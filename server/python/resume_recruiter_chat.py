#!/usr/bin/env python3
import json
import os
import re
import subprocess
import sys
import urllib.request
from datetime import datetime, timezone
from io import BytesIO
from urllib.parse import urlparse, parse_qs

try:
    from pypdf import PdfReader
except ImportError:
    try:
        from PyPDF2 import PdfReader
    except ImportError:
        PdfReader = None


DEFAULT_RESUME_URL = (
    "https://drive.google.com/file/d/1h3f0GoBVo8ag_i18pCyXQG8w3fOqqIdU/preview"
)
DEFAULT_OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
DEFAULT_OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.2")
DEFAULT_OLLAMA_NUM_CTX = int(os.environ.get("OLLAMA_NUM_CTX", "8192"))


def extract_google_drive_file_id(url: str) -> str:
    match = re.search(r"/d/([a-zA-Z0-9_-]+)", url or "")
    if match:
        return match.group(1)

    try:
        parsed = urlparse(url or "")
        return parse_qs(parsed.query).get("id", [""])[0]
    except Exception:
        return ""


def to_download_url(url: str) -> str:
    file_id = extract_google_drive_file_id(url)
    if file_id:
        return f"https://drive.google.com/uc?export=download&id={file_id}"
    return url


def normalize_text(text: str) -> str:
    return (
        str(text or "")
        .replace("\ufb01", "fi")
        .replace("\ufb02", "fl")
        .replace("\u00a0", " ")
        .replace("•", "\n• ")
        .replace("●", "\n• ")
    )


def download_resume_text(resume_url: str) -> str:
    request = urllib.request.Request(
        to_download_url(resume_url),
        headers={"User-Agent": "portfolio-recruiter-chat/1.0"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        pdf_bytes = response.read()

    if PdfReader is not None:
        reader = PdfReader(BytesIO(pdf_bytes))
        pages = [page.extract_text() or "" for page in reader.pages]
        return normalize_text("\n".join(pages)).strip()

    process = subprocess.run(
        ["pdftotext", "-", "-"],
        input=pdf_bytes,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )

    if process.returncode != 0:
        stderr = process.stderr.decode("utf-8", errors="ignore").strip()
        raise RuntimeError(stderr or "Unable to extract text from the resume PDF.")

    return normalize_text(process.stdout.decode("utf-8", errors="ignore")).strip()


def post_json(url: str, payload):
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "User-Agent": "portfolio-recruiter-chat/1.0",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=120) as response:
        return json.loads(response.read().decode("utf-8"))


def ask_ollama(question: str, resume_text: str, model: str, base_url: str, num_ctx: int):
    system_prompt = (
        "You are a recruiter assistant answering questions only from the provided resume. "
        "Be concise, professional, and factual. "
        "If the answer is not clearly in the resume, say that it is not available in the resume."
    )
    user_prompt = (
        "Use this complete resume as the only source of truth.\n\n"
        f"Resume:\n{resume_text}\n\n"
        f"Recruiter question: {question or 'Give a short professional summary of the candidate.'}"
    )
    payload = {
        "model": model,
        "stream": False,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "options": {
            "num_ctx": num_ctx,
        },
    }
    response = post_json(f"{base_url.rstrip('/')}/api/chat", payload)
    message = ((response or {}).get("message") or {}).get("content", "").strip()
    if not message:
        raise RuntimeError("Ollama returned an empty response.")
    return message


def main():
    payload = json.load(sys.stdin)
    resume_url = payload.get("resumeUrl") or DEFAULT_RESUME_URL
    question = str(payload.get("message") or "")
    model = str(payload.get("model") or DEFAULT_OLLAMA_MODEL)
    base_url = str(payload.get("baseUrl") or DEFAULT_OLLAMA_BASE_URL)
    num_ctx = int(payload.get("numCtx") or DEFAULT_OLLAMA_NUM_CTX)
    resume_text = download_resume_text(resume_url)
    reply = ask_ollama(question, resume_text, model, base_url, num_ctx)

    print(
        json.dumps(
            {
                "ok": True,
                "reply": reply,
                "model": model,
                "resumeChars": len(resume_text),
                "resumeUpdatedAt": datetime.now(timezone.utc).isoformat(),
            }
        )
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(json.dumps({"ok": False, "error": str(error)}))
        sys.exit(1)
