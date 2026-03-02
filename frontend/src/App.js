import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

import ProtectedRoute from './components/ProtectedRoute';
import { MapPin } from 'lucide-react';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import BrowseItems from './pages/BrowseItems';
import ReportItem from './pages/ReportItem';
import ItemDetails from './pages/ItemDetails';
import SearchFilters from './pages/SearchFilters';
import Profile from './pages/Profile';
import MyItems from './pages/MyItems';
import Notifications from './pages/Notifications';
import Chat from './pages/Chat';
import ChatRoom from './pages/ChatRoom';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings';
import TermsPage from './pages/TermsPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import CollegeManager from './pages/admin/CollegeManager';
import UserManager from './pages/admin/UserManager';
import BlockManager from './pages/admin/BlockManager';
import CategoryManager from './pages/admin/CategoryManager';
import AdminSignup from './pages/admin/AdminSignup';
import AuthLanding from './pages/AuthLanding';

function AppRoutes() {
  const { darkMode, setDarkMode } = useTheme();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show splash screen for 3.5 seconds on initial load
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    const bg = darkMode ? '#121212' : '#f0f4ff';
    return (
      <div style={{
        minHeight: '100vh',
        background: '#000', // Desktop outer background
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: '100%',
          height: '100vh',
          background: bg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div className="bounce-rotate-animation" style={{
            width: 90, height: 90, borderRadius: 24,
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 24, boxShadow: '0 15px 35px rgba(37,99,235,0.4)'
          }}>
            <MapPin size={48} color="#ffffff" strokeWidth={2.5} />
          </div>
          <h2 className="fade-up-text" style={{ fontWeight: 900, color: darkMode ? '#e2e8f0' : '#1e1e1e', margin: 0, fontSize: 28, letterSpacing: 1.5 }}>CampusTrace</h2>
          <style>
            {`
              @keyframes popRotate {
                0% { transform: scale(0.3) rotate(-180deg); opacity: 0; }
                50% { transform: scale(1.1) rotate(10deg); opacity: 1; }
                70% { transform: scale(0.95) rotate(-5deg); }
                100% { transform: scale(1) rotate(0deg); opacity: 1; }
              }
              @keyframes slideUpFade {
                0% { transform: translateY(20px); opacity: 0; }
                100% { transform: translateY(0); opacity: 1; }
              }
              .bounce-rotate-animation {
                animation: popRotate 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
              }
              .fade-up-text {
                opacity: 0;
                animation: slideUpFade 0.6s ease forwards;
                animation-delay: 0.6s;
              }
            `}
          </style>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login darkMode={darkMode} />} />
          <Route path="/signup" element={<Signup darkMode={darkMode} />} />
          <Route path="/admin/signup" element={<AdminSignup darkMode={darkMode} />} />
          <Route path="/forgot-password" element={<ForgotPassword darkMode={darkMode} />} />
          <Route path="/reset-password" element={<ResetPassword darkMode={darkMode} />} />
          <Route path="/terms" element={<TermsPage darkMode={darkMode} />} />  {/* ← NEW */}
          <Route path="/privacy" element={<TermsPage darkMode={darkMode} />} />  {/* ← NEW */}
          <Route path="/dashboard" element={<Dashboard darkMode={darkMode} />} />
          <Route path="/welcome" element={<AuthLanding darkMode={darkMode} setDarkMode={setDarkMode} />} />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute><AdminDashboard darkMode={darkMode} /></ProtectedRoute>
          } />
          <Route path="/admin/colleges" element={
            <ProtectedRoute><CollegeManager darkMode={darkMode} /></ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute><UserManager darkMode={darkMode} /></ProtectedRoute>
          } />
          <Route path="/admin/blocks" element={
            <ProtectedRoute><BlockManager darkMode={darkMode} /></ProtectedRoute>
          } />
          <Route path="/admin/categories" element={
            <ProtectedRoute><CategoryManager darkMode={darkMode} /></ProtectedRoute>
          } />

          {/* Protected */}
          <Route path="/" element={
            <ProtectedRoute><Home darkMode={darkMode} setDarkMode={setDarkMode} /></ProtectedRoute>
          } />
          <Route path="/browse" element={
            <ProtectedRoute><BrowseItems darkMode={darkMode} /></ProtectedRoute>
          } />
          <Route path="/report" element={
            <ProtectedRoute><ReportItem darkMode={darkMode} /></ProtectedRoute>
          } />
          <Route path="/item/:id" element={
            <ProtectedRoute><ItemDetails darkMode={darkMode} /></ProtectedRoute>
          } />
          <Route path="/filters" element={
            <ProtectedRoute><SearchFilters darkMode={darkMode} /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Profile darkMode={darkMode} /></ProtectedRoute>
          } />
          <Route path="/my-items" element={
            <ProtectedRoute><MyItems darkMode={darkMode} /></ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute><Notifications darkMode={darkMode} /></ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute><Settings darkMode={darkMode} setDarkMode={setDarkMode} /></ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute><Chat darkMode={darkMode} /></ProtectedRoute>
          } />
          <Route path="/chat/:roomId" element={
            <ProtectedRoute><ChatRoom darkMode={darkMode} /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
