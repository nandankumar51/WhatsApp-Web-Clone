# WhatsApp Web Clone

A full-stack real-time chat application built with Node.js, Express, React, MongoDB, and Socket.IO.

## What it does

- User registration and login
- One-to-one chat creation
- Real-time messaging with Socket.IO
- Message history stored in MongoDB
- Online/offline presence updates
- Responsive WhatsApp-style UI

## Project Layout

- `backend/` - Express API, Socket.IO server, MongoDB models
- `frontend/` - React app and chat UI

## Run Locally

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Environment

Backend uses a local MongoDB database if `MONGODB_URI` is set in `backend/.env`.

Example:
```env
MONGODB_URI=mongodb://localhost:27017/humble-tree
PORT=5001
HOST=0.0.0.0
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:3000
```

## Notes

- Backend defaults to port `5001`
- Frontend expects the backend at `http://localhost:5001`
- If MongoDB is unavailable, the backend can fall back to local JSON storage
