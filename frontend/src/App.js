import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Toaster } from './components/ui/sonner';

import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import OTPVerify from './pages/OTPVerify';
import Dashboard from './pages/Dashboard';
import Buy from './pages/Buy';
import ProductDetail from './pages/ProductDetail';
import Sell from './pages/Sell';
import AIValuation from './pages/AIValuation';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Verification from './pages/Verification';
import SmartMatch from './pages/SmartMatch';
import Checkout from './pages/Checkout';
import Wallet from './pages/Wallet';
import Liked from './pages/Liked';
import RefundDetail from './pages/RefundDetail';
import DeviceValidation from './pages/DeviceValidation';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

function Protected({ children, adminBlocked = true }) {
  const { user, bootLoading } = useApp();
  const path = window.location.pathname;
  if (bootLoading) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  // Admins should stay in admin panel
  if (user.role === 'admin' && adminBlocked && path !== '/admin') return <Navigate to="/admin" replace />;
  return <Layout>{children}</Layout>;
}

function AdminOnly({ children }) {
  const { user, bootLoading } = useApp();
  if (bootLoading) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/otp" element={<OTPVerify />} />

          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/buy" element={<Protected><Buy /></Protected>} />
          <Route path="/buy/:id" element={<Protected><ProductDetail /></Protected>} />
          <Route path="/sell" element={<Protected><Sell /></Protected>} />
          <Route path="/match" element={<Protected><SmartMatch /></Protected>} />
          <Route path="/valuation" element={<Protected><AIValuation /></Protected>} />
          <Route path="/chat" element={<Protected><Chat /></Protected>} />
          <Route path="/chat/:id" element={<Protected><Chat /></Protected>} />
          <Route path="/checkout/:id" element={<Protected><Checkout /></Protected>} />
          <Route path="/wallet" element={<Protected><Wallet /></Protected>} />
          <Route path="/liked" element={<Protected><Liked /></Protected>} />
          <Route path="/refund/:id" element={<Protected><RefundDetail /></Protected>} />
          <Route path="/validation" element={<Protected><DeviceValidation /></Protected>} />
          <Route path="/verification" element={<Protected><Verification /></Protected>} />
          <Route path="/profile" element={<Protected><Profile /></Protected>} />
          <Route path="/settings" element={<Protected><Settings /></Protected>} />
          <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
          <Route path="/admin" element={<AdminOnly><Admin /></AdminOnly>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </AppProvider>
  );
}

export default App;
