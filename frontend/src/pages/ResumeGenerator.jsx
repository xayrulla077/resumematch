import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { resumesAPI, jobsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  FileText,
  Download,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Code,
  Languages,
  Award,
  Eye,
  CheckCircle,
  X
} from 'lucide-react';

const templates = [
  { id: 'modern', name: 'Modern', color: 'blue' },
  { id: 'classic', name: 'Classic', color: 'gray' },
  { id: 'creative', name: 'Creative', color: 'purple' },
  { id: 'minimal', name: 'Minimal', color: 'slate' }
];

const ResumeGenerator = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [generatedPdf, setGeneratedPdf] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Resume data for editing
  const [resumeData, setResumeData] = useState({
    full_name: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    summary: '',
    skills: '',
    experience: [],
    education: [],
    languages: []
  });

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      setLoading(true);
      const response = await resumesAPI.getMyResumes();
      const resumeList = response.data?.items || [];
      setResumes(resumeList);
      
      if (resumeList.length > 0 && !selectedResume) {
        selectResume(resumeList[0]);
      }
    } catch (error) {
      console.error('Load resumes error:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectResume = (resume) => {
    setSelectedResume(resume);
    // Parse resume data
    setResumeData({
      full_name: user?.full_name || '',
      title: resume.title || 'Professional',
      email: user?.email || '',
      phone: user?.phone || '',
      location: resume.location || '',
      linkedin: user?.linkedin || '',
      summary: resume.summary || '',
      skills: resume.skills || '',
      experience: resume.experience ? JSON.parse(resume.experience) : [],
      education: resume.education ? JSON.parse(resume.education) : [],
      languages: resume.languages ? JSON.parse(resume.languages) : []
    });
  };

  const handleInputChange = (field, value) => {
    setResumeData(prev => ({ ...prev, [field]: value }));
  };

  const addExperience = () => {
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, { company: '', position: '', duration: '', location: '', responsibilities: [] }]
    }));
  };

  const updateExperience = (index, field, value) => {
    setResumeData(prev => {
      const exp = [...prev.experience];
      exp[index] = { ...exp[index], [field]: value };
      return { ...prev, experience: exp };
    });
  };

  const removeExperience = (index) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const addEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, { school: '', degree: '', year: '', gpa: '' }]
    }));
  };

  const updateEducation = (index, field, value) => {
    setResumeData(prev => {
      const edu = [...prev.education];
      edu[index] = { ...edu[index], [field]: value };
      return { ...prev, education: edu };
    });
  };

  const removeEducation = (index) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const generatePdf = async () => {
    try {
      setGenerating(true);
      
      // Prepare data for API
      const data = {
        user_data: {
          full_name: resumeData.full_name,
          email: resumeData.email,
          phone: resumeData.phone,
          linkedin: resumeData.linkedin
        },
        resume_data: {
          title: resumeData.title,
          location: resumeData.location,
          summary: resumeData.summary,
          skills: resumeData.skills.split(',').map(s => s.trim()).filter(s => s),
          experience: resumeData.experience,
          education: resumeData.education,
          languages: resumeData.languages
        },
        template: selectedTemplate
      };

      const response = await fetch('http://127.0.0.1:8000/api/resumes/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('PDF generation failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setGeneratedPdf(url);
      setShowPreview(true);
      
      toast.success('Resume PDF yaratildi!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('PDF yaratishda xatolik');
    } finally {
      setGenerating(false);
    }
  };

  const downloadPdf = () => {
    if (generatedPdf) {
      const a = document.createElement('a');
      a.href = generatedPdf;
      a.download = `${resumeData.full_name || 'resume'}.pdf`;
      a.click();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-8 font-['Outfit']">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <FileText className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[var(--text-main)]">Resume Generator</h1>
            <p className="text-[var(--text-muted)] text-xs font-bold">Professional PDF resume yarating</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowPreview(true)}
            className="px-6 py-3 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-[var(--bg-card)]"
          >
            <Eye size={18} />
            Preview
          </button>
          <button 
            onClick={generatePdf}
            disabled={generating}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {generating ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            Generate PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left - Resume Selection & Template */}
        <div className="space-y-6">
          {/* Resume Select */}
          <div className="p-6 bg-[var(--bg-surface)] rounded-[2rem] border border-[var(--border-main)]">
            <h3 className="font-black text-[var(--text-main)] mb-4">Tanlangan Resume</h3>
            <select 
              value={selectedResume?.id || ''}
              onChange={(e) => {
                const resume = resumes.find(r => r.id === parseInt(e.target.value));
                if (resume) selectResume(resume);
              }}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-3 px-4 text-[var(--text-main)] font-bold"
            >
              <option value="">Resume tanlang</option>
              {resumes.map(r => (
                <option key={r.id} value={r.id}>{r.file_name}</option>
              ))}
            </select>
          </div>

          {/* Template Selection */}
          <div className="p-6 bg-[var(--bg-surface)] rounded-[2rem] border border-[var(--border-main)]">
            <h3 className="font-black text-[var(--text-main)] mb-4">Template</h3>
            <div className="grid grid-cols-2 gap-3">
              {templates.map(temp => (
                <button
                  key={temp.id}
                  onClick={() => setSelectedTemplate(temp.id)}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    selectedTemplate === temp.id 
                      ? 'border-indigo-500 bg-indigo-500/10' 
                      : 'border-[var(--border-main)] hover:border-indigo-300'
                  }`}
                >
                  <div className={`w-full h-8 rounded-lg bg-${temp.color}-500 mb-2`}></div>
                  <p className="font-bold text-sm text-[var(--text-main)]">{temp.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="p-6 bg-emerald-500/10 rounded-[2rem] border border-emerald-500/20">
            <h3 className="font-black text-emerald-400 mb-3">💡 Maslahatlar</h3>
            <ul className="text-sm text-[var(--text-muted)] space-y-2">
              <li>• Professional rasm qo'shing</li>
              <li>• Qisqa va aniq summary yozing</li>
              <li>• Skillslarni vergul bilan ajrating</li>
              <li>• Eng muhim tajribalarni birinchi qo'ying</li>
            </ul>
          </div>
        </div>

        {/* Center - Resume Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <div className="p-6 bg-[var(--bg-surface)] rounded-[2rem] border border-[var(--border-main)]">
            <h3 className="font-black text-[var(--text-main)] mb-4 flex items-center gap-2">
              <User size={20} /> Shaxsiy ma'lumotlar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="To'liq ism"
                value={resumeData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                className="bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-3 px-4 font-bold"
              />
              <input
                type="text"
                placeholder="Unvon (masalan: Senior Developer)"
                value={resumeData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-3 px-4 font-bold"
              />
              <input
                type="email"
                placeholder="Email"
                value={resumeData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-3 px-4 font-bold"
              />
              <input
                type="tel"
                placeholder="Telefon"
                value={resumeData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-3 px-4 font-bold"
              />
              <input
                type="text"
                placeholder="Manzil"
                value={resumeData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-3 px-4 font-bold"
              />
              <input
                type="text"
                placeholder="LinkedIn URL"
                value={resumeData.linkedin}
                onChange={(e) => handleInputChange('linkedin', e.target.value)}
                className="bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-3 px-4 font-bold"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="p-6 bg-[var(--bg-surface)] rounded-[2rem] border border-[var(--border-main)]">
            <h3 className="font-black text-[var(--text-main)] mb-4">Professional Summary</h3>
            <textarea
              placeholder="O'zingiz haqida qisqa matn..."
              value={resumeData.summary}
              onChange={(e) => handleInputChange('summary', e.target.value)}
              rows={4}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-3 px-4 font-bold resize-none"
            />
          </div>

          {/* Skills */}
          <div className="p-6 bg-[var(--bg-surface)] rounded-[2rem] border border-[var(--border-main)]">
            <h3 className="font-black text-[var(--text-main)] mb-4 flex items-center gap-2">
              <Code size={20} /> Ko'nikmalar
            </h3>
            <textarea
              placeholder="Skillslarni vergul bilan yozing (masalan: Python, JavaScript, React, SQL)"
              value={resumeData.skills}
              onChange={(e) => handleInputChange('skills', e.target.value)}
              rows={3}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-3 px-4 font-bold"
            />
            {resumeData.skills && (
              <div className="flex flex-wrap gap-2 mt-3">
                {resumeData.skills.split(',').map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-bold">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Experience */}
          <div className="p-6 bg-[var(--bg-surface)] rounded-[2rem] border border-[var(--border-main)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-[var(--text-main)] flex items-center gap-2">
                <Briefcase size={20} /> Ish tajribasi
              </h3>
              <button 
                onClick={addExperience}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm"
              >
                + Qo'shish
              </button>
            </div>
            {resumeData.experience.map((exp, i) => (
              <div key={i} className="mb-4 p-4 bg-[var(--bg-card)] rounded-2xl">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Kompaniya"
                    value={exp.company}
                    onChange={(e) => updateExperience(i, 'company', e.target.value)}
                    className="bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl py-2 px-3 font-bold text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Lavozim"
                    value={exp.position}
                    onChange={(e) => updateExperience(i, 'position', e.target.value)}
                    className="bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl py-2 px-3 font-bold text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Davomiyligi (masalan: 2020-2023)"
                    value={exp.duration}
                    onChange={(e) => updateExperience(i, 'duration', e.target.value)}
                    className="bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl py-2 px-3 font-bold text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Manzil"
                    value={exp.location}
                    onChange={(e) => updateExperience(i, 'location', e.target.value)}
                    className="bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl py-2 px-3 font-bold text-sm"
                  />
                </div>
                <textarea
                  placeholder="Vazifalar (har birini yangi qatordan)"
                  value={exp.responsibilities?.join('\n') || ''}
                  onChange={(e) => updateExperience(i, 'responsibilities', e.target.value.split('\n'))}
                  rows={2}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl py-2 px-3 font-bold text-sm"
                />
                <button 
                  onClick={() => removeExperience(i)}
                  className="mt-2 text-rose-400 text-sm font-bold"
                >
                  O'chirish
                </button>
              </div>
            ))}
          </div>

          {/* Education */}
          <div className="p-6 bg-[var(--bg-surface)] rounded-[2rem] border border-[var(--border-main)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-[var(--text-main)] flex items-center gap-2">
                <GraduationCap size={20} /> Ta'lim
              </h3>
              <button 
                onClick={addEducation}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm"
              >
                + Qo'shish
              </button>
            </div>
            {resumeData.education.map((edu, i) => (
              <div key={i} className="mb-4 p-4 bg-[var(--bg-card)] rounded-2xl">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Universitet"
                    value={edu.school}
                    onChange={(e) => updateEducation(i, 'school', e.target.value)}
                    className="bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl py-2 px-3 font-bold text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Daraja (masalan: Bachelor)"
                    value={edu.degree}
                    onChange={(e) => updateEducation(i, 'degree', e.target.value)}
                    className="bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl py-2 px-3 font-bold text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Yil (masalan: 2020)"
                    value={edu.year}
                    onChange={(e) => updateEducation(i, 'year', e.target.value)}
                    className="bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl py-2 px-3 font-bold text-sm"
                  />
                  <input
                    type="text"
                    placeholder="GPA (ixtiyoriy)"
                    value={edu.gpa || ''}
                    onChange={(e) => updateEducation(i, 'gpa', e.target.value)}
                    className="bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl py-2 px-3 font-bold text-sm"
                  />
                </div>
                <button 
                  onClick={() => removeEducation(i)}
                  className="mt-2 text-rose-400 text-sm font-bold"
                >
                  O'chirish
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-[var(--bg-surface)] rounded-[3rem] border border-[var(--border-main)] max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 flex items-center justify-between border-b border-[var(--border-main)]">
              <h2 className="text-2xl font-black text-[var(--text-main)]">Resume Preview</h2>
              <button 
                onClick={() => setShowPreview(false)}
                className="p-3 bg-[var(--bg-card)] rounded-xl hover:bg-rose-500/20"
              >
                <X size={20} className="text-rose-400" />
              </button>
            </div>
            <div className="p-8 bg-white text-black">
              {/* Preview Content */}
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold mb-2">{resumeData.full_name || 'Your Name'}</h1>
                <p className="text-xl text-gray-600 mb-2">{resumeData.title || 'Professional Title'}</p>
                <div className="text-sm text-gray-500 flex justify-center gap-4 flex-wrap">
                  {resumeData.email && <span>{resumeData.email}</span>}
                  {resumeData.phone && <span>| {resumeData.phone}</span>}
                  {resumeData.location && <span>| {resumeData.location}</span>}
                </div>
              </div>
              
              {resumeData.summary && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold border-b border-gray-300 mb-2">Professional Summary</h2>
                  <p className="text-sm">{resumeData.summary}</p>
                </div>
              )}
              
              {resumeData.skills && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold border-b border-gray-300 mb-2">Skills</h2>
                  <p className="text-sm">{resumeData.skills}</p>
                </div>
              )}
              
              {resumeData.experience.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold border-b border-gray-300 mb-2">Work Experience</h2>
                  {resumeData.experience.map((exp, i) => (
                    <div key={i} className="mb-4">
                      <p className="font-bold">{exp.position} at {exp.company}</p>
                      <p className="text-sm text-gray-600">{exp.duration} {exp.location && `| ${exp.location}`}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {resumeData.education.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold border-b border-gray-300 mb-2">Education</h2>
                  {resumeData.education.map((edu, i) => (
                    <div key={i} className="mb-2">
                      <p className="font-bold">{edu.degree} - {edu.school}</p>
                      <p className="text-sm text-gray-600">{edu.year}{edu.gpa && ` | GPA: ${edu.gpa}`}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-[var(--border-main)]">
              <button 
                onClick={downloadPdf}
                disabled={!generatedPdf}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download size={20} />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeGenerator;