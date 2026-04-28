import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import {
    BrainCircuit,
    Rocket,
    ShieldCheck,
    Zap,
    Target,
    Briefcase,
    Users,
    ChevronRight,
    FileSearch,
    CheckCircle2,
    Sparkles,
    ArrowRight,
    Code2,
    Database,
    Network,
    BookOpen,
    TrendingUp,
    Layers,
    GitBranch,
    Award,
    Clock,
    BarChart3,
    Lock,
    Globe,
    Brain,
    FileText,
    Server,
    Monitor
} from 'lucide-react';

const Landing = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleCTA = () => {
        if (user) navigate('/dashboard');
        else navigate('/register');
    };

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] selection:bg-indigo-500/30 font-['Outfit'] overflow-x-hidden transition-colors duration-300">

            {/* ─── Navbar ─────────────────────────────────────────────────────────── */}
            <nav className="fixed top-0 left-0 right-0 z-[100] bg-[var(--bg-main)]/80 backdrop-blur-2xl border-b border-[var(--border-main)] px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black italic text-lg shadow-xl shadow-indigo-600/30">
                            RM
                        </div>
                        <span className="font-black text-xl tracking-tighter uppercase hidden sm:block">Matcher <span className="text-indigo-500">AI</span></span>
                    </div>

                    <div className="flex items-center gap-4">
                        <a
                            href="#dastur-tavfsilotlari"
                            className="hidden md:block px-5 py-2.5 text-[var(--text-muted)] hover:text-indigo-400 font-black text-xs uppercase tracking-widest transition-all border border-transparent hover:border-indigo-500/30 rounded-xl"
                        >
                            Dastur Tavfsilotlari
                        </a>
                        {!user ? (
                            <>
                                <button onClick={() => navigate('/login')} className="px-6 py-2.5 text-[var(--text-muted)] hover:text-[var(--text-main)] font-black text-xs uppercase tracking-widest transition-all">Kirish</button>
                                <button onClick={() => navigate('/register')} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-95">Boshlash</button>
                            </>
                        ) : (
                            <button onClick={() => navigate('/dashboard')} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-2">
                                Dashboard
                                <ChevronRight size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* ─── Hero Section ───────────────────────────────────────────────────── */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
                {/* Abstract Backgrounds */}
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600/10 border border-indigo-600/20 rounded-full text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                        <Sparkles size={14} className="animate-pulse" />
                        AI Yordamida Rezyume boshqaruvi
                    </div>

                    <h1 className="text-5xl lg:text-8xl font-black text-[var(--text-main)] leading-[1.1] tracking-tighter mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        Kelajakni <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_auto] animate-gradient">Smart AI</span> <br />
                        Bilan Quring
                    </h1>

                    <p className="max-w-2xl mx-auto text-[var(--text-muted)] text-lg lg:text-xl font-bold leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                        Rezyumelarni tahlil qilish, vakansiyalar bilan solishtirish va eng munosib nomzodlarni AI yordamida soniyalarda aniqlang.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
                        <button onClick={handleCTA} className="px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-600/40 transition-all hover:scale-105 active:scale-95 group flex items-center gap-3">
                            Hozir Boshlash
                            <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                        </button>
                        <button className="px-10 py-5 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface)]/80 text-[var(--text-main)] border border-[var(--border-main)] rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all backdrop-blur-xl">
                            Demo Ko'rish
                        </button>
                    </div>

                    {/* Floating UI Mockup */}
                    <div className="mt-24 relative max-w-5xl mx-auto animate-in zoom-in-95 duration-1000 delay-500">
                        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[var(--bg-main)] to-transparent z-10" />
                        <div className="relative rounded-[3rem] border border-[var(--border-main)] bg-[var(--bg-surface)]/40 backdrop-blur-3xl p-4 shadow-[0_0_100px_rgba(99,102,241,0.2)] overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-10 border-b border-[var(--border-main)] bg-white/5 flex items-center px-6 gap-2">
                                <div className="w-2 h-2 rounded-full bg-rose-500" />
                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            </div>
                            <div className="pt-12 px-2 pb-2">
                                <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426&ixlib=rb-4.0.3" alt="Dashboard Mockup" className="rounded-3xl w-full h-[400px] object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="p-8 bg-indigo-600/20 backdrop-blur-3xl border border-indigo-600/30 rounded-[2rem] text-center shadow-2xl">
                                        <p className="text-3xl font-black mb-2 animate-pulse text-[var(--text-main)]">98.5%</p>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Match Accuracy</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Features Grid ──────────────────────────────────────────────────── */}
            <section className="py-24 px-6 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl lg:text-5xl font-black mb-4 uppercase tracking-tight italic text-[var(--text-main)]">Nega Bizning <span className="text-indigo-500">AI?</span></h2>
                        <div className="w-24 h-1 bg-indigo-600 mx-auto rounded-full" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: BrainCircuit, title: "Smart Parsing", desc: "PDF rezyumalardan barcha muhim ma'lumotlarni AI yordamida xatosiz ajratib oladi.", color: "indigo" },
                            { icon: Target, title: "Semantic Matching", desc: "Shunchaki kalit so'zlar emas, balki nomzodning tajribasi va ish ruhini tushunadi.", color: "purple" },
                            { icon: Zap, title: "Fast Analysis", desc: "Minglab rezyumalarni bir necha soniya ichida tahlil qiling va hisobot oling.", color: "emerald" },
                            { icon: Users, title: "Applicant Flow", desc: "Arizalarni boshqarish va nomzodlar bilan muloqotni bitta tizimga jamlang.", color: "rose" },
                            { icon: ShieldCheck, title: "Secure Storage", desc: "Barcha ma'lumotlar shifrlangan holda saqlanadi va maxfiylik ta'minlanadi.", color: "blue" },
                            { icon: Rocket, title: "Advanced Search", desc: "Nomzodlarni mahorat darajasi va tajribasi bo'yicha aqlli qidiruv tizimi.", color: "amber" },
                        ].map((f, i) => {
                            const featureColors = {
                                indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500',
                                purple: 'bg-purple-500/10 border-purple-500/20 text-purple-500',
                                emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
                                rose: 'bg-rose-500/10 border-rose-500/20 text-rose-500',
                                blue: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
                                amber: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
                            };
                            const colorClasses = featureColors[f.color] || featureColors.indigo;
                            return (
                            <div key={i} className="group p-10 rounded-[2.5rem] bg-[var(--bg-surface)] border border-[var(--border-main)] hover:border-indigo-600/30 hover:shadow-2xl transition-all duration-500">
                                <div className={`w-16 h-16 rounded-2xl ${colorClasses} flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                                    <f.icon size={30} />
                                </div>
                                <h3 className="text-xl font-black mb-4 uppercase tracking-tight text-[var(--text-main)]">{f.title}</h3>
                                <p className="text-[var(--text-muted)] font-bold leading-relaxed">{f.desc}</p>
                            </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ─── Stats Section ──────────────────────────────────────────────────── */}
            <section className="py-24 px-6 border-y border-[var(--border-main)] bg-[var(--bg-surface)]/50">
                <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
                    {[
                        { label: "Analizlar", val: "1.2M+" },
                        { label: "Muvaffaqiyat", val: "99.9%" },
                        { label: "Kompaniyalar", val: "500+" },
                        { label: "Tejamkorlik", val: "70%" },
                    ].map((s, i) => (
                        <div key={i}>
                            <p className="text-5xl font-black text-[var(--text-main)] mb-2 tracking-tighter">{s.val}</p>
                            <p className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.3em]">{s.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── Dastur Tavfsilotlari ─────────────────────────────────────────── */}
            <section id="dastur-tavfsilotlari" className="py-32 px-6 relative overflow-hidden">
                {/* BG glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
                <div className="absolute top-1/2 left-[-15%] w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-1/2 right-[-15%] w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-24">
                        <div className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600/10 border border-indigo-600/20 rounded-full text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
                            <BookOpen size={14} />
                            Malakaviy Amaliyot Loyihasi
                        </div>
                        <h2 className="text-3xl lg:text-6xl font-black uppercase tracking-tighter italic text-[var(--text-main)] mb-6">
                            Dastur{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Tavfsilotlari</span>
                        </h2>
                        <p className="max-w-2xl mx-auto text-[var(--text-muted)] text-lg font-bold leading-relaxed">
                            Resume Matcher AI — zamonaviy HR jarayonlarini avtomatlashtirishga yo`naltirilgan
                            intellektual platforma.
                        </p>
                        <div className="w-24 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 mx-auto rounded-full mt-8" />
                    </div>

                    {/* Maqsad + Kelib chiqishi */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                        {/* Maqsad */}
                        <div className="group p-10 rounded-[2.5rem] bg-[var(--bg-surface)] border border-[var(--border-main)] hover:border-indigo-600/30 hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/5 rounded-full blur-3xl" />
                            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                                <Target size={30} className="text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tight text-[var(--text-main)] mb-6">Dastur Maqsadi</h3>
                            <div className="space-y-4 text-[var(--text-muted)] font-bold leading-relaxed">
                                <p>
                                    Ushbu loyiha HR mutaxassislariga sifatli nomzodlarni tez va aniq toppishda yordam beradi.
                                    Sun'iy intellekt texnologiyalari orqali rezyumalarni avtomatik tahlil qilib,
                                    vakansiyaga eng mos nomzodlarni ballarga asoslanib ajratib beradi.
                                </p>
                                <p>
                                    Ishga qabul qilish jarayonini 5-7 barobar tezlashtiradi va inson omilidan
                                    kelib chiqadigan xatoliklarni minimallashtirishga xizmat qiladi.
                                </p>
                            </div>
                        </div>

                        {/* Kelib chiqishi */}
                        <div className="group p-10 rounded-[2.5rem] bg-[var(--bg-surface)] border border-[var(--border-main)] hover:border-purple-600/30 hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-600/5 rounded-full blur-3xl" />
                            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                                <GitBranch size={30} className="text-purple-400" />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tight text-[var(--text-main)] mb-6">Kelib Chiqishi</h3>
                            <div className="space-y-4 text-[var(--text-muted)] font-bold leading-relaxed">
                                <p>
                                    Loyiha 2026-yilda malakaviy amaliyot doirasida ishlab chiqilgan.
                                    Open-source Resume Matcher frameworkidan ilhomlanib,
                                    mahalliy bozor ehtiyojlariga moslashtirildi va to'liq qayta yaratildi.
                                </p>
                                <p>
                                    O`zbek tilidagi interfeys va mahalliy kompaniyalar uchun moslashtirilgan
                                    ish oqimi uning asosiy farqlovchi xususiyatidir.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Texnik Stack */}
                    <div className="p-10 rounded-[2.5rem] bg-[var(--bg-surface)] border border-[var(--border-main)] hover:border-indigo-600/20 hover:shadow-2xl transition-all duration-500 mb-12 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/3 via-transparent to-purple-600/3" />
                        <div className="relative">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <Layers size={30} className="text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight text-[var(--text-main)]">Texnik Arxitektura</h3>
                                    <p className="text-[var(--text-muted)] font-bold text-sm mt-1">Full-stack zamonaviy texnologiyalar to'plami</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    {
                                        icon: Monitor,
                                        label: 'Frontend',
                                        color: 'indigo',
                                        items: ['React 18 + Vite', 'Tailwind CSS', 'Lucide Icons', 'React Router v6', 'Recharts']
                                    },
                                    {
                                        icon: Server,
                                        label: 'Backend',
                                        color: 'purple',
                                        items: ['Python FastAPI', 'SQLite / SQLAlchemy', 'JWT Authentication', 'PyMuPDF (PDF parse)', 'Uvicorn']
                                    },
                                    {
                                        icon: Brain,
                                        label: 'AI & Tahlil',
                                        color: 'rose',
                                        items: ['TF-IDF Vektorlashtirish', 'Cosine Similarity', 'spaCy NLP', 'Sklearn', 'Keyword Extraction']
                                    }
                                ].map((stack, i) => {
                                    const stackColors = {
                                        indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400', dot: 'bg-indigo-500' },
                                        purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', dot: 'bg-purple-500' },
                                        rose:   { bg: 'bg-rose-500/10',   border: 'border-rose-500/20',   text: 'text-rose-400',   dot: 'bg-rose-500'   },
                                    };
                                    const c = stackColors[stack.color];
                                    return (
                                        <div key={i} className={`p-6 rounded-2xl ${c.bg} border ${c.border}`}>
                                            <div className="flex items-center gap-3 mb-5">
                                                <stack.icon size={20} className={c.text} />
                                                <span className={`font-black text-sm uppercase tracking-widest ${c.text}`}>{stack.label}</span>
                                            </div>
                                            <ul className="space-y-2.5">
                                                {stack.items.map((item, j) => (
                                                    <li key={j} className="flex items-center gap-2.5 text-[var(--text-muted)] font-bold text-sm">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${c.dot} flex-shrink-0`} />
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Foydalari */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: TrendingUp, color: 'indigo', title: 'Samaradorlik', desc: `Rezyume tekshirish vaqtini 80% qisqartiradi va HR xodimiga strategik ishlar uchun vaqt bo'shatadi.` },
                            { icon: CheckCircle2, color: 'emerald', title: 'Aniqlik', desc: `Semantic tahlil orqali 95%+ to'g'ri mos kelishni ta'minlaydi, noto'g'ri rad etishlarni kamaytiradi.` },
                            { icon: Globe, color: 'blue', title: 'Moslashuvchanlik', desc: `Har qanday soha va lavozim uchun mos, istalgan turdagi rezyume formatini qo'llab-quvvatlaydi.` },
                            { icon: Lock, color: 'amber', title: 'Xavfsizlik', desc: `JWT autentifikatsiya va shifrlangan ma'lumotlar saqlash bilan barcha foydalanuvchi so'rovlari himoyalangan.` },
                        ].map((b, i) => {
                            const benefitColors = {
                                indigo:  { bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20',  icon: 'text-indigo-400'  },
                                emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-400' },
                                blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    icon: 'text-blue-400'    },
                                amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   icon: 'text-amber-400'   },
                            };
                            const c = benefitColors[b.color];
                            return (
                                <div key={i} className={`group p-8 rounded-[2rem] ${c.bg} border ${c.border} hover:shadow-xl transition-all duration-500`}>
                                    <b.icon size={28} className={`${c.icon} mb-5 group-hover:scale-110 transition-transform duration-300`} />
                                    <h4 className="font-black text-base uppercase tracking-tight text-[var(--text-main)] mb-3">{b.title}</h4>
                                    <p className="text-[var(--text-muted)] font-bold text-sm leading-relaxed">{b.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ─── CTA Section ────────────────────────────────────────────────────── */}
            <section className="py-24 lg:py-48 px-6 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-full max-h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center relative z-10 space-y-10">
                    <h2 className="text-4xl lg:text-7xl font-black text-[var(--text-main)] leading-tight uppercase tracking-tighter italic">
                        Kelajakning <span className="text-indigo-500">Ishga Qabul</span> <br /> Tizimini Sinab Ko'ring
                    </h2>
                    <p className="text-[var(--text-muted)] text-lg font-bold">
                        Professional HR mutaxassislari uchun maxsus ishlab chiqilgan.<br />
                        Bugun ro'yxatdan o'ting va haftasiga 10 soatgacha vaqtingizni tejang.
                    </p>
                    <div className="flex justify-center">
                        <button onClick={handleCTA} className="px-12 py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center gap-3">
                            Boshlash — Bu bepul
                            <Rocket size={20} className="text-white" />
                        </button>
                    </div>
                </div>
            </section>

            {/* ─── Footer ─────────────────────────────────────────────────────────── */}
            <footer className="py-20 px-6 border-t border-[var(--border-main)] bg-[var(--bg-surface)]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
                    <div className="flex items-center gap-3 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
                        <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-black italic">RM</div>
                        <span className="font-black text-sm tracking-widest uppercase text-[var(--text-main)]">Matcher AI</span>
                    </div>

                    <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                        <a href="#" className="hover:text-[var(--text-main)] transition-colors">Pricing</a>
                        <a href="#" className="hover:text-[var(--text-main)] transition-colors">Privacy</a>
                        <a href="#" className="hover:text-[var(--text-main)] transition-colors">Contact</a>
                    </div>

                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]/50">© 2026 Resume Matcher AI. Barcha huquqlar himoyalangan.</p>
                </div>
            </footer>

            <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 5s ease infinite;
        }
      `}</style>
        </div>
    );
};

export default Landing;
