import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

import ProtectedRoute from './components/ProtectedRoute';

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
import Dashboard from './pages/Dashboard';    // ← NEW

function AppRoutes() {
  const { darkMode, setDarkMode } = useTheme();

  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          {/* Public */}
          <Route path="/login"           element={<Login darkMode={darkMode} />} />
          <Route path="/signup"          element={<Signup darkMode={darkMode} />} />
          <Route path="/forgot-password" element={<ForgotPassword darkMode={darkMode} />} />
          <Route path="/reset-password"  element={<ResetPassword darkMode={darkMode} />} />
          <Route path="/terms"           element={<TermsPage darkMode={darkMode} />} />  {/* ← NEW */}
          <Route path="/privacy"         element={<TermsPage darkMode={darkMode} />} />  {/* ← NEW */}
          <Route path="/dashboard" element={<Dashboard darkMode={darkMode} />} />

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