import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { resumesAPI, statsAPI, analyticsAPI } from '../services/api';
import { toast } from 'sonner';
import {
  FileText,
  Briefcase,
  Users,
  Eye,
  TrendingUp,
  Calendar,
  ChevronRight,
  PlusCircle,
  MoreVertical,
  Activity as ActivityIcon,
  X,
  Mail,
  Phone,
  MapPin,
  Star,
  ExternalLink,
  Shield,
  Zap
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import StatCard from '../components/StatCard';

// ─── Static chart data ───────────────────────────────────────────────────────

const WEEKLY_DATA = [
  { name: 'Dush', count: 40 },
  { name: 'Sesh', count: 30 },
  { name: 'Chor', count: 60 },
  { name: 'Pay', count: 80 },
  { name: 'Jum', count: 50 },
  { name: 'Shan', count: 90 },
  { name: 'Yak', count: 70 },
];

const MONTHLY_DATA = [
  { name: 'Yan', count: 120 },
  { name: 'Fev', count: 180 },
  { name: 'Mar', count: 150 },
  { name: 'Apr', count: 220 },
  { name: 'May', count: 190 },
  { name: 'Iyn', count: 280 },
  { name: 'Iyl', count: 240 },
  { name: 'Avg', count: 310 },
  { name: 'Sen', count: 270 },
  { name: 'Okt', count: 340 },
  { name: 'Noy', count: 300 },
  { name: 'Dek', count: 380 },
];

const COLORS = ['#6366f1', '#a855f7', '#3b82f6', '#2dd4bf', '#f59e0b'];

// ─── Skeleton components ──────────────────────────────────────────────────────

const SkeletonBox = ({ className = '' }) => (
  <div className={`animate-pulse bg-[var(--bg-card)] rounded-2xl ${className}`} />
);

const StatCardSkeleton = () => (
  <div className="relative overflow-hidden p-8 rounded-[2.5rem] bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-2xl">
    <SkeletonBox className="w-14 h-14 rounded-2xl mb-6" />
    <SkeletonBox className="w-24 h-3 mb-4" />
    <SkeletonBox className="w-20 h-10" />
  </div>
);

const TableRowSkeleton = () => (
  <tr className="border-b border-[var(--border-main)]">
    <td className="py-6 px-4">
      <div className="flex items-center gap-5">
        <SkeletonBox className="w-14 h-14 rounded-2xl flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <SkeletonBox className="w-32 h-3" />
          <SkeletonBox className="w-24 h-2" />
        </div>
      </div>
    </td>
    <td className="py-6 px-4">
      <div className="flex justify-center">
        <SkeletonBox className="w-16 h-16 rounded-full" />
      </div>
    </td>
    <td className="py-6 px-4">
      <div className="flex gap-2">
        <SkeletonBox className="w-16 h-6 rounded-xl" />
        <SkeletonBox className="w-16 h-6 rounded-xl" />
      </div>
    </td>
    <td className="py-6 px-4">
      <div className="flex justify-end gap-3">
        <SkeletonBox className="w-10 h-10 rounded-2xl" />
        <SkeletonBox className="w-10 h-10 rounded-2xl" />
      </div>
    </td>
  </tr>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const Dashboard = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ resumes: 0, jobs: 0, applicants: 0 });
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('weekly');
  const [chartData, setChartData] = useState(WEEKLY_DATA);
  const [skillData, setSkillData] = useState([]);
  const [visible, setVisible] = useState(false);

  // Resume detail modal
  const [selectedResume, setSelectedResume] = useState(null);
  const [showResumeModal, setShowResumeModal] = useState(false);

  // MoreVertical dropdown
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  // Trigger stagger animation after mount
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [statsRes, resumesRes] = await Promise.all([
        statsAPI.getStats(),
        resumesAPI.getAll({ limit: 5 }),
      ]);

      setStats({
        resumes: statsRes.data.total_resumes || 0,
        jobs: statsRes.data.total_jobs || 0,
        applicants: statsRes.data.total_users || 0,
      });

      setResumes(resumesRes.data.items || []);

      // Try real skills API, fall back to defaults
      try {
        const skillsRes = await analyticsAPI.getTopSkills();
        if (skillsRes.data && skillsRes.data.length > 0) {
          setSkillData(
            skillsRes.data.slice(0, 5).map((item) => ({
              name: item.skill,
              value: item.demand,
            }))
          );
        } else {
          loadFallbackSkills();
        }
      } catch {
        loadFallbackSkills();
      }

    } catch (error) {
      console.error('Dashboard load error:', error);
      toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackSkills = () => {
    setSkillData([
      { name: 'Python', value: 85 },
      { name: 'React', value: 72 },
      { name: 'JavaScript', value: 90 },
      { name: 'Node.js', value: 65 },
      { name: 'SQL', value: 50 },
    ]);
  };

  const handlePeriodChange = (e) => {
    const period = e.target.value;
    setChartPeriod(period);
    setChartData(period === 'weekly' ? WEEKLY_DATA : MONTHLY_DATA);
    toast.success(period === 'weekly' ? 'Haftalik ko\'rinish' : 'Oylik ko\'rinish');
  };

  const handleViewResume = (resume) => {
    setSelectedResume(resume);
    setShowResumeModal(true);
    setOpenDropdownId(null);
  };

  const handleCloseModal = () => {
    setShowResumeModal(false);
    setSelectedResume(null);
  };

  const handleToggleDropdown = (id) => {
    setOpenDropdownId((prev) => (prev === id ? null : id));
  };

  // ─── Stagger animation helper ─────────────────────────────────────────────

  const staggerClass = (index, base = '') =>
    `${base} transition-all duration-700 ease-out ${visible
      ? 'opacity-100 translate-y-0'
      : 'opacity-0 translate-y-8'
    }`;

  const staggerStyle = (index) => ({
    transitionDelay: `${index * 80}ms`,
  });

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-4 sm:p-6 lg:p-8 relative overflow-hidden font-['Outfit'] transition-all duration-300">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-10">

        {/* ── Welcome Section ──────────────────────────────────────────────── */}
        <div
          className={staggerClass(0, 'flex flex-col sm:flex-row sm:items-center justify-between gap-6')}
          style={staggerStyle(0)}
        >
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--text-main)] tracking-tight">
              Xush kelibsiz!{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
                👋
              </span>
            </h1>
            <p className="text-[var(--text-muted)] font-bold uppercase tracking-[0.2em] text-[8px] sm:text-[10px] pl-1 border-l-2 border-indigo-500/50">
              Platformaning bugungi holati va asosiy ko'rsatkichlar
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 px-6 py-4 bg-[var(--bg-surface)] backdrop-blur-xl rounded-2xl border border-[var(--border-main)] shadow-xl">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-black text-[var(--text-main)] uppercase tracking-widest">
                {new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            {(user?.role === 'admin' || user?.role === 'employer') && (
            <button
              onClick={() => navigate('/jobs')}
              className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-2xl shadow-indigo-500/25 transition-all active:scale-95 group"
            >
              <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-500" />
              <span>Yangi E'lon</span>
            </button>
            )}
          </div>
        </div>

        {/* ── Stats Grid ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              {/* Card 1 — Rezyumalar */}
              <StatCard
                icon={FileText}
                title="Jami Rezyumalar"
                value={stats.resumes}
                color="indigo"
                className={staggerClass(1, '')}
                style={staggerStyle(1)}
                onClick={() => navigate('/resumes')}
                trend={{ icon: TrendingUp, text: '+12%', color: 'emerald' }}
              />

              {/* Card 2 — Ish O'rinlari */}
              <StatCard
                icon={Briefcase}
                title="Ish O'rinlari"
                value={stats.jobs}
                color="purple"
                className={staggerClass(2, '')}
                style={staggerStyle(2)}
                onClick={() => navigate('/jobs')}
                trend={{ text: 'FAOL', color: 'indigo' }}
              />

              {/* Card 3 — Nomzodlar */}
              <StatCard
                icon={Users}
                title="Nomzodlar"
                value={stats.applicants}
                color="teal"
                className={staggerClass(3, '')}
                style={staggerStyle(3)}
                onClick={() => navigate('/activities')}
                trend={{ text: 'YANGI', color: 'amber' }}
              />
            </>
          )}
        </div>

        {/* ── Main Content Grid ─────────────────────────────────────────────── */}
        <div
          className={staggerClass(4, 'grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10')}
          style={staggerStyle(4)}
        >
          {/* Analytics Chart */}
          <div className="lg:col-span-2 p-6 sm:p-8 lg:p-12 rounded-3xl sm:rounded-[3rem] bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
              <TrendingUp size={160} />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
              <div>
                <h2 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tight">Faollik statistikasi</h2>
                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-1">
                  {chartPeriod === 'weekly' ? 'Haftalik yuklangan rezyumalar' : 'Oylik yuklangan rezyumalar'}
                </p>
              </div>
              <div className="flex bg-[var(--bg-main)]/50 p-1.5 rounded-2xl border border-[var(--border-main)]">
                {['weekly', 'monthly'].map(p => (
                  <button
                    key={p}
                    onClick={() => { setChartPeriod(p); setChartData(p === 'weekly' ? WEEKLY_DATA : MONTHLY_DATA); }}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${chartPeriod === p ? 'bg-indigo-600 text-white shadow-xl' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                  >
                    {p === 'weekly' ? 'Haftalik' : 'Oylik'}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <SkeletonBox className="h-[350px] w-full" />
            ) : (
              <div style={{ width: '100%', height: 350, minHeight: 350, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="var(--border-main)" opacity={0.5} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 900 }}
                      dy={15}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: '24px',
                        border: '1px solid var(--border-main)',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                        padding: '16px',
                        backdropFilter: 'blur(16px)'
                      }}
                      itemStyle={{ color: 'var(--text-main)', fontSize: '12px', fontWeight: 'bold' }}
                      cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '4 4' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#6366f1"
                      strokeWidth={5}
                      fillOpacity={1}
                      fill="url(#colorCount)"
                      activeDot={{ r: 8, fill: '#6366f1', stroke: 'white', strokeWidth: 3 }}
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Skill Stats */}
          <div className="p-8 lg:p-10 rounded-[3rem] bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-2xl flex flex-col relative overflow-hidden group">
            <div className="absolute -right-10 top-20 opacity-[0.02] pointer-events-none group-hover:-rotate-45 transition-transform duration-1000">
              <Zap size={180} />
            </div>

            <div className="mb-10">
              <h2 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tight">Top Ko'nikmalar</h2>
              <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-1">Bozor talabi bo'yicha tahlil</p>
            </div>

            {loading ? (
              <div className="flex-1 space-y-8 mt-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex justify-between">
                      <SkeletonBox className="w-20 h-3" />
                      <SkeletonBox className="w-10 h-3" />
                    </div>
                    <SkeletonBox className="w-full h-2.5 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 space-y-8">
                {skillData.map((skill, idx) => (
                  <div
                    key={skill.name}
                    className="space-y-4 transition-all duration-700 ease-out"
                    style={{ transitionDelay: `${(idx + 5) * 100}ms` }}
                  >
                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                      <span className="text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        {skill.name}
                      </span>
                      <span className="text-indigo-500 ml-auto">{skill.value}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-[var(--bg-main)]/50 rounded-full overflow-hidden border border-[var(--border-main)]">
                      <div
                        className="h-full rounded-full shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all duration-1500 ease-out"
                        style={{
                          width: visible ? `${skill.value}%` : '0%',
                          backgroundColor: COLORS[idx % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => navigate('/analytics')}
              className="mt-12 w-full py-5 bg-indigo-600/5 hover:bg-indigo-600 border border-indigo-600/20 text-indigo-500 hover:text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl hover:shadow-indigo-600/20 flex items-center justify-center gap-3 relative z-10"
            >
              <ActivityIcon size={18} />
              Batafsil Hisobot
            </button>
          </div>
        </div>

        {/* ── Recent Candidates ─────────────────────────────────────────────── */}
        <div
          className={staggerClass(5, 'p-8 lg:p-12 rounded-[3.5rem] bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-2xl relative overflow-hidden')}
          style={staggerStyle(5)}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 border border-amber-500/20 shadow-inner">
                <TrendingUp size={24} />
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-black text-[var(--text-main)] uppercase tracking-tight">So'nggi Rezyumalar</h2>
                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-1">Yaqinda yuklangan va tahlil qilingan</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/resumes')}
              className="px-6 py-3 bg-[var(--bg-main)]/50 hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)] font-black text-[10px] uppercase tracking-widest border border-[var(--border-main)] rounded-xl transition-all flex items-center gap-2 group/btn"
            >
              Barchasini ko'rish
              <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[var(--border-main)]">
                  <th className="pb-8 px-4 text-[var(--text-muted)] font-black text-[10px] uppercase tracking-[0.2em]">Nomzod</th>
                  <th className="pb-8 px-4 text-[var(--text-muted)] font-black text-[10px] uppercase tracking-[0.2em] text-center">Match Score</th>
                  <th className="pb-8 px-4 text-[var(--text-muted)] font-black text-[10px] uppercase tracking-[0.2em]">Asosiy Ko'nikmalar</th>
                  <th className="pb-8 px-4 text-[var(--text-muted)] font-black text-[10px] uppercase tracking-[0.2em] text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]" ref={dropdownRef}>
                {loading ? (
                  [...Array(5)].map((_, i) => <TableRowSkeleton key={i} />)
                ) : resumes.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-[2.5rem] bg-[var(--bg-main)]/50 border border-[var(--border-main)] flex items-center justify-center text-[var(--text-muted)] opacity-30">
                          <FileText size={40} />
                        </div>
                        <p className="text-[var(--text-muted)] font-black text-xs uppercase tracking-widest">Hali rezyumalar yuklanmagan</p>
                        <button onClick={() => navigate('/resumes')} className="mt-4 px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20">Resume Yuklash</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  resumes.map((resume, idx) => (
                    <tr
                      key={resume.id}
                      className="group/row hover:bg-white/[0.01] transition-all animate-in fade-in slide-in-from-bottom-2"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <td className="py-7 px-4">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl relative overflow-hidden flex-shrink-0 group-hover/row:scale-105 transition-transform duration-500">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-40" />
                            <div className="relative z-10" style={{ color: COLORS[idx % COLORS.length] }}>
                              {(resume.full_name || resume.file_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div
                              className="absolute inset-0 opacity-10"
                              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-black text-[var(--text-main)] text-sm capitalize tracking-tight group-hover/row:text-indigo-500 transition-colors truncate">
                              {(resume.full_name || resume.file_name?.replace('.pdf', '') || '').toLowerCase()}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[10px] text-[var(--text-muted)] font-bold truncate">{resume.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-7 px-4">
                        <div className="flex items-center justify-center">
                          <div className="w-16 h-16 relative group-hover/row:scale-110 transition-transform duration-500">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle cx="50%" cy="50%" r="42%" stroke="var(--border-main)" strokeWidth="8%" fill="transparent" />
                              <circle
                                cx="50%" cy="50%" r="42%"
                                stroke={COLORS[idx % COLORS.length]}
                                strokeWidth="8%"
                                fill="transparent"
                                strokeDasharray="100 100"
                                strokeDashoffset={100 - (resume.match_score || 85)}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-[var(--text-main)]">
                              {resume.match_score || 85}%
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-7 px-4">
                        <div className="flex flex-wrap gap-2 max-w-[280px]">
                          {resume.skills
                            ? (() => {
                                const skillsArray = Array.isArray(resume.skills) 
                                  ? resume.skills 
                                  : typeof resume.skills === 'string' 
                                    ? resume.skills.split(', ')
                                    : [];
                                return skillsArray.slice(0, 3).map((skill) => (
                                  <span
                                    key={skill}
                                    className="px-3 py-1.5 bg-[var(--bg-main)]/50 border border-[var(--border-main)] text-[var(--text-muted)] group-hover/row:text-[var(--text-main)] group-hover/row:border-indigo-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                                  >
                                    {skill}
                                  </span>
                                ));
                              })()
                            : <span className="text-[var(--text-muted)] text-[10px] font-black italic uppercase italic">Tahlil qilinmoqda...</span>}
                        </div>
                      </td>

                      <td className="py-7 px-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleViewResume(resume)}
                            className="p-3 bg-[var(--bg-main)]/50 hover:bg-indigo-600 text-[var(--text-muted)] hover:text-white rounded-[1.25rem] transition-all border border-[var(--border-main)] shadow-xl active:scale-90"
                          >
                            <Eye size={18} />
                          </button>
                          <div className="relative">
                            <button
                              onClick={() => handleToggleDropdown(resume.id)}
                              className="p-3 bg-[var(--bg-main)]/50 hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-[1.25rem] transition-all border border-[var(--border-main)] shadow-xl"
                            >
                              <MoreVertical size={18} />
                            </button>
                            {openDropdownId === resume.id && (
                              <div className="absolute right-0 top-full mt-3 w-56 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 backdrop-blur-3xl">
                                <button
                                  onClick={() => handleViewResume(resume)}
                                  className="w-full flex items-center gap-4 px-5 py-4 text-[var(--text-muted)] hover:bg-indigo-600/10 hover:text-indigo-500 transition-all text-[11px] font-black uppercase tracking-widest text-left"
                                >
                                  <Eye size={16} />
                                  Tafsilotlar
                                </button>
                                <button
                                  onClick={() => { navigate('/resumes'); setOpenDropdownId(null); }}
                                  className="w-full flex items-center gap-4 px-5 py-4 text-[var(--text-muted)] hover:bg-purple-600/10 hover:text-purple-500 transition-all text-[11px] font-black uppercase tracking-widest text-left shadow-inner"
                                >
                                  <ExternalLink size={16} />
                                  Hammasini ko'rish
                                </button>
                                <div className="p-3 bg-white/5 mx-2 mb-2 rounded-xl text-center">
                                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">ID: RM-{resume.id}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Resume Detail Modal ── */}
      {showResumeModal && selectedResume && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xl" onClick={handleCloseModal} />
          <div className="relative w-full max-w-3xl bg-[var(--bg-surface)] border border-white/10 rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
            <div className="p-8 lg:p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-3xl font-black shadow-2xl shadow-indigo-600/30">
                  {(selectedResume.full_name || selectedResume.file_name || '').charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white capitalize tracking-tight">{(selectedResume.full_name || "Nomzod").toLowerCase()}</h2>
                  <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1 tracking-[0.2em]">{selectedResume.file_name || 'Noma\'lum'}</p>
                </div>
              </div>
              <button onClick={handleCloseModal} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 lg:p-10 space-y-10 overflow-y-auto no-scrollbar flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: Mail, label: 'Email', value: selectedResume.email, color: 'indigo' },
                  { icon: Phone, label: 'Telefon', value: selectedResume.phone, color: 'purple' },
                  { icon: MapPin, label: 'Joylashuv', value: selectedResume.location, color: 'rose' },
                  { icon: Zap, label: 'Match Score', value: `${selectedResume.match_score || 85}%`, color: 'amber' },
                ].map(({ icon: Icon, label, value, color }) => {
                  const colorClasses = {
                    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500',
                    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-500',
                    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-500',
                    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
                  };
                  const classes = colorClasses[color] || colorClasses.indigo;
                  return (
                    <div key={label} className="p-5 rounded-3xl bg-white/5 border border-white/5 flex items-center gap-5 group/item hover:border-white/10 transition-all">
                      <div className={`w-12 h-12 rounded-2xl ${classes} flex items-center justify-center transition-all group-hover/item:scale-110 shadow-lg`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
                        <p className="text-sm font-black text-white mt-1 uppercase truncate">{value || 'Noma\'lum'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-l-4 border-indigo-600 pl-3">Skill Tahlili</h4>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(selectedResume.skills) ? selectedResume.skills : (selectedResume.skills || "").split(', ')).map(skill => (
                    <span key={skill} className="px-4 py-2.5 bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-l-4 border-indigo-600 pl-3">Qisqacha Tavsif</h4>
                <div className="p-6 rounded-[2rem] bg-indigo-600/5 border border-indigo-600/10 italic text-slate-400 text-sm leading-relaxed shadow-inner">
                  "{selectedResume.summary || "Tavsif mavjud emas"}"
                </div>
              </div>
            </div>

            <div className="p-8 lg:p-10 pt-0 flex gap-4">
              <button onClick={handleCloseModal} className="flex-1 py-4 font-black uppercase tracking-widest text-[11px] text-slate-500 hover:text-white transition-all">Yopish</button>
              <button onClick={() => navigate('/resumes')} className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-3">
                Batafsil ko'rish
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Row animation */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
