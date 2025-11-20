# LeetCode-style Coding Platform

This repository contains a LeetCode-style coding platform with a React frontend and a Node.js backend. It integrates with Judge0 for running user-submitted code and supports multiple languages (JavaScript, C++, Java). The project includes server-side harnesses to wrap function-only submissions into full programs for Judge0.

## Features

- Problem pages with Monaco editor for code editing
- Run & Submit via Judge0 API
- Persistent submissions saved to MongoDB
- Admin video upload integration (Cloudinary)
- AI Chat assistant (Gemini/Google GenAI)
- Redis used for token blacklist / session helpers

## Repo structure

- `backend/` – Express server, Mongoose models, Judge0 harnesses
- `frontend/` – React + Vite app with Monaco editor
- `scripts/` – helper scripts for seeding and testing Judge0 harnesses

## Quick setup (local)

Prerequisites:
- Node.js >= 18
- npm or yarn
- MongoDB (Atlas recommended)
- (Optional) Redis

1. Install dependencies

```bash
# backend
cd backend
npm install

# frontend
cd ../frontend
npm install
```

2. Environment variables

Create a `.env` in `backend/` with at least:

```
PORT=4000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/<db>
JWT_KEY=your_jwt_secret
JUDGE0_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_RAPIDAPI_KEY=your_rapidapi_key
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
GEMINI_KEY=...
REDIS_ENABLED=false
```

3. Run locally

```bash
# backend
cd backend
npm run dev

# frontend
cd ../frontend
npm run dev
```

4. Open frontend at `http://localhost:5173` (Vite defaults)

## Deploy

Recommended:
- Backend: Render / Railway / Heroku
- Frontend: Vercel / Netlify / Render
- Database: MongoDB Atlas

Set environment variables in the chosen hosting provider. For Judge0 heavy usage consider self-hosted Judge0.

## Notes

- The harness currently supports common DSA input patterns (twoSum, maxProfit, threeSum, climbStairs, coinChange). Some complex types (2D grids, ListNode linked lists, etc.) may require harness updates.
- Submissions are stored in MongoDB `submissions` collection; the frontend also stores last-submitted code locally in `localStorage` for a quick restore.

## Contributing

- Create issues for new harness patterns you'd like supported.
- PRs welcome — keep changes focused and add tests where applicable.

---

If you want, I can also add a short `CONTRIBUTING.md` and a deploy workflow next.