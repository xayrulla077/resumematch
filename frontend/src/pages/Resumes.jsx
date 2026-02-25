import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { resumesAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  Search,
  Eye,
  Trash2,
  BarChart3,
  CheckCircle,
  Clock,
  Loader2,
  X,
  Mail,
  Phone,
  MapPin,
  Star,
  AlertTriangle,
  ChevronRight,
  Download,
  BrainCircuit,
  Zap,
  ShieldCheck,
  Target,
  Info
} from 'lucide-react';
import Pagination from '../components/Pagination';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const TableRowSkeleton = () => (
  <tr className="border-b border-[var(--border-main)] animate-pulse">
    <td className="px-6 py-5">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[var(--bg-card)] rounded-2xl flex-shrink-0" />
        <div className="space-y-2">
          <div className="w-32 h-3 bg-[var(--bg-card)] rounded-lg" />
          <div className="w-24 h-2 bg-[var(--bg-card)] rounded-lg" />
        </div>
      </div>
    </td>
    <td className="px-6 py-5"><div className="w-24 h-3 bg-[var(--bg-card)] rounded-lg" /></td>
    <td className="px-6 py-5 text-right">
      <div className="flex justify-end gap-2">
        <div className="w-10 h-10 bg-[var(--bg-card)] rounded-xl" />
        <div className="w-10 h-10 bg-[var(--bg-card)] rounded-xl" />
      </div>
    </td>
  </tr>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const Resumes = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();

  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Detail modal
  const [selectedResume, setSelectedResume] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // AI Review modal
  const [reviewData, setReviewData] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Delete confirm modal
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Data Fetching ───────────────────────────────────────────────────────────

  const loadResumes = async () => {
    try {
      setLoading(true);
      const response = await resumesAPI.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm.trim() || undefined
      });
      setResumes(response.data.items || []);
      setTotalItems(response.data.metadata.total || 0);
    } catch (error) {
      console.error('Resumes load error:', error);
      toast.error("Rezyumalarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumes();
  }, [currentPage, searchTerm]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleFileUpload = async (file) => {
    if (file.type !== 'application/pdf') {
      toast.error("Faqat PDF fayllar qabul qilinadi!");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Fayl hajmi 10MB dan oshmasligi kerak!");
      return;
    }

    try {
      setUploading(true);
      await resumesAPI.upload(file);
      toast.success("Rezyume muvaffaqiyatli yuklandi va tahlil qilindi! 🎉");
      loadResumes();
    } catch (error) {
      toast.error("Xatolik: " + (error.response?.data?.detail || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleView = (resume) => {
    setSelectedResume(resume);
    setShowDetailModal(true);
  };

  const handleAIReview = async (resume) => {
    try {
      setSelectedResume(resume);
      setReviewLoading(true);
      setShowReviewModal(true);
      const response = await resumesAPI.getAIFeedback(resume.id);
      setReviewData(response.data);
    } catch (error) {
      console.error("AI Review error:", error);
      toast.error("AI Review olishda xatolik yuz berdi");
      setShowReviewModal(false);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDeleteConfirm = (id) => {
    setDeleteTargetId(id);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await resumesAPI.delete(deleteTargetId);
      toast.success("Rezyume o'chirib tashlandi");
      setShowDeleteConfirm(false);
      loadResumes();
    } catch (error) {
      toast.error("O'chirishda xatolik yuz berdi");
    } finally {
      setDeleting(false);
    }
  };

  // ── Drag & Drop ────────────────────────────────────────────────────────────

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files[0]);
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    const mb = bytes / (1024 * 1024);
    return mb > 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-4 sm:p-6 lg:p-8 relative overflow-hidden font-['Outfit'] transition-all duration-300">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-10">

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl lg:text-5xl font-black text-[var(--text-main)] tracking-tight">
            Rezyumalar <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Ombori</span>
          </h1>
          <p className="text-[var(--text-muted)] font-bold uppercase tracking-[0.2em] text-[10px] pl-1 border-l-2 border-indigo-500/50">
            AI yordamida rezyumalarni aqlli tahlil qiling va professional feedback oling
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: 'Jami Rezyumalar', value: totalItems, icon: FileText, color: 'indigo' },
            { label: 'Tahlil Qilingan', value: resumes.filter(r => r.is_analyzed).length, icon: CheckCircle, color: 'emerald' },
            { label: 'Kutilmoqda', value: resumes.filter(r => !r.is_analyzed).length, icon: Clock, color: 'amber' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="relative overflow-hidden p-8 rounded-[2rem] bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-xl transition-all hover:scale-[1.02]">
              <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
                <Icon size={120} />
              </div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">{label}</h4>
                  <p className="text-4xl font-black text-[var(--text-main)]">{value}</p>
                </div>
                <div className={`w-14 h-14 rounded-2xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center text-${color}-500`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Upload Zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`relative p-10 lg:p-16 rounded-[3rem] bg-[var(--bg-surface)] border-2 border-dashed transition-all duration-500 text-center flex flex-col items-center gap-6 shadow-2xl overflow-hidden ${isDragging ? 'border-indigo-600 bg-indigo-600/5 scale-[1.01]' : 'border-[var(--border-main)]'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />

          <div className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center transition-all duration-500 ${uploading ? 'bg-indigo-600 rotate-[360deg] scale-110' : 'bg-indigo-600/10 shadow-lg'}`}>
            {uploading ? (
              <Loader2 className="text-white animate-spin" size={40} />
            ) : (
              <Upload className="text-indigo-600" size={40} />
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tight">
              {uploading ? "Yuklanmoqda..." : "Rezyumeni yuklang"}
            </h2>
            <p className="text-[var(--text-muted)] font-bold text-sm max-w-sm">
              PDF faylni bu yerga tashlang yoki tugma orqali tanlang. AI darhol tahlilni boshlaydi.
            </p>
          </div>

          {!uploading && (
            <div className="flex flex-col items-center gap-4">
              <label className="px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.25rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-600/25 transition-all active:scale-95 cursor-pointer">
                Faylni tanlang
                <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0])} />
              </label>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Faqat PDF • Maks 10 MB</p>
            </div>
          )}
        </div>

        {/* Filters & Table */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="w-full sm:max-w-md relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Nomzod yoki fayl bo'yicha qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl py-4 pl-12 pr-6 text-[var(--text-main)] placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none font-bold text-sm shadow-xl"
              />
            </div>
            <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest bg-[var(--bg-surface)] px-6 py-4 rounded-2xl border border-[var(--border-main)] shadow-xl">
              Jami: <span className="text-[var(--text-main)]">{totalItems}</span> ta rezyume
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] rounded-[2.5rem] border border-[var(--border-main)] shadow-2xl overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-main)] bg-white/[0.02]">
                    <th className="px-8 py-6 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Hujjat</th>
                    <th className="px-8 py-6 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Nomzod va Email</th>
                    <th className="px-8 py-6 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Holat</th>
                    <th className="px-8 py-6 text-right text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-main)]">
                  {loading ? (
                    [...Array(5)].map((_, i) => <TableRowSkeleton key={i} />)
                  ) : resumes.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-20 text-center">
                        <div className="flex flex-col items-center gap-4 text-[var(--text-muted)]">
                          <FileText size={48} className="opacity-20" />
                          <p className="font-black text-sm uppercase tracking-widest">Ma'lumot topilmadi</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    resumes.map((r, idx) => (
                      <tr key={r.id} className="group hover:bg-white/[0.03] transition-all animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <FileText size={20} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-[var(--text-main)] text-sm truncate uppercase tracking-tight">{r.file_name}</p>
                              <p className="text-[10px] text-[var(--text-muted)] font-bold mt-1 uppercase tracking-widest">{formatSize(r.file_size)} • {new Date(r.uploaded_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="space-y-1">
                            <p className="text-sm font-black text-[var(--text-main)]">{r.full_name || 'Aniqlanmagan'}</p>
                            <p className="text-xs text-[var(--text-muted)] group-hover:text-indigo-400 transition-colors">{r.email || '—'}</p>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest ${r.is_analyzed ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                            {r.is_analyzed ? <CheckCircle size={12} /> : <Clock size={12} className="animate-spin-slow" />}
                            {r.is_analyzed ? "Tahlil qilingan" : "Kutilmoqda"}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => handleAIReview(r)}
                              className="p-3 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-500 hover:text-white rounded-xl transition-all border border-indigo-500/20 shadow-xl group/btn"
                              title="AI Tahlil va Professional maslahat"
                            >
                              <BrainCircuit size={18} className="group-hover/btn:scale-110 transition-transform" />
                            </button>
                            <button
                              onClick={() => handleView(r)}
                              className="p-3 bg-[var(--bg-main)]/50 hover:bg-slate-700 text-[var(--text-muted)] hover:text-white rounded-xl transition-all border border-[var(--border-main)] shadow-xl"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteConfirm(r.id)}
                              className="p-3 bg-[var(--bg-main)]/50 hover:bg-rose-600 text-[var(--text-muted)] hover:text-white rounded-xl transition-all border border-[var(--border-main)] shadow-xl"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-8 border-t border-[var(--border-main)] bg-white/[0.01]">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ AI Review Modal ═══ */}
      {showReviewModal && selectedResume && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 sm:p-12">
          <div className="absolute inset-0 bg-[#0a0f1d]/85 backdrop-blur-2xl animate-in fade-in duration-500" onClick={() => !reviewLoading && setShowReviewModal(false)}></div>
          <div className="bg-[#121827]/60 backdrop-blur-3xl w-full max-w-2xl rounded-[3rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] border border-white/10 relative z-10 overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-10 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 relative border-b border-white/5">
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                    <BrainCircuit size={40} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight leading-none mb-2 uppercase">AI PROFESSIONAL REVIEW</h3>
                    <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em]">{selectedResume.full_name || selectedResume.file_name}</p>
                  </div>
                </div>
                <button onClick={() => setShowReviewModal(false)} disabled={reviewLoading} className="p-3 hover:bg-white/10 rounded-2xl transition-all group border border-white/5 disabled:opacity-30">
                  <X size={24} className="group-hover:rotate-90 transition-transform text-white" />
                </button>
              </div>
            </div>

            <div className="p-10 overflow-y-auto no-scrollbar flex-1 space-y-10">
              {reviewLoading ? (
                <div className="py-24 flex flex-col items-center justify-center space-y-8">
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="text-indigo-500 animate-pulse" size={32} />
                    </div>
                  </div>
                  <p className="font-black text-[10px] text-slate-500 uppercase tracking-[0.4em] animate-pulse text-center">Gemini rezyumeni tahlil qilmoqda...</p>
                </div>
              ) : reviewData && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                  {/* Overall Score */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 text-center relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Star size={48} className="text-amber-400" />
                      </div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Quality Score</p>
                      <div className="text-6xl font-black text-white tracking-tighter">{reviewData.quality_score}%</div>
                    </div>
                    <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 text-center relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <ShieldCheck size={48} className="text-emerald-400" />
                      </div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">ATS Compatibility</p>
                      <div className="text-6xl font-black text-white tracking-tighter">{reviewData.ats_score}%</div>
                    </div>
                  </div>

                  {/* Advice Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Info size={18} className="text-indigo-400" />
                      <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Professional Maslahatlar</h4>
                    </div>
                    {reviewData.advice.map((adv, i) => (
                      <div key={i} className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-black shrink-0">{i + 1}</div>
                        <p className="text-sm text-slate-300 font-bold leading-relaxed">{adv}</p>
                      </div>
                    ))}
                  </div>

                  {/* Pros & Cons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle size={14} /> Kuchli Tomonlar
                      </h4>
                      <div className="space-y-2">
                        {reviewData.pros.map((p, i) => (
                          <div key={i} className="text-xs text-slate-400 font-medium flex items-start gap-2">
                            <div className="w-1 h-1 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                            {p}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle size={14} /> Kamchiliklar
                      </h4>
                      <div className="space-y-2">
                        {reviewData.cons.map((c, i) => (
                          <div key={i} className="text-xs text-slate-400 font-medium flex items-start gap-2">
                            <div className="w-1 h-1 bg-rose-500 rounded-full mt-1.5 shrink-0" />
                            {c}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-10 bg-black/20 border-t border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,1)]"></div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Gemini AI Analysis Active</p>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="px-10 py-4 bg-white/5 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-white/5 hover:bg-white/10 hover:text-white transition-all active:scale-95 duration-300">
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Detail Modal ═══ */}
      {showDetailModal && selectedResume && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setShowDetailModal(false)} />
          <div className="relative w-full max-w-6xl h-[90vh] bg-[var(--bg-surface)] border border-white/10 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center text-indigo-500 text-2xl font-black">
                  {(selectedResume.full_name || selectedResume.file_name).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">{selectedResume.full_name || "Nomzod Ma'lumoti"}</h3>
                  <div className="flex gap-4 mt-1">
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">{selectedResume.file_name}</p>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">• {formatSize(selectedResume.file_size)}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              {/* PDF Preview */}
              <div className="lg:w-2/3 bg-slate-900/50 border-r border-white/5 relative">
                <iframe
                  src={`${import.meta.env.VITE_API_URL}/uploads/${selectedResume.file_name}`}
                  className="w-full h-full"
                  title="PDF Preview"
                />
              </div>

              {/* Data Panel */}
              <div className="lg:w-1/3 p-8 overflow-y-auto no-scrollbar space-y-8 bg-white/[0.01]">
                {/* Status Card */}
                <div className={`p-6 rounded-3xl border ${selectedResume.is_analyzed ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/5 border-amber-500/20 text-amber-500'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest">Tahlil Holati</h4>
                    {selectedResume.is_analyzed ? <CheckCircle size={20} /> : <Loader2 size={20} className="animate-spin" />}
                  </div>
                  <p className="text-xl font-black">{selectedResume.is_analyzed ? "Muvaffaqiyatli tahlil qilindi" : "Tahlil kutilmoqda..."}</p>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 border-l-2 border-indigo-500">Bog'lanish</h4>
                  <div className="grid gap-3">
                    {[
                      { icon: Mail, label: 'Email', value: selectedResume.email, color: 'indigo' },
                      { icon: Phone, label: 'Telefon', value: selectedResume.phone, color: 'purple' },
                      { icon: MapPin, label: 'Joylashuv', value: selectedResume.location, color: 'rose' },
                    ].map(({ icon: Icon, label, value, color }) => (
                      <div key={label} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 text-${color}-500 flex items-center justify-center`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</p>
                          <p className="text-sm font-bold text-white">{value || '—'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                {selectedResume.skills && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 border-l-2 border-indigo-500">Ko'nikmalar (AI tahlili)</h4>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(selectedResume.skills) ? selectedResume.skills : selectedResume.skills.split(',')).map(skill => (
                        <span key={skill} className="px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest">
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {selectedResume.summary && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 border-l-2 border-indigo-500">Qisqacha tavsif</h4>
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-sm text-slate-400 leading-relaxed font-medium">{selectedResume.summary}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 bg-white/[0.02] border-t border-white/5 flex gap-4">
              <a
                href={`${import.meta.env.VITE_API_URL}/uploads/${selectedResume.file_name}`}
                download
                className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all border border-white/10 flex items-center justify-center gap-3"
              >
                <Download size={18} />
                Yuklab olish
              </a>
              <button
                onClick={() => handleDeleteConfirm(selectedResume.id)}
                className="flex-1 py-4 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all border border-rose-600/20 flex items-center justify-center gap-3"
              >
                <Trash2 size={18} />
                Faylni o'chirish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Delete Confirm ═══ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => !deleting && setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-sm bg-[var(--bg-surface)] border border-white/10 rounded-[3rem] p-10 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-rose-500">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-3">O'chirib tashlash?</h3>
            <p className="text-slate-500 font-bold text-sm mb-10 leading-relaxed uppercase tracking-widest text-[10px]">Bu rezyume va tahlil natijalari butunlay yo'qoladi.</p>
            <div className="flex gap-4">
              <button disabled={deleting} onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:text-white transition-all">Yo'q</button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-rose-600/30 transition-all flex items-center justify-center"
              >
                {deleting ? <Loader2 className="animate-spin" size={20} /> : "O'chirilsin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resumes;
