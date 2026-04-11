import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  Bell,
  Plus,
  Trash2,
  Search,
  Loader2,
  CheckCircle,
  Mail,
  Smartphone,
  MapPin,
  Briefcase,
  DollarSign,
  Filter
} from 'lucide-react';
import { jobAlertsAPI } from '../lib/api';

const JobAlerts = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [preferences, setPreferences] = useState({
    enabled: true,
    skills: [],
    locations: [],
    job_types: [],
    min_salary: null,
    notify_email: true,
    notify_push: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newJob, setNewJob] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newJobType, setNewJobType] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await jobAlertsAPI.getPreferences();
      if (response.data) {
        setPreferences(response.data);
      }
    } catch (error) {
      console.error('Load preferences error:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await jobAlertsAPI.updatePreferences(preferences);
      toast.success(t('job_alerts_saved') || 'Job alert settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (newJob.trim() && !preferences.skills.includes(newJob.trim())) {
      setPreferences({
        ...preferences,
        skills: [...preferences.skills, newJob.trim()]
      });
      setNewJob('');
    }
  };

  const removeSkill = (skill) => {
    setPreferences({
      ...preferences,
      skills: preferences.skills.filter(s => s !== skill)
    });
  };

  const addLocation = () => {
    if (newLocation.trim() && !preferences.locations.includes(newLocation.trim())) {
      setPreferences({
        ...preferences,
        locations: [...preferences.locations, newLocation.trim()]
      });
      setNewLocation('');
    }
  };

  const removeLocation = (location) => {
    setPreferences({
      ...preferences,
      locations: preferences.locations.filter(l => l !== location)
    });
  };

  const addJobType = () => {
    if (newJobType && !preferences.job_types.includes(newJobType)) {
      setPreferences({
        ...preferences,
        job_types: [...preferences.job_types, newJobType]
      });
      setNewJobType('');
    }
  };

  const removeJobType = (type) => {
    setPreferences({
      ...preferences,
      job_types: preferences.job_types.filter(t => t !== type)
    });
  };

  const checkNewJobs = async () => {
    setChecking(true);
    try {
      const response = await jobAlertsAPI.checkNewJobs();
      setCheckResult(response.data);
    } catch (error) {
      console.error('Check jobs error:', error);
    } finally {
      setChecking(false);
    }
  };

  const jobTypes = ['fullTime', 'partTime', 'contract', 'internship', 'freelance'];

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center">
            <Bell className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[var(--text-main)]">
              {t('job_alerts') || 'Job Alerts'}
            </h1>
            <p className="text-[var(--text-muted)] font-medium">
              {t('job_alerts_subtitle') || 'Get notified when new jobs match your preferences'}
            </p>
          </div>
        </div>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              preferences.enabled ? 'bg-green-500/20' : 'bg-gray-500/20'
            }`}>
              <Bell className={`w-6 h-6 ${preferences.enabled ? 'text-green-500' : 'text-gray-500'}`} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[var(--text-main)]">
                {t('enable_job_alerts') || 'Enable Job Alerts'}
              </h3>
              <p className="text-[var(--text-muted)] font-medium">
                {preferences.enabled 
                  ? t('alerts_are_active') || 'You will receive notifications for matching jobs'
                  : t('alerts_are_inactive') || 'No notifications will be sent'
                }
              </p>
            </div>
          </div>
          <button
            onClick={() => setPreferences({ ...preferences, enabled: !preferences.enabled })}
            className={`w-16 h-8 rounded-full transition-all ${
              preferences.enabled ? 'bg-green-500' : 'bg-gray-600'
            }`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform ${
              preferences.enabled ? 'translate-x-8' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-8">
        <h3 className="text-xl font-black text-[var(--text-main)] mb-6 flex items-center gap-3">
          <Mail className="w-5 h-5 text-indigo-500" />
          {t('notification_methods') || 'Notification Methods'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
              preferences.notify_email 
                ? 'border-indigo-500 bg-indigo-500/10' 
                : 'border-[var(--border-main)] bg-[var(--bg-main)]'
            }`}
            onClick={() => setPreferences({ ...preferences, notify_email: !preferences.notify_email })}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-black text-[var(--text-main)]">{t('email') || 'Email'}</h4>
                  <p className="text-sm text-[var(--text-muted)]">
                    {t('receive_via_email') || 'Receive notifications via email'}
                  </p>
                </div>
              </div>
              <CheckCircle className={`w-6 h-6 ${preferences.notify_email ? 'text-indigo-500' : 'text-gray-400'}`} />
            </div>
          </div>

          <div 
            className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
              preferences.notify_push 
                ? 'border-indigo-500 bg-indigo-500/10' 
                : 'border-[var(--border-main)] bg-[var(--bg-main)]'
            }`}
            onClick={() => setPreferences({ ...preferences, notify_push: !preferences.notify_push })}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h4 className="font-black text-[var(--text-main)]">{t('push') || 'Push'}</h4>
                  <p className="text-sm text-[var(--text-muted)]">
                    {t('receive_push_notifications') || 'Receive push notifications'}
                  </p>
                </div>
              </div>
              <CheckCircle className={`w-6 h-6 ${preferences.notify_push ? 'text-indigo-500' : 'text-gray-400'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Skills/Job Keywords */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-8">
        <h3 className="text-xl font-black text-[var(--text-main)] mb-6 flex items-center gap-3">
          <Briefcase className="w-5 h-5 text-indigo-500" />
          {t('job_keywords') || 'Job Keywords'}
          <span className="text-sm font-medium text-[var(--text-muted)]">
            ({preferences.skills.length})
          </span>
        </h3>
        
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={newJob}
            onChange={(e) => setNewJob(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addSkill()}
            placeholder={t('add_job_keyword') || 'Add job keyword (e.g. Python, React, Designer)'}
            className="flex-1 px-5 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-medium focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={addSkill}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('add') || 'Add'}
          </button>
        </div>

        {preferences.skills.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {preferences.skills.map((skill, index) => (
              <div
                key={index}
                className="px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 rounded-full flex items-center gap-2"
              >
                <span className="text-indigo-400 font-bold">{skill}</span>
                <button
                  onClick={() => removeSkill(skill)}
                  className="text-indigo-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--text-muted)] text-center py-4">
            {t('no_keywords_added') || 'No keywords added yet. Add job titles or skills you are interested in.'}
          </p>
        )}
      </div>

      {/* Locations */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-8">
        <h3 className="text-xl font-black text-[var(--text-main)] mb-6 flex items-center gap-3">
          <MapPin className="w-5 h-5 text-indigo-500" />
          {t('preferred_locations') || 'Preferred Locations'}
          <span className="text-sm font-medium text-[var(--text-muted)]">
            ({preferences.locations.length})
          </span>
        </h3>
        
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addLocation()}
            placeholder={t('add_location') || 'Add location (e.g. Tashkent, Remote)'}
            className="flex-1 px-5 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-medium focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={addLocation}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('add') || 'Add'}
          </button>
        </div>

        {preferences.locations.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {preferences.locations.map((location, index) => (
              <div
                key={index}
                className="px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-full flex items-center gap-2"
              >
                <MapPin className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-bold">{location}</span>
                <button
                  onClick={() => removeLocation(location)}
                  className="text-green-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--text-muted)] text-center py-4">
            {t('no_locations_added') || 'No locations added yet. Add locations where you want to work.'}
          </p>
        )}
      </div>

      {/* Job Types */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-8">
        <h3 className="text-xl font-black text-[var(--text-main)] mb-6 flex items-center gap-3">
          <Filter className="w-5 h-5 text-indigo-500" />
          {t('job_types') || 'Job Types'}
        </h3>
        
        <div className="flex gap-3 mb-4">
          <select
            value={newJobType}
            onChange={(e) => setNewJobType(e.target.value)}
            className="flex-1 px-5 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="">{t('select_job_type') || 'Select job type'}</option>
            {jobTypes.map(type => (
              <option key={type} value={type}>
                {type === 'fullTime' && t('full_time') || type === 'partTime' && t('part_time') || 
                 type === 'contract' && t('contract') || type === 'internship' && t('internship') || 
                 type === 'freelance' && t('freelance') || type}
              </option>
            ))}
          </select>
          <button
            onClick={addJobType}
            disabled={!newJobType}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('add') || 'Add'}
          </button>
        </div>

        {preferences.job_types.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {preferences.job_types.map((type, index) => (
              <div
                key={index}
                className="px-4 py-2 bg-orange-600/20 border border-orange-500/30 rounded-full flex items-center gap-2"
              >
                <span className="text-orange-400 font-bold">{type}</span>
                <button
                  onClick={() => removeJobType(type)}
                  className="text-orange-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--text-muted)] text-center py-4">
            {t('no_job_types_added') || 'No job types selected'}
          </p>
        )}
      </div>

      {/* Minimum Salary */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-8">
        <h3 className="text-xl font-black text-[var(--text-main)] mb-6 flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-indigo-500" />
          {t('minimum_salary') || 'Minimum Salary'}
        </h3>
        
        <div className="flex items-center gap-4">
          <input
            type="number"
            value={preferences.min_salary || ''}
            onChange={(e) => setPreferences({ ...preferences, min_salary: e.target.value ? parseInt(e.target.value) : null })}
            placeholder={t('enter_min_salary') || 'Enter minimum salary (optional)'}
            className="flex-1 px-5 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-medium focus:outline-none focus:border-indigo-500"
          />
          <span className="text-[var(--text-muted)] font-medium">
            {t('per_month') || 'per month'}
          </span>
        </div>
      </div>

      {/* Check for New Jobs */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-[var(--text-main)]">
            {t('check_matching_jobs') || 'Check for Matching Jobs'}
          </h3>
          <button
            onClick={checkNewJobs}
            disabled={checking || !preferences.enabled}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            {checking ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            {t('check_now') || 'Check Now'}
          </button>
        </div>

        {checkResult && (
          <div className="mt-4 p-6 bg-[var(--bg-main)] rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className={`w-6 h-6 ${checkResult.has_new ? 'text-green-500' : 'text-gray-400'}`} />
              <span className="text-lg font-bold text-[var(--text-main)]">
                {checkResult.has_new 
                  ? `${checkResult.count} ${t('new_jobs_found') || 'new jobs found'}`
                  : t('no_new_jobs') || 'No new jobs matching your preferences'
                }
              </span>
            </div>
            
            {checkResult.jobs && checkResult.jobs.length > 0 && (
              <div className="space-y-3 mt-4">
                {checkResult.jobs.map(job => (
                  <div key={job.id} className="p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-main)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-[var(--text-main)]">{job.title}</h4>
                        <p className="text-sm text-[var(--text-muted)]">{job.company} • {job.location}</p>
                      </div>
                      <span className="text-green-400 font-bold">{job.salary}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-colors flex items-center gap-3"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          {t('save_settings') || 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default JobAlerts;