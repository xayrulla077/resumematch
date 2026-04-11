import { TrendingUp } from 'lucide-react';

const StatCard = ({
  icon: Icon,
  title,
  value,
  trend,
  color = 'indigo',
  onClick,
  style,
  className = '',
}) => {
  const colorConfigs = {
    indigo: { text: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', hoverBg: 'group-hover:bg-indigo-600' },
    purple: { text: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', hoverBg: 'group-hover:bg-purple-600' },
    emerald: { text: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', hoverBg: 'group-hover:bg-emerald-600' },
    amber: { text: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', hoverBg: 'group-hover:bg-amber-600' },
    teal: { text: 'text-teal-500', bg: 'bg-teal-500/10', border: 'border-teal-500/20', hoverBg: 'group-hover:bg-teal-600' },
  };

  const c = colorConfigs[color] || colorConfigs.indigo;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden group p-8 rounded-[2.5rem] bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-2xl hover:bg-white/[0.02] cursor-pointer transition-all ${className}`}
      style={style}
    >
      <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all duration-700 pointer-events-none`}>
        <Icon className={`w-32 h-32 ${c.text}`} />
      </div>
      <div className="relative z-10">
        <div className={`p-4 w-16 h-16 rounded-2xl ${c.bg} ${c.border} flex items-center justify-center ${c.text} mb-8 ${c.hoverBg} group-hover:text-white transition-all duration-500 shadow-lg`}>
          <Icon size={28} />
        </div>
        <h4 className="text-[var(--text-muted)] font-black text-[10px] uppercase tracking-[0.2em] mb-2">{title}</h4>
        <div className="flex items-baseline gap-4">
          <span className="text-5xl font-black text-[var(--text-main)] tracking-tighter">{value}</span>
          {trend && (
            <div className={`flex items-center gap-1.5 px-3 py-1 ${colorConfigs[trend.color || 'emerald'].bg} ${colorConfigs[trend.color || 'emerald'].text} rounded-xl text-[10px] font-black border ${colorConfigs[trend.color || 'emerald'].border}`}>
              {trend.icon && <trend.icon size={12} />}
              {trend.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
