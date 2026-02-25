import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { applicationsAPI, jobsAPI, analyticsAPI } from '../services/api';
import { Users, Briefcase, CheckCircle, XCircle, Clock, Eye, AlertCircle, BrainCircuit, Star, X, Info, Search, Filter, Download, Loader2 } from 'lucide-react';

const AdminApplicants = () => {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedAIApp, setSelectedAIApp] = useState(null);
    const [selectedInterviewApp, setSelectedInterviewApp] = useState(null);
    const [interviewQuestions, setInterviewQuestions] = useState([]);
    const [interviewLoading, setInterviewLoading] = useState(false);
    const [interviewSubmitting, setInterviewSubmitting] = useState(false);

    useEffect(() => {
        if (user?.role !== 'admin') {
            window.location.href = '/';
            return;
        }
        loadJobs();
    }, [user]);

    const loadJobs = async () => {
        try {
            const response = await jobsAPI.getAll({ limit: 100 });
            const jobItems = response.data.items || [];
            setJobs(jobItems);
            if (jobItems.length > 0) {
                setSelectedJob(jobItems[0]);
                loadApplicants(jobItems[0].id);
            }
        } catch (error) {
            console.error('Jobs load error:', error);
        }
    };

    const loadApplicants = async (jobId) => {
        try {
            setLoading(true);
            const response = await applicationsAPI.getJobApplicants(jobId, { limit: 100 });
            setApplicants(response.data.items || []);
        } catch (error) {
            console.error('Applicants load error:', error);
            setApplicants([]);
        } finally {
            setLoading(false);
        }
    };

    const handleJobSelect = (job) => {
        setSelectedJob(job);
        loadApplicants(job.id);
    };

    const updateStatus = async (applicationId, status) => {
        try {
            await applicationsAPI.updateStatus(applicationId, status, '');
            loadApplicants(selectedJob.id);
        } catch (error) {
            alert('Xatolik: ' + error.message);
        }
    };

    const startAIInterview = async (app) => {
        try {
            setInterviewLoading(true);
            await applicationsAPI.generateInterviewQuestions(app.id);
            alert('Savollar muvaffaqiyatli yaratildi. Nomzod endi o\'zining "Arizalar tarixi" sahifasida suhbatni boshlashi mumkin.');
            loadApplicants(selectedJob.id);
        } catch (error) {
            console.error('Interview generation error:', error);
            alert('Savollarni yaratishda xatolik yuz berdi');
        } finally {
            setInterviewLoading(false);
        }
    };

    const handleAnswerChange = (questionId, value) => {
        setInterviewQuestions(prev => prev.map(q =>
            q.id === questionId ? { ...q, answer: value } : q
        ));
    };

    const submitInterview = async () => {
        try {
            setInterviewSubmitting(true);
            const response = await applicationsAPI.submitInterviewAnswers(
                selectedInterviewApp.id,
                interviewQuestions
            );
            alert(`Suhbat yakunlandi! Ball: ${response.data.score}`);
            setSelectedInterviewApp(null);
            loadApplicants(selectedJob.id);
        } catch (error) {
            console.error('Interview submission error:', error);
            alert('Javoblarni yuborishda xatolik yuz berdi');
        } finally {
            setInterviewSubmitting(false);
        }
    };

    const handleExport = async () => {
        if (!selectedJob) return;
        try {
            const response = await analyticsAPI.exportApplicants(selectedJob.id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `applicants_${selectedJob.title}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export error:', error);
            alert('Eksport qilishda xatolik yuz berdi');
        }
    };

    const parseAIField = (field) => {
        try {
            if (!field) return [];
            return typeof field === 'string' ? JSON.parse(field) : field;
        } catch (e) {
            return [];
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { color: 'indigo', label: 'Yangi' },
            screening: { color: 'blue', label: 'Saralash' },
            interview: { color: 'purple', label: 'Suhbat' },
            accepted: { color: 'emerald', label: 'Qabul' },
            rejected: { color: 'rose', label: 'Rad Etildi' },
        };
        const b = badges[status] || badges.pending;
        return (
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-${b.color}-500/10 text-${b.color}-400 border border-${b.color}-400/20`}>
                {b.label}
            </span>
        );
    };

    const COLUMNS = [
        { id: 'pending', label: 'Applied', color: 'bg-indigo-500', desc: 'Yangi arizalar' },
        { id: 'screening', label: 'Screening', color: 'bg-blue-500', desc: 'Saralash' },
        { id: 'interview', label: 'Interview', color: 'bg-purple-500', desc: 'Suhbat jarayoni' },
        { id: 'decision', label: 'Decision', color: 'bg-slate-800', desc: 'Yakuniy qaror' }
    ];

    const getApplicantsByStatus = (statusId) => {
        if (statusId === 'decision') {
            return applicants.filter(a => ['accepted', 'rejected'].includes(a.status));
        }
        return applicants.filter(a => a.status === statusId);
    };

    return (
        <div className="min-h-screen bg-[var(--bg-main)] p-8 relative overflow-hidden font-['Outfit'] transition-all duration-300">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px]"></div>

            <div className="relative z-10 space-y-10 animate-in fade-in duration-700">
                {/* Header Section */}
                <div className="p-10 rounded-[3rem] bg-[var(--bg-surface)] backdrop-blur-3xl border border-[var(--border-main)] shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
                                Admin Control
                            </div>
                            <div className="h-1.5 w-1.5 bg-white/10 rounded-full"></div>
                            <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                ATS Workflow Management
                            </div>
                        </div>

                        <h1 className="text-5xl font-black text-[var(--text-main)] tracking-tight leading-none mb-4">
                            NOMZODLAR <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">OQIMI</span> 🌊
                        </h1>
                        <p className="text-[var(--text-muted)] font-bold text-sm max-w-xl">
                            Gemini AI tahlili asosida nomzodlarni ishning har bir bosqichi bo'yicha aqlli boshqaring va saralang.
                        </p>
                    </div>

                    {/* Job Pills & Export */}
                    <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar flex-1 w-full">
                            {jobs.map((job) => (
                                <button
                                    key={job.id}
                                    onClick={() => handleJobSelect(job)}
                                    className={`flex-shrink-0 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] transition-all duration-300 border relative group ${selectedJob?.id === job.id
                                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-500/20 active:scale-95'
                                        : 'bg-white/5 text-[var(--text-muted)] border-[var(--border-main)] hover:border-indigo-500/50 hover:text-[var(--text-main)]'
                                        }`}
                                >
                                    {job.title}
                                    {selectedJob?.id === job.id && (
                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white border-4 border-[#121827] shadow-lg animate-in zoom-in-50">
                                            <CheckCircle size={12} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleExport}
                            disabled={applicants.length === 0}
                            className="flex-shrink-0 flex items-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-30 disabled:grayscale active:scale-95"
                        >
                            <Download size={18} />
                            Export Report
                        </button>
                    </div>
                </div>

                {/* Kanban Board Layout */}
                <div className="flex gap-8 overflow-x-auto pb-8 h-[calc(100vh-380px)] min-h-[550px] no-scrollbar">
                    {COLUMNS.map(column => {
                        const columnApplicants = getApplicantsByStatus(column.id);
                        return (
                            <div key={column.id} className="flex-shrink-0 w-80 flex flex-col h-full bg-white/[0.02] backdrop-blur-3xl rounded-[2.5rem] p-6 border border-white/5 shadow-2xl transition-all duration-500 hover:bg-white/[0.04]">
                                {/* Column Header */}
                                <div className="flex items-center justify-between mb-8 px-2">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-3 h-3 rounded-full ${column.color} shadow-lg shadow-${column.color.replace('bg-', '')}/20`}></div>
                                            <h3 className="font-black text-[var(--text-main)] text-xs uppercase tracking-[0.2em]">{column.label}</h3>
                                        </div>
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-5">{column.desc}</p>
                                    </div>
                                    <div className="w-10 h-10 bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-xl flex items-center justify-center text-[10px] font-black text-[var(--text-main)] shadow-xl">
                                        {columnApplicants.length}
                                    </div>
                                </div>

                                {/* Column Body - Cards */}
                                <div className="flex-1 overflow-y-auto space-y-5 pr-2 no-scrollbar">
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                            <Loader2 size={32} className="text-white animate-spin" />
                                        </div>
                                    ) : columnApplicants.map(app => (
                                        <div
                                            key={app.id}
                                            className="bg-[var(--bg-surface)] backdrop-blur-xl p-6 rounded-[2.5rem] border border-[var(--border-main)] shadow-xl hover:shadow-2xl hover:bg-white/[0.03] hover:-translate-y-1 transition-all duration-500 group relative animate-in fade-in slide-in-from-bottom-6"
                                        >
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="w-14 h-14 bg-[var(--bg-main)]/50 rounded-2xl flex items-center justify-center text-[var(--text-muted)] font-black group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 border border-[var(--border-main)] shadow-inner text-xl uppercase">
                                                    {app.applicant_name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <div className="flex items-center gap-2 bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                                                        <BrainCircuit size={14} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                                                        <span className="text-[11px] font-black text-indigo-400">{app.ai_score || app.match_score}%</span>
                                                    </div>
                                                    {column.id === 'decision' && getStatusBadge(app.status)}
                                                </div>
                                            </div>

                                            <h4 className="font-black text-[var(--text-main)] text-sm mb-1 group-hover:text-indigo-400 transition-colors uppercase tracking-tight duration-300">{app.applicant_name}</h4>
                                            <p className="text-[10px] font-bold text-[var(--text-muted)] lowercase mb-6 truncate opacity-60 tracking-wider">{app.applicant_email}</p>

                                            {/* AI Insight Preview */}
                                            {app.ai_summary && (
                                                <div className="bg-[var(--bg-main)]/30 p-4 rounded-2xl mb-6 border border-[var(--border-main)] group-hover:bg-indigo-500/5 transition-colors duration-500">
                                                    <p className="text-[10px] text-[var(--text-muted)] font-bold leading-relaxed line-clamp-2 italic opacity-80">"{app.ai_summary}"</p>
                                                </div>
                                            )}

                                            {/* Actions Bar */}
                                            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                                <button
                                                    onClick={() => setSelectedAIApp(app)}
                                                    className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-indigo-600 text-slate-500 hover:text-white rounded-xl transition-all duration-300 border border-white/5 shadow-lg active:scale-95"
                                                    title="Tafsilotlar"
                                                >
                                                    <Eye size={20} />
                                                </button>

                                                <div className="flex gap-2">
                                                    {column.id === 'pending' && (
                                                        <button
                                                            onClick={() => updateStatus(app.id, 'screening')}
                                                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95"
                                                        >
                                                            Review
                                                        </button>
                                                    )}
                                                    {column.id === 'screening' && (
                                                        <button
                                                            onClick={() => updateStatus(app.id, 'interview')}
                                                            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest shadow-xl shadow-purple-500/20 active:scale-95"
                                                        >
                                                            Interview
                                                        </button>
                                                    )}
                                                    {column.id === 'interview' && (
                                                        <button
                                                            onClick={() => startAIInterview(app)}
                                                            disabled={interviewLoading}
                                                            className="px-6 py-3 bg-white hover:bg-indigo-600 text-slate-900 hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 border border-[var(--border-main)] group/btn disabled:opacity-50"
                                                        >
                                                            <BrainCircuit size={16} className={`${interviewLoading ? 'animate-spin' : 'text-indigo-600 group-hover/btn:text-white'} transition-colors`} />
                                                            {interviewLoading ? 'YARATILMOQDA...' : 'AI SUHBAT'}
                                                        </button>
                                                    )}
                                                    {(column.id === 'screening' || column.id === 'interview') && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => updateStatus(app.id, 'accepted')}
                                                                className="w-10 h-10 flex items-center justify-center bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20 active:scale-95"
                                                                title="Qabul"
                                                            >
                                                                <CheckCircle size={20} />
                                                            </button>
                                                            <button
                                                                onClick={() => updateStatus(app.id, 'rejected')}
                                                                className="w-10 h-10 flex items-center justify-center bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20 active:scale-95"
                                                                title="Rad"
                                                            >
                                                                <XCircle size={20} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {!loading && columnApplicants.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center py-24 text-white/5">
                                            <div className="p-6 bg-white/[0.02] rounded-3xl border-2 border-dashed border-white/5 mb-6 animate-pulse">
                                                <Users size={56} />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Bo'sh</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* AI Insights Modal */}
            {selectedAIApp && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
                    <div className="absolute inset-0 bg-[#0a0f1d]/80 backdrop-blur-2xl transition-opacity animate-in fade-in duration-500" onClick={() => setSelectedAIApp(null)}></div>
                    <div className="bg-[#121827]/40 backdrop-blur-3xl w-full max-w-2xl rounded-[3rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] border border-white/10 relative z-10 overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-10 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 relative border-b border-white/5">
                            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                                <BrainCircuit className="w-full h-full" />
                            </div>

                            <div className="flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                                        <BrainCircuit size={40} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white tracking-tight leading-none mb-2 uppercase">AI ANALYTICS</h3>
                                        <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em]">{selectedAIApp.applicant_name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedAIApp(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-all group border border-white/5">
                                    <X size={24} className="group-hover:rotate-90 transition-transform text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-10 overflow-y-auto no-scrollbar flex-1 space-y-12">
                            {/* Score Card */}
                            <div className="flex items-center justify-between p-10 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">Gemini Match Score</p>
                                    <div className="text-7xl font-black text-white flex items-baseline tracking-tighter">
                                        {selectedAIApp.ai_score || selectedAIApp.match_score}
                                        <span className="text-2xl text-indigo-500 ml-1 font-black">%</span>
                                    </div>
                                </div>
                                <div className="w-32 h-32 relative z-10">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="64" cy="64" r="56" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                                        <circle cx="64" cy="64" r="56" fill="transparent" stroke="url(#modalScoreGradient)" strokeWidth="12"
                                            strokeDasharray={351.8} strokeDashoffset={351.8 - (351.8 * (selectedAIApp.ai_score || selectedAIApp.match_score)) / 100}
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
                                        <h4 className="text-white font-black uppercase tracking-tight text-lg">Kuchli Tomonlari</h4>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {parseAIField(selectedAIApp.ai_strengths).length > 0 ? (
                                            parseAIField(selectedAIApp.ai_strengths).map((s, idx) => (
                                                <span key={idx} className="px-6 py-3 bg-white/5 text-emerald-400 text-xs font-black rounded-2xl border border-white/5 shadow-lg uppercase tracking-wider">
                                                    {s}
                                                </span>
                                            ))
                                        ) : (
                                            <div className="w-full p-6 bg-white/5 rounded-2xl text-slate-500 text-xs font-black text-center border border-dashed border-white/10 uppercase tracking-widest">
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
                                        <h4 className="text-white font-black uppercase tracking-tight text-lg">Yetishmayotgan Bilimlar</h4>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {parseAIField(selectedAIApp.ai_missing_skills).length > 0 ? (
                                            parseAIField(selectedAIApp.ai_missing_skills).map((s, idx) => (
                                                <span key={idx} className="px-6 py-3 bg-white/5 text-rose-400 text-xs font-black rounded-2xl border border-white/5 shadow-lg uppercase tracking-wider">
                                                    {s}
                                                </span>
                                            ))
                                        ) : (
                                            <div className="w-full p-6 bg-emerald-500/10 text-emerald-400 text-xs font-black text-center rounded-2xl border border-emerald-500/20 uppercase tracking-widest">
                                                Vakansiya talablariga to'liq javob beradi! ✨
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
                                        <h4 className="text-white font-black uppercase tracking-tight text-lg">AI Xulosasi</h4>
                                    </div>
                                    <div className="p-8 bg-[var(--bg-main)]/50 rounded-[2.5rem] text-[var(--text-muted)] text-sm font-bold leading-relaxed border border-[var(--border-main)] shadow-inner relative overflow-hidden group">
                                        <div className="absolute -top-4 -left-4 text-white/5 font-serif text-9xl select-none group-hover:text-indigo-500/10 transition-colors">“</div>
                                        <p className="relative z-10 pl-6 border-l-2 border-indigo-500/30 whitespace-pre-wrap text-[var(--text-main)]">{selectedAIApp.ai_summary || "Hozircha tahlil mavjud emas."}</p>
                                    </div>
                                </div>

                                {/* Interview Results */}
                                {selectedAIApp.ai_interview_score > 0 && (
                                    <div>
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20">
                                                <BrainCircuit size={20} />
                                            </div>
                                            <h4 className="text-[var(--text-main)] font-black uppercase tracking-tight text-lg">AI Intervyu Natijasi</h4>
                                        </div>
                                        <div className="p-10 bg-[var(--bg-main)]/50 rounded-[2.5rem] border border-[var(--border-main)] space-y-8 relative overflow-hidden group">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Suhbat Balli</p>
                                                    <div className="text-5xl font-black text-purple-400">{selectedAIApp.ai_interview_score}%</div>
                                                </div>
                                                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${selectedAIApp.ai_interview_score > 70 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                    }`}>
                                                    {selectedAIApp.ai_interview_score > 70 ? 'Tavsiya etiladi' : 'Qo\'shimcha tahlil zarur'}
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">AI Feedback:</p>
                                                <p className="text-sm text-[var(--text-main)] leading-relaxed italic border-l-2 border-purple-500/30 pl-4">
                                                    "{selectedAIApp.ai_interview_feedback}"
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 bg-black/20 border-t border-white/5 flex justify-end gap-4">
                            <button onClick={() => setSelectedAIApp(null)} className="px-10 py-4 bg-white/5 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-white/5 hover:bg-white/10 hover:text-white transition-all active:scale-95">
                                Yopish
                            </button>
                            <button className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95">
                                PDF Hisobot
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* AI Interview Modal */}
            {selectedInterviewApp && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 sm:p-12">
                    <div className="absolute inset-0 bg-[#0a0f1d]/80 backdrop-blur-2xl transition-opacity animate-in fade-in duration-500" onClick={() => !interviewSubmitting && setSelectedInterviewApp(null)}></div>
                    <div className="bg-[#121827]/40 backdrop-blur-3xl w-full max-w-2xl rounded-[3rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] border border-white/10 relative z-10 overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-10 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 relative border-b border-white/5">
                            <div className="flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/20">
                                        <BrainCircuit size={40} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white tracking-tight leading-none mb-2 uppercase">AI MOCK INTERVIEW</h3>
                                        <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em]">{selectedInterviewApp.applicant_name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedInterviewApp(null)} disabled={interviewSubmitting} className="p-3 hover:bg-white/10 rounded-2xl transition-all group border border-white/5 disabled:opacity-30">
                                    <X size={24} className="group-hover:rotate-90 transition-transform text-white" />
                                </button>
                            </div>
                        </div>

                        <div className="p-10 overflow-y-auto no-scrollbar flex-1 space-y-10">
                            {interviewLoading ? (
                                <div className="py-24 flex flex-col items-center justify-center space-y-8">
                                    <div className="relative">
                                        <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <BrainCircuit className="text-indigo-500 animate-pulse" size={32} />
                                        </div>
                                    </div>
                                    <p className="font-black text-[10px] text-slate-500 uppercase tracking-[0.4em] animate-pulse text-center">Gemini savollar tayyorlamoqda...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-indigo-500/5 p-8 rounded-[2rem] border border-indigo-500/10 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                            <Info size={40} className="text-indigo-400" />
                                        </div>
                                        <p className="text-sm text-indigo-300 font-bold leading-relaxed relative z-10">
                                            Quyida Gemini AI tomonidan nomzodning tajribasi va ish talablariga moslab generatsiya qilingan savollar berilgan.
                                        </p>
                                    </div>

                                    {interviewQuestions.map((q, idx) => (
                                        <div key={q.id} className="space-y-5 animate-in slide-in-from-left duration-500" style={{ animationDelay: `${idx * 150}ms` }}>
                                            <div className="flex items-start gap-5">
                                                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-1 shadow-xl">
                                                    {String(idx + 1).padStart(2, '0')}
                                                </div>
                                                <p className="font-black text-white text-sm leading-relaxed pt-2 tracking-tight">{q.question}</p>
                                            </div>
                                            <div className="relative group/input">
                                                <textarea
                                                    className="w-full p-6 bg-white/5 border border-white/10 rounded-[2rem] text-sm font-bold text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600 min-h-[120px] resize-none"
                                                    placeholder="Nomzodning javobini kiriting..."
                                                    value={q.answer || ''}
                                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                ></textarea>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>

                        <div className="p-10 bg-black/20 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,1)]"></div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                    {interviewQuestions.length} ta savol tayyor
                                </p>
                            </div>
                            <div className="flex gap-4 w-full sm:w-auto">
                                <button
                                    onClick={() => setSelectedInterviewApp(null)}
                                    disabled={interviewSubmitting}
                                    className="flex-1 sm:flex-none px-10 py-4 bg-white/5 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-white/5 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 active:scale-95"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    onClick={submitInterview}
                                    disabled={interviewLoading || interviewSubmitting || interviewQuestions.length === 0}
                                    className="flex-1 sm:flex-none px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 disabled:bg-slate-800 disabled:text-slate-500 active:scale-95"
                                >
                                    {interviewSubmitting ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Baholanmoqda...
                                        </>
                                    ) : (
                                        <>
                                            <Target size={18} />
                                            Javoblarni Baholash
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminApplicants;
