import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { resumesAPI } from '../services/api';
import { Loader2, X, Mail, Phone, MapPin, Calendar, Award, Briefcase, GraduationCap, Languages, FileText, ExternalLink, Star, Trophy, Code, Globe, Heart, Zap, Target, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const CandidateProfileModal = ({ applicationId, candidateName, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [resume, setResume] = useState(null);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    loadResume();
  }, [applicationId]);

  const loadResume = async () => {
    try {
      setLoading(true);
      const response = await resumesAPI.getAll({ user_id: applicationId, limit: 1 });
      if (response.data.items && response.data.items.length > 0) {
        setResume(response.data.items[0]);
      }
    } catch (error) {
      console.error('Error loading resume:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70" onClick={onClose} />
        <div className="relative w-full max-w-2xl bg-[var(--bg-surface)] rounded-2xl p-8">
          <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-main)] shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--bg-card)] border-b border-[var(--border-main)] p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-500/30">
                {candidateName?.charAt(0) || '?'}
              </div>
              <div>
                <h2 className="text-2xl font-black text-[var(--text-main)]">{candidateName || 'Noma\'lum'}</h2>
                <p className="text-sm text-[var(--text-muted)]">Nomzod profili</p>
                {resume?.match_score && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg">
                      {Math.round(resume.match_score)}% moslik
                    </span>
                    {resume.status === 'analyzed' && (
                      <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                        AI tahlil qilingan
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[var(--bg-main)] rounded-xl">
              <X size={24} className="text-[var(--text-muted)]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Contact Info */}
          {(resume?.email || resume?.phone) && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                <Mail size={16} /> Bog'lanish
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {resume?.email && (
                  <div className="flex items-center gap-3 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-3">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                      <Mail size={18} className="text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase">Email</p>
                      <p className="text-sm text-[var(--text-main)] font-bold">{resume.email}</p>
                    </div>
                  </div>
                )}
                {resume?.phone && (
                  <div className="flex items-center gap-3 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-3">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                      <Phone size={18} className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase">Telefon</p>
                      <p className="text-sm text-[var(--text-main)] font-bold">{resume.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Skills */}
          {resume?.skills && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                <Zap size={16} /> Ko'nikmalar
              </h3>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(resume.skills) ? resume.skills.map((skill, idx) => (
                  <span key={idx} className="px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl text-sm font-black">
                    {skill}
                  </span>
                )) : typeof resume.skills === 'string' && resume.skills.split(',').map((skill, idx) => (
                  <span key={idx} className="px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl text-sm font-black">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {resume?.summary && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                <FileText size={16} /> Shaxsiy maqsad
              </h3>
              <div className="bg-gradient-to-r from-[var(--bg-card)] to-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl p-5">
                <p className="text-[var(--text-main)] text-sm leading-relaxed">{resume.summary}</p>
              </div>
            </div>
          )}

          {/* Experience */}
          {resume?.experience && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                <Briefcase size={16} /> Ish tajribasi
              </h3>
              <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-5">
                <p className="text-[var(--text-main)] text-sm whitespace-pre-wrap leading-relaxed">{resume.experience}</p>
              </div>
            </div>
          )}

          {/* Education */}
          {resume?.education && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                <GraduationCap size={16} /> Ta'lim
              </h3>
              <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-5">
                <p className="text-[var(--text-main)] text-sm whitespace-pre-wrap leading-relaxed">{resume.education}</p>
              </div>
            </div>
          )}

          {/* Certifications */}
          {resume?.certifications && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                <Award size={16} /> Sertifikatlar va malakoviy darajalar
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {resume.certifications.split(',').map((cert, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                      <Award size={18} className="text-amber-500" />
                    </div>
                    <p className="text-sm text-[var(--text-main)] font-bold">{cert.trim()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {resume?.projects && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                <Code size={16} /> Loyihalar
              </h3>
              <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-5">
                <p className="text-[var(--text-main)] text-sm whitespace-pre-wrap leading-relaxed">{resume.projects}</p>
              </div>
            </div>
          )}

          {/* Languages */}
          {resume?.languages && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                <Globe size={16} /> Chet tillari
              </h3>
              <div className="flex flex-wrap gap-3">
                {Array.isArray(resume.languages) ? resume.languages.map((lang, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <Globe size={14} className="text-emerald-500" />
                    <span className="text-sm font-black text-emerald-400">{lang}</span>
                  </div>
                )) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <Globe size={14} className="text-emerald-500" />
                    <span className="text-sm font-black text-emerald-400">{resume.languages}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Achievements */}
          {resume?.achievements && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                <Trophy size={16} /> Yutuqlar va mukofotlar
              </h3>
              <div className="space-y-2">
                {resume.achievements.split(',').map((achievement, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-purple-500/5 border border-purple-500/20 rounded-xl p-3">
                    <Trophy size={16} className="text-purple-500" />
                    <p className="text-sm text-[var(--text-main)]">{achievement.trim()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {(resume?.linkedin || resume?.github || resume?.website) && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                <ExternalLink size={16} /> Ijtimoiy tarmoqlar va havolalar
              </h3>
              <div className="flex flex-wrap gap-3">
                {resume?.linkedin && (
                  <a href={resume.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-xl hover:bg-blue-500/20 transition-colors">
                    <ExternalLink size={14} className="text-blue-500" />
                    <span className="text-sm font-black text-blue-400">LinkedIn</span>
                  </a>
                )}
                {resume?.github && (
                  <a href={resume.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-slate-500/10 border border-slate-500/30 rounded-xl hover:bg-slate-500/20 transition-colors">
                    <Code size={14} className="text-slate-400" />
                    <span className="text-sm font-black text-slate-400">GitHub</span>
                  </a>
                )}
                {resume?.website && (
                  <a href={resume.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl hover:bg-indigo-500/20 transition-colors">
                    <Globe size={14} className="text-indigo-500" />
                    <span className="text-sm font-black text-indigo-400">Website</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* AI Analysis */}
          {resume?.ai_summary && resume.ai_summary !== 'AI tahlili kutilmoqda...' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                <Target size={16} /> AI Tahlil va Baholash
              </h3>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Star size={16} className="text-purple-500" />
                    <span className="text-sm font-black text-purple-400">Umumiy baho</span>
                  </div>
                  <p className="text-[var(--text-main)] text-sm">{resume.ai_summary}</p>
                </div>
                
                {resume?.ai_strengths && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={16} className="text-emerald-500" />
                      <span className="text-sm font-black text-emerald-400">Kuchli tomonlar</span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">{resume.ai_strengths}</p>
                  </div>
                )}
                
                {resume?.ai_missing_skills && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target size={16} className="text-amber-500" />
                      <span className="text-sm font-black text-amber-400">Rivojlantirish kerak</span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">{resume.ai_missing_skills}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[var(--bg-card)] border-t border-[var(--border-main)] p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[var(--text-muted)]">
              Resume: {resume?.file_name || 'Yo\'q'} • {resume?.uploaded_at ? formatDate(resume.uploaded_at) : ''}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (resume?.file_path) {
                    window.open(resume.file_path, '_blank');
                  }
                }}
                disabled={!resume?.file_path}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm disabled:opacity-50"
              >
                PDF ko'rish
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-[var(--bg-main)] text-[var(--text-muted)] rounded-xl font-black text-sm"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfileModal;