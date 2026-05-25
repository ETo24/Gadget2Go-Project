import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, connectChatWS, disconnectChatWS } from '../lib/api';



const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [saved, setSaved] = useState([]);
  const [likedSet, setLikedSet] = useState(new Set());
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [compare, setCompare] = useState([]);
  const [coords, setCoords] = useState({ lat: 1.3521, lon: 103.8198 }); // default Singapore
  const [bootLoading, setBootLoading] = useState(true);

  // Initial load
  useEffect(() => {
    try {
      const t = localStorage.getItem('g2g_theme'); if (t) setTheme(t);
      const s = JSON.parse(localStorage.getItem('g2g_saved') || '[]'); setSaved(s);
      const r = JSON.parse(localStorage.getItem('g2g_recent') || '[]'); setRecentlyViewed(r);
      const c = JSON.parse(localStorage.getItem('g2g_coords') || 'null'); if (c) setCoords(c);
    } catch { /* ignore */ }
    const token = localStorage.getItem('g2g_token');
    if (token) {
      api.get('/users/me').then(r => {
        setUser(r.data);
        if (r.data.role !== 'admin') {
          api.get('/likes/ids').then(rr => setLikedSet(new Set(rr.data))).catch(() => {});
        }
      }).catch(() => localStorage.removeItem('g2g_token')).finally(() => setBootLoading(false));
    } else { setBootLoading(false); }
  }, []);

  // Persist
  useEffect(() => { localStorage.setItem('g2g_theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('g2g_saved', JSON.stringify(saved)); }, [saved]);
  useEffect(() => { localStorage.setItem('g2g_recent', JSON.stringify(recentlyViewed)); }, [recentlyViewed]);
  useEffect(() => { localStorage.setItem('g2g_coords', JSON.stringify(coords)); }, [coords]);

  // Theme on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  // WS connection
  useEffect(() => {
    if (user?.id) connectChatWS(user.id);
    return () => { if (!user) disconnectChatWS(); };
  }, [user?.id]);

  const setSession = useCallback((token, userObj) => {
    localStorage.setItem('g2g_token', token);
    setUser(userObj);
    if (userObj.role !== 'admin') {
      api.get('/likes/ids').then(r => setLikedSet(new Set(r.data))).catch(() => {});
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('g2g_token');
    setUser(null);
    setLikedSet(new Set());
    disconnectChatWS();
  }, []);

  const toggleTheme = useCallback(() => setTheme(t => (t === 'dark' ? 'light' : 'dark')), []);
  const toggleSaved = useCallback((id) => setSaved(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]), []);

  const isLiked = useCallback((listingId) => likedSet.has(listingId), [likedSet]);
  const toggleLike = useCallback(async (listingId) => {
    const liked = likedSet.has(listingId);
    setLikedSet(prev => {
      const n = new Set(prev);
      if (liked) n.delete(listingId); else n.add(listingId);
      return n;
    });
    try {
      if (liked) await api.delete(`/likes/${listingId}`);
      else await api.post(`/likes/${listingId}`);
    } catch {
      // revert on failure
      setLikedSet(prev => {
        const n = new Set(prev);
        if (liked) n.add(listingId); else n.delete(listingId);
        return n;
      });
    }
  }, [likedSet]);
  const addRecentlyViewed = useCallback((id) => setRecentlyViewed(prev => [id, ...prev.filter(x => x !== id)].slice(0, 8)), []);
  const toggleCompare = useCallback((id) => setCompare(prev => prev.includes(id) ? prev.filter(x => x !== id) : (prev.length < 3 ? [...prev, id] : prev)), []);

  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation) return Promise.resolve(coords);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (p) => { const c = { lat: p.coords.latitude, lon: p.coords.longitude }; setCoords(c); resolve(c); },
        () => resolve(coords),
        { enableHighAccuracy: false, timeout: 4000 }
      );
    });
  }, [coords]);

  const refreshUser = useCallback(async () => {
    try { const r = await api.get('/users/me'); setUser(r.data); return r.data; } catch { return null; }
  }, []);

  const value = {
    user, theme, saved, recentlyViewed, compare, coords, bootLoading, likedSet,
    setSession, logout, toggleTheme, toggleSaved, addRecentlyViewed, toggleCompare,
    setTheme, requestGeolocation, refreshUser, setCoords,
    isLiked, toggleLike,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
