import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { candidatesAPI } from '../services/api';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import {
    Users,
    Search,
    Filter,
    Star,
    Award,
    Briefcase,
    GraduationCap,
    Code,
    Loader2,
    ChevronRight,
    Mail,
    Phone,
    User,
    TrendingUp,
    Brain
} from 'lucide-react';

const ScoreCard = ({ icon: Icon, label, score, color }) => (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-main)]">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            <Icon size={18} />
        </div>
        <div>
            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{label}</p>
            <p className="text-sm font-black text-[var(--text-main)]">{score}</p>
        </div>
    </div>
);

const CandidateSkeleton = () => (
    <div className="p-6 rounded-[2rem] bg-[var(--bg-surface)] border border-[var(--border-main)] animate-pulse">
        <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-[var(--bg-card)] rounded-2xl" />
            <div className="flex-1">
                <div className="h-5 bg-[var(--bg-card)] rounded-xl w-1/3 mb-2" />
                <div className="h-3 bg-[var(--bg-card)] rounded-xl w-1/2" />
            </div>
            <div className="w-20 h-10 bg-[var(--bg-card)] rounded-xl" />
        </div>
        <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-[var(--bg-card)] rounded-xl" />
            ))}
        </div>
        <div className="h-8 bg-[var(--bg-card)] rounded-xl mt-4" />
    </div>
);

