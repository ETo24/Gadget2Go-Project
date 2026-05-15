import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const AppContext = createContext(null);

const STORAGE_KEY = 'g2g_state_v1';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}
function saveState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [saved, setSaved] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [compare, setCompare] = useState([]);

  useEffect(() => {
    const s = loadState();
    if (s) {
      if (s.user) setUser(s.user);
      if (s.theme) setTheme(s.theme);
      if (s.saved) setSaved(s.saved);
      if (s.recentlyViewed) setRecentlyViewed(s.recentlyViewed);
      if (s.compare) setCompare(s.compare);
    }
  }, []);

  useEffect(() => {
    saveState({ user, theme, saved, recentlyViewed, compare });
  }, [user, theme, saved, recentlyViewed, compare]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  const login = useCallback(({ name, email }) => {
    const u = {
      id: 'me',
      name: name || email?.split('@')[0] || 'User',
      email: email || 'demo@g2g.app',
      phone: '+65 9123 4567',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=200&q=80',
      verified: true,
      trustScore: 96,
      walletBalance: 1240,
      rating: 4.9,
      reviews: 27,
      memberSince: 'Jan 2024',
    };
    setUser(u);
    return u;
  }, []);
  const logout = useCallback(() => setUser(null), []);
  const toggleTheme = useCallback(() => setTheme(t => (t === 'dark' ? 'light' : 'dark')), []);
  const toggleSaved = useCallback((id) => {
    setSaved(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);
  const addRecentlyViewed = useCallback((id) => {
    setRecentlyViewed(prev => [id, ...prev.filter(x => x !== id)].slice(0, 8));
  }, []);
  const toggleCompare = useCallback((id) => {
    setCompare(prev => prev.includes(id) ? prev.filter(x => x !== id) : (prev.length < 3 ? [...prev, id] : prev));
  }, []);

  const value = {
    user, theme, saved, recentlyViewed, compare,
    login, logout, toggleTheme, toggleSaved, addRecentlyViewed, toggleCompare,
    setTheme,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
