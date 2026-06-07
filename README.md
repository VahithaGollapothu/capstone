  # ArchGen AI

ArchGen AI is an AI-powered architectural design assistant.

## Features
- AI floor-plan generation
- AI elevation and exterior renders
- Color recommendation system
- Conversational design assistant
- Saved projects dashboard

## Tech Stack
- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS, Framer Motion
- Backend: FastAPI, Uvicorn
- AI: Groq LLM and optional image generation providers
- Database: MongoDB, with an in-memory fallback when MongoDB is unavailable
- Dev: Docker Compose

## Local Development
```bash
docker compose up --build
```

Frontend: http://localhost:3000
Backend: http://localhost:8000

## Deploy Backend On Render
You can deploy from the included `render.yaml` blueprint, or create a Render Web Service manually.

Manual Render settings:
- Root directory: `backend`
- Runtime: Python
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Health check path: `/`

Render environment variables:
```bash
FRONTEND_ORIGINS=https://your-vercel-app.vercel.app
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/archgen
GROQ_API_KEY=your_groq_api_key
REPLICATE_API_TOKEN=
REPLICATE_MODEL_VERSION=
STABILITY_API_KEY=
STABILITY_ENGINE_ID=stable-diffusion-v1-5
```

`MONGODB_URI` is optional for demo mode because the backend falls back to in-memory saved projects if MongoDB is not reachable. Saved projects will not persist without MongoDB.

## Deploy Frontend On Vercel
Create a Vercel project for the `frontend` directory.

Vercel settings:
- Framework preset: Next.js
- Root directory: `frontend`
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `.next`

Vercel environment variable:
```bash
NEXT_PUBLIC_API_URL=https://your-render-service.onrender.com/api/v1
```

After the Vercel URL is created, add that URL to Render's `FRONTEND_ORIGINS`.

## Project Structure
```text
archgen-ai/
├─ frontend/
├─ backend/
├─ docker-compose.yml
├─ render.yaml
└─ README.md
```
