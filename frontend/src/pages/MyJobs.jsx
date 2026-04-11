import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { jobsAPI, applicationsAPI, messagesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import ChatModal from '../components/ChatModal';
import CandidateProfileModal from '../components/CandidateProfileModal';
import { User } from 'lucide-react';
import { MessageCircle } from 'lucide-react';
import {
  Briefcase,
  Plus,
  Search,
  MapPin,
  DollarSign,
  Edit,
  Trash2,
  X,
  Calendar,
  Loader2,
  Building2,
  Clock,
  Users,
  AlertCircle
} from 'lucide-react';
import Pagination from '../components/Pagination';

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

const MyJobs = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 9;

  const [searchTerm, setSearchTerm] = useState('');

  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    salary: '',
    employment_type: 'full_time',
    requirements: '',
    description: '',
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [applicantFilters, setApplicantFilters] = useState({
    status: '',
    minScore: '',
    maxScore: '',
    sortBy: 'match_score',
    sortOrder: 'desc',
  });
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [chatApp, setChatApp] = useState(null);
  const [showCandidateProfile, setShowCandidateProfile] = useState(null);

  const handleUpdateStatus = async (applicationId, newStatus) => {
    setUpdatingStatus(applicationId);
    try {
      await applicationsAPI.updateStatus(applicationId, newStatus, '');
      toast.success("Ariza holati yangilandi");
      if (selectedJobForApplicants) {
        viewApplicants(selectedJobForApplicants);
      }
    } catch (error) {
      console.error('Status update error:', error);
      toast.error("Holatni yangilashda xatolik");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await jobsAPI.getMyJobs({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm.trim() || undefined,
      });
      setJobs(response.data.items || []);
      setTotalItems(response.data?.metadata?.total || 0);
    } catch (error) {
      console.error('My jobs load error:', error);
      toast.error("Vakansiyalarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [currentPage, searchTerm]);

  const viewApplicants = async (job) => {
    setSelectedJobForApplicants(job);
    setShowApplicantsModal(true);
    setApplicantsLoading(true);
    try {
      const params = {
        status: applicantFilters.status || undefined,
        min_score: applicantFilters.minScore ? parseFloat(applicantFilters.minScore) : undefined,
        max_score: applicantFilters.maxScore ? parseFloat(applicantFilters.maxScore) : undefined,
        sort_by: applicantFilters.sortBy,
        sort_order: applicantFilters.sortOrder,
      };
      const response = await applicationsAPI.getJobApplicants(job.id, params);
      setApplicants(response.data.items || []);
    } catch (error) {
      console.error('Error loading applicants:', error);
      toast.error("Nomzodlarni yuklashda xatolik");
    } finally {
      setApplicantsLoading(false);
    }
  };

  const handleApplicantFilterChange = (key, value) => {
    const newFilters = { ...applicantFilters, [key]: value };
    setApplicantFilters(newFilters);
    if (selectedJobForApplicants) {
      viewApplicantsWithFilters(selectedJobForApplicants, newFilters);
    }
  };

  const viewApplicantsWithFilters = async (job, filters) => {
    setApplicantsLoading(true);
    try {
      const params = {
        status: filters.status || undefined,
        min_score: filters.minScore ? parseFloat(filters.minScore) : undefined,
        max_score: filters.maxScore ? parseFloat(filters.maxScore) : undefined,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder,
      };
      const response = await applicationsAPI.getJobApplicants(job.id, params);
      setApplicants(response.data.items || []);
    } catch (error) {
      console.error('Error loading applicants:', error);
      toast.error("Nomzodlarni yuklashda xatolik");
    } finally {
      setApplicantsLoading(false);
    }
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowJobModal(false);
        setShowDeleteConfirm(false);
        setShowApplicantsModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleAddJob = () => {
    setEditingJob(null);
    setFormData({
      title: '',
      company: user?.company_name || '',
      location: '',
      salary: '',
      employment_type: 'full_time',
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
      employment_type: job.employment_type || 'full_time',
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
      toast.error("Xatolik: " + (error.response?.data?.detail || error.message));
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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const employmentTypes = {
    full_time: 'To\'liq vaqt',
    part_time: 'Yarim stavka',
    contract: 'Shartnoma',
    internship: 'Amaliyot',
    remote: 'Masofaviy',
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-[var(--text-main)] uppercase tracking-tight">
              {t('myJobs') || 'Mening vakansiyalarim'}
            </h1>
            <p className="text-[var(--text-muted)] text-sm font-bold mt-1">
              {totalItems} ta vakansiya
            </p>
          </div>
          <button
            onClick={handleAddJob}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-6 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-indigo-600/20"
          >
            <Plus size={20} />
            Vakansiya qo'shish
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={20} />
          <input
            type="text"
            placeholder="Vakansiyalarni qidirish..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl py-4 pl-14 pr-6 text-[var(--text-main)] font-bold text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all placeholder:text-[var(--text-muted)]"
          />
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)
          ) : jobs.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-[var(--bg-surface)] rounded-3xl flex items-center justify-center mb-6">
                <Briefcase size={40} className="text-[var(--text-muted)]" />
              </div>
              <h3 className="text-xl font-black text-[var(--text-main)] mb-2">
                Vakansiyalar topilmadi
              </h3>
              <p className="text-[var(--text-muted)] font-bold mb-6">
                Hozircha siz hech qanday vakansiya yaratmadingiz
              </p>
              <button
                onClick={handleAddJob}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-6 rounded-2xl transition-all"
              >
                <Plus size={20} />
                Birinchi vakansiya yaratish
              </button>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className="p-8 rounded-[2.5rem] bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-indigo-600/20 rounded-2xl flex items-center justify-center">
                    <Building2 size={28} className="text-indigo-400" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditJob(job)}
                      className="p-3 bg-[var(--bg-card)] hover:bg-indigo-600/20 hover:text-indigo-400 text-[var(--text-muted)] rounded-2xl transition-all"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteConfirm(job.id)}
                      className="p-3 bg-[var(--bg-card)] hover:bg-rose-500/20 hover:text-rose-400 text-[var(--text-muted)] rounded-2xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-black text-[var(--text-main)] mb-2 line-clamp-1">
                  {job.title}
                </h3>
                <p className="text-[var(--text-muted)] font-bold text-sm mb-4">
                  {job.company}
                </p>

                <div className="flex flex-wrap gap-3 mb-6">
                  {job.location && (
                    <span className="flex items-center gap-1.5 text-xs font-black text-[var(--text-muted)] bg-[var(--bg-card)] px-3 py-1.5 rounded-xl">
                      <MapPin size={12} />
                      {job.location}
                    </span>
                  )}
                  {job.salary && (
                    <span className="flex items-center gap-1.5 text-xs font-black text-[var(--text-muted)] bg-[var(--bg-card)] px-3 py-1.5 rounded-xl">
                      <DollarSign size={12} />
                      {job.salary}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-xs font-black text-indigo-400 bg-indigo-600/10 px-3 py-1.5 rounded-xl">
                    <Clock size={12} />
                    {employmentTypes[job.employment_type] || job.employment_type}
                  </span>
                </div>

                <div className="pt-4 border-t border-[var(--border-main)]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-black text-[var(--text-muted)]">
                      <Calendar size={12} />
                      {formatDate(job.posted_at)}
                    </span>
                    <button 
                      onClick={() => viewApplicants(job)}
                      className="flex items-center gap-1.5 text-xs font-black text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <Users size={12} />
                      {job.applications_count || 0} ariza
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && totalItems > itemsPerPage && (
          <div className="mt-10">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* Job Modal */}
        {showJobModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowJobModal(false)} />
            <div className="relative w-full max-w-2xl bg-[var(--bg-surface)] rounded-[2rem] border border-[var(--border-main)] shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowJobModal(false)}
                className="absolute top-6 right-6 p-2 hover:bg-[var(--bg-card)] rounded-xl transition-colors"
              >
                <X size={24} className="text-[var(--text-muted)]" />
              </button>

              <h2 className="text-2xl font-black text-[var(--text-main)] mb-6">
                {editingJob ? 'Vakansiya tahrirlash' : 'Yangi vakansiya'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">
                    Sarlavha *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-4 px-5 text-[var(--text-main)] font-bold text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Masalan: Senior Python Developer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">
                    Kompaniya *
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-4 px-5 text-[var(--text-main)] font-bold text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Kompaniya nomi"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">
                      Manzil
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-4 px-5 text-[var(--text-main)] font-bold text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
                      placeholder="Toshkent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">
                      Maosh
                    </label>
                    <input
                      type="text"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-4 px-5 text-[var(--text-main)] font-bold text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
                      placeholder="$2000-3000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">
                    Ish turi
                  </label>
                  <select
                    value={formData.employment_type}
                    onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-4 px-5 text-[var(--text-main)] font-bold text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="full_time">To'liq vaqt</option>
                    <option value="part_time">Yarim stavka</option>
                    <option value="contract">Shartnoma</option>
                    <option value="internship">Amaliyot</option>
                    <option value="remote">Masofaviy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">
                    Talablar
                  </label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    rows="3"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-4 px-5 text-[var(--text-main)] font-bold text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all resize-none"
                    placeholder="Talablar ro'yxati..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">
                    Tavsif
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="4"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-4 px-5 text-[var(--text-main)] font-bold text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all resize-none"
                    placeholder="Ish haqida batafsil..."
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowJobModal(false)}
                  className="flex-1 bg-[var(--bg-card)] hover:bg-[var(--bg-surface)] text-[var(--text-main)] font-black py-4 rounded-2xl transition-all border border-[var(--border-main)]"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleSaveJob}
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      {editingJob ? 'Saqlash' : 'Yaratish'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
            <div className="relative w-full max-w-md bg-[var(--bg-surface)] rounded-[2rem] border border-[var(--border-main)] shadow-2xl p-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mb-6">
                  <AlertCircle size={32} className="text-rose-400" />
                </div>
                <h3 className="text-xl font-black text-[var(--text-main)] mb-2">
                  Vakansiya o'chirilsinmi?
                </h3>
                <p className="text-[var(--text-muted)] font-bold mb-6">
                  Bu amaliyotni ortga qaytarib bo'lmaydi
                </p>
                <div className="flex gap-4 w-full">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 bg-[var(--bg-card)] hover:bg-[var(--bg-surface)] text-[var(--text-main)] font-black py-3 rounded-2xl transition-all border border-[var(--border-main)]"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={handleDeleteJob}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black py-3 rounded-2xl transition-all"
                  >
                    O'chirish
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Applicants Modal */}
        {showApplicantsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowApplicantsModal(false)} />
            <div className="relative w-full max-w-3xl bg-[var(--bg-surface)] rounded-[2rem] border border-[var(--border-main)] shadow-2xl p-6 max-h-[85vh] overflow-hidden flex flex-col">
              <button
                onClick={() => setShowApplicantsModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-[var(--bg-card)] rounded-xl transition-colors"
              >
                <X size={24} className="text-[var(--text-muted)]" />
              </button>

              <div className="mb-4">
                <h2 className="text-xl font-black text-[var(--text-main)]">
                  {selectedJobForApplicants?.title}
                </h2>
                <p className="text-[var(--text-muted)] text-sm font-bold">
                  {selectedJobForApplicants?.company} - {applicants.length} ta ariza
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-4 p-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)]">
                <select
                  value={applicantFilters.status}
                  onChange={(e) => handleApplicantFilterChange('status', e.target.value)}
                  className="bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl px-3 py-2 text-sm font-bold text-[var(--text-main)]"
                >
                  <option value="">Barcha holatlar</option>
                  <option value="pending">Kutilmoqda</option>
                  <option value="screening">Saralanmoqda</option>
                  <option value="interview">Suhbat</option>
                  <option value="accepted">Qabul</option>
                  <option value="rejected">Rad etilgan</option>
                </select>
                
                <input
                  type="number"
                  placeholder="Min ball"
                  value={applicantFilters.minScore}
                  onChange={(e) => handleApplicantFilterChange('minScore', e.target.value)}
                  className="bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl px-3 py-2 text-sm font-bold text-[var(--text-main)] w-24"
                />
                
                <input
                  type="number"
                  placeholder="Max ball"
                  value={applicantFilters.maxScore}
                  onChange={(e) => handleApplicantFilterChange('maxScore', e.target.value)}
                  className="bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl px-3 py-2 text-sm font-bold text-[var(--text-main)] w-24"
                />

                <select
                  value={applicantFilters.sortBy}
                  onChange={(e) => handleApplicantFilterChange('sortBy', e.target.value)}
                  className="bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl px-3 py-2 text-sm font-bold text-[var(--text-main)]"
                >
                  <option value="match_score">Match balli</option>
                  <option value="applied_at">Sana bo'yicha</option>
                  <option value="ai_score">AI balli</option>
                </select>

                <select
                  value={applicantFilters.sortOrder}
                  onChange={(e) => handleApplicantFilterChange('sortOrder', e.target.value)}
                  className="bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl px-3 py-2 text-sm font-bold text-[var(--text-main)]"
                >
                  <option value="desc">Kamayish</option>
                  <option value="asc">O'sish</option>
                </select>
              </div>

              {applicantsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={32} className="animate-spin text-indigo-500" />
                </div>
              ) : applicants.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={48} className="text-[var(--text-muted)] mx-auto mb-4" />
                  <p className="text-[var(--text-muted)] font-bold">Hozircha arizalar yo'q</p>
                </div>
              ) : (
                <div className="overflow-y-auto flex-1 space-y-4 pr-2">
                  {applicants.map((applicant) => (
                    <div
                      key={applicant.id}
                      className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-indigo-500/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center">
                              <span className="text-indigo-400 font-black text-sm">
                                {applicant.applicant_name?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-black text-[var(--text-main)]">
                                {applicant.applicant_name || 'Noma\'lum'}
                              </h4>
                              <p className="text-[var(--text-muted)] text-xs font-bold">
                                {applicant.applicant_email || 'Email yo\'q'}
                              </p>
                            </div>
                          </div>
                          {applicant.cover_letter && (
                            <p className="text-[var(--text-muted)] text-sm font-bold mb-2 line-clamp-2">
                              {applicant.cover_letter}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-[var(--text-muted)]">
                              Resume: {applicant.resume_file || 'Yo\'q'}
                            </span>
                            <span className="text-[var(--text-muted)]">
                              • {formatDate(applicant.applied_at)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-[var(--text-muted)]">Match:</span>
                            <span className={`text-sm font-black ${
                              applicant.match_score >= 70 ? 'text-emerald-400' :
                              applicant.match_score >= 40 ? 'text-amber-400' : 'text-rose-400'
                            }`}>
                              {Math.round(applicant.match_score || 0)}%
                            </span>
                          </div>
                          <span className={`text-xs font-black px-2 py-1 rounded-lg ${
                            applicant.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' :
                            applicant.status === 'rejected' ? 'bg-rose-500/20 text-rose-400' :
                            applicant.status === 'interview' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            <select
                              value={applicant.status}
                              onChange={(e) => handleUpdateStatus(applicant.id, e.target.value)}
                              disabled={updatingStatus === applicant.id}
                              className={`bg-transparent border-none text-xs font-black cursor-pointer focus:outline-none ${
                                applicant.status === 'accepted' ? 'text-emerald-400' :
                                applicant.status === 'rejected' ? 'text-rose-400' :
                                applicant.status === 'interview' ? 'text-amber-400' :
                                'text-slate-400'
                              }`}
                            >
                              <option value="pending">Kutilmoqda</option>
                              <option value="screening">Saralanmoqda</option>
                              <option value="interview">Suhbat</option>
                              <option value="accepted">Qabul</option>
                              <option value="rejected">Rad</option>
                            </select>
                          </span>
                          <button
                            onClick={() => { setChatApp(applicant); setShowChat(true); }}
                            className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg hover:bg-indigo-600/30"
                            title="Chat"
                          >
                            <MessageCircle size={16} />
                          </button>
                          <button
                            onClick={() => { setShowCandidateProfile(applicant); }}
                            className="p-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30"
                            title="Profilni ko'rish"
                          >
                            <User size={16} />
                          </button>
                        </div>
                      </div>
                      {applicant.ai_summary && applicant.ai_summary !== 'AI tahlili kutilmoqda...' && (
                        <div className="mt-3 pt-3 border-t border-[var(--border-main)]">
                          <p className="text-xs font-black text-[var(--text-muted)] mb-1">AI tahlil:</p>
                          <p className="text-sm text-[var(--text-muted)] line-clamp-2">{applicant.ai_summary}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showChat && chatApp && (
        <ChatModal
          applicationId={chatApp.id}
          jobTitle={selectedJobForApplicants?.title}
          candidateName={chatApp.applicant_name}
          onClose={() => { setShowChat(false); setChatApp(null); }}
        />
      )}

      {showCandidateProfile && (
        <CandidateProfileModal
          applicationId={showCandidateProfile.resume_id || showCandidateProfile.id}
          candidateName={showCandidateProfile.applicant_name}
          onClose={() => setShowCandidateProfile(null)}
        />
      )}
    </div>
  );
};

export default MyJobs;
