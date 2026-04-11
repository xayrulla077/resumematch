import { Briefcase, Building2, MapPin, DollarSign, Users, Edit, Trash2, ChevronRight } from 'lucide-react';

const JobCard = ({
  job,
  idx,
  user,
  activeTab,
  getEmploymentColor,
  getEmploymentLabel,
  onEdit,
  onDelete,
  onApply,
  t
}) => {
  return (
    <div
      className="group relative p-8 rounded-[2.5rem] bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-2xl hover:border-indigo-500/40 transition-all duration-500 flex flex-col animate-in fade-in zoom-in-95"
      style={{ animationDelay: `${idx * 50}ms` }}
    >
      <div className="flex justify-between items-start mb-8">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-600/20 text-indigo-500 flex items-center justify-center transition-all group-hover:bg-indigo-600 group-hover:text-white shadow-lg">
          <Briefcase size={24} />
        </div>
        {(user?.role === 'admin' || user?.role === 'employer') && (
          <div className="flex gap-2">
            <button onClick={(e) => { e.stopPropagation(); onEdit(job); }} className="p-3 bg-white/5 hover:bg-indigo-600 text-[var(--text-muted)] hover:text-white rounded-xl transition-all border border-white/5 shadow-xl font-bold flex items-center gap-2 text-[10px] uppercase">
              <Edit size={16} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(job.id); }} className="p-3 bg-white/5 hover:bg-rose-600 text-[var(--text-muted)] hover:text-white rounded-xl transition-all border border-white/5 shadow-xl font-bold flex items-center gap-2 text-[10px] uppercase">
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-2 mb-6">
        <h3 className="text-2xl font-black text-[var(--text-main)] group-hover:text-indigo-500 transition-colors uppercase tracking-tight leading-none">
          {job.title}
        </h3>
        <div className="flex items-center gap-2 text-indigo-500 font-black text-[10px] uppercase tracking-[0.2em]">
          <Building2 size={12} />
          {job.company}
        </div>
        {job.match_score !== undefined && activeTab === 'recommended' && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-black text-purple-400 bg-purple-500/10 px-3 py-1 rounded-lg">
              {Math.round(job.match_score)}% moslik
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3 mb-8">
        <div className="flex items-center gap-3 text-[var(--text-muted)] font-bold text-xs bg-white/5 p-3 rounded-2xl border border-white/5">
          <MapPin size={16} className="text-indigo-400" />
          {job.location || 'Noma\'lum'}
        </div>
        <div className="flex items-center gap-3 text-[var(--text-muted)] font-bold text-xs bg-white/5 p-3 rounded-2xl border border-white/5">
          <DollarSign size={16} className="text-emerald-500" />
          <span className="text-[var(--text-main)]">{job.salary || 'Kelishiladi'}</span>
        </div>
      </div>

      <div className="mb-8">
        <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${getEmploymentColor(job.employment_type)}`}>
          {getEmploymentLabel(job.employment_type)}
        </span>
      </div>

      <div className="pt-8 border-t border-[var(--border-main)] mt-auto">
        {user?.role === 'candidate' ? (
          <button
            onClick={(e) => { e.stopPropagation(); onApply(job); }}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 group/btn shadow-xl shadow-indigo-600/20 active:scale-95"
          >
            {t ? t('submitApplication') : 'Ariza Topshirish'}
            <ChevronRight className="group-hover/btn:translate-x-1 transition-transform" size={16} />
          </button>
        ) : (
          <div className="w-full py-4 px-6 bg-[var(--bg-main)]/50 rounded-2xl border border-[var(--border-main)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users size={18} className="text-indigo-400" />
              <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">{t ? t('applicants') : 'Nomzodlar soni'}</span>
            </div>
            <span className="text-sm font-black text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-lg">
              {job.applications_count || 0}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobCard;
