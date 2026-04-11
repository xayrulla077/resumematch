import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'sonner';
import {
    User, Mail, Lock, Phone, FileText, ArrowRight, BrainCircuit,
    CheckCircle, Eye, EyeOff, AlertCircle, ShieldCheck, Building2,
    Briefcase, UserCircle
} from 'lucide-react';

// ─── Password strength ────────────────────────────────────────────────────────

const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score: 1, label: 'Zaif', color: 'bg-rose-500' };
    if (score === 2) return { score: 2, label: "O'rtacha", color: 'bg-amber-500' };
    if (score === 3) return { score: 3, label: 'Yaxshi', color: 'bg-indigo-500' };
    return { score: 4, label: 'Kuchli', color: 'bg-emerald-500' };
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();
    
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        full_name: '',
        phone: '',
        bio: '',
        role: 'candidate',  // candidate yoki employer
        company_name: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [touched, setTouched] = useState({});

    const passwordStrength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);

    // ── Validation ────────────────────────────────────────────────────────────

    const validationErrors = useMemo(() => {
        const errs = {};
        if (!formData.full_name.trim()) errs.full_name = "To'liq ism majburiy";
        if (!formData.username.trim()) errs.username = "Username majburiy";
        else if (formData.username.length < 3) errs.username = "Username kamida 3 ta belgi";
        if (!formData.email.trim()) errs.email = "Email majburiy";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = "Email format noto'g'ri";
        if (!formData.password) errs.password = "Parol majburiy";
        else if (formData.password.length < 8) errs.password = "Parol kamida 8 ta belgi";
        else if (!/[A-Z]/.test(formData.password)) errs.password = "Parol kamida 1 katta harf bo'lishi kerak";
        else if (!/[0-9]/.test(formData.password)) errs.password = "Parol kamida 1 raqam bo'lishi kerak";
        if (formData.role === 'employer' && !formData.company_name.trim()) errs.company_name = "Kompaniya nomi majburiy";
        return errs;
    }, [formData]);

    const isValid = Object.keys(validationErrors).length === 0;

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleBlur = (field) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
    };

    const fieldError = (field) => touched[field] && validationErrors[field];

    const inputClass = (field) =>
        `w-full bg-[var(--bg-input)] border rounded-2xl py-4 pl-12 pr-5 text-[var(--text-main)] font-bold text-sm focus:ring-2 outline-none transition-all placeholder:text-[var(--text-muted)] ${fieldError(field)
            ? 'border-rose-500 focus:ring-rose-500/30'
            : 'border-[var(--border-main)] focus:ring-indigo-500/30 focus:border-indigo-500'
        }`;

    // ── Submit ────────────────────────────────────────────────────────────────

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate all fields before submit
        const errs = {};
        if (!formData.full_name?.trim()) errs.full_name = "To'liq ism majburiy";
        if (!formData.username?.trim()) errs.username = "Username majburiy";
        else if (formData.username.length < 3) errs.username = "Username kamida 3 ta belgi";
        if (!formData.email?.trim()) errs.email = "Email majburiy";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = "Email format noto'g'ri";
        if (!formData.password) errs.password = "Parol majburiy";
        else if (formData.password.length < 8) errs.password = "Parol kamida 8 ta belgi";
        else if (!/[A-Z]/.test(formData.password)) errs.password = "Parol kamida 1 katta harf bo'lishi kerak";
        else if (!/[0-9]/.test(formData.password)) errs.password = "Parol kamida 1 raqam bo'lishi kerak";
        if (formData.role === 'employer' && !formData.company_name?.trim()) errs.company_name = "Kompaniya nomi majburiy";
        
        if (Object.keys(errs).length > 0) {
            setTouched({ full_name: true, username: true, email: true, password: true, company_name: true });
            toast.error("Iltimos, barcha maydonlarni to'g'ri to'ldiring");
            return;
        }

        setError('');
        setLoading(true);
        try {
            const submitData = { ...formData };
            await register(submitData);
            toast.success("Muvaffaqiyatli ro'yxatdan o'tdingiz! 🎉");
            navigate('/dashboard');
        } catch (err) {
            if (err.response?.status === 422 && Array.isArray(err.response.data?.detail)) {
                const msgs = err.response.data.detail.map((e) => e.msg).join(', ');
                setError(msgs);
            } else {
                setError(err.response?.data?.detail || err.message || "Ro'yxatdan o'tishda xatolik.");
            }
        } finally {
            setLoading(false);
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] relative overflow-hidden font-['Outfit'] py-8 px-4 transition-colors duration-300">
            {/* Background */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />

            <div className="max-w-5xl w-full flex flex-col md:flex-row bg-[var(--bg-surface)]/60 backdrop-blur-3xl rounded-[3rem] border border-[var(--border-main)] shadow-2xl overflow-hidden relative z-10">
                {/* Visual Side */}
                <div className="md:w-1/3 p-10 bg-indigo-600/10 flex flex-col justify-between border-r border-[var(--border-main)]">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/30">
                            <BrainCircuit className="text-white" size={26} />
                        </div>
                        <h1 className="text-2xl font-black text-[var(--text-main)] italic uppercase tracking-tighter">RM</h1>
                    </div>

                    <div className="space-y-6 py-8">
                        <h2 className="text-3xl lg:text-4xl font-black text-[var(--text-main)] leading-tight">
                            Kelajak <span className="text-indigo-400">Sizdan</span> boshlanadi.
                        </h2>
                        <ul className="space-y-4">
                            {[
                                "AI orqali rezyume tahlili",
                                "Smart intervyu tizimi",
                                "Karyera o'sishi statistikasi",
                            ].map((text, i) => (
                                <li key={i} className="flex items-center gap-3 text-[var(--text-muted)] font-bold text-sm">
                                    <CheckCircle size={16} className="text-indigo-500 flex-shrink-0" />
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="p-5 bg-[var(--bg-surface)]/50 rounded-3xl border border-[var(--border-main)]">
                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Hozir qo'shiling</p>
                        <p className="text-[var(--text-main)] font-bold text-xs leading-relaxed">
                            2 daqiqa ichida professional HR vositalaridan foydalanishni boshlang.
                        </p>
                    </div>
                </div>

                {/* Form Side */}
                <div className="flex-1 p-8 lg:p-12 bg-[var(--bg-card)]">
                    <div className="mb-7 flex justify-between items-end">
                        <div>
                            <h2 className="text-3xl font-black text-[var(--text-main)] mb-1 uppercase tracking-tight">Ro'yxatdan o'tish</h2>
                            <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">Yangi akkount yaratish</p>
                        </div>
                        <Link to="/login" className="text-xs font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest pb-1 border-b-2 border-indigo-400/30 transition-colors">
                            Kirish
                        </Link>
                    </div>

                    {/* Server Error */}
                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl mb-6 text-xs font-bold flex items-start gap-3 animate-in fade-in duration-300">
                            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5" noValidate>
                        {/* Full Name */}
                        <div className="space-y-1.5 group">
                            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 group-focus-within:text-indigo-400 transition-colors">To'liq ism</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-indigo-400 transition-colors" size={16} />
                                <input type="text" name="full_name" className={inputClass('full_name')} placeholder="John Doe" value={formData.full_name} onChange={handleChange} onBlur={() => handleBlur('full_name')} />
                            </div>
                            {fieldError('full_name') && (
                                <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-1 animate-in fade-in duration-200"><AlertCircle size={10} />{fieldError('full_name')}</p>
                            )}
                        </div>

                        {/* Username */}
                        <div className="space-y-1.5 group">
                            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 group-focus-within:text-indigo-400 transition-colors">Username</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-indigo-400 transition-colors" size={16} />
                                <input type="text" name="username" required className={inputClass('username')} placeholder="johndoe" value={formData.username} onChange={handleChange} onBlur={() => handleBlur('username')} />
                            </div>
                            {fieldError('username') && (
                                <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-1 animate-in fade-in duration-200"><AlertCircle size={10} />{fieldError('username')}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5 group">
                            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 group-focus-within:text-indigo-400 transition-colors">Email Manzil</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-indigo-400 transition-colors" size={16} />
                                <input type="email" name="email" required className={inputClass('email')} placeholder="john@example.com" value={formData.email} onChange={handleChange} onBlur={() => handleBlur('email')} />
                            </div>
                            {fieldError('email') && (
                                <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-1 animate-in fade-in duration-200"><AlertCircle size={10} />{fieldError('email')}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div className="space-y-1.5 group">
                            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 group-focus-within:text-indigo-400 transition-colors">Telefon</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-indigo-400 transition-colors" size={16} />
                                <input type="text" name="phone" className={inputClass('phone')} placeholder="+998 90 123 45 67" value={formData.phone} onChange={handleChange} />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="md:col-span-2 space-y-2 group">
                            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 group-focus-within:text-indigo-400 transition-colors">Parol</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-indigo-400 transition-colors" size={16} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    required
                                    className={`w-full bg-[var(--bg-input)] border rounded-2xl py-4 pl-12 pr-12 text-[var(--text-main)] font-bold text-sm focus:ring-2 outline-none transition-all placeholder:text-[var(--text-muted)] ${fieldError('password')
                                        ? 'border-rose-500 focus:ring-rose-500/30'
                                        : 'border-[var(--border-main)] focus:ring-indigo-500/30 focus:border-indigo-500'
                                        }`}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    onBlur={() => handleBlur('password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((p) => !p)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-indigo-400 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>

                            {/* Password Strength */}
                            {formData.password && (
                                <div className="space-y-1.5 animate-in fade-in duration-300">
                                    <div className="flex gap-1.5">
                                        {[1, 2, 3, 4].map((level) => (
                                            <div
                                                key={level}
                                                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${level <= passwordStrength.score ? passwordStrength.color : 'bg-[var(--border-main)]'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-1.5 ml-1">
                                        <ShieldCheck size={10} className={
                                            passwordStrength.score === 4 ? 'text-emerald-400' :
                                                passwordStrength.score === 3 ? 'text-indigo-400' :
                                                    passwordStrength.score === 2 ? 'text-amber-400' : 'text-rose-400'
                                        } />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${passwordStrength.score === 4 ? 'text-emerald-400' :
                                            passwordStrength.score === 3 ? 'text-indigo-400' :
                                                passwordStrength.score === 2 ? 'text-amber-400' : 'text-rose-400'
                                            }`}>
                                            {passwordStrength.label} parol
                                        </span>
                                    </div>
                                </div>
                            )}

                            {fieldError('password') && (
                                <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-1 animate-in fade-in duration-200"><AlertCircle size={10} />{fieldError('password')}</p>
                            )}
                        </div>

                        {/* Role Selection */}
                        <div className="md:col-span-2 space-y-1.5 group">
                            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 group-focus-within:text-indigo-400 transition-colors">Ro'lingizni tanlang</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, role: 'candidate' }))}
                                    className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                                        formData.role === 'candidate'
                                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                                            : 'border-[var(--border-main)] text-[var(--text-muted)] hover:border-indigo-500/30'
                                    }`}
                                >
                                    <UserCircle size={24} />
                                    <div className="text-left">
                                        <span className="block font-black text-xs uppercase">{t('jobSeeker') || 'Ish qidiruvchi'}</span>
                                        <span className="block text-[10px] opacity-60">{t('seekerDesc') || 'Ish izlayman'}</span>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, role: 'employer' }))}
                                    className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                                        formData.role === 'employer'
                                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                                            : 'border-[var(--border-main)] text-[var(--text-muted)] hover:border-indigo-500/30'
                                    }`}
                                >
                                    <Building2 size={24} />
                                    <div className="text-left">
                                        <span className="block font-black text-xs uppercase">{t('employer') || 'Ish beruvchi'}</span>
                                        <span className="block text-[10px] opacity-60">{t('employerDesc') || 'Xodim izlayman'}</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Company Name (for employers) */}
                        {formData.role === 'employer' && (
                            <div className="md:col-span-2 space-y-1.5 group animate-in fade-in slide-in-from-top-2">
                                <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 group-focus-within:text-indigo-400 transition-colors">Kompaniya nomi</label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-indigo-400 transition-colors" size={16} />
                                    <input
                                        type="text"
                                        name="company_name"
                                        className={inputClass('company_name')}
                                        placeholder="Mening kompaniyam"
                                        value={formData.company_name}
                                        onChange={handleChange}
                                        onBlur={() => handleBlur('company_name')}
                                    />
                                </div>
                                {fieldError('company_name') && (
                                    <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-1 animate-in fade-in duration-200"><AlertCircle size={10} />{fieldError('company_name')}</p>
                                )}
                            </div>
                        )}

                        {/* Bio */}
                        <div className="md:col-span-2 space-y-1.5 group">
                            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 group-focus-within:text-indigo-400 transition-colors">Bio (ixtiyoriy)</label>
                            <div className="relative">
                                <FileText className="absolute left-4 top-4 text-[var(--text-muted)] group-focus-within:text-indigo-400 transition-colors" size={16} />
                                <textarea
                                    name="bio"
                                    rows="3"
                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-4 pl-12 pr-5 text-[var(--text-main)] font-bold text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all resize-none placeholder:text-[var(--text-muted)]"
                                    placeholder="Tajribangiz va ko'nikmalaringiz haqida..."
                                    value={formData.bio}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="md:col-span-2 space-y-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white font-black py-4 rounded-2xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 group"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Ro'yxatdan o'tish
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-[var(--border-main)]" />
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                                    <span className="bg-[var(--bg-surface)] px-4 text-[var(--text-muted)]">Yoki Google orqali</span>
                                </div>
                            </div>

                            {/* Google */}
                            <button
                                type="button"
                                onClick={() => toast.info("Google orqali ro'yxatdan o'tish tez kunda qo'shiladi")}
                                className="w-full bg-[var(--bg-surface)] hover:bg-[var(--bg-surface)]/80 text-[var(--text-main)] font-black py-4 rounded-2xl transition-all border border-[var(--border-main)] flex items-center justify-center gap-3 group"
                            >
                                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                    <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.11c-.22-.67-.35-1.39-.35-2.11s.13-1.44.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z" />
                                    <path fill="#4285F4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.83c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Google akkaunt bilan davom etish
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
