import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { applicationsAPI } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import {
    Brain,
    Send,
    ChevronRight,
    ChevronLeft,
    Timer,
    CheckCircle,
    AlertCircle,
    Loader2,
    Mic,
    MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

const Interview = () => {
    const { applicationId } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
    const [completed, setCompleted] = useState(false);
    const [evaluation, setEvaluation] = useState(null);

    useEffect(() => {
        loadInterview();
    }, [applicationId]);

    useEffect(() => {
        if (!loading && !completed && timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && !completed) {
            handleSubmit();
        }
    }, [loading, completed, timeLeft]);

    const loadInterview = async () => {
        try {
            setLoading(true);
            // Backend'da generate savollari bor, lekin candidate uchun faqat o'zi bor savollarni olish kerak
            // Hozircha generatsiya API ni ishlatib turamiz (admin bo'lmasa xato berishi mumkin, shuning uchun backendni ham ko'ramiz)
            const response = await applicationsAPI.getMyApplications();
            const application = response.data.find(app => app.id === parseInt(applicationId));

            if (!application) {
                toast.error("Ariza topilmadi");
                navigate('/applications');
                return;
            }

            if (application.ai_interview_data) {
                try {
                    const parsedQuestions = JSON.parse(application.ai_interview_data);
                    if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
                        toast.error("Savollar hali tayyorlanmagan yoki xatolik yuz berdi");
                        navigate('/applications');
                        return;
                    }
                    setQuestions(parsedQuestions);
                } catch (parseError) {
                    console.error('JSON parse error:', parseError);
                    toast.error("Savollar formati xato");
                    navigate('/applications');
                    return;
                }
            } else {
                toast.error("Siz uchun hali intervyu savollari tayyorlanmagan");
                navigate('/applications');
            }
        } catch (error) {
            console.error('Interview load error:', error);
            toast.error("Xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (value) => {
        setAnswers({
            ...answers,
            [currentStep]: value
        });
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            const payload = questions.map((q, idx) => ({
                question: q,
                answer: answers[idx] || "Javob berilmadi"
            }));

            const response = await applicationsAPI.submitInterviewAnswers(applicationId, payload);
            setEvaluation(response.data);
            setCompleted(true);
            toast.success("Intervyu muvaffaqiyatli topshirildi!");
        } catch (error) {
            console.error('Submit error:', error);
            toast.error("Javoblarni yuborishda xatolik yuz berdi");
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center border border-indigo-500/20 animate-pulse">
                        <Brain className="text-indigo-500" size={40} />
                    </div>
                    <p className="text-[var(--text-muted)] font-black uppercase tracking-[0.3em] text-xs">AI Intervyu yuklanmoqda...</p>
                </div>
            </div>
        );
    }

    if (completed) {
        return (
            <div className="min-h-screen bg-[var(--bg-main)] p-8 flex items-center justify-center font-['Outfit']">
                <div className="max-w-2xl w-full p-12 rounded-[3.5rem] bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-3xl text-center space-y-8 animate-in zoom-in-95 duration-700">
                    <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center border border-emerald-500/20 mx-auto shadow-2xl shadow-emerald-500/10">
                        <CheckCircle className="text-emerald-500" size={48} />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-4xl font-black text-[var(--text-main)] tracking-tight">INTERVYU YAKUNLANDI 🎉</h2>
                        <p className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-xs">Javoblaringiz AI tomonidan muvaffaqiyatli baholandi.</p>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-[var(--bg-main)] border border-[var(--border-main)] space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-[var(--text-muted)] font-black uppercase tracking-widest text-[10px]">AI Score</span>
                            <span className="text-3xl font-black text-indigo-500">{evaluation?.score}%</span>
                        </div>
                        <div className="w-full bg-[var(--border-main)] h-2 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
                                style={{ width: `${evaluation?.score}%` }}
                            ></div>
                        </div>
                        <div className="text-left space-y-3">
                            <span className="text-[var(--text-muted)] font-black uppercase tracking-widest text-[10px]">AI Feedback</span>
                            <p className="text-sm text-[var(--text-main)] leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">{evaluation?.feedback}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/applications')}
                        className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
                    >
                        Arizalarimga qaytish
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-main)] p-8 relative overflow-hidden font-['Outfit'] transition-all duration-300">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px]"></div>

            <div className="max-w-4xl mx-auto relative z-10 space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/10">
                            <Brain className="text-white" size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">AI TECH <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">INTERVIEW</span> 🎙️</h1>
                            <p className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-[10px] mt-1">Sizning bilimingiz AI tomonidan real-vaqtda tekshirilmoqda.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-main)] shadow-lg shadow-black/5">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                            <Timer size={20} />
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">Qolgan vaqt</p>
                            <p className={`text-xl font-black ${timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-[var(--text-main)]'}`}>{formatTime(timeLeft)}</p>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{t('steps')} {currentStep + 1} / {questions.length}</span>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{Math.round(((currentStep + 1) / questions.length) * 100)}% yakunlandi</span>
                    </div>
                    <div className="w-full h-4 bg-[var(--bg-surface)] rounded-full p-1 border border-[var(--border-main)] shadow-inner">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_100%] animate-gradient rounded-full transition-all duration-500 shadow-lg shadow-indigo-500/20"
                            style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Question Card */}
                <div className="p-10 rounded-[3rem] bg-[var(--bg-surface)] backdrop-blur-3xl border border-[var(--border-main)] shadow-3xl space-y-10 animate-in slide-in-from-bottom duration-700">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <span className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 font-black border border-indigo-500/20">
                                {currentStep + 1}
                            </span>
                            <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Savol:</h3>
                        </div>
                        <p className="text-xl font-bold text-[var(--text-main)] leading-relaxed pl-2 border-l-4 border-indigo-500/30">
                            {questions[currentStep] || 'Savollar mavjud emas'}
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-3">
                                <MessageSquare size={14} className="text-indigo-500" />
                                Sizning javobingiz:
                            </h4>
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-lg text-emerald-500 border border-emerald-500/20">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="text-[8px] font-black uppercase tracking-widest">AI tahlilga tayyor</span>
                            </div>
                        </div>
                        <textarea
                            value={answers[currentStep] || ''}
                            onChange={(e) => handleAnswerChange(e.target.value)}
                            placeholder="Texnik javobingizni batafsil yozing..."
                            className="w-full h-64 p-8 bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-[2.5rem] outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 text-[var(--text-main)] font-medium text-lg resize-none transition-all placeholder:text-slate-700 leading-relaxed shadow-inner"
                        ></textarea>
                    </div>

                    <div className="flex items-center justify-between pt-4 gap-6">
                        <button
                            onClick={() => setCurrentStep(prev => prev - 1)}
                            disabled={currentStep === 0}
                            className="flex-1 py-5 bg-[var(--bg-main)] hover:bg-[var(--border-main)] text-[var(--text-main)] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-[var(--border-main)] flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed group shadow-lg"
                        >
                            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                            Oldingi
                        </button>

                        {currentStep === questions.length - 1 ? (
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex-[2] py-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70"
                            >
                                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                Topshirish & Yakunlash
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentStep(prev => prev + 1)}
                                className="flex-[2] py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 active:scale-95 group"
                            >
                                Keyingi savol
                                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Warning Toast style */}
                <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-5 backdrop-blur-3xl animate-in fade-in slide-in-from-right duration-1000">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20 flex-shrink-0">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <h5 className="text-sm font-black text-amber-500 uppercase tracking-widest mb-1">Eslatma:</h5>
                        <p className="text-xs text-amber-500/70 font-bold leading-relaxed">
                            Intervyu davomida sahifadan chiqib ketish yoki uni yangilash tavsiya etilmaydi. Yakunlash tugmasini bosishni unutmang.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Interview;
