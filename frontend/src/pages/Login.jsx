import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Mail, Lock, ArrowRight, BrainCircuit, User, Eye, EyeOff, AlertCircle
} from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Real-time validation
    const [touched, setTouched] = useState({ username: false, password: false });

    const { login } = useAuth();
    const navigate = useNavigate();

    const usernameError = touched.username && !username.trim() ? "Username majburiy" : '';
    const passwordError = touched.password && password.length < 6 ? "Parol kamida 6 ta belgi" : '';
    const isValid = username.trim() && password.length >= 6;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setTouched({ username: true, password: true });
        if (!isValid) return;

        setError('');
        setLoading(true);
        try {
            await login(username, password);
            toast.success("Muvaffaqiyatli kirdingiz! Xush kelibsiz 🎉");
            navigate('/');
        } catch (err) {
            const msg = err.response?.data?.detail || "Login va parolni tekshiring.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] relative overflow-hidden font-['Outfit'] transition-colors duration-300">
            {/* Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />

            <div className="max-w-5xl w-full mx-4 flex flex-col md:flex-row bg-[var(--bg-surface)]/60 backdrop-blur-3xl rounded-[3rem] border border-[var(--border-main)] shadow-2xl overflow-hidden relative z-10">
                {/* Visual Side */}
                <div className="md:w-1/2 p-10 lg:p-12 bg-indigo-600/10 flex flex-col justify-between border-r border-[var(--border-main)]">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/30">
                            <BrainCircuit className="text-white" size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-[var(--text-main)] tracking-widest leading-none italic">RM</h1>
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Matcher AI</p>
                        </div>
                    </div>

                    <div className="space-y-6 py-8">
                        <h2 className="text-4xl lg:text-5xl font-black text-[var(--text-main)] leading-tight">
                            Xush kelibsiz{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Back!</span>
                        </h2>
                        <p className="text-[var(--text-muted)] font-bold leading-relaxed text-base lg:text-lg">
                            Kelajakni AI bilan quring. Rezyumelarni saralash va intervyularni boshqarish endi ancha osonroq.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 text-[var(--text-muted)]">
                        <div className="flex -space-x-3">
                            {[11, 12, 13, 14].map((i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-[var(--bg-main)] bg-[var(--bg-surface)] flex items-center justify-center overflow-hidden">
                                    <img src={`https://i.pravatar.cc/100?img=${i}`} alt="user" />
                                </div>
                            ))}
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest">500+ HR Expertlar biz bilan</p>
                    </div>
                </div>

                {/* Form Side */}
                <div className="md:w-1/2 p-10 lg:p-16 flex flex-col justify-center bg-[var(--bg-card)]">
                    <div className="mb-8">
                        <h2 className="text-3xl font-black text-[var(--text-main)] mb-1 uppercase tracking-tight">Kirish</h2>
                        <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">Sizni yana ko'rganimizdan xursandmiz!</p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl mb-6 text-xs font-bold flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="p-1.5 bg-rose-500/20 rounded-lg flex-shrink-0 mt-0.5">
                                <Lock size={12} />
                            </div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        {/* Username */}
                        <div className="space-y-1.5 group">
                            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 group-focus-within:text-indigo-400 transition-colors">
                                Username
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-indigo-400 transition-colors">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className={`w-full bg-[var(--bg-main)]/50 border rounded-2xl py-4 pl-12 pr-5 text-[var(--text-main)] font-bold text-sm focus:ring-2 outline-none transition-all placeholder:text-slate-600 ${usernameError
                                        ? 'border-rose-500 focus:ring-rose-500/30'
                                        : 'border-[var(--border-main)] focus:ring-indigo-500/30 focus:border-indigo-500'
                                        }`}
                                    placeholder="Username kiriting"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onBlur={() => setTouched((p) => ({ ...p, username: true }))}
                                />
                            </div>
                            {usernameError && (
                                <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-1 animate-in fade-in duration-200">
                                    <AlertCircle size={10} /> {usernameError}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5 group">
                            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 group-focus-within:text-indigo-400 transition-colors">
                                Parol
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-indigo-400 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className={`w-full bg-[var(--bg-main)]/50 border rounded-2xl py-4 pl-12 pr-12 text-[var(--text-main)] font-bold text-sm focus:ring-2 outline-none transition-all placeholder:text-slate-600 ${passwordError
                                        ? 'border-rose-500 focus:ring-rose-500/30'
                                        : 'border-[var(--border-main)] focus:ring-indigo-500/30 focus:border-indigo-500'
                                        }`}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((p) => !p)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-indigo-400 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {passwordError && (
                                <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-1 animate-in fade-in duration-200">
                                    <AlertCircle size={10} /> {passwordError}
                                </p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white font-black py-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Kirish
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        {/* Divider */}
                        <div className="relative my-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-[var(--border-main)]" />
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                                <span className="bg-[var(--bg-main)] px-4 text-[var(--text-muted)]">Yoki</span>
                            </div>
                        </div>

                        {/* Google */}
                        <button
                            type="button"
                            onClick={() => toast.info("Google login tez kunda qo'shiladi!")}
                            className="w-full bg-[var(--bg-surface)] hover:bg-[var(--bg-surface)]/80 text-[var(--text-main)] font-black py-4 rounded-2xl transition-all border border-[var(--border-main)] flex items-center justify-center gap-3 group"
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.11c-.22-.67-.35-1.39-.35-2.11s.13-1.44.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z" />
                                <path fill="#4285F4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.83c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google orqali kirish
                        </button>
                    </form>

                    <p className="mt-8 text-center text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                        Akkountingiz yo'qmi?{' '}
                        <Link to="/register" className="text-indigo-400 hover:text-indigo-300 ml-1 transition-colors">
                            Ro'yxatdan o'tish
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
