#!/usr/bin/env python3
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone
from io import BytesIO
from urllib.parse import parse_qs, urlparse

import pdfplumber


DEFAULT_RESUME_URL = (
    "https://drive.google.com/file/d/1h3f0GoBVo8ag_i18pCyXQG8w3fOqqIdU/preview"
)

REGION_PRESETS = {
    "contact": {
        "page": 0,
        "bbox": [0.00, 0.00, 1.00, 0.15],
    },
    "summary": {
        "page": 0,
        "bbox": [0.00, 0.13, 1.00, 0.28],
    },
    "experience": {
        "page": 0,
        "bbox": [0.00, 0.25, 1.00, 1.00],
    },
    "skills": {
        "page": 1,
        "bbox": [0.00, 0.32, 1.00, 0.50],
    },
    "education": {
        "page": 1,
        "bbox": [0.00, 0.50, 1.00, 1.00],
    },
}

KEYWORD_REGION_MAP = {
    "address": "contact",
    "availability": "summary",
    "background": "summary",
    "bio": "summary",
    "contact": "contact",
    "contact details": "contact",
    "education": "education",
    "email": "contact",
    "experience": "experience",
    "linkedin": "contact",
    "location": "contact",
    "phone": "contact",
    "phone number": "contact",
    "profile": "summary",
    "resume summary": "summary",
    "skills": "skills",
    "summary": "summary",
    "tools": "skills",
    "work history": "experience",
}


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
    normalized = (
        str(text or "")
        .replace("\ufb01", "fi")
        .replace("\ufb02", "fl")
        .replace("\u00a0", " ")
        .replace("•", "\n• ")
        .replace("●", "\n• ")
    )
    normalized = re.sub(r"[ \t]+", " ", normalized)
    normalized = re.sub(r"\n{3,}", "\n\n", normalized)
    return normalized.strip()


def download_resume_bytes(resume_url: str) -> bytes:
    request = urllib.request.Request(
        to_download_url(resume_url),
        headers={"User-Agent": "portfolio-recruiter-chat/1.0"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()


def normalize_keyword(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "").lower()).strip()


def extract_keywords_from_message(message: str):
    normalized_message = normalize_keyword(re.sub(r"[^a-z0-9\s]", " ", message or ""))
    matches = []

    for keyword in KEYWORD_REGION_MAP:
        if keyword in normalized_message:
            matches.append(keyword)

    return matches


def choose_region(keywords, message: str) -> tuple[str, str]:
    for keyword in keywords:
        normalized = normalize_keyword(keyword)
        region = KEYWORD_REGION_MAP.get(normalized)
        if region:
            return region, normalized

    for keyword in extract_keywords_from_message(message):
        region = KEYWORD_REGION_MAP.get(keyword)
        if region:
            return region, keyword

    return "summary", "summary"


def to_absolute_bbox(page, relative_bbox):
    x0, top, x1, bottom = relative_bbox
    return (
        page.width * x0,
        page.height * top,
        page.width * x1,
        page.height * bottom,
    )


def clean_lines(text: str):
    lines = [line.strip(" -|") for line in normalize_text(text).splitlines()]
    lines = [line for line in lines if line]
    deduped = []

    for line in lines:
        if not deduped or deduped[-1] != line:
            deduped.append(line)

    return deduped


def extract_region_text(pdf_bytes: bytes, region_name: str) -> str:
    preset = REGION_PRESETS.get(region_name) or REGION_PRESETS["summary"]
    with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
        page_index = min(preset["page"], max(len(pdf.pages) - 1, 0))
        page = pdf.pages[page_index]
        absolute_bbox = to_absolute_bbox(page, preset["bbox"])

        cropped = page.crop(absolute_bbox)
        text = cropped.extract_text(x_tolerance=2, y_tolerance=3) or ""

        if not text.strip():
            text = page.extract_text(x_tolerance=2, y_tolerance=3) or ""

    lines = clean_lines(text)
    return "\n".join(lines)


def build_reply(region_name: str, matched_keyword: str, extracted_text: str) -> str:
    if not extracted_text:
        return (
            "I could not extract that section from the resume PDF right now. "
            "Please try another keyword."
        )

    if region_name == "contact":
        intro = f"Here are the {matched_keyword or 'contact'} details from the resume:"
    elif region_name == "summary":
        intro = "Here is the summary section from the resume:"
    elif region_name == "experience":
        intro = "Here is the experience section from the resume:"
    elif region_name == "skills":
        intro = "Here is the skills section from the resume:"
    elif region_name == "education":
        intro = "Here is the education section from the resume:"
    else:
        intro = "Here is the extracted resume content:"

    return f"{intro}\n\n{extracted_text}"


def main():
    payload = json.load(sys.stdin)
    resume_url = payload.get("resumeUrl") or DEFAULT_RESUME_URL
    message = str(payload.get("message") or "")
    raw_keywords = payload.get("keywords") or []
    keywords = [str(keyword) for keyword in raw_keywords if str(keyword).strip()]
    region_name, matched_keyword = choose_region(keywords, message)
    pdf_bytes = download_resume_bytes(resume_url)
    extracted_text = extract_region_text(pdf_bytes, region_name)
    reply = build_reply(region_name, matched_keyword, extracted_text)
    print(
        json.dumps(
            {
                "ok": True,
                "reply": reply,
                "region": region_name,
                "matchedKeyword": matched_keyword,
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
