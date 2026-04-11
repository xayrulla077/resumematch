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
    <div className="p-6 lg:p-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[var(--text-main)]">
              {t('company_reviews') || 'Company Reviews'}
            </h1>
            <p className="text-[var(--text-muted)] font-medium">
              {t('reviews_subtitle') || 'Read and write company reviews'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)] font-medium">Total Reviews</p>
                <p className="text-2xl font-black text-[var(--text-main)]">{stats.total_reviews}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)] font-medium">Companies</p>
                <p className="text-2xl font-black text-[var(--text-main)]">{stats.total_companies}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)] font-medium">Average Rating</p>
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
          className={`px-6 py-3 rounded-2xl font-bold transition-all ${
            activeTab === 'reviews' 
              ? 'bg-amber-500 text-white' 
              : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-main)]'
          }`}
        >
          <Building2 className="w-5 h-5 inline-block mr-2" />
          Reviews
        </button>
        <button
          onClick={() => setActiveTab('salary')}
          className={`px-6 py-3 rounded-2xl font-bold transition-all ${
            activeTab === 'salary' 
              ? 'bg-green-500 text-white' 
              : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-main)]'
          }`}
        >
          <DollarSign className="w-5 h-5 inline-block mr-2" />
          Salaries
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`px-6 py-3 rounded-2xl font-bold transition-all ${
            activeTab === 'add' 
              ? 'bg-indigo-500 text-white' 
              : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-main)]'
          }`}
        >
          <Plus className="w-5 h-5 inline-block mr-2" />
          Add Review
        </button>
      </div>

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Company List */}
          <div className="lg:col-span-1 space-y-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search companies..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-main)] font-medium focus:outline-none focus:border-amber-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl"
              >
                Search
              </button>
            </form>

            <div className="space-y-3">
              {companies.map((company, index) => (
                <button
                  key={index}
                  onClick={() => loadCompanyReviews(company.company)}
                  className={`w-full p-4 rounded-2xl text-left transition-all ${
                    selectedCompany === company.company
                      ? 'bg-amber-500/20 border-2 border-amber-500'
                      : 'bg-[var(--bg-surface)] border border-[var(--border-main)] hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--text-main)]">{company.company}</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-bold text-[var(--text-main)]">{company.average_rating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    {company.total_reviews} reviews
                  </p>
                </button>
              ))}
              
              {companies.length === 0 && (
                <p className="text-center text-[var(--text-muted)] py-8">
                  No companies found
                </p>
              )}
            </div>
          </div>

          {/* Company Reviews */}
          <div className="lg:col-span-2">
            {companyReviews ? (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-black text-[var(--text-main)]">{selectedCompany}</h3>
                  <div className="flex items-center gap-2">
                    <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                    <span className="text-2xl font-black text-[var(--text-main)]">{companyReviews.average_rating}</span>
                    <span className="text-[var(--text-muted)]">({companyReviews.total_reviews})</span>
                  </div>
                </div>

                <div className="space-y-6">
                  {companyReviews.reviews.map((review) => (
                    <div key={review.id} className="p-6 bg-[var(--bg-main)] rounded-2xl border border-[var(--border-main)]">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                            <span className="text-amber-500 font-black">{review.user_name[0]}</span>
                          </div>
                          <div>
                            <p className="font-bold text-[var(--text-main)]">{review.user_name}</p>
                            <p className="text-sm text-[var(--text-muted)]">{review.work_type}</p>
                          </div>
                        </div>
                        <div className="flex">{renderStars(review.rating)}</div>
                      </div>

                      {review.title && (
                        <h4 className="font-bold text-[var(--text-main)] mb-3">{review.title}</h4>
                      )}

                      {review.pros && (
                        <div className="flex items-start gap-2 mb-2">
                          <ThumbsUp className="w-4 h-4 text-green-500 mt-1" />
                          <div>
                            <p className="text-sm font-bold text-green-500">Pros</p>
                            <p className="text-sm text-[var(--text-main)]">{review.pros}</p>
                          </div>
                        </div>
                      )}

                      {review.cons && (
                        <div className="flex items-start gap-2 mb-2">
                          <ThumbsDown className="w-4 h-4 text-red-500 mt-1" />
                          <div>
                            <p className="text-sm font-bold text-red-500">Cons</p>
                            <p className="text-sm text-[var(--text-main)]">{review.cons}</p>
                          </div>
                        </div>
                      )}

                      {review.advice && (
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-blue-500 mt-1" />
                          <div>
                            <p className="text-sm font-bold text-blue-500">Advice</p>
                            <p className="text-sm text-[var(--text-main)]">{review.advice}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-12 text-center">
                <Building2 className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                <p className="text-[var(--text-muted)]">Select a company to view reviews</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Review Form */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-8">
            <h3 className="text-xl font-black text-[var(--text-main)] mb-6 flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-amber-500" />
              Write a Review
            </h3>
            
            <form onSubmit={submitReview} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={reviewForm.company_name}
                  onChange={(e) => setReviewForm({ ...reviewForm, company_name: e.target.value })}
                  placeholder="Enter company name"
                  className="w-full px-5 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-medium focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">
                  Rating *
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="p-2"
                    >
                      <Star
                        className={`w-8 h-8 ${star <= reviewForm.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">
                  Review Title
                </label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  placeholder="Short summary"
                  className="w-full px-5 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">
                  Pros
                </label>
                <textarea
                  value={reviewForm.pros}
                  onChange={(e) => setReviewForm({ ...reviewForm, pros: e.target.value })}
                  placeholder="What did you like?"
                  rows={3}
                  className="w-full px-5 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-medium focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">
                  Cons
                </label>
                <textarea
                  value={reviewForm.cons}
                  onChange={(e) => setReviewForm({ ...reviewForm, cons: e.target.value })}
                  placeholder="What didn't you like?"
                  rows={3}
                  className="w-full px-5 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-medium focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">
                  Advice
                </label>
                <textarea
                  value={reviewForm.advice}
                  onChange={(e) => setReviewForm({ ...reviewForm, advice: e.target.value })}
                  placeholder="Advice for others"
                  rows={2}
                  className="w-full px-5 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-medium focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">
                    Work Type
                  </label>
                  <select
                    value={reviewForm.work_type}
                    onChange={(e) => setReviewForm({ ...reviewForm, work_type: e.target.value })}
                    className="w-full px-5 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-medium focus:outline-none focus:border-amber-500"
                  >
                    {workTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reviewForm.is_anonymous}
                      onChange={(e) => setReviewForm({ ...reviewForm, is_anonymous: e.target.checked })}
                      className="w-5 h-5 rounded border-[var(--border-main)] text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-[var(--text-main)] font-medium">Anonymous</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-3"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <MessageCircle className="w-5 h-5" />
                )}
                Submit Review
              </button>
            </form>
          </div>

          {/* Add Salary Form */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-8">
            <h3 className="text-xl font-black text-[var(--text-main)] mb-6 flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-green-500" />
              Add Salary Data
            </h3>
            
            <form onSubmit={submitSalary} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={salaryForm.company}
                  onChange={(e) => setSalaryForm({ ...salaryForm, company: e.target.value })}
                  placeholder="Enter company name"
                  className="w-full px-5 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-medium focus:outline-none focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={salaryForm.job_title}
                  onChange={(e) => setSalaryForm({ ...salaryForm, job_title: e.target.value })}
                  placeholder="e.g. Python Developer"
                  className="w-full px-5 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-medium focus:outline-none focus:border-green-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">
                    Min Salary ($) *
                  </label>
                  <input
                    type="number"
                    value={salaryForm.salary_min}
                    onChange={(e) => setSalaryForm({ ...salaryForm, salary_min: e.target.value })}
                    placeholder="1000"
                    className="w-full px-5 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-medium focus:outline-none focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">
                    Max Salary ($) *
                  </label>
                  <input
                    type="number"
                    value={salaryForm.salary_max}
                    onChange={(e) => setSalaryForm({ ...salaryForm, salary_max: e.target.value })}
                    placeholder="2000"
                    className="w-full px-5 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--var(--text-main)] font-medium focus:outline-none focus:border-green-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={salaryForm.location}
                  onChange={(e) => setSalaryForm({ ...salaryForm, location: e.target.value })}
                  placeholder="e.g. Tashkent, Remote"
                  className="w-full px-5 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-medium focus:outline-none focus:border-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">
                    Employment Type
                  </label>
                  <select
                    value={salaryForm.employment_type}
                    onChange={(e) => setSalaryForm({ ...salaryForm, employment_type: e.target.value })}
                    className="w-full px-5 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-medium focus:outline-none focus:border-green-500"
                  >
                    {workTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">
                    Experience Level
                  </label>
                  <select
                    value={salaryForm.experience_level}
                    onChange={(e) => setSalaryForm({ ...salaryForm, experience_level: e.target.value })}
                    className="w-full px-5 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-medium focus:outline-none focus:border-green-500"
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
                className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-3"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <DollarSign className="w-5 h-5" />
                )}
                Add Salary Data
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyReviews;