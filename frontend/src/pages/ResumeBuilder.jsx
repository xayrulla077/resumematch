import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { resumesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    FileText,
    User,
    Briefcase,
    GraduationCap,
    Award,
    Plus,
    Trash2,
    Save,
    ChevronLeft,
    Loader2,
    Link,
    Medal,
    Trophy,
    FolderKanban
} from 'lucide-react';

const ResumeBuilder = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        summary: user?.bio || '',
        skills: '',
        experience: [],
        education: [],
        languages: [],
        certifications: [],
        projects: [],
        achievements: [],
        linkedin: '',
        github: '',
        website: ''
    });

    const [selectedSkills, setSelectedSkills] = useState([]);

    const predefinedSkills = [
        "Python", "JavaScript", "TypeScript", "React", "Vue", "Angular", "Node.js", 
        "Django", "FastAPI", "Flask", "Java", "C++", "C#", "Go", "Rust", "PHP",
        "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Docker", "Kubernetes",
        "AWS", "GCP", "Azure", "Linux", "Git", "CI/CD", "REST API", "GraphQL",
        "Machine Learning", "Data Analysis", "TensorFlow", "PyTorch", "NLP",
        "HTML", "CSS", "Tailwind", "SASS", "Figma", "UI/UX Design",
        "Project Management", "Agile", "Scrum", "Team Leadership", "Communication"
    ];

    const toggleSkill = (skill) => {
        setSelectedSkills(prev => 
            prev.includes(skill) 
                ? prev.filter(s => s !== skill)
                : [...prev, skill]
        );
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addExperience = () => {
        setFormData(prev => ({
            ...prev,
            experience: [...prev.experience, { title: '', company: '', date_range: '', description: '' }]
        }));
    };

    const updateExperience = (index, field, value) => {
        const newExp = [...formData.experience];
        newExp[index][field] = value;
        setFormData(prev => ({ ...prev, experience: newExp }));
    };

    const removeExperience = (index) => {
        setFormData(prev => ({
            ...prev,
            experience: prev.experience.filter((_, i) => i !== index)
        }));
    };

    const addEducation = () => {
        setFormData(prev => ({
            ...prev,
            education: [...prev.education, { degree: '', institution: '', year: '' }]
        }));
    };

    const updateEducation = (index, field, value) => {
        const newEdu = [...formData.education];
        newEdu[index][field] = value;
        setFormData(prev => ({ ...prev, education: newEdu }));
    };

    const removeEducation = (index) => {
        setFormData(prev => ({
            ...prev,
            education: prev.education.filter((_, i) => i !== index)
        }));
    };

    const addCertification = () => {
        setFormData(prev => ({
            ...prev,
            certifications: [...prev.certifications, { name: '', issuer: '', date: '', credential_id: '' }]
        }));
    };

    const updateCertification = (index, field, value) => {
        const newCert = [...formData.certifications];
        newCert[index][field] = value;
        setFormData(prev => ({ ...prev, certifications: newCert }));
    };

    const removeCertification = (index) => {
        setFormData(prev => ({
            ...prev,
            certifications: prev.certifications.filter((_, i) => i !== index)
        }));
    };

    const addProject = () => {
        setFormData(prev => ({
            ...prev,
            projects: [...prev.projects, { name: '', description: '', technologies: '', link: '' }]
        }));
    };

    const updateProject = (index, field, value) => {
        const newProj = [...formData.projects];
        newProj[index][field] = value;
        setFormData(prev => ({ ...prev, projects: newProj }));
    };

    const removeProject = (index) => {
        setFormData(prev => ({
            ...prev,
            projects: prev.projects.filter((_, i) => i !== index)
        }));
    };

    const addAchievement = () => {
        setFormData(prev => ({
            ...prev,
            achievements: [...prev.achievements, { title: '', description: '', date: '' }]
        }));
    };

    const updateAchievement = (index, field, value) => {
        const newAch = [...formData.achievements];
        newAch[index][field] = value;
        setFormData(prev => ({ ...prev, achievements: newAch }));
    };

    const removeAchievement = (index) => {
        setFormData(prev => ({
            ...prev,
            achievements: prev.achievements.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.full_name || !formData.email) {
            toast.error("Ism va Email to'ldirilishi shart");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                ...formData,
                skills: selectedSkills.length > 0 
                    ? selectedSkills 
                    : formData.skills.split(',').map(s => s.trim()).filter(s => s),
                languages: formData.languages ? formData.languages.split(',').map(l => l.trim()).filter(l => l) : [],
                projects: formData.projects.map(p => ({
                    ...p,
                    technologies: p.technologies ? p.technologies.split(',').map(t => t.trim()).filter(t => t) : []
                }))
            };

            const response = await resumesAPI.build(payload);
            const newResume = response.data.data;
            
            toast.success("Rezyume muvaffaqiyatli yaratildi! 🎉");
            
            // Show download button option
            if (newResume && newResume.id) {
                const downloadPdf = window.confirm("Rezyume yaratildi! Endi PDF ni yuklab olmoqchimisiz?");
                if (downloadPdf) {
                    try {
                        const pdfResponse = await resumesAPI.download(newResume.id);
                        const url = window.URL.createObjectURL(new Blob([pdfResponse.data]));
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', `${formData.full_name || 'resume'}.pdf`);
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                    } catch (pdfError) {
                        console.error('PDF download error:', pdfError);
                    }
                }
            }
            navigate('/resumes');
        } catch (error) {
            toast.error("Xatolik: " + (error.response?.data?.detail || error.message));
        } finally {
            setLoading(false);
        }
    };

    // Modern input classes
    const inputBaseClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-sm";
    const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1";

    return (
        <div className="min-h-screen bg-[var(--bg-main)] p-4 sm:p-6 lg:p-8 relative overflow-hidden font-['Outfit'] transition-all">
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto flex flex-col h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/resumes')}
                            className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10 shadow-xl"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">
                                Resume <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Builder</span>
                            </h1>
                            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1">
                                ATS-Friendly Standard Rezyume Yaratish
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        {loading ? "Saqlanmoqda..." : "Yaratish"}
                    </button>
                </div>

                <div className="flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden">
                    {/* Form Setup */}
                    <div className="lg:w-1/2 overflow-y-auto no-scrollbar pb-20 space-y-8 pr-2">

                        {/* Personal Info */}
                        <div className="bg-[var(--bg-surface)] backdrop-blur-xl border border-[var(--border-main)] p-6 rounded-[2rem] space-y-5 shadow-2xl">
                            <div className="flex items-center gap-3 border-b border-[var(--border-main)] pb-4">
                                <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center">
                                    <User size={18} />
                                </div>
                                <h2 className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">Shaxsiy Ma'lumotlar</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelClass}>To'liq Ism</label>
                                    <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} className={inputBaseClass} placeholder="Vali Valiyev" />
                                </div>
                                <div>
                                    <label className={labelClass}>Email</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={inputBaseClass} placeholder="vali@example.com" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className={labelClass}>Telefon</label>
                                    <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className={inputBaseClass} placeholder="+998 90 123 45 67" />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Qisqacha o'zingiz haqingizda (Summary)</label>
                                <textarea name="summary" value={formData.summary} onChange={handleInputChange} className={`${inputBaseClass} min-h-[100px] resize-none`} placeholder="Tajribali dasturchiman, asosan veb texnologiyalarida..." />
                            </div>
                        </div>

                        {/* Experience */}
                        <div className="bg-[var(--bg-surface)] backdrop-blur-xl border border-[var(--border-main)] p-6 rounded-[2rem] space-y-5 shadow-2xl">
                            <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
                                        <Briefcase size={18} />
                                    </div>
                                    <h2 className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">Ish Tajribasi</h2>
                                </div>
                                <button onClick={addExperience} className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <Plus size={14} /> Qo'shish
                                </button>
                            </div>

                            <div className="space-y-6">
                                {formData.experience.map((exp, index) => (
                                    <div key={index} className="p-5 bg-white/5 border border-white/5 rounded-2xl relative group">
                                        <button onClick={() => removeExperience(index)} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                            <input type="text" placeholder="Lavozim (Software Engineer)" value={exp.title} onChange={e => updateExperience(index, 'title', e.target.value)} className={inputBaseClass} />
                                            <input type="text" placeholder="Kompaniya (Google)" value={exp.company} onChange={e => updateExperience(index, 'company', e.target.value)} className={inputBaseClass} />
                                        </div>
                                        <div className="mb-4">
                                            <input type="text" placeholder="Sana (2020 - Hozirgacha)" value={exp.date_range} onChange={e => updateExperience(index, 'date_range', e.target.value)} className={inputBaseClass} />
                                        </div>
                                        <textarea placeholder="Qilingan ishlar va yutuqlar..." value={exp.description} onChange={e => updateExperience(index, 'description', e.target.value)} className={`${inputBaseClass} h-auto min-h-[80px]`} />
                                    </div>
                                ))}
                                {formData.experience.length === 0 && (
                                    <div className="text-center py-6 border border-dashed border-[var(--border-main)] rounded-2xl text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest">
                                        Hali tajriba qo'shilmagan
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Education */}
                        <div className="bg-[var(--bg-surface)] backdrop-blur-xl border border-[var(--border-main)] p-6 rounded-[2rem] space-y-5 shadow-2xl">
                            <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center">
                                        <GraduationCap size={18} />
                                    </div>
                                    <h2 className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">Ta'lim</h2>
                                </div>
                                <button onClick={addEducation} className="p-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <Plus size={14} /> Qo'shish
                                </button>
                            </div>

                            <div className="space-y-6">
                                {formData.education.map((edu, index) => (
                                    <div key={index} className="p-5 bg-white/5 border border-white/5 rounded-2xl relative group grid gap-4">
                                        <button onClick={() => removeEducation(index)} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all z-10">
                                            <Trash2 size={16} />
                                        </button>
                                        <input type="text" placeholder="Daraja (Bakalavr - Computer Science)" value={edu.degree} onChange={e => updateEducation(index, 'degree', e.target.value)} className={inputBaseClass} />
                                        <input type="text" placeholder="Universitet (TATU)" value={edu.institution} onChange={e => updateEducation(index, 'institution', e.target.value)} className={inputBaseClass} />
                                        <input type="text" placeholder="Yil (2018 - 2022)" value={edu.year} onChange={e => updateEducation(index, 'year', e.target.value)} className={inputBaseClass} />
                                    </div>
                                ))}
                                {formData.education.length === 0 && (
                                    <div className="text-center py-6 border border-dashed border-[var(--border-main)] rounded-2xl text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest">
                                        Hali ta'lim qo'shilmagan
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Skills */}
                        <div className="bg-[var(--bg-surface)] backdrop-blur-xl border border-[var(--border-main)] p-6 rounded-[2rem] space-y-5 shadow-2xl">
                            <div className="flex items-center gap-3 border-b border-[var(--border-main)] pb-4">
                                <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
                                    <Award size={18} />
                                </div>
                                <h2 className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">Ko'nikmalar</h2>
                            </div>

                            <div>
                                <label className={labelClass}>Skill larni belgilang yoki qo'lda yozing</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                                    {predefinedSkills.map(skill => (
                                        <label 
                                            key={skill}
                                            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-xs font-medium ${
                                                selectedSkills.includes(skill)
                                                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                                                    : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedSkills.includes(skill)}
                                                onChange={() => toggleSkill(skill)}
                                                className="w-4 h-4 accent-indigo-500"
                                            />
                                            {skill}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Boshqa ko'nikmalar (vergul bilan)</label>
                                <input 
                                    type="text" 
                                    name="skills" 
                                    value={formData.skills} 
                                    onChange={handleInputChange} 
                                    className={inputBaseClass} 
                                    placeholder="JavaScript, Node.js, SQL..." 
                                />
                            </div>
                        </div>

                        {/* Certifications */}
                        <div className="bg-[var(--bg-surface)] backdrop-blur-xl border border-[var(--border-main)] p-6 rounded-[2rem] space-y-5 shadow-2xl">
                            <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-cyan-500/10 text-cyan-400 rounded-xl flex items-center justify-center">
                                        <Medal size={18} />
                                    </div>
                                    <h2 className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">Sertifikatlar</h2>
                                </div>
                                <button onClick={addCertification} className="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <Plus size={14} /> Qo'shish
                                </button>
                            </div>

                            <div className="space-y-6">
                                {formData.certifications.map((cert, index) => (
                                    <div key={index} className="p-5 bg-white/5 border border-white/5 rounded-2xl relative group">
                                        <button onClick={() => removeCertification(index)} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                            <input type="text" placeholder="Sertifikat nomi" value={cert.name} onChange={e => updateCertification(index, 'name', e.target.value)} className={inputBaseClass} />
                                            <input type="text" placeholder="Beruvchi (Coursera, AWS...)" value={cert.issuer} onChange={e => updateCertification(index, 'issuer', e.target.value)} className={inputBaseClass} />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <input type="text" placeholder="Sana (2024)" value={cert.date} onChange={e => updateCertification(index, 'date', e.target.value)} className={inputBaseClass} />
                                            <input type="text" placeholder="Credential ID (ixtiyoriy)" value={cert.credential_id} onChange={e => updateCertification(index, 'credential_id', e.target.value)} className={inputBaseClass} />
                                        </div>
                                    </div>
                                ))}
                                {formData.certifications.length === 0 && (
                                    <div className="text-center py-6 border border-dashed border-[var(--border-main)] rounded-2xl text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest">
                                        Hali sertifikat qo'shilmagan
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Projects */}
                        <div className="bg-[var(--bg-surface)] backdrop-blur-xl border border-[var(--border-main)] p-6 rounded-[2rem] space-y-5 shadow-2xl">
                            <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-500/10 text-orange-400 rounded-xl flex items-center justify-center">
                                        <FolderKanban size={18} />
                                    </div>
                                    <h2 className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">Loyihalar</h2>
                                </div>
                                <button onClick={addProject} className="p-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <Plus size={14} /> Qo'shish
                                </button>
                            </div>

                            <div className="space-y-6">
                                {formData.projects.map((proj, index) => (
                                    <div key={index} className="p-5 bg-white/5 border border-white/5 rounded-2xl relative group">
                                        <button onClick={() => removeProject(index)} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                            <input type="text" placeholder="Loyiha nomi" value={proj.name} onChange={e => updateProject(index, 'name', e.target.value)} className={inputBaseClass} />
                                            <input type="text" placeholder="Havola (GitHub, Live...)" value={proj.link} onChange={e => updateProject(index, 'link', e.target.value)} className={inputBaseClass} />
                                        </div>
                                        <div className="mb-4">
                                            <input type="text" placeholder="Texnologiyalar (React, Node.js...)" value={proj.technologies} onChange={e => updateProject(index, 'technologies', e.target.value)} className={inputBaseClass} />
                                        </div>
                                        <textarea placeholder="Loyiha tavsifi..." value={proj.description} onChange={e => updateProject(index, 'description', e.target.value)} className={`${inputBaseClass} h-auto min-h-[80px]`} />
                                    </div>
                                ))}
                                {formData.projects.length === 0 && (
                                    <div className="text-center py-6 border border-dashed border-[var(--border-main)] rounded-2xl text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest">
                                        Hali loyiha qo'shilmagan
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Achievements */}
                        <div className="bg-[var(--bg-surface)] backdrop-blur-xl border border-[var(--border-main)] p-6 rounded-[2rem] space-y-5 shadow-2xl">
                            <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-yellow-500/10 text-yellow-400 rounded-xl flex items-center justify-center">
                                        <Trophy size={18} />
                                    </div>
                                    <h2 className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">Yutuqlar</h2>
                                </div>
                                <button onClick={addAchievement} className="p-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <Plus size={14} /> Qo'shish
                                </button>
                            </div>

                            <div className="space-y-6">
                                {formData.achievements.map((ach, index) => (
                                    <div key={index} className="p-5 bg-white/5 border border-white/5 rounded-2xl relative group">
                                        <button onClick={() => removeAchievement(index)} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                            <input type="text" placeholder="Yutuq nomi" value={ach.title} onChange={e => updateAchievement(index, 'title', e.target.value)} className={inputBaseClass} />
                                            <input type="text" placeholder="Sana (2024)" value={ach.date} onChange={e => updateAchievement(index, 'date', e.target.value)} className={inputBaseClass} />
                                        </div>
                                        <textarea placeholder="Tavsif..." value={ach.description} onChange={e => updateAchievement(index, 'description', e.target.value)} className={`${inputBaseClass} h-auto min-h-[80px]`} />
                                    </div>
                                ))}
                                {formData.achievements.length === 0 && (
                                    <div className="text-center py-6 border border-dashed border-[var(--border-main)] rounded-2xl text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest">
                                        Hali yutuq qo'shilmagan
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Links */}
                        <div className="bg-[var(--bg-surface)] backdrop-blur-xl border border-[var(--border-main)] p-6 rounded-[2rem] space-y-5 shadow-2xl">
                            <div className="flex items-center gap-3 border-b border-[var(--border-main)] pb-4">
                                <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
                                    <Link size={18} />
                                </div>
                                <h2 className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">Ijtimoiy Tarmoqlar</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className={labelClass}>LinkedIn</label>
                                    <input type="text" name="linkedin" value={formData.linkedin} onChange={handleInputChange} className={inputBaseClass} placeholder="linkedin.com/in/..." />
                                </div>
                                <div>
                                    <label className={labelClass}>GitHub</label>
                                    <input type="text" name="github" value={formData.github} onChange={handleInputChange} className={inputBaseClass} placeholder="github.com/..." />
                                </div>
                                <div>
                                    <label className={labelClass}>Website</label>
                                    <input type="text" name="website" value={formData.website} onChange={handleInputChange} className={inputBaseClass} placeholder="yourwebsite.com" />
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Live Preview Panel */}
                    <div className="hidden lg:flex lg:w-1/2 justify-center items-start overflow-y-auto no-scrollbar pb-20">
                        <div className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] rounded-md origin-top transform transition-all font-sans relative">
                            <div className="border-b-4 border-slate-900 pb-6 mb-6">
                                <h1 className="text-4xl font-extrabold uppercase tracking-tight text-slate-900 mb-2">{formData.full_name || "Ismingiz"}</h1>
                                <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
                                    {formData.email && <span>{formData.email}</span>}
                                    {formData.phone && <span>{formData.phone}</span>}
                                </div>
                            </div>

                            {formData.summary && (
                                <div className="mb-6 border-b border-slate-50 pb-6">
                                    <h3 className="text-lg font-bold text-slate-800 border-b border-slate-300 pb-1 mb-3 uppercase tracking-wider">Professional Summary</h3>
                                    <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{formData.summary}</p>
                                </div>
                            )}

                            {formData.experience.length > 0 && (
                                <div className="mb-6 border-b border-slate-50 pb-6">
                                    <h3 className="text-lg font-bold text-slate-800 border-b border-slate-300 pb-1 mb-3 uppercase tracking-wider">Experience</h3>
                                    <div className="space-y-4">
                                        {formData.experience.map((exp, i) => (
                                            <div key={i}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-bold text-slate-900">{exp.title || "Lavozim"} <span className="text-slate-500 font-normal">at {exp.company || 'Kompaniya'}</span></h4>
                                                    <span className="text-xs font-semibold text-slate-500">{exp.date_range}</span>
                                                </div>
                                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{exp.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {formData.education.length > 0 && (
                                <div className="mb-6 border-b border-slate-50 pb-6">
                                    <h3 className="text-lg font-bold text-slate-800 border-b border-slate-300 pb-1 mb-3 uppercase tracking-wider">Education</h3>
                                    <div className="space-y-3">
                                        {formData.education.map((edu, i) => (
                                            <div key={i} className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-slate-900">{edu.degree || "Ixtisoslik"}</h4>
                                                    <p className="text-sm text-slate-600">{edu.institution || "Muassasa"}</p>
                                                </div>
                                                <span className="text-xs font-semibold text-slate-500">{edu.year}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(formData.skills || selectedSkills.length > 0) && (
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 border-b border-slate-300 pb-1 mb-3 uppercase tracking-wider">Skills</h3>
                                    <p className="text-sm text-slate-700 leading-relaxed font-semibold">
                                        {selectedSkills.length > 0 
                                            ? selectedSkills.join(' • ')
                                            : formData.skills.split(',').map(s => s.trim()).filter(s => s).join(' • ')
                                        }
                                    </p>
                                </div>
                            )}

                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none text-slate-900">
                                <FileText size={120} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResumeBuilder;
