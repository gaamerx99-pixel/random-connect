# RandomConnect

Full stack FastAPI + React (Vite) + TypeScript + Tailwind CSS + MongoDB starter project.

## Structure

- `frontend/` - Vite + React + TypeScript + Tailwind CSS + Framer Motion
- `backend/` - FastAPI app with WebSocket signaling, MongoDB, Google OAuth and JWT

## Quick start

### Backend

1. Create a virtual environment:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```
2. Install dependencies:
   ```powershell
   pip install -r backend/requirements.txt
   ```
3. Copy `.env.example` to `.env` and set values.
4. Start the backend:
   ```powershell
   uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend

1. Install dependencies:
   ```powershell
   cd frontend
   npm install
   ```
2. Start the frontend:
   ```powershell
   npm run dev
   ```

## Notes

- Frontend proxy is configured to forward `/api` and `/ws` to `http://localhost:8000`.
- MongoDB is expected to be reachable via the `MONGO_URI` environment variable.
- Google OAuth integration is scaffolded with placeholder endpoints.
