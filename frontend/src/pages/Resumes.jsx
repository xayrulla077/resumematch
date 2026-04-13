import { useState, useEffect, useCallback } from 'react';
import { FileText, Upload, Search, Trash2, Eye, BarChart3, ChevronLeft, ChevronRight, X, Check, Clock, Download } from 'lucide-react';
import { resumesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useLanguage } from '../context/LanguageContext';
import ResumeRow from '../components/ResumeRow';

const Resumes = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResume, setSelectedResume] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');

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
      toast.error(t('resumesLoadError') || "Rezyumalarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumes();
  }, [currentPage, searchTerm]);

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    setUploading(true);
    
    try {
      await resumesAPI.upload(file);
      toast.success(t('resumeUploadSuccess') || "Rezyume muvaffaqiyatli yuklandi");
      setFileName('');
      loadResumes();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(t('resumeUploadError') || "Rezyumeni yuklashda xatolik yuz berdi");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setFileName(file.name);
      handleFileUpload(file);
    } else {
      toast.error(t('invalidFileType') || "Faqat PDF fayllari ruxsat etilgan");
    }
  }, []);

  const handleDelete = async (id) => {
    if (!confirm(t('confirmDelete') || "Haqiqatanham o'chirmoqchimisiz?")) return;
    try {
      await resumesAPI.delete(id);
      toast.success(t('deleteSuccess') || "Muvaffaqiyatli o'chirildi");
      loadResumes();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(t('deleteError') || "O'chirishda xatolik yuz berdi");
    }
  };

  const handleDownload = async (id, fileName) => {
    try {
      const response = await resumesAPI.download(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'resume.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t('downloadSuccess') || "Rezyume muvaffaqiyatli yuklandi");
    } catch (error) {
      console.error('Download error:', error);
      toast.error(t('downloadError') || "Yuklashda xatolik yuz berdi");
    }
  };

  const handleAnalyze = async (id) => {
    try {
      await resumesAPI.getAIFeedback(id);
      toast.success(t('analysisStarted') || "Tahlil boshlandi");
      loadResumes();
    } catch (error) {
      console.error('Analyze error:', error);
      toast.error(t('analysisError') || "Tahlilda xatolik yuz berdi");
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const getStatusBadge = (status) => {
    if (status === 'analyzed') {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20">
          <Check size={12} /> {t('analyzed') || 'Tahlil qilindi'}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-amber-500/20">
        <Clock size={12} /> {t('pending') || 'Kutilmoqda'}
      </span>
    );
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-black text-[var(--text-main)] uppercase tracking-tight">
          {t('resumesPage') || 'Rezyumalar'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">{t('warehouse') || 'Ombori'}</span>
        </h1>
        <p className="text-[var(--text-muted)] font-medium mt-2">{t('resumesDesc') || 'Barcha rezyumalarni boshqarish va tahlil qilish'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className={`relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-indigo-500/20 to-indigo-600/5 border border-indigo-500/20`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                <FileText className="text-indigo-400" size={20} />
              </div>
              <span className="text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest">{t('totalResumes') || 'Jami Rezyumalar'}</span>
            </div>
            <p className="text-3xl font-black text-white">{totalItems}</p>
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg-surface)] rounded-[2rem] border border-[var(--border-main)] overflow-hidden">
        <div className="p-6 border-b border-[var(--border-main)]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
              <input
                type="text"
                placeholder={t('searchResumes') || "Rezyumalarni qidirish..."}
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-12 pr-4 py-3 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl text-[var(--text-main)] placeholder-[var(--text-muted)] font-medium focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <label className="flex items-center gap-3 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl cursor-pointer transition-all hover:shadow-lg hover:shadow-indigo-500/20">
              <Upload size={18} />
              {t('uploadResume') || 'Rezyume yuklash'}
              <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0])} />
            </label>
          </div>
        </div>

        <div className="p-6">
          <div
            className="border-2 border-dashed border-[var(--border-main)] rounded-2xl p-8 mb-6 text-center hover:border-indigo-500/50 transition-colors cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto w-12 h-12 text-[var(--text-muted)] mb-4" />
            <p className="text-[var(--text-muted)] font-medium">{t('dragDropText') || "PDF faylni bu yerga sudrab tashlang yoki"}</p>
            <p className="text-indigo-400 font-black text-sm uppercase tracking-wider mt-2">{t('clickToUpload') || "yuklash uchun bosing"}</p>
            <p className="text-[var(--text-muted)] text-xs mt-2">{t('supportedFormats') || "Qo'llab-quvvatlanadigan format: PDF (maksimal 10MB)"}</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : resumes.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="mx-auto w-16 h-16 text-[var(--text-muted)]/30 mb-4" />
              <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight mb-2">{t('noResumes') || "Rezyumalar yo'q"}</h3>
              <p className="text-[var(--text-muted)]">{t('uploadFirst') || "Birinchi rezyumeni yuklang"}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border-main)]">
                      <th className="text-left py-4 px-4 text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest">{t('fileName') || 'FAYL NOMI'}</th>
                      <th className="text-left py-4 px-4 text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest">{t('uploadDate') || 'YUKLANGAN SANA'}</th>
                      <th className="text-left py-4 px-4 text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest">{t('fileSize') || 'HAJMI'}</th>
                      <th className="text-left py-4 px-4 text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest">{t('status') || 'HOLATI'}</th>
                      <th className="text-right py-4 px-4 text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest">{t('actions') || 'AMALLAR'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumes.map((resume) => (
                      <ResumeRow
                        key={resume.id}
                        resume={resume}
                        user={user}
                        getStatusBadge={getStatusBadge}
                        handleDownload={handleDownload}
                        handleAnalyze={handleAnalyze}
                        setSelectedResume={setSelectedResume}
                        setShowModal={setShowModal}
                        handleDelete={handleDelete}
                        t={t}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-[var(--border-main)]">
                  <p className="text-[var(--text-muted)] text-sm font-medium">
                    {t('showing') || 'Ko\'rsatilmoqda'} {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} {t('of') || 'dan'} {totalItems}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={20} className="text-[var(--text-muted)]" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-xl font-black text-sm transition-colors ${
                          currentPage === page
                            ? 'bg-indigo-600 text-white'
                            : 'text-[var(--text-muted)] hover:bg-white/5'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={20} className="text-[var(--text-muted)]" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showModal && selectedResume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[var(--bg-surface)] rounded-[2rem] border border-[var(--border-main)] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[var(--border-main)] flex items-center justify-between">
              <h2 className="text-xl font-black text-[var(--text-main)] uppercase">{selectedResume.file_name}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-xl">
                <X size={20} className="text-[var(--text-muted)]" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[var(--text-muted)] text-xs font-black uppercase tracking-widest">{t('uploadDate') || 'YUKLANGAN SANA'}</label>
                  <p className="text-[var(--text-main)] font-medium mt-1">
                    {selectedResume.uploaded_at ? format(new Date(selectedResume.uploaded_at), 'MMM dd, yyyy HH:mm') : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-[var(--text-muted)] text-xs font-black uppercase tracking-widest">{t('status') || 'HOLATI'}</label>
                  <div className="mt-1">{getStatusBadge(selectedResume.status)}</div>
                </div>
              </div>
              
              {selectedResume.analysis && (
                <div className="mt-6 p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                  <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-3">{t('analysisResults') || 'Tahlil natijalari'}</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-[var(--text-muted)]">{t('skills') || 'Ko\'nikmalar'}:</span> <span className="text-[var(--text-main)]">{selectedResume.analysis.skills?.join(', ') || '-'}</span></p>
                    <p><span className="text-[var(--text-muted)]">{t('experience') || 'Tajriba'}:</span> <span className="text-[var(--text-main)]">{selectedResume.analysis.experience || '-'}</span></p>
                    <p><span className="text-[var(--text-muted)]">{t('education') || 'Ma\'lumot'}:</span> <span className="text-[var(--text-main)]">{selectedResume.analysis.education || '-'}</span></p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resumes;