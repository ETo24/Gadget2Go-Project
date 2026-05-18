// API client for Gadget2Go. Uses REACT_APP_BACKEND_URL + /api prefix.
import axios from 'axios';

const BASE = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/$/, '');
export const API_URL = `${BASE}/api`;

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('g2g_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = err?.response?.data?.detail || err?.message || 'Network error';
    return Promise.reject(new Error(msg));
  }
);

// ---------------- WebSocket helper ----------------
let socket = null;
let listeners = new Set();
export function connectChatWS(userId) {
  if (!userId || socket) return;
  try {
    const proto = BASE.startsWith('https') ? 'wss' : 'ws';
    const host = BASE.replace(/^https?:\/\//, '');
    socket = new WebSocket(`${proto}://${host}/api/ws/chat/${userId}`);
    socket.onmessage = (ev) => {
      try { const data = JSON.parse(ev.data); listeners.forEach(fn => fn(data)); } catch { /* ignore */ }
    };
    socket.onclose = () => { socket = null; setTimeout(() => connectChatWS(userId), 2000); };
    socket.onerror = () => { /* swallow */ };
  } catch { /* ignore */ }
}
export function onChatEvent(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function sendChatEvent(payload) { if (socket && socket.readyState === 1) socket.send(JSON.stringify(payload)); }
export function disconnectChatWS() { if (socket) { try { socket.close(); } catch { /* ignore */ } socket = null; } }
