import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  Star,
  Search,
  Plus,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Building2,
  TrendingUp,
  DollarSign,
  MessageCircle
} from 'lucide-react';
import { reviewsAPI } from '../lib/api';

const CompanyReviews = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('reviews'); // 'reviews', 'salary', 'add'
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyReviews, setCompanyReviews] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [topSalaries, setTopSalaries] = useState([]);
  const [salaryData, setSalaryData] = useState(null);
  
  // Add review form
  const [reviewForm, setReviewForm] = useState({
    company_name: '',
    rating: 5,
    title: '',
    pros: '',
    cons: '',
    advice: '',
    is_anonymous: true,
    work_type: 'full_time'
  });
  
  // Add salary form
  const [salaryForm, setSalaryForm] = useState({
    company: '',
    job_title: '',
    salary_min: '',
    salary_max: '',
    location: '',
    employment_type: 'full_time',
    experience_level: 'mid'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCompanies();
    loadStats();
    loadTopSalaries();
  }, []);

  const loadCompanies = async () => {
    try {
      const response = await reviewsAPI.getAll(searchTerm, 20);
      if (response.data) {
        setCompanies(response.data.companies || []);
      }
    } catch (error) {
      console.error('Load companies error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await reviewsAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const loadTopSalaries = async () => {
    try {
      const response = await reviewsAPI.getTopSalaries(10);
      setTopSalaries(response.data?.top_salaries || []);
    } catch (error) {
      console.error('Load salaries error:', error);
    }
  };

  const loadCompanyReviews = async (companyName) => {
    try {
      setLoading(true);
      const response = await reviewsAPI.getCompany(companyName);
      setCompanyReviews(response.data);
      setSelectedCompany(companyName);
    } catch (error) {
      console.error('Load company reviews error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadCompanies();
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.company_name || !reviewForm.rating) {
      toast.error('Please fill in required fields');
      return;
    }

    setSubmitting(true);
    try {
      await reviewsAPI.create(reviewForm);
      toast.success('Review submitted successfully!');
      setReviewForm({
        company_name: '',
        rating: 5,
        title: '',
        pros: '',
        cons: '',
        advice: '',
        is_anonymous: true,
        work_type: 'full_time'
      });
      loadCompanies();
      setActiveTab('reviews');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const submitSalary = async (e) => {
    e.preventDefault();
    if (!salaryForm.company || !salaryForm.job_title || !salaryForm.salary_min || !salaryForm.salary_max) {
      toast.error('Please fill in required fields');
      return;
    }

    setSubmitting(true);
    try {
      await reviewsAPI.addSalary(salaryForm);
      toast.success('Salary data submitted successfully!');
      setSalaryForm({
        company: '',
        job_title: '',
        salary_min: '',
        salary_max: '',
        location: '',
        employment_type: 'full_time',
        experience_level: 'mid'
      });
      loadTopSalaries();
      setActiveTab('salary');
    } catch (error) {
      toast.error('Failed to submit salary data');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`}
      />
    ));
  };

  const workTypes = [
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' }
  ];

  const experienceLevels = [
    { value: 'junior', label: 'Junior (0-2 years)' },
    { value: 'mid', label: 'Mid (2-5 years)' },
    { value: 'senior', label: 'Senior (5-10 years)' },
    { value: 'lead', label: 'Lead (10+ years)' }
  ];

  if (loading && !companies.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-8 font-['Outfit']">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[var(--text-main)]">
              {t('company_reviews') || 'Kompaniya izohlari'}
            </h1>
            <p className="text-[var(--text-muted)] font-bold text-sm">
              {t('reviews_subtitle') || 'Korxonalar haqida haqiqiy fikrlar va maoshlar'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-6 shadow-xl shadow-black/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)] font-bold">Jami izohlar</p>
                <p className="text-2xl font-black text-[var(--text-main)]">{stats.total_reviews}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-6 shadow-xl shadow-black/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)] font-bold">Kompaniyalar</p>
                <p className="text-2xl font-black text-[var(--text-main)]">{stats.total_companies}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-6 shadow-xl shadow-black/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)] font-bold">O'rtacha reyting</p>
                <p className="text-2xl font-black text-[var(--text-main)]">{stats.average_rating}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-3">
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'reviews' 
              ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' 
              : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-main)] hover:border-amber-500/50'
          }`}
        >
          <Building2 className="w-5 h-5" />
          Izohlar
        </button>
        <button
          onClick={() => setActiveTab('salary')}
          className={`px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'salary' 
              ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' 
              : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-main)] hover:border-green-500/50'
          }`}
        >
          <DollarSign className="w-5 h-5" />
          Maoshlar
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'add' 
              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
              : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-main)] hover:border-indigo-500/50'
          }`}
        >
          <Plus className="w-5 h-5" />
          Izoh qo'shish
        </button>
      </div>

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Company List */}
          <div className="lg:col-span-1 space-y-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-amber-500 transition-colors" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Kompaniya qidirish..."
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-main)] font-bold focus:outline-none focus:border-amber-500 shadow-xl shadow-black/5"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/30 transition-all"
              >
                Qidiruv
              </button>
            </form>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {companies.map((company, index) => (
                <button
                  key={index}
                  onClick={() => loadCompanyReviews(company.company)}
                  className={`w-full p-5 rounded-[2rem] text-left transition-all ${
                    selectedCompany === company.company
                      ? 'bg-amber-500/10 border-2 border-amber-500 shadow-lg shadow-amber-500/10'
                      : 'bg-[var(--bg-surface)] border border-[var(--border-main)] hover:border-amber-500/50 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-[var(--bg-main)] rounded-xl border border-[var(--border-main)] flex items-center justify-center overflow-hidden">
                      {company.logo_url ? (
                        <img src={company.logo_url} alt={company.company} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-6 h-6 text-[var(--text-muted)]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-[var(--text-main)] leading-tight">{company.company}</span>
                        <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-1 rounded-lg">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs font-black text-[var(--text-main)]">{company.average_rating}</span>
                        </div>
                      </div>
                      <p className="text-[10px] uppercase font-black text-amber-500 mt-1">{company.industry || 'IT & Xizmatlar'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border-main)]/50">
                    <p className="text-xs text-[var(--text-muted)] font-bold">
                      {company.total_reviews} ta izoh
                    </p>
                    <div className="w-6 h-6 rounded-full bg-[var(--bg-main)] flex items-center justify-center">
                      <Plus className="w-3 h-3 text-[var(--text-muted)]" />
                    </div>
                  </div>
                </button>
              ))}
              
              {companies.length === 0 && (
                <div className="text-center py-12 bg-[var(--bg-surface)] rounded-[2rem] border border-dashed border-[var(--border-main)]">
                  <Building2 className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-20" />
                  <p className="text-[var(--text-muted)] font-bold italic">
                    Kompaniyalar topilmadi
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Company Reviews */}
          <div className="lg:col-span-2">
            {companyReviews ? (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-8 shadow-2xl shadow-black/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-[var(--border-main)]/50">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center">
                      {companyReviews.logo_url ? (
                        <img src={companyReviews.logo_url} alt={selectedCompany} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <Building2 className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-[var(--text-main)] leading-none mb-2">{selectedCompany}</h3>
                      <p className="text-sm font-bold text-amber-500 uppercase tracking-wider">Kompaniya haqida fikrlar</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2 mb-1">
                      <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                      <span className="text-4xl font-black text-[var(--text-main)] tracking-tighter">{companyReviews.average_rating}</span>
                    </div>
                    <p className="text-sm font-bold text-[var(--text-muted)] tracking-tight">
                      {companyReviews.total_reviews} ta izoh asosida
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {companyReviews.reviews.length > 0 ? (
                    companyReviews.reviews.map((review) => (
                      <div key={review.id} className="p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-main)] hover:border-amber-500/30 transition-all group">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                              <span className="font-black text-xl">{review.user_name[0]}</span>
                            </div>
                            <div>
                              <p className="font-black text-lg text-[var(--text-main)] leading-tight">{review.user_name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 bg-[var(--bg-main)] text-[10px] font-black text-[var(--text-muted)] rounded-md uppercase border border-[var(--border-main)]">
                                  {review.work_type || 'Full-time'}
                                </span>
                                <span className="text-xs text-[var(--text-muted)] font-bold italic opacity-60">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex bg-[var(--bg-main)] p-2 rounded-xl border border-[var(--border-main)]">
                            {renderStars(review.rating)}
                          </div>
                        </div>

                        {review.title && (
                          <h4 className="text-xl font-black text-[var(--text-main)] mb-4 tracking-tight">"{review.title}"</h4>
                        )}

                        <div className="space-y-4">
                          {review.pros && (
                            <div className="relative pl-6">
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500/30 rounded-full"></div>
                              <div className="flex items-center gap-2 mb-1">
                                <ThumbsUp className="w-4 h-4 text-green-500" />
                                <p className="text-xs font-black text-green-500 uppercase">Ijobiy tomonlari</p>
                              </div>
                              <p className="text-sm text-[var(--text-main)] font-medium leading-relaxed italic opacity-90">{review.pros}</p>
                            </div>
                          )}

                          {review.cons && (
                            <div className="relative pl-6">
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/30 rounded-full"></div>
                              <div className="flex items-center gap-2 mb-1">
                                <ThumbsDown className="w-4 h-4 text-red-500" />
                                <p className="text-xs font-black text-red-500 uppercase">Salbiy tomonlari</p>
                              </div>
                              <p className="text-sm text-[var(--text-main)] font-medium leading-relaxed italic opacity-90">{review.cons}</p>
                            </div>
                          )}

                          {review.advice && (
                            <div className="relative pl-6">
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500/30 rounded-full"></div>
                              <div className="flex items-center gap-2 mb-1">
                                <Lightbulb className="w-4 h-4 text-blue-500" />
                                <p className="text-xs font-black text-blue-500 uppercase">Maslahat</p>
                              </div>
                              <p className="text-sm text-[var(--text-main)] font-medium leading-relaxed italic opacity-90">{review.advice}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 bg-[var(--bg-main)] rounded-[3rem] border border-dashed border-[var(--border-main)]">
                      <MessageCircle className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4 opacity-10" />
                      <p className="text-[var(--text-muted)] font-black text-xl italic">Bu korxonaga hali izoh yozilmagan</p>
                      <button 
                        onClick={() => {
                          setReviewForm(prev => ({ ...prev, company_name: selectedCompany }));
                          setActiveTab('add');
                        }}
                        className="mt-6 px-8 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:scale-105 transition-transform"
                      >
                        Birinchi bo'lib izoh yozish
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[3rem] p-20 text-center shadow-xl shadow-black/5 animate-in zoom-in-95 duration-500">
                <div className="w-32 h-32 bg-[var(--bg-main)] rounded-[2.5rem] border border-[var(--border-main)] flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <Building2 className="w-16 h-16 text-[var(--text-muted)] opacity-20" />
                </div>
                <h3 className="text-3xl font-black text-[var(--text-main)] mb-4 tracking-tight italic">
                  Kompaniyani tanlang
                </h3>
                <p className="text-[var(--text-muted)] font-bold max-w-sm mx-auto leading-relaxed">
                  Chap tomondagi ro'yxatdan korxonani tanlab, uning haqidagi barcha izohlar va maoshlar bilan tanishishingiz mumkin.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Salary Tab */}
      {activeTab === 'salary' && (
        <div className="space-y-8">
          {/* Top Salaries */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-8">
            <h3 className="text-xl font-black text-[var(--text-main)] mb-6 flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Top Salaries by Job Title
            </h3>
            
            {topSalaries.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topSalaries.map((item, index) => (
                  <div key={index} className="p-4 bg-[var(--bg-main)] rounded-xl border border-[var(--border-main)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[var(--text-main)]">{item.job_title}</span>
                      <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">
                        #{index + 1}
                      </span>
                    </div>
                    <p className="text-2xl font-black text-green-500">
                      ${item.average_salary?.toLocaleString()}
                    </p>
                    <p className="text-sm text-[var(--text-muted)]">
                      {item.data_points} data points
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-[var(--text-muted)] py-8">
                No salary data available yet
              </p>
            )}
          </div>
        </div>
      )}

      {/* Add Review Tab */}
      {activeTab === 'add' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Add Review Form */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[3rem] p-8 shadow-2xl shadow-black/5">
            <h3 className="text-2xl font-black text-[var(--text-main)] mb-6 flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-amber-500" />
              Izoh qoldirish
            </h3>
            
            <form onSubmit={submitReview} className="space-y-6">
              <div>
                <label className="block text-sm font-black text-[var(--text-muted)] mb-2 uppercase">
                  Kompaniya nomi *
                </label>
                <input
                  type="text"
                  value={reviewForm.company_name}
                  onChange={(e) => setReviewForm({ ...reviewForm, company_name: e.target.value })}
                  placeholder="Kompaniya nomini kiriting"
                  className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-bold focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-black text-[var(--text-muted)] mb-2 uppercase">
                  Reyting *
                </label>
                <div className="flex gap-2 bg-[var(--bg-main)] p-3 rounded-2xl border border-[var(--border-main)] w-fit">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-8 h-8 ${star <= reviewForm.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-[var(--text-muted)] mb-2 uppercase">
                  Sarlavha
                </label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  placeholder="Qisqacha sarlavha"
                  className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-black text-[var(--text-muted)] mb-2 uppercase">
                    Ijobiy tomonlari
                  </label>
                  <textarea
                    value={reviewForm.pros}
                    onChange={(e) => setReviewForm({ ...reviewForm, pros: e.target.value })}
                    placeholder="Sizga nima yoqdi?"
                    rows={3}
                    className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-bold focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-[var(--text-muted)] mb-2 uppercase">
                    Salbiy tomonlari
                  </label>
                  <textarea
                    value={reviewForm.cons}
                    onChange={(e) => setReviewForm({ ...reviewForm, cons: e.target.value })}
                    placeholder="Nima yoqmadi?"
                    rows={3}
                    className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-bold focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-black text-[var(--text-muted)] mb-2 uppercase">
                    Ish turi
                  </label>
                  <select
                    value={reviewForm.work_type}
                    onChange={(e) => setReviewForm({ ...reviewForm, work_type: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-bold focus:outline-none focus:border-amber-500"
                  >
                    {workTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={reviewForm.is_anonymous}
                      onChange={(e) => setReviewForm({ ...reviewForm, is_anonymous: e.target.checked })}
                      className="w-6 h-6 rounded-lg border-[var(--border-main)] text-amber-500 focus:ring-amber-500 bg-[var(--bg-main)]"
                    />
                    <span className="text-[var(--text-main)] font-black group-hover:text-amber-500 transition-colors">Anonim qoldirish</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black rounded-[2rem] transition-all flex items-center justify-center gap-3 shadow-xl shadow-amber-500/30"
              >
                {submitting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <MessageCircle className="w-6 h-6" />
                )}
                Izohni yuborish
              </button>
            </form>
          </div>

          {/* Add Salary Form */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[3rem] p-8 shadow-2xl shadow-black/5">
            <h3 className="text-2xl font-black text-[var(--text-main)] mb-6 flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-green-500" />
              Maosh haqida ma'lumot
            </h3>
            
            <form onSubmit={submitSalary} className="space-y-6">
              <div>
                <label className="block text-sm font-black text-[var(--text-muted)] mb-2 uppercase">
                  Kompaniya nomi *
                </label>
                <input
                  type="text"
                  value={salaryForm.company}
                  onChange={(e) => setSalaryForm({ ...salaryForm, company: e.target.value })}
                  placeholder="Kompaniya nomi"
                  className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-bold focus:outline-none focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-black text-[var(--text-muted)] mb-2 uppercase">
                  Lavozim *
                </label>
                <input
                  type="text"
                  value={salaryForm.job_title}
                  onChange={(e) => setSalaryForm({ ...salaryForm, job_title: e.target.value })}
                  placeholder="Masalan: Python Developer"
                  className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-bold focus:outline-none focus:border-green-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-black text-[var(--text-muted)] mb-2 uppercase">
                    Min Maosh ($) *
                  </label>
                  <input
                    type="number"
                    value={salaryForm.salary_min}
                    onChange={(e) => setSalaryForm({ ...salaryForm, salary_min: e.target.value })}
                    placeholder="1000"
                    className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-bold focus:outline-none focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-[var(--text-muted)] mb-2 uppercase">
                    Max Maosh ($) *
                  </label>
                  <input
                    type="number"
                    value={salaryForm.salary_max}
                    onChange={(e) => setSalaryForm({ ...salaryForm, salary_max: e.target.value })}
                    placeholder="2000"
                    className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-bold focus:outline-none focus:border-green-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-black text-[var(--text-muted)] mb-2 uppercase">
                    Ish turi
                  </label>
                  <select
                    value={salaryForm.employment_type}
                    onChange={(e) => setSalaryForm({ ...salaryForm, employment_type: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-bold focus:outline-none focus:border-green-500"
                  >
                    {workTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-black text-[var(--text-muted)] mb-2 uppercase">
                    Tajriba darajasi
                  </label>
                  <select
                    value={salaryForm.experience_level}
                    onChange={(e) => setSalaryForm({ ...salaryForm, experience_level: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-bold focus:outline-none focus:border-green-500"
                  >
                    {experienceLevels.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-black rounded-[2rem] transition-all flex items-center justify-center gap-3 shadow-xl shadow-green-500/30"
              >
                {submitting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <DollarSign className="w-6 h-6" />
                )}
                Ma'lumotni saqlash
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyReviews;