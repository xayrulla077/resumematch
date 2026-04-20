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
  Sparkles,
  Briefcase,
  GraduationCap,
  Languages,
  Plus,
  Trash2
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
  
  const [experienceForm, setExperienceForm] = useState({
    company: '',
    position: '',
    start_date: '',
    end_date: '',
    description: '',
    is_current: false
  });

  const [educationForm, setEducationForm] = useState({
    institution: '',
    degree: '',
    field_of_study: '',
    graduation_year: '',
  });

  const [languageForm, setLanguageForm] = useState({
    language: '',
    level: 'B2 - Intermediate',
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

  const handlePost = async (endpoint, data, successMsg) => {
    setSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        toast.success(successMsg);
        loadProfileData();
      } else {
        toast.error('Failed to save data');
      }
    } catch (error) {
      toast.error('Connection error');
    } finally {
      setSaving(false);
    }
  };

  const saveBasicInfo = async () => {
    setSaving(true);
    try {
      // Logic for saving basic info (you might need a PUT to /auth/me)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(basicForm)
      });
      if (res.ok) {
        setUser({ ...user, ...basicForm });
        toast.success('Basic info saved!');
        loadProfileData();
      }
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const getStepIcon = (stepId) => {
    switch (stepId) {
      case 'basic': return <User className="w-5 h-5" />;
      case 'experience': return <Briefcase className="w-5 h-5" />;
      case 'education': return <GraduationCap className="w-5 h-5" />;
      case 'skills': return <Award className="w-5 h-5" />;
      case 'languages': return <Languages className="w-5 h-5" />;
      case 'resume': return <FileText className="w-5 h-5" />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-in fade-in duration-500">
      {/* Header with Progress */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Target className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-[var(--text-main)] mb-1">Profile Completion</h1>
              <p className="text-[var(--text-muted)] font-medium">Complete your details to unlock full potential</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-black text-indigo-500">{completion?.total_percentage || 0}%</div>
            <div className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mt-1">Status</div>
          </div>
        </div>
        
        {/* Progress Bar Container */}
        <div className="relative pt-1">
          <div className="overflow-hidden h-4 text-xs flex rounded-full bg-[var(--bg-main)]">
            <div 
              style={{ width: `${completion?.total_percentage || 0}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out"
            />
          </div>
          <div className="absolute top-[-30px] right-0 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
             <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">Live Updates</span>
          </div>
        </div>
        
        {/* Next Action */}
        {completion?.next_step && (
          <div className="mt-8 p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-center justify-between group hover:bg-indigo-500/10 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-indigo-400 font-bold block">Next logic step</span>
                <span className="text-[var(--text-main)] font-black text-lg">Complete your {completion.next_step.label}</span>
              </div>
            </div>
            <button 
              onClick={() => {
                const stepIdx = wizardSteps?.steps.findIndex(s => s.id === completion.next_step.field);
                if (stepIdx >= 0) setActiveStep(stepIdx);
              }}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
            >
              Continue Now
            </button>
          </div>
        )}
      </div>

      {/* Wizard Steps Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Step Navigation */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-4 mb-4">Wizard Navigation</h3>
          {wizardSteps?.steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(index)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 border ${
                activeStep === index 
                  ? 'bg-indigo-500/10 border-indigo-500/50 shadow-sm' 
                  : 'bg-[var(--bg-surface)] border-[var(--border-main)] hover:border-indigo-500/30'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                step.completed ? 'bg-emerald-500/20 text-emerald-500' : 
                activeStep === index ? 'bg-indigo-600 text-white' : 'bg-[var(--bg-main)] text-[var(--text-muted)]'
              }`}>
                {step.completed ? <Check className="w-5 h-5" /> : getStepIcon(step.id)}
              </div>
              <div className="text-left flex-1">
                <p className={`font-black tracking-tight ${activeStep === index ? 'text-indigo-400' : 'text-[var(--text-main)]'}`}>{step.title}</p>
                <div className="flex items-center gap-1">
                  <div className={`w-1 h-1 rounded-full ${step.completed ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">
                    {step.completed ? 'Done' : 'Incomplete'}
                  </p>
                </div>
              </div>
              {activeStep === index && <ChevronRight className="w-4 h-4 text-indigo-500 animate-pulse" />}
            </button>
          ))}
        </div>

        {/* Form Content Area */}
        <div className="lg:col-span-8 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-8 shadow-sm">
          {wizardSteps?.steps[activeStep] && (
            <div className="space-y-8">
              <div className="border-b border-[var(--border-main)] pb-6 mb-8">
                <h2 className="text-2xl font-black text-[var(--text-main)]">{wizardSteps.steps[activeStep].title}</h2>
                <p className="text-[var(--text-muted)] mt-1">{wizardSteps.steps[activeStep].description}</p>
              </div>

              {/* Basic Info Form */}
              {wizardSteps.steps[activeStep].id === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Full Name</label>
                       <input 
                         className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl p-4 text-[var(--text-main)] outline-none focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold"
                         value={basicForm.full_name}
                         onChange={(e) => setBasicForm({...basicForm, full_name: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Contact Phone</label>
                       <input 
                         className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl p-4 text-[var(--text-main)] outline-none focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold"
                         value={basicForm.phone}
                         onChange={(e) => setBasicForm({...basicForm, phone: e.target.value})}
                       />
                    </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Current Location (City, Country)</label>
                     <input 
                       className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl p-4 text-[var(--text-main)] outline-none focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold"
                       value={basicForm.location}
                       placeholder="e.g. Tashkent, Uzbekistan"
                       onChange={(e) => setBasicForm({...basicForm, location: e.target.value})}
                     />
                  </div>
                  <button 
                    onClick={saveBasicInfo}
                    className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all active:scale-[0.98] mt-4"
                  >
                    Save & Continue
                  </button>
                </div>
              )}

              {/* Experience Form */}
              {wizardSteps.steps[activeStep].id === 'experience' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Company Name</label>
                       <input 
                         className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl p-4 outline-none focus:border-indigo-500 font-bold"
                         placeholder="e.g. Google"
                         value={experienceForm.company}
                         onChange={(e) => setExperienceForm({...experienceForm, company: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Job Title</label>
                       <input 
                         className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl p-4 outline-none focus:border-indigo-500 font-bold"
                         placeholder="e.g. Senior Frontend Developer"
                         value={experienceForm.position}
                         onChange={(e) => setExperienceForm({...experienceForm, position: e.target.value})}
                       />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Start Date</label>
                        <input className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl p-4 font-bold" type="text" placeholder="MM/YYYY" value={experienceForm.start_date} onChange={e => setExperienceForm({...experienceForm, start_date: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">End Date</label>
                        <input className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl p-4 font-bold" type="text" placeholder="MM/YYYY or Present" value={experienceForm.end_date} onChange={e => setExperienceForm({...experienceForm, end_date: e.target.value})} />
                     </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Key Responsibilities</label>
                    <textarea 
                      className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl p-4 font-bold min-h-[120px]" 
                      placeholder="Tell us about what you did..."
                      value={experienceForm.description}
                      onChange={e => setExperienceForm({...experienceForm, description: e.target.value})}
                    />
                  </div>
                  <button 
                    onClick={() => handlePost('experience', experienceForm, 'Experience added!')}
                    className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> Add Experience Entry
                  </button>
                </div>
              )}

              {/* Education Form */}
              {wizardSteps.steps[activeStep].id === 'education' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Educational Institution</label>
                     <input 
                       className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl p-4 font-bold" 
                       placeholder="e.g. Tashkent State Technical University"
                       value={educationForm.institution}
                       onChange={e => setEducationForm({...educationForm, institution: e.target.value})}
                     />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Degree / Level</label>
                       <select 
                         className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl p-4 font-bold outline-none"
                         value={educationForm.degree}
                         onChange={e => setEducationForm({...educationForm, degree: e.target.value})}
                       >
                         <option value="">Select Degree</option>
                         <option value="Bakalavr">Bakalavr (Bachelor)</option>
                         <option value="Magistr">Magistr (Master)</option>
                         <option value="PhD">PhD</option>
                         <option value="Kollej/Litsey">Kollej/Litsey</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Graduation Year</label>
                       <input className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl p-4 font-bold" placeholder="e.g. 2023" value={educationForm.graduation_year} onChange={e => setEducationForm({...educationForm, graduation_year: e.target.value})} />
                    </div>
                  </div>
                  <button 
                    onClick={() => handlePost('education', educationForm, 'Education added!')}
                    className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> Add Education
                  </button>
                </div>
              )}

              {/* Languages Form */}
              {wizardSteps.steps[activeStep].id === 'languages' && (
                <div className="space-y-6 text-center py-10">
                   <div className="max-w-sm mx-auto space-y-4">
                      <div className="bg-indigo-600/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                         <Languages className="w-10 h-10 text-indigo-500" />
                      </div>
                      <div className="space-y-2 text-left">
                         <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Language</label>
                         <input className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl p-4 font-bold" placeholder="e.g. English" value={languageForm.language} onChange={e => setLanguageForm({...languageForm, language: e.target.value})} />
                      </div>
                      <div className="space-y-2 text-left">
                         <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Proficiency Level</label>
                         <select className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl p-4 font-bold outline-none" value={languageForm.level} onChange={e => setLanguageForm({...languageForm, level: e.target.value})}>
                            <option value="A1 - Beginner">A1 - Beginner</option>
                            <option value="A2 - Elementary">A2 - Elementary</option>
                            <option value="B1 - Intermediate">B1 - Intermediate</option>
                            <option value="B2 - Upper Intermediate">B2 - Upper Intermediate</option>
                            <option value="C1 - Advanced">C1 - Advanced</option>
                            <option value="C2 - Mastery">C2 - Mastery</option>
                            <option value="Native">Native (Ona tili)</option>
                         </select>
                      </div>
                      <button 
                        onClick={() => handlePost('languages', languageForm, 'Language added!')}
                        className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl mt-4"
                      >
                        Save Language
                      </button>
                   </div>
                </div>
              )}

              {/* Other steps: Resume, Skills */}
              {['resume', 'skills'].includes(wizardSteps.steps[activeStep].id) && (
                <div className="text-center py-12 space-y-6">
                   <div className="w-32 h-32 bg-[var(--bg-main)] rounded-[3rem] flex items-center justify-center mx-auto shadow-inner">
                      {getStepIcon(wizardSteps.steps[activeStep].id)}
                   </div>
                   <div>
                      <p className="text-[var(--text-muted)] font-medium max-w-xs mx-auto">
                        This section requires more advanced tools. Please visit the dedicated page to complete this step.
                      </p>
                   </div>
                   <button 
                     onClick={() => window.location.href = wizardSteps.steps[activeStep].id === 'resume' ? '/resumes' : '/skills-verification'}
                     className="px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/20"
                   >
                     Go to {wizardSteps.steps[activeStep].title}
                   </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletion;