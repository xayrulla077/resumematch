import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Award,
  Bell,
  Video,
  Check,
  ChevronRight,
  ChevronDown,
  Loader2,
  Upload,
  Camera,
  Edit3,
  Target,
  Sparkles
} from 'lucide-react';
import { authAPI, resumesAPI, jobsAPI, savedJobsAPI } from '../lib/api';

const ProfileCompletion = () => {
  const { t } = useLanguage();
  const { user, setUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [completion, setCompletion] = useState(null);
  const [wizardSteps, setWizardSteps] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  
  // Form states
  const [editingBasic, setEditingBasic] = useState(false);
  const [basicForm, setBasicForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    location: user?.location || '',
  });
  const [editingBio, setEditingBio] = useState(false);
  const [bioForm, setBioForm] = useState({
    bio: user?.bio || '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const [completionRes, wizardRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/user/profile-completion`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/user/profile-wizard-steps`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      
      const completionData = await completionRes.json();
      const wizardData = await wizardRes.json();
      
      setCompletion(completionData);
      setWizardSteps(wizardData);
      
      // Find first incomplete step
      const firstIncomplete = wizardData.steps.findIndex(s => !s.completed);
      setActiveStep(firstIncomplete >= 0 ? firstIncomplete : 0);
    } catch (error) {
      console.error('Load profile data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveBasicInfo = async () => {
    setSaving(true);
    try {
      await authAPI.googleLogin({ ...user, ...basicForm });
      setUser({ ...user, ...basicForm });
      setEditingBasic(false);
      toast.success('Basic info saved!');
      loadProfileData();
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const saveBio = async () => {
    setSaving(true);
    try {
      setUser({ ...user, bio: bioForm.bio });
      setEditingBio(false);
      toast.success('Bio saved!');
      loadProfileData();
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const getStepIcon = (step) => {
    switch (step.id) {
      case 'basic': return <User className="w-5 h-5" />;
      case 'about': return <Edit3 className="w-5 h-5" />;
      case 'photo': return <Camera className="w-5 h-5" />;
      case 'resume': return <FileText className="w-5 h-5" />;
      case 'skills': return <Award className="w-5 h-5" />;
      case 'alerts': return <Bell className="w-5 h-5" />;
      default: return <Target className="w-5 h-5" />;
    }
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
      {/* Header with Progress */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center">
              <Target className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[var(--text-main)]">Profile Completion</h1>
              <p className="text-[var(--text-muted)]">Complete your profile to get better job matches</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black text-indigo-500">{completion?.total_percentage || 0}%</div>
            <div className="text-sm text-[var(--text-muted)]">Complete</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-4 bg-[var(--bg-main)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${completion?.total_percentage || 0}%` }}
          />
        </div>
        
        {/* Next Step */}
        {completion?.next_step && (
          <div className="mt-6 p-4 bg-indigo-500/10 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <span className="text-indigo-400 font-medium">Next: Complete your {completion.next_step.label}</span>
            </div>
            <button 
              onClick={() => {
                const stepIndex = wizardSteps?.steps.findIndex(s => s.id === completion.next_step.field);
                if (stepIndex >= 0) setActiveStep(stepIndex);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
            >
              Continue
            </button>
          </div>
        )}
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {completion?.breakdown && Object.entries(completion.breakdown).map(([key, value]) => (
          <div key={key} className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-[var(--text-main)]">{value}%</div>
            <div className="text-xs text-[var(--text-muted)] capitalize">{key.replace('_', ' ')}</div>
          </div>
        ))}
      </div>

      {/* Wizard Steps */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-8">
        <h2 className="text-xl font-black text-[var(--text-main)] mb-6">Complete Your Profile</h2>
        
        <div className="space-y-4">
          {wizardSteps?.steps.map((step, index) => (
            <div 
              key={step.id}
              className={`border rounded-2xl overflow-hidden transition-all ${
                activeStep === index 
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
                  : 'border-[var(--border-main)]'
              }`}
            >
              <button
                onClick={() => setActiveStep(index)}
                className="w-full p-6 flex items-center justify-between hover:bg-[var(--bg-main)] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    step.completed 
                      ? 'bg-green-500/20 text-green-500' 
                      : activeStep === index 
                        ? 'bg-indigo-500/20 text-indigo-500'
                        : 'bg-[var(--bg-main)] text-[var(--text-muted)]'
                  }`}>
                    {step.completed ? <Check className="w-6 h-6" /> : getStepIcon(step)}
                  </div>
                  <div className="text-left">
                    <h3 className="font-black text-[var(--text-main)]">{step.title}</h3>
                    <p className="text-sm text-[var(--text-muted)]">{step.description}</p>
                  </div>
                </div>
                {activeStep === index ? (
                  <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />
                )}
              </button>
              
              {/* Step Content */}
              {activeStep === index && !step.completed && (
                <div className="px-6 pb-6 border-t border-[var(--border-main)] pt-4">
                  {step.id === 'basic' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">Full Name *</label>
                          <input
                            type="text"
                            value={basicForm.full_name}
                            onChange={(e) => setBasicForm({ ...basicForm, full_name: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-medium focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">Phone *</label>
                          <input
                            type="tel"
                            value={basicForm.phone}
                            onChange={(e) => setBasicForm({ ...basicForm, phone: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-medium focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">Location</label>
                        <input
                          type="text"
                          value={basicForm.location}
                          onChange={(e) => setBasicForm({ ...basicForm, location: e.target.value })}
                          placeholder="City, Country"
                          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-medium focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <button
                        onClick={saveBasicInfo}
                        disabled={saving || !basicForm.full_name || !basicForm.phone}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl"
                      >
                        {saving ? 'Saving...' : 'Save & Continue'}
                      </button>
                    </div>
                  )}
                  
                  {step.id === 'about' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">About You</label>
                        <textarea
                          value={bioForm.bio}
                          onChange={(e) => setBioForm({ ...bioForm, bio: e.target.value })}
                          placeholder="Tell employers about yourself, your experience, and what you're looking for..."
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-medium focus:outline-none focus:border-indigo-500 resize-none"
                        />
                      </div>
                      <button
                        onClick={saveBio}
                        disabled={saving}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl"
                      >
                        {saving ? 'Saving...' : 'Save & Continue'}
                      </button>
                    </div>
                  )}
                  
                  {step.id === 'photo' && (
                    <div className="text-center py-4">
                      <div className="w-24 h-24 bg-[var(--bg-main)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Camera className="w-10 h-10 text-[var(--text-muted)]" />
                      </div>
                      <p className="text-[var(--text-muted)] mb-4">Upload a professional photo</p>
                      <button
                        onClick={() => window.location.href = '/profile'}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                      >
                        Go to Profile
                      </button>
                    </div>
                  )}
                  
                  {step.id === 'resume' && (
                    <div className="text-center py-4">
                      <div className="w-24 h-24 bg-[var(--bg-main)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-10 h-10 text-[var(--text-muted)]" />
                      </div>
                      <p className="text-[var(--text-muted)] mb-4">Upload your resume</p>
                      <button
                        onClick={() => window.location.href = '/resumes'}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                      >
                        Go to Resumes
                      </button>
                    </div>
                  )}
                  
                  {step.id === 'skills' && (
                    <div className="text-center py-4">
                      <div className="w-24 h-24 bg-[var(--bg-main)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Award className="w-10 h-10 text-[var(--text-muted)]" />
                      </div>
                      <p className="text-[var(--text-muted)] mb-4">Add your skills</p>
                      <button
                        onClick={() => window.location.href = '/skills-verification'}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                      >
                        Go to Skills
                      </button>
                    </div>
                  )}
                  
                  {step.id === 'alerts' && (
                    <div className="text-center py-4">
                      <div className="w-24 h-24 bg-[var(--bg-main)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-10 h-10 text-[var(--text-muted)]" />
                      </div>
                      <p className="text-[var(--text-muted)] mb-4">Set up job alerts</p>
                      <button
                        onClick={() => window.location.href = '/job-alerts'}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                      >
                        Go to Job Alerts
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletion;