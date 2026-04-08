import React, { lazy, Suspense } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';

// Pages
// Lazy Load Pages
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Home = lazy(() => import('./pages/Home'));
const BrowseItems = lazy(() => import('./pages/BrowseItems'));
const ReportItem = lazy(() => import('./pages/ReportItem'));
const ItemDetails = lazy(() => import('./pages/ItemDetails'));
const SearchFilters = lazy(() => import('./pages/SearchFilters'));
const Profile = lazy(() => import('./pages/Profile'));
const MyItems = lazy(() => import('./pages/MyItems'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Chat = lazy(() => import('./pages/Chat'));
const ChatRoom = lazy(() => import('./pages/ChatRoom'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Settings = lazy(() => import('./pages/Settings'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const CollegeManager = lazy(() => import('./pages/admin/CollegeManager'));
const UserManager = lazy(() => import('./pages/admin/UserManager'));
const BlockManager = lazy(() => import('./pages/admin/BlockManager'));
const CategoryManager = lazy(() => import('./pages/admin/CategoryManager'));
const AdminRequestForm = lazy(() => import('./pages/admin/AdminRequestForm'));
const AdminRequestManager = lazy(() => import('./pages/admin/AdminRequestManager'));
const AuthLanding = lazy(() => import('./pages/AuthLanding'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const AIVerification = lazy(() => import('./pages/AIVerification'));
const MyClaims = lazy(() => import('./pages/MyClaims'));
const ResolutionManager = lazy(() => import('./pages/admin/ResolutionManager'));
const CollegeInfo = lazy(() => import('./pages/admin/CollegeInfo'));
const SuperAdminDashboard = lazy(() => import('./pages/admin/SuperAdminDashboard'));
const ProofReviews = lazy(() => import('./pages/admin/ProofReviews'));
const EscrowControl = lazy(() => import('./pages/admin/EscrowControl'));

function AppRoutes() {
  const { darkMode, setDarkMode } = useTheme();

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-text-secondary uppercase tracking-[3px] animate-pulse">Loading System...</p>
          </div>
        </div>
      }>
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
          <Route path="*" element={
            <ProtectedRoute>
              <MainLayout>
                <Routes>
                  {/* Admin Routes */}
                  <Route path="/admin" element={<AdminDashboard darkMode={darkMode} />} />
                  <Route path="/admin-dashboard" element={<AdminDashboard darkMode={darkMode} />} />
                  <Route path="/super-admin-dashboard" element={<AdminDashboard darkMode={darkMode} />} />
                  <Route path="/admin/super" element={<AdminDashboard darkMode={darkMode} />} />
                  <Route path="/admin/analytics" element={<SuperAdminDashboard darkMode={darkMode} />} />
                  <Route path="/admin/colleges" element={<CollegeManager darkMode={darkMode} />} />
                  <Route path="/admin/users" element={<UserManager darkMode={darkMode} />} />
                  <Route path="/admin/blocks" element={<BlockManager darkMode={darkMode} />} />
                  <Route path="/admin/categories" element={<CategoryManager darkMode={darkMode} />} />
                  <Route path="/admin/requests" element={<AdminRequestManager darkMode={darkMode} />} />
                  <Route path="/admin/resolutions" element={<ResolutionManager darkMode={darkMode} />} />
                  <Route path="/admin/college-info" element={<CollegeInfo darkMode={darkMode} />} />
                  <Route path="/admin/proof-reviews" element={<ProofReviews darkMode={darkMode} />} />
                  <Route path="/admin/escrow-control" element={<EscrowControl darkMode={darkMode} />} />

                  {/* Main Routes */}
                  <Route path="/" element={<Home darkMode={darkMode} setDarkMode={setDarkMode} />} />
                  <Route path="/browse" element={<BrowseItems darkMode={darkMode} />} />
                  <Route path="/items" element={<BrowseItems darkMode={darkMode} />} />
                  <Route path="/report" element={<ReportItem darkMode={darkMode} />} />
                  <Route path="/item/:id" element={<ItemDetails darkMode={darkMode} />} />
                  <Route path="/filters" element={<SearchFilters darkMode={darkMode} />} />
                  <Route path="/profile" element={<Profile darkMode={darkMode} />} />
                  <Route path="/my-items" element={<MyItems darkMode={darkMode} />} />
                  <Route path="/claims" element={<MyClaims darkMode={darkMode} />} />
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
      </Suspense>
    </BrowserRouter>
  );
}



function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
          <SpeedInsights />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;