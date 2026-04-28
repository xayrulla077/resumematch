import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Resumes from './pages/Resumes';
import Jobs from './pages/Jobs';
import MyJobs from './pages/MyJobs';
import Analytics from './pages/Analytics';
import Activities from './pages/Activities';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import Register from './pages/Register';
import MyApplications from './pages/MyApplications';
import AdminApplicants from './pages/AdminApplicants';
import Profile from './pages/Profile';
import Interview from './pages/Interview';
import ResumeBuilder from './pages/ResumeBuilder';
import Intro from './pages/Intro';
import Landing from './pages/Landing';
import Messages from './pages/Messages';
import Tests from './pages/Tests';
import BestCandidates from './pages/BestCandidates';
import ResumeGenerator from './pages/ResumeGenerator';
import CompanyProfile from './pages/CompanyProfile';
import SkillsVerification from './pages/SkillsVerification';
import JobAlerts from './pages/JobAlerts';
import InterviewCalendar from './pages/InterviewCalendar';
import VideoResume from './pages/VideoResume';
import CompanyReviews from './pages/CompanyReviews';
import SavedJobs from './pages/SavedJobs';
import NotificationsCenter from './pages/NotificationsCenter';
import Companies from './pages/Companies';
import CompanyDetails from './pages/CompanyDetails';
import ProfileCompletion from './pages/ProfileCompletion';
import ApplicantTracking from './pages/ApplicantTracking';
import { useState } from 'react';
import BottomNav from './components/BottomNav';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-[#0a0f1d] transition-colors duration-300">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black italic text-xl animate-pulse">
          RM
        </div>
        <p className="text-slate-500 text-xs font-black uppercase tracking-widest animate-pulse">Yuklanmoqda...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;

  return children ? children : <Outlet />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex bg-[var(--bg-main)] min-h-screen transition-colors duration-300">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 lg:ml-72 min-h-screen transition-all duration-300 flex flex-col">
        {/* Mobile Top Bar */}
        <div className="lg:hidden flex items-center justify-between px-6 py-4 bg-[var(--bg-main)]/90 backdrop-blur-xl border-b border-[var(--border-main)] sticky top-0 z-30">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => window.location.href = '/'}
          >
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black italic text-sm shadow-lg shadow-indigo-500/20">
              RM
            </div>
            <span className="text-[var(--text-main)] font-black text-sm tracking-widest uppercase">Matcher</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2.5 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl transition-all"
          >
            <div className="w-5 h-5 flex flex-col justify-center gap-1.5">
              <span className={`block h-0.5 bg-[var(--text-main)] rounded-full transition-all duration-300 ${sidebarOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-0.5 bg-[var(--text-main)] rounded-full transition-all duration-300 ${sidebarOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 bg-[var(--text-main)] rounded-full transition-all duration-300 ${sidebarOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>

        <div className="flex-1 pb-24 lg:pb-0">
          <Outlet />
        </div>

        {/* Mobile Bottom Navigation */}
        <BottomNav setSidebarOpen={setSidebarOpen} />
      </div>
    </div>
  );
};


function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <BrowserRouter>
            {/* Global Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  borderRadius: '16px',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '13px',
                  fontWeight: '700',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
                },
                success: {
                  style: {
                    borderColor: 'rgba(99, 102, 241, 0.3)',
                  },
                  iconTheme: {
                    primary: '#6366f1',
                    secondary: '#fff',
                  },
                },
                error: {
                  style: {
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                  },
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />

            <Routes>
              {/* Landing page - for everyone */}
              <Route path="/" element={<Landing />} />
              
              {/* Auth pages */}
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/resumes" element={<Resumes />} />
                <Route path="/resume-builder" element={<ResumeBuilder />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/company/:id" element={<CompanyDetails />} />
                <Route path="/my-jobs" element={<MyJobs />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/activities" element={<Activities />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/admin/applicants" element={<AdminApplicants />} />
                <Route path="/my-applications" element={<MyApplications />} />
                <Route path="/interview/:applicationId" element={<Interview />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/tests" element={<Tests />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/best-candidates" element={<BestCandidates />} />
                <Route path="/resume-generator" element={<ResumeGenerator />} />
                <Route path="/company-profile" element={<CompanyProfile />} />
                <Route path="/skills-verification" element={<SkillsVerification />} />
                <Route path="/job-alerts" element={<JobAlerts />} />
                <Route path="/interview-calendar" element={<InterviewCalendar />} />
                <Route path="/video-resume" element={<VideoResume />} />
                <Route path="/company-reviews" element={<CompanyReviews />} />
                <Route path="/saved-jobs" element={<SavedJobs />} />
                <Route path="/notifications" element={<NotificationsCenter />} />
                <Route path="/profile-completion" element={<ProfileCompletion />} />
                <Route path="/applicant-tracking" element={<ApplicantTracking />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;