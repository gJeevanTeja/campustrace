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
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import CollegeManager from './pages/admin/CollegeManager';
import UserManager from './pages/admin/UserManager';
import BlockManager from './pages/admin/BlockManager';
import CategoryManager from './pages/admin/CategoryManager';
import AdminRequestForm from './pages/admin/AdminRequestForm';
import AdminRequestManager from './pages/admin/AdminRequestManager';
import AuthLanding from './pages/AuthLanding';
import Leaderboard from './pages/Leaderboard';
import AIVerification from './pages/AIVerification';
import ResolutionManager from './pages/admin/ResolutionManager';
import CollegeInfo from './pages/admin/CollegeInfo';

import MainLayout from './components/layout/MainLayout';

function AppRoutes() {
  const { darkMode, setDarkMode } = useTheme();

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public - No Layout */}
        <Route path="/login" element={<Login darkMode={darkMode} />} />
        <Route path="/signup" element={<Signup darkMode={darkMode} />} />
        <Route path="/admin/request" element={<AdminRequestForm darkMode={darkMode} />} />
        <Route path="/forgot-password" element={<ForgotPassword darkMode={darkMode} />} />
        <Route path="/reset-password" element={<ResetPassword darkMode={darkMode} />} />
        <Route path="/terms" element={<TermsPage darkMode={darkMode} />} />
        <Route path="/privacy" element={<TermsPage darkMode={darkMode} />} />
        <Route path="/dashboard" element={<Dashboard darkMode={darkMode} />} />
        <Route path="/welcome" element={<AuthLanding darkMode={darkMode} />} />

        {/* Protected & Admin - With MainLayout */}
        <Route element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminDashboard darkMode={darkMode} />} />
                <Route path="/admin-dashboard" element={<AdminDashboard darkMode={darkMode} />} />
                <Route path="/super-admin-dashboard" element={<AdminDashboard darkMode={darkMode} />} />
                <Route path="/admin/super" element={<AdminDashboard darkMode={darkMode} />} />
                <Route path="/admin/colleges" element={<CollegeManager darkMode={darkMode} />} />
                <Route path="/admin/users" element={<UserManager darkMode={darkMode} />} />
                <Route path="/admin/blocks" element={<BlockManager darkMode={darkMode} />} />
                <Route path="/admin/categories" element={<CategoryManager darkMode={darkMode} />} />
                <Route path="/admin/requests" element={<AdminRequestManager darkMode={darkMode} />} />
                <Route path="/admin/resolutions" element={<ResolutionManager darkMode={darkMode} />} />
                <Route path="/admin/college-info" element={<CollegeInfo darkMode={darkMode} />} />

                {/* Main Routes */}
                <Route path="/" element={<Home darkMode={darkMode} setDarkMode={setDarkMode} />} />
                <Route path="/browse" element={<BrowseItems darkMode={darkMode} />} />
                <Route path="/report" element={<ReportItem darkMode={darkMode} />} />
                <Route path="/item/:id" element={<ItemDetails darkMode={darkMode} />} />
                <Route path="/filters" element={<SearchFilters darkMode={darkMode} />} />
                <Route path="/profile" element={<Profile darkMode={darkMode} />} />
                <Route path="/my-items" element={<MyItems darkMode={darkMode} />} />
                <Route path="/notifications" element={<Notifications darkMode={darkMode} />} />
                <Route path="/settings" element={<Settings darkMode={darkMode} setDarkMode={setDarkMode} />} />
                <Route path="/chat" element={<Chat darkMode={darkMode} />} />
                <Route path="/chat/:roomId" element={<ChatRoom darkMode={darkMode} />} />
                <Route path="/leaderboard" element={<Leaderboard darkMode={darkMode} />} />
                <Route path="/ai-verification/:id" element={<AIVerification darkMode={darkMode} />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }>
          <Route path="/*" element={<div />} /> {/* Outlet placeholder */}
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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