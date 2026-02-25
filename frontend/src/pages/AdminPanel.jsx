import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { adminAPI } from '../lib/api';
import {
  Settings,
  Users,
  Database,
  Server,
  Download,
  Upload,
  Brain,
  HardDrive,
  Cpu,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  UserPlus,
  Shield,
  Briefcase,
  Target
} from 'lucide-react';

const AdminPanel = () => {
  const { t } = useLanguage();
  const [matchingThreshold, setMatchingThreshold] = useState(70);
  const [loading, setLoading] = useState(true);

  // System Status State
  const [systemStatus, setSystemStatus] = useState({
    server: 'online',
    cpu: 0,
    memory: 0,
    disk: 0,
    lastBackup: 'Noma\'lum',
    uptime: '0d 0h 0m'
  });

  // Database Stats State
  const [dbStats, setDbStats] = useState({
    resumes: 0,
    jobs: 0,
    matches: 0,
    users: 0
  });

  // Users State
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    loadStats();
    loadUsers();
    // Poll system stats every 10 seconds
    const interval = setInterval(loadSystemMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [metricsRes, dbRes] = await Promise.all([
        adminAPI.getSystemStats(),
        adminAPI.getDBOverview()
      ]);

      setSystemStatus(prev => ({
        ...prev,
        cpu: metricsRes.data.cpu_usage,
        memory: metricsRes.data.memory_usage,
        disk: metricsRes.data.disk_usage,
        uptime: metricsRes.data.uptime
      }));

      setDbStats({
        resumes: dbRes.data.resumes_count,
        jobs: dbRes.data.jobs_count,
        matches: dbRes.data.matches_count,
        users: dbRes.data.users_count
      });
    } catch (error) {
      console.error('Stats load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await adminAPI.getUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Users load error:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadSystemMetrics = async () => {
    try {
      const response = await adminAPI.getSystemStats();
      setSystemStatus(prev => ({
        ...prev,
        cpu: response.data.cpu_usage,
        memory: response.data.memory_usage,
        disk: response.data.disk_usage,
        uptime: response.data.uptime
      }));
    } catch (error) {
      console.error('Metrics update error:', error);
    }
  };

  // AI Model Info
  const aiModel = {
    name: 'Resume Matcher ML v2.1',
    version: '2.1.0',
    accuracy: 89.5,
    lastUpdate: '01.01.2025'
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
      case 'healthy':
        return <CheckCircle className="text-emerald-400" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-amber-400" size={20} />;
      case 'critical':
      case 'offline':
        return <XCircle className="text-rose-400" size={20} />;
      default:
        return <CheckCircle className="text-slate-500" size={20} />;
    }
  };

  const getStatusColor = (value) => {
    if (value < 60) return 'from-emerald-500 to-teal-500';
    if (value < 80) return 'from-amber-500 to-orange-500';
    return 'from-rose-500 to-red-500';
  };

  const handleExport = async (type) => {
    try {
      let response;
      let filename = `${type}_export.xlsx`;

      switch (type) {
        case 'resumes':
          response = await analyticsAPI.exportResumes();
          filename = 'rezyumalar_hisoboti.xlsx';
          break;
        case 'jobs':
          response = await analyticsAPI.exportJobs();
          filename = 'ishlar_ro\'yxati.xlsx';
          break;
        default:
          response = await analyticsAPI.exportAll();
          filename = 'umumiy_hisobot.xlsx';
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Eksport yakunlandi");
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Eksport qilishda xatolik yuz berdi");
    }
  };

  const handleBackup = async () => {
    try {
      toast.info('Backup yaratilmoqda...');
      const response = await adminAPI.createBackup();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup_${new Date().toISOString().split('T')[0]}.db`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Backup muvaffaqiyatli yuklab olindi');
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Backup yaratishda xatolik yuz berdi');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-8 relative overflow-hidden font-['Outfit'] transition-all duration-300">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px]"></div>

      <div className="relative z-10 space-y-10 animate-in fade-in duration-700">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-[var(--text-main)] tracking-tight flex items-center gap-4">
              <Shield className="text-indigo-500" size={40} />
              ADMIN <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">PANEL</span> 🛡️
            </h1>
            <p className="text-[var(--text-muted)] mt-2 font-bold uppercase tracking-widest text-xs">Tizim boshqaruvi, xavfsizlik va infrastrukturani nazorat qilish.</p>
          </div>
        </div>

        {/* System Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Server status */}
          <div className="p-8 rounded-[2.5rem] bg-[var(--bg-surface)] backdrop-blur-3xl border border-[var(--border-main)] shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                <Server className="text-emerald-400" size={28} />
              </div>
              {getStatusIcon(systemStatus.server)}
            </div>
            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2">{t('serverStatus')}</p>
            <p className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tight">{t(systemStatus.server)}</p>
          </div>

          {/* Stats Mapping */}
          {[
            { label: t('cpuUsage'), value: systemStatus.cpu, icon: Cpu, color: 'indigo' },
            { label: t('memoryUsage'), value: systemStatus.memory, icon: Activity, color: 'purple' },
            { label: t('diskSpace'), value: systemStatus.disk, icon: HardDrive, color: 'amber' }
          ].map((stat, idx) => (
            <div key={idx} className="p-8 rounded-[2.5rem] bg-[var(--bg-surface)] backdrop-blur-3xl border border-[var(--border-main)] shadow-2xl relative overflow-hidden group">
              <div className="flex items-center justify-between mb-6">
                <div className={`w-14 h-14 bg-${stat.color}-500/10 rounded-2xl flex items-center justify-center border border-${stat.color}-500/20 shadow-lg shadow-${stat.color}-500/5`}>
                  <stat.icon className={`text-${stat.color}-400`} size={28} />
                </div>
                <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 bg-white/5 rounded-xl border border-[var(--border-main)] text-[var(--text-main)]`}>
                  {stat.value}%
                </span>
              </div>
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4">{stat.label}</p>
              <div className="w-full bg-white/5 rounded-full h-1.5 relative overflow-hidden group/progress shadow-inner">
                <div
                  className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getStatusColor(stat.value)} h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
                  style={{ width: `${stat.value}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Database Statistics */}
          <div className="p-10 rounded-[3rem] bg-[var(--bg-surface)] backdrop-blur-3xl border border-[var(--border-main)] shadow-2xl relative overflow-hidden group">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                <Database className="text-purple-400" size={24} />
              </div>
              <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight uppercase">{t('databaseStats')}</h2>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                { label: t('resumes'), value: dbStats.resumes, color: 'indigo', icon: Activity },
                { label: t('jobs'), value: dbStats.jobs, color: 'purple', icon: Briefcase },
                { label: t('matches'), value: dbStats.matches, color: 'emerald', icon: Target },
                { label: t('totalUsers'), value: dbStats.users, color: 'amber', icon: Users }
              ].map((stat, idx) => (
                <div key={idx} className="p-6 bg-[var(--bg-main)]/50 rounded-[2rem] border border-[var(--border-main)] group/stat hover:bg-white/[0.08] transition-all duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{stat.label}</p>
                    <div className={`p-1.5 bg-${stat.color}-500/10 rounded-lg`}>
                      <stat.icon size={14} className={`text-${stat.color}-400`} />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-[var(--text-main)] tracking-tighter">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Settings */}
          <div className="p-10 rounded-[3rem] bg-[var(--bg-surface)] backdrop-blur-3xl border border-[var(--border-main)] shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                  <Brain className="text-indigo-400" size={24} />
                </div>
                <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight uppercase">{t('aiSettings')}</h2>
              </div>
              <div className="px-3 py-1 bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-400 shadow-lg shadow-indigo-500/5">
                AI Engine v2.1
              </div>
            </div>

            <div className="space-y-8">
              <div className="p-8 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-[2rem] border border-white/5 relative overflow-hidden">
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2">{t('aiModel')}</p>
                <p className="text-xl font-black text-[var(--text-main)] tracking-tight mb-4">{aiModel.name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{t('modelVersion')}: {aiModel.version}</span>
                  <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    {t('accuracy')}: {aiModel.accuracy}%
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">
                    {t('matchingThreshold')}
                  </label>
                  <span className="text-lg font-black text-indigo-400 tracking-tighter">{matchingThreshold}%</span>
                </div>
                <div className="relative group/range">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={matchingThreshold}
                    onChange={(e) => setMatchingThreshold(e.target.value)}
                    className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between mt-3 px-1">
                    {[0, 25, 50, 75, 100].map(v => (
                      <span key={v} className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{v}%</span>
                    ))}
                  </div>
                </div>
              </div>

              <button className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-3">
                <RefreshCw size={18} />
                {t('updateModel')}
              </button>
            </div>
          </div>
        </div>

        {/* Backup & Export */}
        <div className="p-10 rounded-[3rem] bg-[var(--bg-surface)] backdrop-blur-3xl border border-[var(--border-main)] shadow-2xl relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
              <Download className="text-blue-400" size={24} />
            </div>
            <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight uppercase">{t('backupExport')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="p-6 bg-[var(--bg-main)]/50 rounded-2xl border border-[var(--border-main)] flex flex-col justify-center">
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2">{t('lastBackup')}</p>
              <p className="font-black text-[var(--text-main)] text-xs tracking-widest">{systemStatus.lastBackup}</p>
            </div>

            {[
              { label: t('createBackup'), icon: Upload, fn: handleBackup, color: 'blue' },
              { label: t('exportResumes'), icon: Download, fn: () => handleExport('resumes'), color: 'purple' },
              { label: t('exportJobs'), icon: Download, fn: () => handleExport('jobs'), color: 'emerald' },
              { label: t('exportAll'), icon: Download, fn: () => handleExport('all'), color: 'amber' }
            ].map((btn, idx) => (
              <button
                key={idx}
                onClick={btn.fn}
                className={`p-6 bg-[var(--bg-main)]/50 hover:bg-${btn.color}-500/10 rounded-2xl border border-[var(--border-main)] hover:border-${btn.color}-500/20 transition-all group/btn flex flex-col items-center justify-center gap-3 active:scale-95 text-[var(--text-main)] font-black`}
              >
                <div className={`p-3 bg-${btn.color}-500/10 rounded-xl group-hover/btn:scale-110 transition-transform`}>
                  <btn.icon className={`text-${btn.color}-400`} size={20} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-center">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* User Management */}
        <div className="rounded-[3rem] bg-[var(--bg-surface)] backdrop-blur-3xl border border-[var(--border-main)] shadow-2xl overflow-hidden relative group">
          <div className="p-10 border-b border-[var(--border-main)] bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                <Users className="text-purple-400" size={24} />
              </div>
              <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight uppercase">{t('userManagement')}</h2>
            </div>
            <button className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white px-8 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center gap-3">
              <UserPlus size={18} />
              {t('addUser')}
            </button>
          </div>

          <div className="overflow-x-auto relative z-10">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-main)] bg-white/[0.02]">
                  <th className="px-8 py-6 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{t('userName')}</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{t('email')}</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{t('role')}</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{t('lastActive')}</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{t('status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => (
                  <tr key={user.id} className="group hover:bg-white/[0.03] transition-colors duration-500 border-b border-[var(--border-main)]/30">
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xl shadow-indigo-500/10">
                          {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-black text-[var(--text-main)] uppercase tracking-tight group-hover:text-indigo-400 transition-colors">
                          {user.full_name || user.username}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-8 text-[var(--text-muted)] font-bold text-sm tracking-wide">{user.email}</td>
                    <td className="px-8 py-8">
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${user.role === 'admin'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}>
                        {t(user.role)}
                      </span>
                    </td>
                    <td className="px-8 py-8 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.2em]">
                      {user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Yaqinda'}
                    </td>
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(user.status)}
                        <span className={`text-[10px] font-black uppercase tracking-widest ${user.status === 'online' ? 'text-emerald-400' : 'text-slate-600'
                          }`}>
                          {t(user.status)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;