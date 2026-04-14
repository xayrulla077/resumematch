import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  Bookmark,
  BookmarkPlus,
  Trash2,
  Loader2,
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Star,
  Bell,
  UserPlus,
  TrendingUp,
  Check,
  X
} from 'lucide-react';
import { savedJobsAPI, jobsAPI } from '../lib/api';

const SavedJobs = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('saved'); // 'saved', 'recommendations', 'following'
  const [savedJobs, setSavedJobs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [followedCompanies, setFollowedCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [savedRes, recRes, followRes] = await Promise.all([
        savedJobsAPI.getSavedJobs(),
        savedJobsAPI.getRecommendations(10),
        savedJobsAPI.getFollowedCompanies()
      ]);
      
      setSavedJobs(savedRes.data || []);
      setRecommendations(recRes.data?.recommendations || []);
      setFollowedCompanies(followRes.data || []);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveJob = async (jobId) => {
    try {
      await savedJobsAPI.saveJob(jobId, '');
      toast.success('Job saved!');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save');
    }
  };

  const handleUnsaveJob = async (jobId) => {
    try {
      await savedJobsAPI.unsaveJob(jobId);
      toast.success('Job removed from saved');
      loadData();
    } catch (error) {
      toast.error('Failed to remove');
    }
  };

  const handleFollowCompany = async (companyName) => {
    try {
      await savedJobsAPI.followCompany(companyName);
      toast.success(`Now following ${companyName}`);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to follow');
    }
  };

  const handleUnfollowCompany = async (companyName) => {
    try {
      await savedJobsAPI.unfollowCompany(companyName);
      toast.success(`Unfollowed ${companyName}`);
      loadData();
    } catch (error) {
      toast.error('Failed to unfollow');
    }
  };

  const isCompanyFollowed = (companyName) => {
    return followedCompanies.some(c => c.company_name === companyName);
  };

  const isJobSaved = (jobId) => {
    return savedJobs.some(s => s.job?.id === jobId);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center">
          <Bookmark className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)]">
            Saved Jobs & Recommendations
          </h1>
          <p className="text-[var(--text-muted)] font-medium">
            Your saved jobs, AI recommendations, and followed companies
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setActiveTab('saved')}
          className={`px-6 py-3 rounded-2xl font-bold transition-all ${
            activeTab === 'saved' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-main)]'
          }`}
        >
          <Bookmark className="w-5 h-5 inline-block mr-2" />
          Saved ({savedJobs.length})
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-6 py-3 rounded-2xl font-bold transition-all ${
            activeTab === 'recommendations' 
              ? 'bg-amber-500 text-white' 
              : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-main)]'
          }`}
        >
          <TrendingUp className="w-5 h-5 inline-block mr-2" />
          AI Recommendations ({recommendations.length})
        </button>
        <button
          onClick={() => setActiveTab('following')}
          className={`px-6 py-3 rounded-2xl font-bold transition-all ${
            activeTab === 'following' 
              ? 'bg-pink-500 text-white' 
              : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-main)]'
          }`}
        >
          <Building2 className="w-5 h-5 inline-block mr-2" />
          Following ({followedCompanies.length})
        </button>
      </div>

      {/* Saved Jobs Tab */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          {savedJobs.length > 0 ? (
            savedJobs.map((item) => (
              <div 
                key={item.id}
                className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-6 hover:border-indigo-500/30 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-[var(--text-main)]">{item.job?.title}</h3>
                    <div className="flex items-center gap-3 mt-2 text-[var(--text-muted)]">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {item.job?.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {item.job?.location}
                      </span>
                      {item.job?.salary && (
                        <span className="flex items-center gap-1 text-green-500">
                          <DollarSign className="w-4 h-4" />
                          {item.job?.salary}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-sm text-[var(--text-muted)]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {item.job?.posted_at ? formatDate(item.job.posted_at) : ''}
                      </span>
                      {item.notes && (
                        <span className="text-indigo-400">Note: {item.notes}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUnsaveJob(item.job?.id)}
                      className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-12 text-center">
              <Bookmark className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
              <h3 className="text-xl font-black text-[var(--text-main)] mb-2">No Saved Jobs</h3>
              <p className="text-[var(--text-muted)]">Save jobs you like to view them later</p>
            </div>
          )}
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          {recommendations.length > 0 ? (
            recommendations.map((rec, index) => (
              <div 
                key={rec.job?.id}
                className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-6 hover:border-amber-500/30 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 text-amber-500 rounded-full text-sm font-bold">
                        <Star className="w-4 h-4" />
                        {rec.match_score}% Match
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-[var(--text-main)]">{rec.job?.title}</h3>
                    <div className="flex items-center gap-3 mt-2 text-[var(--text-muted)]">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {rec.job?.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {rec.job?.location}
                      </span>
                      {rec.job?.salary && (
                        <span className="flex items-center gap-1 text-green-500">
                          <DollarSign className="w-4 h-4" />
                          {rec.job?.salary}
                        </span>
                      )}
                    </div>
                    {rec.job?.required_skills && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {(Array.isArray(rec.job?.required_skills) ? rec.job?.required_skills : (rec.job?.required_skills || "").split(',')).slice(0, 5).map((skill, i) => (
                          <span key={i} className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-bold">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {!isJobSaved(rec.job?.id) ? (
                      <button
                        onClick={() => handleSaveJob(rec.job?.id)}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2"
                      >
                        <BookmarkPlus className="w-4 h-4" />
                        Save
                      </button>
                    ) : (
                      <span className="px-4 py-2 bg-green-500/20 text-green-500 font-bold rounded-xl flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Saved
                      </span>
                    )}
                    <button
                      onClick={() => handleFollowCompany(rec.job?.company)}
                      disabled={isCompanyFollowed(rec.job?.company)}
                      className="px-4 py-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 font-bold rounded-xl flex items-center gap-2 disabled:opacity-50"
                    >
                      <UserPlus className="w-4 h-4" />
                      Follow
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-12 text-center">
              <TrendingUp className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
              <h3 className="text-xl font-black text-[var(--text-main)] mb-2">No Recommendations</h3>
              <p className="text-[var(--text-muted)]">Add skills to get personalized job recommendations</p>
              <button
                onClick={() => window.location.href = '/skills-verification'}
                className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
              >
                Add Skills
              </button>
            </div>
          )}
        </div>
      )}

      {/* Following Tab */}
      {activeTab === 'following' && (
        <div className="space-y-4">
          {followedCompanies.length > 0 ? (
            followedCompanies.map((company, index) => (
              <div 
                key={index}
                className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-6 hover:border-pink-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-pink-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-[var(--text-main)]">{company.company_name}</h3>
                      <p className="text-sm text-[var(--text-muted)]">
                        Following since {formatDate(company.followed_at)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnfollowCompany(company.company_name)}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Unfollow
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-12 text-center">
              <Building2 className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
              <h3 className="text-xl font-black text-[var(--text-main)] mb-2">No Companies Following</h3>
              <p className="text-[var(--text-muted)]">Follow companies to get updates about their jobs</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SavedJobs;