# Smart Virtual Queue Management System for Public Service Centers

A full-stack digital queue management solution designed to eliminate physical waiting lines, enable digital ticketing with QR codes, provide real-time remote queue tracking, and empower public service centers with efficient staff and admin controls.

## Features

- **Citizen Portal**: Digital token generation, real-time position tracking, QR code ticket, estimated wait times, and ticket history.
- **Staff Portal**: Counter management, next ticket calling, QR code scanner for ticket verification, status updates (Serving, Completed, Missed).
- **Admin Portal**: Analytics dashboard, service CRUD management, counter assignment, staff management, and system queue configuration.
- **Live Queue Display Board**: Digital TV display mode showing token calls per counter with audible notifications.

## Tech Stack

- **Frontend**: React 18, Vite, React Router v6, Lucide Icons, Axios, CSS Design System, HTML5-QRCode.
- **Backend**: Python 3.10+, Flask, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-CORS, Pillow, QRCode.
- **Database**: SQLite (SQLAlchemy ORM).

## Setup & Running

### Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
python run.py
```
Backend runs at `http://localhost:5000`.

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

### Demo Credentials
- **Admin**: `admin@queue.com` / `admin123`
- **Staff**: `staff@queue.com` / `staff123`
- **Citizen**: `citizen@queue.com` / `citizen123` (or register a new account)
