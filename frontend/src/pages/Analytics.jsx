import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { analyticsAPI } from '../services/api';
import { toast } from 'sonner';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, Award, Target, Calendar, CheckCircle,
  RefreshCw, Activity
} from 'lucide-react';

// ─── Skeleton components ──────────────────────────────────────────────────────

const CardSkeleton = () => (
  <div className="relative overflow-hidden p-7 rounded-[2rem] bg-white/5 border border-white/10 animate-pulse">
    <div className="flex items-center justify-between mb-5">
      <div className="w-12 h-12 bg-white/10 rounded-2xl" />
      <div className="w-14 h-6 bg-white/10 rounded-xl" />
    </div>
    <div className="w-20 h-3 bg-white/10 rounded-lg mb-3" />
    <div className="w-16 h-9 bg-white/10 rounded-lg" />
  </div>
);

const ChartSkeleton = ({ height = 'h-[350px]' }) => (
  <div className={`${height} w-full bg-white/5 rounded-2xl animate-pulse`} />
);

// ─── Main Component ───────────────────────────────────────────────────────────

const DATE_RANGES = [
  { label: '7 kun', days: 7 },
  { label: '30 kun', days: 30 },
  { label: '90 kun', days: 90 },
  { label: '1 yil', days: 365 },
];

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

