import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { applicationsAPI } from '../services/api';
import { FileText, Calendar, CheckCircle, Clock, XCircle, AlertCircle, Eye, BrainCircuit, X, Star, Info, Target } from 'lucide-react';

const MyApplications = () => {
    const { t } = useLanguage();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState(null);

    useEffect(() => {
        loadApplications();
    }, []);

    const loadApplications = async () => {
        try {
            setLoading(true);
            const response = await applicationsAPI.getMyApplications();
            // Backend returns { success: true, data: [...] }
            setApplications(response.data.data || []);
        } catch (error) {
            console.error('Applications load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { color: 'indigo', label: 'Kutilmoqda' },
            screening: { color: 'blue', label: 'Saralanmoqda' },
            interview: { color: 'purple', label: 'Suhbat' },
            accepted: { color: 'emerald', label: 'Qabul qilindi' },
            rejected: { color: 'rose', label: 'Rad etildi' },
        };

        const b = badges[status] || badges.pending;

        return (
            <span className={`px-3 py-1 bg-${b.color}-500/10 text-${b.color}-400 border border-${b.color}-400/20 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-${b.color}-500/5`}>
                {b.label}
            </span>
        );
    };

    const parseAIField = (field) => {
        try {
            if (!field) return [];
            return typeof field === 'string' ? JSON.parse(field) : field;
        } catch (e) {
            return [];
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-main)] p-8 relative overflow-hidden font-['Outfit'] transition-colors duration-300">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px]"></div>

            <div className="relative z-10 space-y-10 animate-in fade-in duration-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-[var(--text-main)] tracking-tight">ARIZALAR <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">TARIXI</span> 📂</h1>
                        <p className="text-[var(--text-muted)] mt-2 font-bold uppercase tracking-widest text-xs">Yuborilgan barcha arizalaringiz va ularning joriy holati.</p>
                    </div>
                </div>

                <div className="rounded-[2.5rem] bg-[var(--bg-surface)] backdrop-blur-3xl border border-[var(--border-main)] shadow-2xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    {loading ? (
                        <div className="text-center py-32 flex flex-col items-center justify-center space-y-8">
                            <div className="relative">
                                <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Clock className="text-indigo-500 animate-pulse" size={28} />
                                </div>
                            </div>
                            <p className="text-[var(--text-muted)] font-black uppercase tracking-[0.3em] text-xs">Arizalar yuklanmoqda...</p>
                        </div>
                    ) : applications.length === 0 ? (
                        <div className="text-center py-32 flex flex-col items-center justify-center space-y-8">
                            <div className="w-24 h-24 bg-[var(--bg-main)]/50 rounded-3xl border-2 border-dashed border-[var(--border-main)] flex items-center justify-center text-slate-400/20">
                                <FileText size={48} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight uppercase">Ariza topilmadi</h3>
                                <p className="text-[var(--text-muted)] font-bold text-sm tracking-wide">Siz hali hech qanday ishga ariza topshirmagansiz.</p>
                            </div>
                            <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 active:scale-95 duration-300">
                                Ish izlashni boshlash
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto relative z-10 no-scrollbar">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[var(--border-main)] bg-white/[0.02]">
                                        <th className="px-8 py-6 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Ish Joyi & Kompaniya</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Moslik Tahlili</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Holat (Status)</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Topshirilgan Sana</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Harakatlar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-main)]">
                                    {applications.map((app) => (
                                        <tr key={app.id} className="group hover:bg-white/[0.03] transition-colors duration-500">
                                            <td className="px-8 py-8">
                                                <div className="space-y-1.5">
                                                    <div className="font-black text-[var(--text-main)] uppercase tracking-tight group-hover:text-indigo-400 transition-colors uppercase">{app.job_title}</div>
                                                    <div className="text-[var(--text-muted)] font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                                        <span className="w-1 h-1 bg-indigo-500 rounded-full"></span>
                                                        {app.company}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-32 bg-[var(--bg-main)]/50 rounded-full h-1.5 relative overflow-hidden group/progress shadow-inner">
                                                        <div
                                                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                                            style={{ width: `${app.ai_score || app.match_score}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-black text-[var(--text-main)] tracking-widest">{app.ai_score || app.match_score}%</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-8">
                                                {getStatusBadge(app.status)}
                                            </td>
                                            <td className="px-8 py-8">
                                                <div className="flex items-center gap-3 text-[var(--text-muted)] group-hover:text-indigo-400 transition-colors">
                                                    <Calendar size={16} className="opacity-50" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                        {new Date(app.applied_at).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-8">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => setSelectedApp(app)}
                                                        className="w-10 h-10 bg-[var(--bg-main)]/50 hover:bg-indigo-600 text-[var(--text-muted)] hover:text-white border border-[var(--border-main)] rounded-xl flex items-center justify-center transition-all active:scale-95 duration-300"
                                                        title="Tahlilni ko'rish"
                                                    >
                                                        <Eye size={18} />
                                                    </button>

                                                    {app.status === 'interview' && app.ai_interview_data && (
                                                        <button
                                                            onClick={() => window.location.href = `/interview/${app.id}`}
                                                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20 active:scale-95 duration-300 animate-pulse"
                                                            title="Suhbatni boshlash"
                                                        >
                                                            <BrainCircuit size={14} />
                                                            Suhbatni boshlash
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* AI Insights Modal */}
            {selectedApp && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl transition-opacity animate-in fade-in duration-500" onClick={() => setSelectedApp(null)}></div>
                    <div className="bg-[var(--bg-surface)] backdrop-blur-3xl w-full max-w-2xl rounded-[3rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] border border-[var(--border-main)] relative z-10 overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-10 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 relative border-b border-[var(--border-main)]">
                            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                                <BrainCircuit className="w-full h-full" />
                            </div>

                            <div className="flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                                        <BrainCircuit size={40} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight leading-none mb-2 uppercase">AI MOSLIK TAHLILI</h3>
                                        <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em]">{selectedApp.job_title}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedApp(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-all group border border-[var(--border-main)]">
                                    <X size={24} className="group-hover:rotate-90 transition-transform text-[var(--text-main)]" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-10 overflow-y-auto no-scrollbar flex-1 space-y-12">
                            {/* Score Card */}
                            <div className="flex items-center justify-between p-10 bg-[var(--bg-main)]/50 rounded-[2.5rem] border border-[var(--border-main)] shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">Gemini Match Score</p>
                                    <div className="text-7xl font-black text-[var(--text-main)] flex items-baseline tracking-tighter">
                                        {selectedApp.ai_score || selectedApp.match_score}
                                        <span className="text-2xl text-indigo-500 ml-1 font-black">%</span>
                                    </div>
                                </div>
                                <div className="w-32 h-32 relative z-10">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="64" cy="64" r="56" fill="transparent" stroke="var(--border-main)" strokeWidth="12" />
                                        <circle cx="64" cy="64" r="56" fill="transparent" stroke="url(#modalScoreGradient)" strokeWidth="12"
                                            strokeDasharray={351.8} strokeDashoffset={351.8 - (351.8 * (selectedApp.ai_score || selectedApp.match_score)) / 100}
                                            strokeLinecap="round" className="drop-shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
                                        <defs>
                                            <linearGradient id="modalScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#6366f1" />
                                                <stop offset="100%" stopColor="#a855f7" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-12">
                                {/* Strengths */}
                                <div>
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                                            <Star size={20} className="fill-emerald-500" />
                                        </div>
                                        <h4 className="text-[var(--text-main)] font-black uppercase tracking-tight text-lg">Kuchli Tomonlaringiz</h4>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {parseAIField(selectedApp.ai_strengths).length > 0 ? (
                                            parseAIField(selectedApp.ai_strengths).map((s, idx) => (
                                                <span key={idx} className="px-6 py-3 bg-[var(--bg-main)]/50 text-emerald-400 text-xs font-black rounded-2xl border border-[var(--border-main)] shadow-lg uppercase tracking-wider">
                                                    {s}
                                                </span>
                                            ))
                                        ) : (
                                            <div className="w-full p-6 bg-[var(--bg-main)]/50 rounded-2xl text-[var(--text-muted)] text-xs font-black text-center border border-dashed border-[var(--border-main)] uppercase tracking-widest">
                                                Ma'lumot topilmadi
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Skills Gap */}
                                <div>
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
                                            <AlertCircle size={20} />
                                        </div>
                                        <h4 className="text-[var(--text-main)] font-black uppercase tracking-tight text-lg">Rivojlantirish Kerak bo'lgan Bilimlar</h4>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {parseAIField(selectedApp.ai_missing_skills).length > 0 ? (
                                            parseAIField(selectedApp.ai_missing_skills).map((s, idx) => (
                                                <span key={idx} className="px-6 py-3 bg-[var(--bg-main)]/50 text-rose-400 text-xs font-black rounded-2xl border border-[var(--border-main)] shadow-lg uppercase tracking-wider">
                                                    {s}
                                                </span>
                                            ))
                                        ) : (
                                            <div className="w-full p-6 bg-emerald-500/10 text-emerald-400 text-xs font-black text-center rounded-2xl border border-emerald-500/20 uppercase tracking-widest">
                                                Siz vakansiya talablariga to'liq javob berasiz! ✨
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Summary */}
                                <div>
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
                                            <Info size={20} />
                                        </div>
                                        <h4 className="text-[var(--text-main)] font-black uppercase tracking-tight text-lg">AI Xulosasi & Tavsiyalar</h4>
                                    </div>
                                    <div className="p-8 bg-[var(--bg-main)]/50 rounded-[2.5rem] text-[var(--text-muted)] text-sm font-bold leading-relaxed border border-[var(--border-main)] shadow-inner relative overflow-hidden group">
                                        <div className="absolute -top-4 -left-4 text-white/5 font-serif text-9xl select-none group-hover:text-indigo-500/10 transition-colors">“</div>
                                        <p className="relative z-10 pl-6 border-l-2 border-indigo-500/30 whitespace-pre-wrap text-[var(--text-main)]">{selectedApp.ai_summary || "Hozircha tahlil mavjud emas."}</p>
                                    </div>
                                </div>

                                {/* Interview Performance (If available) */}
                                {selectedApp.ai_interview_score > 0 && (
                                    <div>
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20">
                                                <Target size={20} />
                                            </div>
                                            <h4 className="text-[var(--text-main)] font-black uppercase tracking-tight text-lg">AI Suhbat Natijasi</h4>
                                        </div>
                                        <div className="p-8 bg-[var(--bg-main)]/50 rounded-[2.5rem] border border-[var(--border-main)] flex items-center justify-between">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Interview Score</p>
                                                <div className="text-4xl font-black text-purple-400">{selectedApp.ai_interview_score}%</div>
                                            </div>
                                            <div className="max-w-[60%] text-right font-bold text-xs text-[var(--text-muted)] italic">
                                                "{selectedApp.ai_interview_feedback}"
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 bg-black/5 border-t border-[var(--border-main)] flex justify-end">
                            <button onClick={() => setSelectedApp(null)} className="px-10 py-4 bg-[var(--bg-main)]/50 text-[var(--text-muted)] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-[var(--border-main)] hover:bg-white/10 hover:text-[var(--text-main)] transition-all active:scale-95 duration-300">
                                Yopish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

};

export default MyApplications;
