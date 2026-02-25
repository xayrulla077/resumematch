import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { jobsAPI, resumesAPI, applicationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';
import {
  Briefcase,
  Plus,
  Search,
  MapPin,
  DollarSign,
  Users,
  Edit,
  Trash2,
  X,
  Calendar,
  TrendingUp,
  Loader2,
  Filter,
  Clock,
  Wifi,
  Building2,
  CheckCircle2,
  ChevronRight,
  FileText,
  AlertCircle
} from 'lucide-react';
import Pagination from '../components/Pagination';

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

const JobCardSkeleton = () => (
  <div className="p-8 rounded-[2.5rem] bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-2xl animate-pulse">
    <div className="flex justify-between items-start mb-8">
      <div className="w-14 h-14 bg-[var(--bg-card)] rounded-2xl" />
      <div className="flex gap-2">
        <div className="w-10 h-10 bg-[var(--bg-card)] rounded-2xl" />
        <div className="w-10 h-10 bg-[var(--bg-card)] rounded-2xl" />
      </div>
    </div>
    <div className="space-y-3 mb-6">
      <div className="h-5 bg-[var(--bg-card)] rounded-xl w-3/4" />
      <div className="h-3 bg-[var(--bg-card)] rounded-xl w-1/2" />
    </div>
    <div className="space-y-4 pt-4 border-t border-[var(--border-main)]">
      <div className="h-3 bg-[var(--bg-card)] rounded-lg w-full" />
      <div className="h-3 bg-[var(--bg-card)] rounded-lg w-2/3" />
    </div>
    <div className="h-12 bg-[var(--bg-card)] rounded-2xl mt-8" />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const Jobs = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { theme } = useTheme();

  // Data state
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 9;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterLocation, setFilterLocation] = useState('');

  // Modals state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedResume, setSelectedResume] = useState('');
  const [coverLetter, setCoverLetter] = useState('');

  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    salary: '',
    employment_type: 'fullTime',
    requirements: '',
    description: '',
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // ── Data Fetching ───────────────────────────────────────────────────────────

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await jobsAPI.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm.trim() || undefined,
        employment_type: filterType !== 'all' ? filterType : undefined,
        location: filterLocation.trim() || undefined
      });
      setJobs(response.data.items || []);
      setTotalItems(response.data.metadata.total || 0);
    } catch (error) {
      console.error('Jobs load error:', error);
      toast.error("Vakansiyalarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const loadResumes = async () => {
    try {
      const response = await resumesAPI.getAll({ limit: 100 });
      setResumes(response.data.items || []);
    } catch (error) {
      console.error('Resumes load error:', error);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [currentPage, searchTerm, filterType, filterLocation]);

  useEffect(() => {
    loadResumes();
  }, []);

  // ── Keyboard Nav ────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowApplyModal(false);
        setShowJobModal(false);
        setShowDeleteConfirm(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleApply = (job) => {
    if (resumes.length === 0) {
      toast.error("Ariza yuborishdan oldin kamida bitta rezyume yuklashingiz kerak!");
      return;
    }
    setSelectedJob(job);
    setSelectedResume('');
    setCoverLetter('');
    setShowApplyModal(true);
  };

  const submitApplication = async () => {
    if (!selectedResume) {
      toast.error("Iltimos, rezyumeni tanlang!");
      return;
    }

    try {
      setSubmitting(true);
      await applicationsAPI.apply(selectedJob.id, parseInt(selectedResume), coverLetter);
      toast.success("Arizangiz muvaffaqiyatli qabul qilindi! 🎉");
      setShowApplyModal(false);
    } catch (error) {
      toast.error("Xatolik: " + (error.response?.data?.detail || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddJob = () => {
    setEditingJob(null);
    setFormData({
      title: '',
      company: '',
      location: '',
      salary: '',
      employment_type: 'fullTime',
      requirements: '',
      description: '',
    });
    setShowJobModal(true);
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setFormData({
      title: job.title || '',
      company: job.company || '',
      location: job.location || '',
      salary: job.salary || '',
      employment_type: job.employment_type || 'fullTime',
      requirements: job.requirements || '',
      description: job.description || '',
    });
    setShowJobModal(true);
  };

  const handleSaveJob = async () => {
    if (!formData.title.trim() || !formData.company.trim()) {
      toast.error("Sarlavha va Kompaniya nomi majburiy!");
      return;
    }

    try {
      setSubmitting(true);
      if (editingJob) {
        await jobsAPI.update(editingJob.id, formData);
        toast.success("Vakansiya yangilandi! ✨");
      } else {
        await jobsAPI.create(formData);
        toast.success("Yangi vakansiya yaratildi! 🚀");
      }
      setShowJobModal(false);
      loadJobs();
    } catch (error) {
      toast.error("Xatolk: " + (error.response?.data?.detail || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteJob = async () => {
    try {
      await jobsAPI.delete(deleteId);
      toast.success("Vakansiya o'chirib tashlandi");
      setShowDeleteConfirm(false);
      loadJobs();
    } catch (error) {
      toast.error("O'chirishda xatolik yuz berdi");
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const getEmploymentLabel = (type) => {
    const labels = {
      fullTime: 'To\'liq stavka',
      partTime: 'Yarim stavka',
      contract: 'Shartnoma',
      internship: 'Amaliyot',
      remote: 'Masofaviy'
    };
    return labels[type] || type;
  };

  const getEmploymentColor = (type) => {
    const colors = {
      fullTime: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      partTime: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      contract: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      internship: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
      remote: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    };
    return colors[type] || 'bg-white/5 text-slate-400 border-white/10';
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-4 sm:p-6 lg:p-8 relative overflow-hidden font-['Outfit'] transition-all duration-300">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[160px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-10">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl lg:text-5xl font-black text-[var(--text-main)] tracking-tight">
              Ish <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Vakansiyalari</span>
            </h1>
            <p className="text-[var(--text-muted)] font-bold uppercase tracking-[0.2em] text-[10px] pl-1 border-l-2 border-indigo-500/50">
              Sizga mos keladigan eng yaxshi ishlarni toping
            </p>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={handleAddJob}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-600/25 transition-all active:scale-95 group flex items-center gap-3"
            >
              <Plus className="group-hover:rotate-90 transition-transform duration-500" size={20} />
              Yangi Vakansiya
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Faol Ishlar', value: totalItems, icon: Briefcase, color: 'indigo' },
            { label: 'Yangi Arizalar', value: '12', icon: Users, color: 'blue' },
            { label: 'Mualliflar', value: '5', icon: Building2, color: 'purple' },
            { label: 'O\'sish', value: '+24%', icon: TrendingUp, color: 'emerald' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="relative overflow-hidden group p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-xl transition-all hover:translate-y-[-4px]">
              <div className="absolute -right-4 -top-4 opacity-5 scale-150 rotate-12 group-hover:scale-110 transition-transform duration-700">
                <Icon className={`w-32 h-32 text-${color}-500`} />
              </div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">{label}</h4>
                  <p className="text-3xl font-black text-[var(--text-main)]">{value}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-main)] flex items-center justify-center text-indigo-400">
                  <Icon size={22} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 lg:p-6 rounded-[2.5rem] bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-2xl space-y-5 backdrop-blur-3xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Vakansiya qidirish (Sarlavha, Kompaniya...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-[1.25rem] py-4 pl-12 pr-6 text-[var(--text-main)] placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none font-bold text-sm"
              />
            </div>
            <div className="lg:col-span-4 relative group">
              <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Joylashuv..."
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="w-full bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-[1.25rem] py-4 pl-12 pr-6 text-[var(--text-main)] placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none font-bold text-sm"
              />
            </div>
            <div className="lg:col-span-3">
              <div className="flex bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-[1.25rem] p-1.5 h-full">
                {['all', 'fullTime', 'remote'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`flex-1 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterType === type
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                  >
                    {type === 'all' ? 'Hammasi' : type === 'fullTime' ? 'To\'liq' : 'Remote'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {[
              { value: 'contract', label: 'Shartnoma', icon: FileText },
              { value: 'internship', label: 'Amaliyot', icon: CheckCircle2 },
              { value: 'partTime', label: 'Yarim stavka', icon: Clock },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setFilterType(filterType === value ? 'all' : value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-black text-[9px] uppercase tracking-widest transition-all ${filterType === value
                  ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                  : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-muted)] hover:border-indigo-500/50'}`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => <JobCardSkeleton key={i} />)}
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-32 flex flex-col items-center text-center gap-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="w-24 h-24 bg-indigo-600/5 border border-indigo-600/10 rounded-[2.5rem] flex items-center justify-center text-indigo-500/30">
              <Briefcase size={48} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">Vakansiyalar topilmadi</h3>
              <p className="text-[var(--text-muted)] font-bold text-sm mt-1 uppercase tracking-widest">Qidiruv shartlarini o'zgartirib ko'ring</p>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {jobs.map((job, idx) => (
                <div
                  key={job.id}
                  className="group relative p-8 rounded-[2.5rem] bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-2xl hover:border-indigo-500/40 transition-all duration-500 flex flex-col animate-in fade-in zoom-in-95"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-600/20 text-indigo-500 flex items-center justify-center transition-all group-hover:bg-indigo-600 group-hover:text-white shadow-lg">
                      <Briefcase size={24} />
                    </div>
                    {user?.role === 'admin' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleEditJob(job)} className="p-3 bg-white/5 hover:bg-indigo-600 text-[var(--text-muted)] hover:text-white rounded-xl transition-all border border-white/5 shadow-xl">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDeleteConfirm(job.id)} className="p-3 bg-white/5 hover:bg-rose-600 text-[var(--text-muted)] hover:text-white rounded-xl transition-all border border-white/5 shadow-xl">
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

                  <div className="pt-8 border-t border-white/5 mt-auto">
                    {user?.role !== 'admin' ? (
                      <button
                        onClick={() => handleApply(job)}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 group/btn shadow-xl shadow-indigo-600/20 active:scale-95"
                      >
                        Ariza Topshirish
                        <ChevronRight className="group-hover/btn:translate-x-1 transition-transform" size={16} />
                      </button>
                    ) : (
                      <div className="w-full py-4 px-6 bg-[var(--bg-main)]/50 rounded-2xl border border-[var(--border-main)] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Users size={18} className="text-indigo-400" />
                          <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">Nomzodlar soni</span>
                        </div>
                        <span className="text-sm font-black text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-lg">
                          0
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* ═══ Apply Modal ═══ */}
      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-lg animate-in fade-in duration-300" onClick={() => setShowApplyModal(false)} />
          <div className="relative w-full max-w-xl bg-[var(--bg-surface)] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Ariza Yuborish</h2>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Ish tajribangizni bizga yuboring</p>
              </div>
              <button onClick={() => setShowApplyModal(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
              <div className="flex items-center gap-5 p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/20">
                <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/30">
                  <Briefcase size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{selectedJob.title}</h3>
                  <p className="text-indigo-400 font-black uppercase tracking-widest text-[10px]">{selectedJob.company}</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Rezyumeni tanlang *</label>
                <div className="space-y-2">
                  {resumes.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedResume(String(r.id))}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${selectedResume === String(r.id)
                        ? 'bg-indigo-600/20 border-indigo-600 text-white'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedResume === String(r.id) ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-500'}`}>
                        <FileText size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm truncate">{r.full_name || r.file_name}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">{new Date(r.uploaded_at).toLocaleDateString()}</p>
                      </div>
                      {selectedResume === String(r.id) && <CheckCircle2 size={22} className="text-indigo-500 animate-in zoom-in-50" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Qo'shimcha ma'lumot</label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Nima uchun bu ish sizga mos keladi?..."
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-5 text-white outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all font-bold text-sm resize-none"
                />
              </div>
            </div>

            <div className="p-8 pt-0 flex gap-4">
              <button onClick={() => setShowApplyModal(false)} className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest text-slate-400 hover:text-white transition-all">Bekor qilish</button>
              <button
                onClick={submitApplication}
                disabled={submitting || !selectedResume}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-[1.25rem] font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Tasdiqlash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Add/Edit Modal ═══ */}
      {showJobModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowJobModal(false)} />
          <div className="relative w-full max-w-2xl bg-[var(--bg-surface)] border border-white/10 rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">{editingJob ? 'Tahrirlash' : 'Yangi Vakansiya'}</h2>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Ma'lumotlarni kiriting</p>
              </div>
              <button onClick={() => setShowJobModal(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-7 overflow-y-auto no-scrollbar flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { name: 'title', label: 'Vakansiya Nomi *', placeholder: 'Frontend Developer', icon: Briefcase },
                  { name: 'company', label: 'Kompaniya *', placeholder: 'TechCorp', icon: Building2 },
                  { name: 'location', label: 'Joylashuv', placeholder: 'Toshkent', icon: MapPin },
                  { name: 'salary', label: 'Maosh', placeholder: '$1000 - $1500', icon: DollarSign },
                ].map(({ name, label, placeholder, icon: Icon }) => (
                  <div key={name} className="space-y-2 group">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 group-focus-within:text-indigo-400 transition-colors">{label}</label>
                    <div className="relative">
                      <Icon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={16} />
                      <input
                        name={name}
                        value={formData[name]}
                        onChange={(e) => setFormData(p => ({ ...p, [name]: e.target.value }))}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all font-bold text-sm"
                        placeholder={placeholder}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ish Turi</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {['fullTime', 'partTime', 'contract', 'internship', 'remote'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, employment_type: type }))}
                      className={`py-3 rounded-[1rem] text-[9px] font-black uppercase tracking-widest border transition-all ${formData.employment_type === type
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                        : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:border-white/20'}`}
                    >
                      {getEmploymentLabel(type)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 group">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 group-focus-within:text-indigo-400 transition-colors">Nomzodlarga Talablar</label>
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData(p => ({ ...p, requirements: e.target.value }))}
                  placeholder="Masalan: Python, React, 3 yil tajriba..."
                  className="w-full h-24 bg-white/5 border border-white/5 rounded-[1.5rem] p-5 text-white outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all font-bold text-sm resize-none"
                />
              </div>

              <div className="space-y-3 group">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 group-focus-within:text-indigo-400 transition-colors">Batafsil Tavsif</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="Ish haqida ko'proq ma'lumot..."
                  className="w-full h-32 bg-white/5 border border-white/5 rounded-[1.5rem] p-5 text-white outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all font-bold text-sm resize-none"
                />
              </div>
            </div>

            <div className="p-8 bg-white/[0.02] border-t border-white/5 flex gap-4">
              <button onClick={() => setShowJobModal(false)} className="flex-1 py-4 font-black uppercase tracking-widest text-[11px] text-slate-500 hover:text-white transition-all">Bekor qilish</button>
              <button
                onClick={handleSaveJob}
                disabled={submitting}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-[1.25rem] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : editingJob ? 'Saqlash' : 'E\'lon qilsh'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Delete Modal ═══ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-sm bg-[var(--bg-surface)] border border-white/10 rounded-[2.5rem] p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-rose-500">
              <Trash2 size={40} />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">O'chirish?</h3>
            <p className="text-slate-400 font-bold text-sm mb-8 leading-relaxed">Vakansiya butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:text-white transition-all">Yo'q</button>
              <button onClick={handleDeleteJob} className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-rose-600/20 transition-all">Ha, O'chirish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;