const BestCandidates = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [minScore, setMinScore] = useState(0);
    const [skillFilter, setSkillFilter] = useState('');
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [candidateDetails, setCandidateDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    useEffect(() => {
        loadCandidates();
    }, [minScore, skillFilter]);

    const loadCandidates = async () => {
        try {
            setLoading(true);
            const params = {
                min_score: minScore,
                limit: 50,
            };
            if (skillFilter) {
                params.skills_filter = skillFilter;
            }
            const response = await candidatesAPI.getBestCandidates(params);
            setCandidates(response.data || []);
        } catch (error) {
            console.error('Load candidates error:', error);
            toast.error("Nomzodlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const viewCandidateDetails = async (candidate) => {
        setSelectedCandidate(candidate);
        setDetailsLoading(true);
        try {
            const response = await candidatesAPI.getCandidateDetails(candidate.id);
            setCandidateDetails(response.data);
        } catch (error) {
            console.error('Candidate details error:', error);
            toast.error("Ma'lumotlarni yuklashda xatolik");
        } finally {
            setDetailsLoading(false);
        }
    };

    const filteredCandidates = candidates.filter(c => 
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.skills && c.skills.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-emerald-400';
        if (score >= 60) return 'text-indigo-400';
        if (score >= 40) return 'text-amber-400';
        return 'text-rose-400';
    };

    const getScoreBg = (score) => {
        if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
        if (score >= 60) return 'bg-indigo-500/10 border-indigo-500/20';
        if (score >= 40) return 'bg-amber-500/10 border-amber-500/20';
        return 'bg-rose-500/10 border-rose-500/20';
    };

    return (
        <div className="min-h-screen bg-[var(--bg-main)] p-8 relative overflow-hidden font-['Outfit'] transition-all duration-300">
            {/* Background */}
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px]"></div>

            <div className="relative z-10 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Award className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-[var(--text-main)]">Eng Yaxshi Nomzodlar</h1>
                            <p className="text-[var(--text-muted)] text-xs font-bold">AI orqali reytinglangan eng iqtidorli nomzodlar</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                        <Brain className="text-emerald-400" size={16} />
                        <span className="text-emerald-400 font-black text-xs">AI REYTING</span>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 items-center p-6 bg-[var(--bg-surface)]/50 backdrop-blur-xl rounded-[2rem] border border-[var(--border-main)]">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                        <input
                            type="text"
                            placeholder="Qidirish (ism yoki skills)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-3 pl-12 pr-4 text-[var(--text-main)] font-bold text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Filter size={18} className="text-[var(--text-muted)]" />
                        <select
                            value={minScore}
                            onChange={(e) => setMinScore(parseInt(e.target.value))}
                            className="bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-3 px-4 text-[var(--text-main)] font-bold text-sm outline-none"
                        >
                            <option value={0}>Barcha ballar</option>
                            <option value={40}>40+ ball</option>
                            <option value={60}>60+ ball</option>
                            <option value={80}>80+ ball</option>
                        </select>
                    </div>
                    <input
                        type="text"
                        placeholder="Skill filter (python, js...)"
                        value={skillFilter}
                        onChange={(e) => setSkillFilter(e.target.value)}
                        className="bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-3 px-4 text-[var(--text-main)] font-bold text-sm outline-none w-[180px]"
                    />
                </div>

                {/* Results count */}
                <div className="flex items-center justify-between">
                    <p className="text-[var(--text-muted)] text-sm font-bold">
                        {filteredCandidates.length} ta nomzod topildi
                    </p>
                    <div className="flex items-center gap-2 text-xs font-black text-[var(--text-muted)]">
                        <Star size={14} className="text-amber-400" />
                        <span>Ball 100% gacha</span>
                    </div>
                </div>

                {/* Candidates Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => <CandidateSkeleton key={i} />)}
                    </div>
                ) : filteredCandidates.length === 0 ? (
                    <div className="text-center py-20">
                        <Users size={48} className="text-[var(--text-muted)] mx-auto mb-4" />
                        <p className="text-[var(--text-muted)] font-black text-lg">Nomzodlar topilmadi</p>
                        <p className="text-[var(--text-muted)] text-sm mt-2">Filtrlarni o'zgartirib ko'ring</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCandidates.map((candidate, index) => (
                            <div 
                                key={candidate.id}
                                className={`p-6 rounded-[2rem] bg-[var(--bg-surface)] border transition-all hover:scale-[1.02] cursor-pointer ${getScoreBg(candidate.total_score)}`}
                                onClick={() => viewCandidateDetails(candidate)}
                            >
                                {/* Rank & Avatar */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white ${
                                            index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                                            index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500' :
                                            index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                                            'bg-indigo-600'
                                        }`}>
                                            #{index + 1}
                                        </div>
                                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
                                            <User className="text-white" size={20} />
                                        </div>
                                    </div>
                                    <div className={`text-2xl font-black ${getScoreColor(candidate.total_score)}`}>
                                        {candidate.total_score}
                                    </div>
                                </div>

                                {/* Name & Skills */}
                                <div className="mb-4">
                                    <h3 className="text-lg font-black text-[var(--text-main)] mb-2">{candidate.full_name}</h3>
                                    <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                                        {candidate.skills || 'Skills yo\'q'}
                                    </p>
                                </div>

                                {/* Scores */}
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    <ScoreCard 
                                        icon={Code} 
                                        label="Skills" 
                                        score={candidate.skills_score} 
                                        color="bg-blue-500/10 text-blue-400"
                                    />
                                    <ScoreCard 
                                        icon={GraduationCap} 
                                        label="Ta'lim" 
                                        score={candidate.education_score} 
                                        color="bg-purple-500/10 text-purple-400"
                                    />
                                    <ScoreCard 
                                        icon={Briefcase} 
                                        label="Tajriba" 
                                        score={candidate.experience_score} 
                                        color="bg-amber-500/10 text-amber-400"
                                    />
                                </div>

                                {/* Experience & Resume count */}
                                <div className="flex items-center justify-between pt-4 border-t border-[var(--border-main)]">
                                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)]">
                                        <TrendingUp size={14} />
                                        {candidate.experience_years} yil tajriba
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                                        <Users size={14} />
                                        {candidate.resume_count} resume
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Candidate Details Modal */}
            {selectedCandidate && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedCandidate(null)}>
                    <div className="bg-[var(--bg-surface)] rounded-[3rem] border border-[var(--border-main)] max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        {detailsLoading ? (
                            <div className="p-12 flex items-center justify-center">
                                <Loader2 className="animate-spin text-indigo-400" size={40} />
                            </div>
                        ) : candidateDetails ? (
                            <div className="p-8">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
                                            <User className="text-white" size={28} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-[var(--text-main)]">{candidateDetails.full_name}</h2>
                                            <p className="text-[var(--text-muted)] text-sm">{candidateDetails.email}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedCandidate(null)}
                                        className="p-3 bg-[var(--bg-card)] rounded-xl hover:bg-rose-500/20 transition-colors"
                                    >
                                        <span className="text-rose-400 font-black text-xl">×</span>
                                    </button>
                                </div>

                                {/* Total Score */}
                                <div className={`p-6 rounded-2xl mb-6 ${getScoreBg(candidateDetails.total_score)}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[var(--text-muted)] text-xs font-black uppercase tracking-widest mb-1">Umumiy Reyting</p>
                                            <p className={`text-4xl font-black ${getScoreColor(candidateDetails.total_score)}`}>
                                                {candidateDetails.total_score}
                                            </p>
                                        </div>
                                        <Award size={48} className={getScoreColor(candidateDetails.total_score)} />
                                    </div>
                                </div>

                                {/* Score breakdown */}
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="p-4 bg-blue-500/10 rounded-2xl text-center">
                                        <Code size={24} className="mx-auto mb-2 text-blue-400" />
                                        <p className="text-2xl font-black text-blue-400">{candidateDetails.skills_score}</p>
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase">Skills (40%)</p>
                                    </div>
                                    <div className="p-4 bg-purple-500/10 rounded-2xl text-center">
                                        <GraduationCap size={24} className="mx-auto mb-2 text-purple-400" />
                                        <p className="text-2xl font-black text-purple-400">{candidateDetails.education_score}</p>
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase">Ta'lim (25%)</p>
                                    </div>
                                    <div className="p-4 bg-amber-500/10 rounded-2xl text-center">
                                        <Briefcase size={24} className="mx-auto mb-2 text-amber-400" />
                                        <p className="text-2xl font-black text-amber-400">{candidateDetails.experience_score}</p>
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase">Tajriba (35%)</p>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="space-y-4">
                                    {candidateDetails.skills && (
                                        <div className="p-4 bg-[var(--bg-card)] rounded-2xl">
                                            <p className="text-[var(--text-muted)] text-xs font-black uppercase tracking-widest mb-2">Ko'nikmalar</p>
                                            <div className="flex flex-wrap gap-2">
                                                {candidateDetails.skills.split(',').map((skill, i) => (
                                                    <span key={i} className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-bold">
                                                        {skill.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {candidateDetails.education && (
                                        <div className="p-4 bg-[var(--bg-card)] rounded-2xl">
                                            <p className="text-[var(--text-muted)] text-xs font-black uppercase tracking-widest mb-2">Ta'lim</p>
                                            <p className="text-[var(--text-main)] font-bold">{candidateDetails.education}</p>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 p-4 bg-[var(--bg-card)] rounded-2xl">
                                            <p className="text-[var(--text-muted)] text-xs font-black uppercase tracking-widest mb-1">Tajriba</p>
                                            <p className="text-[var(--text-main)] font-black text-lg">{candidateDetails.experience_years} yil</p>
                                        </div>
                                        <div className="flex-1 p-4 bg-[var(--bg-card)] rounded-2xl">
                                            <p className="text-[var(--text-muted)] text-xs font-black uppercase tracking-widest mb-1">Resumelar</p>
                                            <p className="text-[var(--text-main)] font-black text-lg">{candidateDetails.resume_count}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact */}
                                <div className="mt-6 pt-6 border-t border-[var(--border-main)]">
                                    <div className="flex gap-3">
                                        {candidateDetails.email && (
                                            <a href={`mailto:${candidateDetails.email}`} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-center rounded-2xl transition-colors flex items-center justify-center gap-2">
                                                <Mail size={18} />
                                                Email
                                            </a>
                                        )}
                                        {candidateDetails.phone && (
                                            <a href={`tel:${candidateDetails.phone}`} className="flex-1 py-3 bg-[var(--bg-card)] hover:bg-emerald-500/20 text-[var(--text-main)] font-black text-center rounded-2xl transition-colors flex items-center justify-center gap-2 border border-[var(--border-main)]">
                                                <Phone size={18} />
                                                Phone
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-rose-400 font-bold">Ma'lumotlar yuklanmadi</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BestCandidates;