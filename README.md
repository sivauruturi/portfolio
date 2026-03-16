# Portfolio Assistant with Ollama

This project runs a portfolio website, a Node.js/Express backend, a Python resume extraction worker, and a local Ollama model for recruiter-style chat responses.

## Stack

- Frontend: static HTML, CSS, JavaScript
- Backend API: Node.js + Express
- Resume worker: Python
- LLM: Ollama local API

## How it works

1. Open the site at `http://localhost:3001`
2. The chat UI sends recruiter questions to `POST /api/recruiter-chat`
3. Node.js receives the request in `server/index.js`
4. Node.js runs `server/python/resume_recruiter_chat.py`
5. Python downloads the resume PDF from Google Drive
6. Python extracts the full resume text
7. Python sends the full resume text plus the user question to Ollama `POST /api/chat`
8. Ollama returns an answer
9. Node.js sends that answer back to the browser chat UI

Flow:

`Browser -> Node.js API -> Python worker -> Ollama -> Node.js API -> Browser`

## Main files

- `index.html`: chat UI entry point
- `assets/js/functions.js`: frontend assistant logic
- `server/index.js`: Express API server
- `server/python/resume_recruiter_chat.py`: resume extraction + Ollama call
- `server/services/resumeService.js`: resume parsing endpoint for structured resume data
- `.env`: local runtime configuration

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Make sure Ollama is running

Check that Ollama is installed:

```bash
ollama --version
```

Pull the model if needed:

```bash
ollama pull llama3:latest
```

If Ollama is not already running:

```bash
ollama serve
```

If you get `address already in use`, Ollama is already running, which is fine.

### 3. Create and review `.env`

A local `.env` file is included for Ollama-based development. Update any values you need, especially calendar/email credentials if you want booking to work fully.

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

Direct Ollama test:

```bash
curl http://127.0.0.1:11434/api/chat \
  -H "Content-Type: application/json" \
  -d '{"model":"llama3:latest","messages":[{"role":"user","content":"Say hello"}],"stream":false}'
```

## Notes

- The recruiter chat uses the full resume text as context.
- The resume source is currently a Google Drive PDF URL from `RESUME_SOURCE_URL`.
- Booking features need valid Google Calendar credentials in `.env`.
- If the chat UI works but recruiter answers fail, check the backend terminal for the Python or Ollama error.
