import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { adminAPI } from '../lib/api';
import {
  Activity,
  Upload,
  BarChart3,
  Briefcase,
  Search,
  Filter,
  Clock,
  CheckCircle,
  Edit,
  Trash2,
  Target,
  FileText
} from 'lucide-react';

const Activities = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [filterType]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const params = filterType !== 'all' ? { action_type: filterType } : {};
      const response = await adminAPI.getActivityLogs(params);
      setActivities(response.data || []);
    } catch (error) {
      console.error('Activities load error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format time ago
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const ts = new Date(timestamp);
    const diff = Math.floor((now - ts) / 1000); // seconds

    if (diff < 60) return t('justNow');
    if (diff < 3600) {
      const mins = Math.floor(diff / 60);
      return `${mins} ${mins === 1 ? t('minute') : t('minutes')} ${t('ago')}`;
    }
    if (diff < 86400) {
      const hrs = Math.floor(diff / 3600);
      return `${hrs} ${hrs === 1 ? t('hour') : t('hours')} ${t('ago')}`;
    }
    const days = Math.floor(diff / 86400);
    return `${days} ${days === 1 ? t('day') : t('days')} ${t('ago')}`;
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'resume_upload': return Upload;
      case 'resume_analysis': return BarChart3;
      case 'job_post': return Briefcase;
      case 'application_submit': return FileText;
      case 'match_analysis': return Target;
      default: return Activity;
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'resume_upload': return 'blue';
      case 'resume_analysis': return 'green';
      case 'job_post': return 'purple';
      case 'application_submit': return 'orange';
      case 'match_analysis': return 'indigo';
      default: return 'slate';
    }
  };

  // Filter activities locally for search
  const filteredActivities = activities
    .filter(activity => {
      const desc = activity.action_description || '';
      const det = activity.details || '';
      if (searchTerm && !desc.toLowerCase().includes(searchTerm.toLowerCase())
        && !det.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });

  // Statistics
  const todayActivities = activities.filter(a => {
    const today = new Date();
    return new Date(a.created_at).toDateString() === today.toDateString();
  }).length;

  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-8 relative overflow-hidden font-['Outfit'] transition-all duration-300">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px]"></div>

      <div className="relative z-10 space-y-10 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-[var(--text-main)] tracking-tight">FAOLIYATLAR <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">LOGI</span> 📜</h1>
            <p className="text-[var(--text-muted)] mt-2 font-bold uppercase tracking-widest text-xs">Tizimda sodir bo'lgan barcha faoliyatlar tarixi va monitoringi.</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: 'Barcha Faoliyatlar', value: activities.length, icon: Activity, color: 'indigo' },
            { label: 'Bugungi Faoliyat', value: todayActivities, icon: CheckCircle, color: 'emerald' },
            { label: 'So\'nggi Faollik', value: activities.filter(a => (new Date() - new Date(a.created_at)) < 3600000).length, icon: Clock, color: 'purple' }
          ].map((stat, idx) => (
            <div key={idx} className="p-8 rounded-[2.5rem] bg-[var(--bg-surface)] backdrop-blur-3xl border border-[var(--border-main)] shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-${stat.color}-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-${stat.color}-500/10 transition-colors`}></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{stat.label}</p>
                  <p className={`text-4xl font-black text-[var(--text-main)] tracking-tight`}>{stat.value || 0}</p>
                </div>
                <div className={`w-16 h-16 bg-${stat.color}-500/10 rounded-2xl flex items-center justify-center border border-${stat.color}-500/20 shadow-lg shadow-${stat.color}-500/10`}>
                  <stat.icon className={`text-${stat.color}-400`} size={28} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="p-8 rounded-[2.5rem] bg-[var(--bg-surface)] backdrop-blur-3xl border border-[var(--border-main)] shadow-2xl relative overflow-hidden group">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative group/search">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/search:text-indigo-400 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Loglardan qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-2xl text-sm font-bold text-[var(--text-main)] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="relative group/filter">
              <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/filter:text-indigo-400 transition-colors" size={20} />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-14 pr-10 py-4 bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-2xl text-sm font-bold text-[var(--text-main)] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="all" className="bg-[#121827]">Barchasi</option>
                <option value="resume_upload" className="bg-[#121827]">Fayl Yuklash</option>
                <option value="resume_analysis" className="bg-[#121827]">AI Tahlil</option>
                <option value="job_post" className="bg-[#121827]">Vakansiya</option>
                <option value="application_submit" className="bg-[#121827]">Arizalar</option>
                <option value="match_analysis" className="bg-[#121827]">Mosliklar</option>
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <Clock size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="rounded-[3rem] bg-[var(--bg-surface)] backdrop-blur-3xl border border-[var(--border-main)] shadow-2xl overflow-hidden relative group">
          <div className="p-10 border-b border-[var(--border-main)] bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                <Clock className="text-indigo-400" size={24} />
              </div>
              <h2 className="text-xl font-black text-[var(--text-main)] tracking-tight uppercase">Yaqindagi Faoliyatlar</h2>
            </div>
            <div className="px-4 py-1.5 bg-white/5 border border-[var(--border-main)] rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Live updates active
            </div>
          </div>

          <div className="divide-y divide-[var(--border-main)]">
            {loading ? (
              <div className="p-32 text-center flex flex-col items-center justify-center space-y-8 animate-pulse">
                <Activity size={48} className="text-indigo-500/20" />
                <p className="text-[var(--text-muted)] font-black uppercase tracking-[0.3em] text-xs">Yuklanmoqda...</p>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="p-32 text-center flex flex-col items-center justify-center space-y-8">
                <div className="w-24 h-24 bg-white/5 rounded-3xl border-2 border-dashed border-[var(--border-main)] flex items-center justify-center text-slate-400/20">
                  <Activity size={48} />
                </div>
                <p className="text-[var(--text-muted)] font-black uppercase tracking-[0.3em] text-xs">Hech qanday faoliyat topilmadi</p>
              </div>
            ) : (
              filteredActivities.map((activity, idx) => {
                const Icon = getLogIcon(activity.action_type);
                const color = getLogColor(activity.action_type);

                return (
                  <div key={activity.id} className="p-8 group hover:bg-white/[0.03] transition-all duration-500 animate-in slide-in-from-left" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="flex items-start gap-8">
                      {/* Icon */}
                      <div className={`w-14 h-14 bg-${color}-500/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-${color}-500/20 shadow-lg shadow-${color}-500/5 group-hover:scale-110 transition-transform duration-500`}>
                        <Icon className={`text-${color}-400`} size={24} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-4">
                        <div className="flex items-start justify-between gap-6">
                          <div className="space-y-1">
                            <h3 className="text-lg font-black text-[var(--text-main)] tracking-tight group-hover:text-indigo-400 transition-colors uppercase">{activity.action_description}</h3>
                            <p className="text-sm text-[var(--text-muted)] font-bold tracking-wide">{activity.details}</p>
                          </div>
                          <span className="px-3 py-1 bg-white/5 border border-[var(--border-main)] rounded-lg text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest whitespace-nowrap">
                            {getTimeAgo(activity.created_at)}
                          </span>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-[var(--border-main)]">
                            <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                              {(activity.user_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{activity.user_name || `User #${activity.user_id}`}</span>
                          </div>

                          <div className="flex items-center gap-2 text-[var(--text-muted)]">
                            <Clock size={14} className="opacity-50" />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              {new Date(activity.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Activities;
