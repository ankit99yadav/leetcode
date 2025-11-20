import axios from "axios";

// Use environment variable if provided (set VITE_API_URL in frontend deployment or .env)
// Fallback to local dev port 4000 (backend default) if not set.
const API_BASE = import.meta.env.VITE_API_URL || 'https://leetcode-3u3y.onrender.com';

const axiosClient = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

export default axiosClient;