const Analytics = () => {
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState(null);
  const [skills, setSkills] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [dateRange, setDateRange] = useState(30);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const [overviewRes, skillsRes, monthlyRes, matchRes] = await Promise.allSettled([
        analyticsAPI.getOverview(dateRange),
        analyticsAPI.getTopSkills(dateRange),
        analyticsAPI.getMonthlyStats(),
        analyticsAPI.getMatchStats(dateRange),
      ]);

      if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value.data);
      if (skillsRes.status === 'fulfilled') setSkills(skillsRes.value.data || []);
      if (monthlyRes.status === 'fulfilled') setMonthly(monthlyRes.value.data || []);
      if (matchRes.status === 'fulfilled') setMatchData(matchRes.value.data.distribution || []);

      if (showRefresh) toast.success("Ma'lumotlar yangilandi!");

    } catch (error) {
      console.error('Analytics fetch error:', error);
      toast.error("Analitika ma'lumotlarini yuklashda xatolik");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData(false);
  }, [fetchData, dateRange]);

  // ── Derived data ──────────────────────────────────────────────────────────

  const [matchData, setMatchData] = useState([]);

  const statCards = [
    {
      title: "Jami Rezyumalar",
      value: overview?.total_resumes ?? '—',
      change: overview?.changes?.resumes ?? '+0%',
      icon: TrendingUp,
      accent: 'indigo',
    },
    {
      title: "Ish E'lonlari",
      value: overview?.total_jobs ?? '—',
      change: overview?.changes?.jobs ?? '+0%',
      icon: Award,
      accent: 'purple',
    },
    {
      title: "O'rtacha Mos Kelish",
      value: overview?.avg_match_score ? `${overview.avg_match_score}%` : '—',
      change: overview?.changes?.matches ?? '+0%',
      icon: Target,
      accent: 'emerald',
    },
    {
      title: 'Yangi Foydalanuvchilar',
      value: overview?.total_users ?? '—',
      change: overview?.changes?.users ?? '+0%',
      icon: CheckCircle,
      accent: 'amber',
    },
  ];

  const accentColors = {
    indigo: { icon: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400', dot: 'bg-indigo-500' },
    purple: { icon: 'bg-purple-500/10 border-purple-500/20 text-purple-400', dot: 'bg-purple-500' },
    emerald: { icon: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', dot: 'bg-emerald-500' },
    amber: { icon: 'bg-amber-500/10 border-amber-500/20 text-amber-400', dot: 'bg-amber-500' },
  };

  const tooltipStyle = {
    backgroundColor: '#0a0f1d',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '1.25rem',
    padding: '0.875rem',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0f1d] p-4 sm:p-6 lg:p-8 relative overflow-hidden font-['Outfit']">
      {/* Background */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 space-y-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
              Analitika <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">📊</span>
            </h1>
            <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-xs">
              Tizim samaradorligi va real vaqtdagi statistika.
            </p>
          </div>

          {/* Date range + Refresh */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Date range pills */}
            <div className="flex items-center gap-1.5 p-1.5 bg-white/5 border border-white/10 rounded-2xl">
              {DATE_RANGES.map(({ label, days }) => (
                <button
                  key={days}
                  onClick={() => setDateRange(days)}
                  className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${dateRange === days
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Refresh */}
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl border border-white/10 transition-all font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Yangilash</span>
            </button>
          </div>
        </div>

        {/* ── Stat Cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {loading ? (
            [...Array(4)].map((_, i) => <CardSkeleton key={i} />)
          ) : (
            statCards.map((card, i) => {
              const Icon = card.icon;
              const ac = accentColors[card.accent];
              return (
                <div key={i} className="relative overflow-hidden group p-7 rounded-[2rem] bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl hover:bg-white/10 transition-all duration-300">
                  <div className="absolute top-0 right-0 p-7 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all pointer-events-none">
                    <Icon className="w-24 h-24" />
                  </div>
                  <div className="relative z-10 flex flex-col gap-5">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 ${ac.icon} rounded-2xl border flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon size={22} />
                      </div>
                      <span className="text-emerald-400 text-[10px] font-black bg-emerald-400/10 px-3 py-1.5 rounded-xl border border-emerald-400/20 uppercase tracking-widest">
                        {card.change}
                      </span>
                    </div>
                    <div>
                      <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-1">{card.title}</p>
                      <p className="text-3xl font-black text-white">{card.value}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Charts Row ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Monthly Trend */}
          <div className="p-6 lg:p-8 rounded-[2.5rem] bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl">
            <div className="flex items-center gap-4 mb-6 lg:mb-8">
              <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                <Calendar size={22} />
              </div>
              <div>
                <h2 className="text-lg lg:text-xl font-black text-white">Oylik Tahlil</h2>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">
                  {dateRange} kunlik ko'rsatkichlar
                </p>
              </div>
            </div>

            {loading ? (
              <ChartSkeleton height="h-[280px] lg:h-[350px]" />
            ) : monthly.length === 0 ? (
              <div className="h-[280px] lg:h-[350px] flex flex-col items-center justify-center gap-3">
                <Activity className="w-12 h-12 text-slate-700" />
                <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">
                  Ma'lumot mavjud emas
                </p>
              </div>
            ) : (
              <div className="h-[280px] lg:h-[350px] w-full" style={{ minHeight: '280px', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <LineChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} />
                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontSize: '11px', fontWeight: 700 }} />
                    <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }} />
                    <Line type="monotone" dataKey="resumes" stroke="#6366f1" strokeWidth={3} name="Rezyumalar" dot={{ fill: '#6366f1', r: 4, stroke: '#0a0f1d', strokeWidth: 2 }} activeDot={{ r: 7 }} />
                    <Line type="monotone" dataKey="jobs" stroke="#a855f7" strokeWidth={3} name="Ish E'lonlari" dot={{ fill: '#a855f7', r: 4, stroke: '#0a0f1d', strokeWidth: 2 }} activeDot={{ r: 7 }} />
                    <Line type="monotone" dataKey="matches" stroke="#10b981" strokeWidth={3} name="Mosliklar" dot={{ fill: '#10b981', r: 4, stroke: '#0a0f1d', strokeWidth: 2 }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Pie chart */}
          <div className="p-6 lg:p-8 rounded-[2.5rem] bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl">
            <div className="flex items-center gap-4 mb-6 lg:mb-8">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
                <Target size={22} />
              </div>
              <div>
                <h2 className="text-lg lg:text-xl font-black text-white">Moslik Statistikasi</h2>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Resume sifati taqsimoti</p>
              </div>
            </div>

            {loading ? (
              <ChartSkeleton height="h-[280px] lg:h-[350px]" />
            ) : (
              <div className="h-[280px] lg:h-[350px] w-full" style={{ minHeight: '280px', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <PieChart>
                    <Pie data={matchData} cx="50%" cy="50%" innerRadius="35%" outerRadius="60%" paddingAngle={8} dataKey="value">
                      {matchData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* ── Bar Chart ────────────────────────────────────────────────────── */}
        <div className="p-6 lg:p-8 rounded-[2.5rem] bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl">
          <div className="flex items-center gap-4 mb-6 lg:mb-8">
            <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400">
              <Award size={22} />
            </div>
            <div>
              <h2 className="text-lg lg:text-xl font-black text-white">Top Texnologiyalar</h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Talab va miqdor bo'yicha</p>
            </div>
          </div>

          {loading ? (
            <ChartSkeleton height="h-[300px] lg:h-[400px]" />
          ) : skills.length === 0 ? (
            <div className="h-[300px] flex flex-col items-center justify-center gap-3">
              <Award className="w-12 h-12 text-slate-700" />
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">Ma'lumot mavjud emas</p>
            </div>
          ) : (
            <div className="h-[300px] lg:h-[400px] w-full" style={{ minHeight: '300px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={skills} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <defs>
                    <linearGradient id="barG1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={1} />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0.3} />
                    </linearGradient>
                    <linearGradient id="barG2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="skill" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={tooltipStyle} />
                  <Bar dataKey="demand" fill="url(#barG1)" radius={[10, 10, 0, 0]} name="Talab %" barSize={32} />
                  <Bar dataKey="count" fill="url(#barG2)" radius={[10, 10, 0, 0]} name="Soni" barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ── Skills Table ──────────────────────────────────────────────────── */}
        <div className="rounded-[2rem] bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <h2 className="text-lg font-black text-white">Top Ko'nikmalar — Batafsil</h2>
            {!loading && (
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {skills.length} ta ko'nikma
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-white/5">
                  {['Reyting', "Ko'nikma", 'Talab', 'Rezyuma Soni', 'Vizual'].map((h) => (
                    <th key={h} className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[...Array(5)].map((__, j) => (
                        <td key={j} className="px-6 py-5">
                          <div className="h-3 bg-white/10 rounded-lg w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : skills.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">
                        Ko'nikma ma'lumotlari mavjud emas
                      </p>
                    </td>
                  </tr>
                ) : (
                  skills.map((skill, index) => (
                    <tr key={index} className="group hover:bg-white/[0.03] transition-colors">
                      <td className="px-6 py-5">
                        {index === 0 && <span className="text-xl">🥇</span>}
                        {index === 1 && <span className="text-xl">🥈</span>}
                        {index === 2 && <span className="text-xl">🥉</span>}
                        {index > 2 && <span className="text-slate-600 font-black text-sm">#{index + 1}</span>}
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-black text-white uppercase tracking-tight text-sm">{skill.skill}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-purple-500/20">
                          {skill.demand}%
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-slate-400 font-bold text-xs">{skill.count} ta</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="w-36 lg:w-48 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-1000"
                            style={{ width: `${skill.demand}%` }}
                          />
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
    </div>
  );
};

export default Analytics;
