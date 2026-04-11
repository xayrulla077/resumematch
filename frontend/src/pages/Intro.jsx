import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { 
  BrainCircuit, 
  Users, 
  TrendingUp, 
  Zap,
  ArrowRight,
  CheckCircle,
  Sparkles
} from 'lucide-react';

const Intro = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  const features = [
    {
      icon: BrainCircuit,
      title: "AI-Powered Analysis",
      desc: "Sun'iy intellekt yordamida rezyumalaringizni avtomatik tahlil qiling va takliflar oling"
    },
    {
      icon: Users,
      title: "Smart Matching",
      desc: "Eng mos ish o'rinlari va nomzodlarni intelligent moslashtirish tizimi"
    },
    {
      icon: TrendingUp,
      title: "Analytics",
      desc: "Karyera o'sishingizni kuzatib boring va maqsadlaringizga erishing"
    },
    {
      icon: Zap,
      title: "AI Interview",
      desc: "Sun'iy intellekt asosida intervyu savollarini yarating va mashq qiling"
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex flex-col relative overflow-hidden font-['Outfit'] transition-colors duration-300">
      {/* Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[150px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/15 rounded-full blur-[150px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-full blur-[100px]" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black italic text-xl shadow-xl shadow-indigo-600/30">
            RM
          </div>
          <span className="font-black text-2xl tracking-tighter uppercase text-[var(--text-main)]">
            Matcher <span className="text-indigo-500">AI</span>
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Hero Section */}
        <div className={`text-center max-w-4xl mx-auto mb-16 transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600/20 rounded-full mb-8 border border-indigo-500/30">
            <Sparkles size={16} className="text-indigo-400" />
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400">AI-Powered Platform</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-black text-[var(--text-main)] leading-tight mb-6 tracking-tight">
            Kelajagingizni <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Sun'iy Intellekt</span> bilan quring
          </h1>
          
          <p className="text-lg lg:text-xl text-[var(--text-muted)] max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
            Resume Matcher AI - bu zamonaviy karyera platformasi. 
            Rezyumangizni AI yordamida tahlil qiling, 
            eng mos ish o'rinlarini toping va karyerangizni rivojlantiring.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="group flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-widest px-8 py-4 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-600/20"
            >
              Ro'yxatdan o'tish
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-3 bg-[var(--bg-surface)] hover:bg-[var(--bg-card)] text-[var(--text-main)] font-black text-sm uppercase tracking-widest px-8 py-4 rounded-2xl border border-[var(--border-main)] transition-all hover:scale-105 active:scale-95"
            >
              Kirish
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto w-full transition-all duration-1000 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 bg-[var(--bg-surface)]/80 backdrop-blur-xl rounded-3xl border border-[var(--border-main)] hover:border-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/10 group"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <feature.icon size={28} className="text-white" />
              </div>
              <h3 className="text-lg font-black text-[var(--text-main)] mb-2 uppercase tracking-tight">
                {feature.title}
              </h3>
              <p className="text-sm text-[var(--text-muted)] font-medium leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className={`mt-20 flex flex-wrap items-center justify-center gap-8 lg:gap-16 transition-all duration-1000 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {[
            { num: "10,000+", label: "Foydalanuvchilar" },
            { num: "5,000+", label: "Ish o'rinlari" },
            { num: "50,000+", label: "Rezyumalar" },
            { num: "98%", label: "Moslik aniqlik" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl lg:text-4xl font-black text-[var(--text-main)] mb-1">
                {stat.num}
              </div>
              <div className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-6 border-t border-[var(--border-main)]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm font-medium">
            <CheckCircle size={16} className="text-emerald-500" />
            Bepul ro'yxatdan o'tish
          </div>
          <div className="text-[var(--text-muted)] text-xs font-black uppercase tracking-widest">
            © 2026 Resume Matcher AI
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Intro;
