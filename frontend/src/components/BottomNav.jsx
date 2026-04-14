import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  User, 
  Menu 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const BottomNav = ({ setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { id: 'dashboard', path: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { id: 'jobs', path: '/jobs', icon: Briefcase, label: t('jobs') },
    { id: 'resumes', path: '/resumes', icon: FileText, label: t('resumes') },
    { id: 'profile', path: '/profile', icon: User, label: 'Profil' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-surface)]/80 backdrop-blur-2xl border-t border-[var(--border-main)] z-40 px-6 py-3 pb-8">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 transition-all ${
                isActive ? 'text-indigo-500 scale-110' : 'text-slate-500'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-indigo-500/10' : ''}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
        
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center gap-1 text-slate-500 hover:text-indigo-500 transition-all"
        >
          <div className="p-2 rounded-xl">
            <Menu size={20} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
            Menu
          </span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;
