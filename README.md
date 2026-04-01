# Portfolio Assistant with PDF Cropping

This project runs a portfolio website, a Node.js/Express backend, and a Python resume extraction worker that uses `pdfplumber` to crop fixed resume regions and return the extracted content to the chat UI.

## Stack

- Frontend: static HTML, CSS, JavaScript
- Backend API: Node.js + Express
- Resume worker: Python + `pdfplumber`

## How it works

1. Open the site at `http://localhost:3001`
2. The chat UI sends recruiter questions to `POST /api/recruiter-chat`
3. Node.js receives the request in `server/index.js`
4. Node.js runs `server/python/resume_recruiter_chat.py`
5. Python downloads the resume PDF from Google Drive
6. The frontend sends detected keywords such as `contact details`, `phone number`, or `address`
7. Python maps those keywords to fixed bbox regions on the PDF
8. `pdfplumber` crops the matching region and extracts the text
9. Node.js sends that extracted content back to the browser chat UI

Flow:

`Browser -> Node.js API -> Python worker -> pdfplumber crop/extract -> Node.js API -> Browser`

## Main files

- `index.html`: chat UI entry point
- `assets/js/functions.js`: frontend assistant logic
- `server/index.js`: Express API server
- `server/python/resume_recruiter_chat.py`: keyword-based bbox crop + PDF text extraction
- `server/services/resumeService.js`: resume parsing endpoint for structured resume data
- `.env`: local runtime configuration

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Make sure Python has `pdfplumber`

Install it if needed:

```bash
pip install pdfplumber
```

If you use a virtual environment, install it there before starting the server.

### 3. Create and review `.env`

Update any values you need, especially calendar/email credentials if you want booking to work fully.

If your machine has multiple Python installations, set `PYTHON_EXECUTABLE` in `.env` to the exact interpreter that has `pdfplumber` installed.

### 4. Start the app

```bash
npm run dev
```

Then open:

```text
http://localhost:3001
```

## Useful endpoints

- `GET /api/health`
- `GET /api/resume-data`
- `POST /api/recruiter-chat`
- `POST /api/booking/slots`
- `POST /api/booking/create`

## Quick tests

Health check:

```bash
curl http://localhost:3001/api/health
```

Recruiter chat test:

```bash
curl -X POST http://localhost:3001/api/recruiter-chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What skills does Siva have?"}'
```

## Notes

- The recruiter chat now uses keyword-based PDF cropping instead of Ollama.
- The default bbox presets assume the resume layout stays the same and only the content changes.
- The resume source is currently a Google Drive PDF URL from `RESUME_SOURCE_URL`.
- Booking features need valid Google Calendar credentials in `.env`.
- If the chat UI works but recruiter answers fail, check the backend terminal for the Python extraction error.
