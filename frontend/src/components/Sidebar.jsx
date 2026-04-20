import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  BarChart3,
  Activity,
  LogOut,
  Users,
  ChevronDown,
  User,
  X,
  Bell,
  Moon,
  Sun,
  Clock,
  Search,
  MessageCircle,
  Award,
  Download,
  Building2,
  Calendar,
  Video,
  Star,
  Bookmark,
  Target
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect } from 'react';
import { applicationsAPI, notificationsAPI } from '../services/api';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { getLocale } from '../context/LanguageContext';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { logout, user } = useAuth();
  const { language, setLanguage, t, locale } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [hasActiveInterviews, setHasActiveInterviews] = useState(false);

  useEffect(() => {
    fetchNotificationData();
    const interval = setInterval(fetchNotificationData, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchNotificationData = async () => {
    try {
      if (!user) return;

      const [notifRes, countRes] = await Promise.all([
        notificationsAPI.getAll(),
        user.role === 'admin' ? applicationsAPI.getNotificationsCount() : Promise.resolve({ data: { count: 0 } })
      ]);

      setNotifications(notifRes.data || []);
      const unreadCount = (notifRes.data || []).filter(n => !n.is_read).length;
      setNotificationCount(unreadCount + (countRes.data?.count || 0));

      // Check for active interviews if user is not admin
      if (user.role !== 'admin') {
        try {
          const appRes = await applicationsAPI.getMyApplications();
          const apps = appRes.data?.data || appRes.data || [];
          const activeApps = apps.some(app => app.status === 'interview' && app.ai_interview_data);
          setHasActiveInterviews(activeApps);
        } catch (e) {
          console.error('Error fetching applications:', e);
        }
      }
    } catch (error) {
      console.error('Fetch notifications error:', error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      setNotificationCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setNotificationCount(user.role === 'admin' ? notificationCount - notifications.filter(n => !n.is_read).length : 0);
      toast.success(t('allNotificationsRead'));
    } catch (error) {
      console.error('Mark all read error:', error);
    }
  };

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    if (setSidebarOpen) setSidebarOpen(false);
  }, [location.pathname]);

  const adminMenuItems = [
    { id: 'dashboard', path: '/', icon: LayoutDashboard, label: t('dashboard') },
    { id: 'admin-panel', path: '/admin', icon: Users, label: 'Boshqaruv paneli' },
    { id: 'jobs', path: '/jobs', icon: Briefcase, label: t('jobs') },
    { id: 'companies', path: '/companies', icon: Building2, label: 'Kompaniyalar' },
    { id: 'applicants', path: '/admin/applicants', icon: Users, label: t('applicants'), hasBadge: true },
    { id: 'resumes', path: '/resumes', icon: FileText, label: t('resumes') },
    { id: 'analytics', path: '/analytics', icon: BarChart3, label: t('analytics') },
    { id: 'company-reviews', path: '/company-reviews', icon: Star, label: 'Company Reviews' },
    { id: 'notifications', path: '/notifications', icon: Bell, label: 'Notifications' },
  ];

  const employerMenuItems = [
    { id: 'my-jobs', path: '/my-jobs', icon: Briefcase, label: t('myJobs') },
    { id: 'applicant-tracking', path: '/applicant-tracking', icon: Users, label: 'Applicant Tracking' },
    { id: 'jobs', path: '/jobs', icon: Search, label: t('findJobs') },
    { id: 'companies', path: '/companies', icon: Building2, label: 'Kompaniyalar' },
    { id: 'best-candidates', path: '/best-candidates', icon: Award, label: 'Eng yaxshi nomzodlar' },
    { id: 'company-profile', path: '/company-profile', icon: Building2, label: 'Company Profile' },
    { id: 'company-reviews', path: '/company-reviews', icon: Star, label: 'Company Reviews' },
    { id: 'notifications', path: '/notifications', icon: Bell, label: 'Notifications' },
    { id: 'messages', path: '/messages', icon: MessageCircle, label: 'Xabarlar' },
  ];

  const candidateMenuItems = [
    { id: 'profile-completion', path: '/profile-completion', icon: Target, label: 'Profile Completion' },
    { id: 'jobs', path: '/jobs', icon: Briefcase, label: t('jobs') },
    { id: 'companies', path: '/companies', icon: Building2, label: 'Kompaniyalar' },
    { id: 'saved-jobs', path: '/saved-jobs', icon: Bookmark, label: 'Saved Jobs' },
    { id: 'applications', path: '/my-applications', icon: FileText, label: t('myApplications') },
    { id: 'interview-calendar', path: '/interview-calendar', icon: Calendar, label: 'Interviews' },
    { id: 'notifications', path: '/notifications', icon: Bell, label: 'Notifications' },
    { id: 'resumes', path: '/resumes', icon: FileText, label: t('resumes') },
    { id: 'video-resume', path: '/video-resume', icon: Video, label: 'Video Resume' },
    { id: 'resume-generator', path: '/resume-generator', icon: Download, label: 'Resume Generator' },
    { id: 'skills-verification', path: '/skills-verification', icon: Award, label: 'Skills Verification' },
    { id: 'job-alerts', path: '/job-alerts', icon: Bell, label: 'Job Alerts' },
    { id: 'company-reviews', path: '/company-reviews', icon: Star, label: 'Company Reviews' },
    { id: 'tests', path: '/tests', icon: Activity, label: t('tests') },
    { id: 'messages', path: '/messages', icon: MessageCircle, label: 'Xabarlar' },
    { id: 'admin-panel', path: '/admin', icon: Users, label: 'Boshqaruv paneli 🎛️', isAdmin: true },
  ];

  if (user?.role === 'candidate' && hasActiveInterviews) {
    candidateMenuItems.push({ id: 'ai-interview', path: '/my-applications', icon: Clock, label: t('aiInterview'), isSpecial: true });
  }

  let menuItems;
  if (user?.role === 'admin') {
    menuItems = adminMenuItems;
  } else if (user?.role === 'employer') {
    menuItems = employerMenuItems;
  } else {
    menuItems = candidateMenuItems;
  }

  const languages = [
    { code: 'uz', name: 'UZB', flag: '🇺🇿' },
    { code: 'ru', name: 'RUS', flag: '🇷🇺' },
    { code: 'en', name: 'ENG', flag: '🇺🇸' },
  ];

  const currentLang = languages.find((lang) => lang.code === language);

  const handleLogout = () => {
    logout();
    toast.success("Tizimdan muvaffaqiyatli chiqdingiz!");
    setTimeout(() => {
      window.location.href = '/login';
    }, 800);
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (setSidebarOpen) setSidebarOpen(false);
  };

  return (
    <>
      <div
        className={`
          w-72 bg-[var(--bg-main)]/95 backdrop-blur-3xl min-h-screen flex flex-col
          fixed left-0 top-0 z-50 shadow-2xl overflow-hidden border-r border-[var(--border-main)]
          font-['Outfit'] transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="absolute top-[-100px] left-[-100px] w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute bottom-[-50px] right-[-50px] w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="p-8 relative flex items-center justify-between">
          <div
            className="flex items-center gap-4 group cursor-pointer"
            onClick={() => handleNavigate('/')}
          >
            <div className="w-12 h-12 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 font-bold italic text-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              RM
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-[0.2em] leading-none">MATCHER</h1>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em] mt-1.5 opacity-80">
                Intelligence
              </p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen && setSidebarOpen(false)}
            className="lg:hidden p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 mb-6">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`w-full flex items-center justify-between p-4 rounded-[1.5rem] border transition-all ${showNotifications ? 'bg-indigo-600 border-indigo-500 shadow-xl shadow-indigo-500/20 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell size={18} className={notificationCount > 0 ? 'animate-bounce' : ''} />
                  {notificationCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#121827] animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                  )}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">{t('notifications')}</span>
              </div>
              <div className={`transition-transform duration-300 ${showNotifications ? 'rotate-180' : ''}`}>
                <ChevronDown size={14} />
              </div>
            </button>

            {showNotifications && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] bg-[var(--bg-surface)] backdrop-blur-3xl border border-[var(--border-main)] rounded-[2rem] shadow-2xl z-[70] overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-300">
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t('recentMessages')}</span>
                  <button onClick={handleMarkAllRead} className="text-[8px] font-bold uppercase text-indigo-400 hover:text-indigo-300 tracking-widest transition-colors">{t('markAllRead')}</button>
                </div>
                <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-10 text-center">
                      <Bell className="mx-auto w-8 h-8 text-slate-700 mb-3 opacity-20" />
                      <p className="text-[10px] font-bold uppercase text-slate-600 tracking-widest">{t('noMessages')}</p>
                    </div>
                  ) : (
                    notifications.map((notif, idx) => (
                      <div
                        key={notif.id}
                        onClick={() => handleMarkAsRead(notif.id)}
                        className={`p-4 border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer relative group ${!notif.is_read ? 'bg-indigo-500/5' : ''}`}
                      >
                        {!notif.is_read && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full" />}
                        <h4 className={`text-[11px] font-bold uppercase tracking-tight mb-1 ${!notif.is_read ? 'text-white' : 'text-slate-400'}`}>{notif.title}</h4>
                        <p className="text-[10px] text-slate-500 font-bold leading-relaxed mb-2 line-clamp-2">{notif.message}</p>
                        <div className="flex items-center gap-2">
                          <Clock size={10} className="text-slate-600" />
                          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">
                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 bg-white/[0.02] text-center border-t border-white/5">
                  <button onClick={() => setShowNotifications(false)} className="text-[10px] font-bold uppercase text-slate-500 hover:text-white transition-colors tracking-widest">{t('close')}</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-1 mt-2 overflow-y-auto no-scrollbar">
          <div className="px-4 mb-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">{t('menu')}</span>
          </div>

          {menuItems.map((item, index) => {
            if (item.isAdmin && user?.role !== 'admin') return null;
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.path)}
                style={{ animationDelay: `${index * 60}ms` }}
                className={`
                  w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative
                  animate-in slide-in-from-left-4 fade-in
                  ${isActive
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20'
                    : item.isSpecial
                      ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20 animate-pulse'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 w-1.5 h-6 bg-white rounded-r-full" />
                )}

                <div
                  className={`transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'
                    }`}
                >
                  <Icon size={20} />
                </div>

                <span
                  className={`font-bold text-sm leading-none flex-1 text-left transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                    }`}
                >
                  {item.label}
                </span>

                {item.hasBadge && notificationCount > 0 && !isActive && (
                  <div className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-lg shadow-rose-500/20 min-w-[22px] text-center">
                    {notificationCount}
                  </div>
                )}
              </button>
            );
          })}

          <div className="px-4 mb-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">{t('account')}</span>
          </div>

          <button
            onClick={() => handleNavigate('/profile')}
            className={`
              w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative
              ${location.pathname === '/profile'
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }
            `}
          >
            {location.pathname === '/profile' && (
              <div className="absolute left-0 w-1.5 h-6 bg-white rounded-r-full" />
            )}
            <div
              className={`transition-colors ${location.pathname === '/profile' ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'
                }`}
            >
              <User size={20} />
            </div>
            <span
              className={`font-bold text-sm leading-none flex-1 text-left transition-colors ${location.pathname === '/profile' ? 'text-white' : 'text-slate-400 group-hover:text-white'
                }`}
            >
              {t('profileSettings')}
            </span>
          </button>
        </nav>

        <div className="p-6 bg-white/[0.02] border-t border-white/5 relative">
          <div
            className="flex items-center gap-4 mb-5 p-3 rounded-2xl group hover:bg-white/5 transition-all duration-300 cursor-pointer"
            onClick={() => handleNavigate('/profile')}
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-xl group-hover:scale-110 transition-transform flex-shrink-0">
              {(user?.username || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate uppercase tracking-tight">
                {user?.username || 'User'}
              </p>
              <p className="text-[10px] font-bold text-slate-500 truncate lowercase mt-0.5">
                {user?.email || ''}
              </p>
            </div>
            {user?.role === 'admin' && (
              <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-lg uppercase tracking-widest flex-shrink-0">
                Admin
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="flex flex-col items-center justify-center py-2.5 bg-[var(--bg-surface)] hover:bg-white/10 rounded-xl text-slate-300 transition-all border border-[var(--border-main)]"
            >
              <span className="text-sm">{currentLang?.flag}</span>
              <span className="text-[8px] font-bold uppercase tracking-widest">{currentLang?.name}</span>
            </button>

            <button
              onClick={toggleTheme}
              className="flex flex-col items-center justify-center py-2.5 bg-[var(--bg-surface)] hover:bg-white/10 rounded-xl text-slate-300 transition-all border border-[var(--border-main)]"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} className="text-indigo-400" />}
              <span className="text-[8px] font-bold uppercase tracking-widest mt-0.5">
                {theme === 'dark' ? 'LIGHT' : 'DARK'}
              </span>
            </button>

            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all border border-rose-500/20 group"
            >
              <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
              <span className="text-[8px] font-bold uppercase tracking-widest mt-0.5">{t('logout')}</span>
            </button>
          </div>

          {showLangDropdown && (
            <div className="absolute bottom-[calc(100%-4px)] left-6 right-6 mb-1 p-2 bg-[var(--bg-surface)] backdrop-blur-3xl rounded-[1.5rem] shadow-2xl border border-[var(--border-main)] animate-in zoom-in-95 slide-in-from-bottom-3 duration-200 z-[60]">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setShowLangDropdown(false);
                    toast.success(t('languageChanged').replace('{lang}', lang.code === 'uz' ? 'O\'zbekcha' : lang.code === 'ru' ? 'Русский' : 'English'));
                  }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 ${language === lang.code
                    ? 'bg-indigo-600/15 text-white'
                    : 'hover:bg-white/5 text-slate-400 hover:text-white'
                    }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-lg">{lang.flag}</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{lang.name}</span>
                  </span>
                  {language === lang.code && (
                    <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;