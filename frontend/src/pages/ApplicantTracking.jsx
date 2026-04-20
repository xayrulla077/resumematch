import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'sonner';
import {
  Briefcase,
  Users,
  FileText,
  MessageSquare,
  Check,
  X,
  Clock,
  Loader2,
  ChevronRight,
  Plus,
  Filter,
  Eye,
  Mail
} from 'lucide-react';
import axios from 'axios';

const ApplicantTracking = () => {
  const { t } = useLanguage();
  const [pipeline, setPipeline] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadPipeline();
    loadStats();
  }, []);

  const loadPipeline = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/ats/pipeline`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setPipeline(res.data.stages || []);
    } catch (error) {
      console.error('Load pipeline error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/ats/pipeline/stats`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setStats(res.data);
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const updateStatus = async (appId, newStatus) => {
    setUpdating(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/ats/pipeline/${appId}/status`, 
        { status: newStatus },
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      toast.success(`Status updated to ${newStatus}`);
      loadPipeline();
      loadStats();
      setSelectedApp(null);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const addNote = async (appId) => {
    if (!noteText.trim()) return;
    setUpdating(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/ats/pipeline/${appId}/notes?note=${encodeURIComponent(noteText)}`,
        {},
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      toast.success('Note added');
      setNoteText('');
      loadPipeline();
    } catch (error) {
      toast.error('Failed to add note');
    } finally {
      setUpdating(false);
    }
  };

  const getStageColor = (stage) => {
    const colors = {
      applied: 'bg-blue-500/20 border-blue-500/30',
      screening: 'bg-yellow-500/20 border-yellow-500/30',
      interview: 'bg-purple-500/20 border-purple-500/30',
      offer: 'bg-orange-500/20 border-orange-500/30',
      hired: 'bg-green-500/20 border-green-500/30',
      rejected: 'bg-red-500/20 border-red-500/30',
    };
    return colors[stage] || 'bg-gray-500/20 border-gray-500/30';
  };

  const getStageIcon = (stage) => {
    switch (stage) {
      case 'applied': return <FileText className="w-4 h-4" />;
      case 'screening': return <Filter className="w-4 h-4" />;
      case 'interview': return <Users className="w-4 h-4" />;
      case 'offer': return <Briefcase className="w-4 h-4" />;
      case 'hired': return <Check className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const stageOrder = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];

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
          <Users className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)]">Applicant Tracking</h1>
          <p className="text-[var(--text-muted)] font-medium">Track and manage your applicants</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-6">
            <div className="text-3xl font-black text-indigo-500">{stats.total}</div>
            <div className="text-sm text-[var(--text-muted)]">Total Applicants</div>
          </div>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-6">
            <div className="text-3xl font-black text-blue-500">{stats.this_week}</div>
            <div className="text-sm text-[var(--text-muted)]">This Week</div>
          </div>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-6">
            <div className="text-3xl font-black text-green-500">{stats.by_stage?.hired || 0}</div>
            <div className="text-sm text-[var(--text-muted)]">Hired</div>
          </div>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-6">
            <div className="text-3xl font-black text-purple-500">{stats.by_stage?.interview || 0}</div>
            <div className="text-sm text-[var(--text-muted)]">In Interview</div>
          </div>
        </div>
      )}

      {/* Pipeline */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {stageOrder.map((stage) => {
            const stageData = pipeline.find(s => s.stage === stage);
            const apps = stageData?.applications || [];
            
            return (
              <div key={stage} className="w-80 flex-shrink-0">
                <div className={`p-4 rounded-t-2xl border-2 ${getStageColor(stage)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStageIcon(stage)}
                      <span className="font-bold capitalize text-[var(--text-main)]">{stage}</span>
                    </div>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-bold">
                      {apps.length}
                    </span>
                  </div>
                </div>
                
                <div className="bg-[var(--bg-surface)] border-2 border-t-0 rounded-b-2xl p-4 space-y-3 min-h-[400px]">
                  {apps.length > 0 ? (
                    apps.map((app) => (
                      <div 
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        className="p-4 bg-[var(--bg-main)] rounded-xl border border-[var(--border-main)] hover:border-indigo-500/50 cursor-pointer transition-all"
                      >
                        <h4 className="font-bold text-[var(--text-main)] truncate">{app.candidate.name}</h4>
                        <p className="text-sm text-[var(--text-muted)] truncate">{app.job_title}</p>
                        {app.skills && app.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {app.skills.slice(0, 3).map((skill, i) => (
                              <span key={i} className="text-xs px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-full">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-[var(--text-muted)] mt-2">
                          {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : ''}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-[var(--text-muted)]">
                      No applicants
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-8" onClick={() => setSelectedApp(null)}>
          <div className="bg-[var(--bg-surface)] rounded-[2rem] p-8 max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-[var(--text-main)]">{selectedApp.candidate.name}</h3>
              <button onClick={() => setSelectedApp(null)} className="p-2 hover:bg-[var(--bg-main)] rounded-xl">
                <X className="w-6 h-6 text-[var(--text-muted)]" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Contact */}
              <div className="p-4 bg-[var(--bg-main)] rounded-xl">
                <h4 className="font-bold text-[var(--text-main)] mb-2">Contact</h4>
                <p className="text-[var(--text-muted)]">{selectedApp.candidate.email}</p>
                {selectedApp.candidate.location && (
                  <p className="text-[var(--text-muted)]">{selectedApp.candidate.location}</p>
                )}
              </div>

              {/* Job */}
              <div className="p-4 bg-[var(--bg-main)] rounded-xl">
                <h4 className="font-bold text-[var(--text-main)] mb-2">Applied For</h4>
                <p className="text-[var(--text-main)]">{selectedApp.job_title}</p>
              </div>

              {/* Skills */}
              {selectedApp.skills && selectedApp.skills.length > 0 && (
                <div className="p-4 bg-[var(--bg-main)] rounded-xl">
                  <h4 className="font-bold text-[var(--text-main)] mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedApp.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Status */}
              <div className="p-4 bg-[var(--bg-main)] rounded-xl">
                <h4 className="font-bold text-[var(--text-main)] mb-2">Current Status</h4>
                <span className={`px-4 py-2 rounded-xl font-bold capitalize ${getStageColor(selectedApp.status)}`}>
                  {selectedApp.status}
                </span>
              </div>

              {/* Move to Stage */}
              <div>
                <h4 className="font-bold text-[var(--text-main)] mb-2">Move to Stage</h4>
                <div className="flex flex-wrap gap-2">
                  {stageOrder.map((stage) => (
                    <button
                      key={stage}
                      onClick={() => updateStatus(selectedApp.id, stage)}
                      disabled={updating || selectedApp.status === stage}
                      className="px-4 py-2 rounded-xl font-bold capitalize bg-[var(--bg-main)] hover:bg-indigo-500/20 text-[var(--text-main)] disabled:opacity-50"
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Note */}
              <div>
                <h4 className="font-bold text-[var(--text-main)] mb-2">Add Note</h4>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note about this applicant..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-medium focus:outline-none focus:border-indigo-500 resize-none"
                />
                <button
                  onClick={() => addNote(selectedApp.id)}
                  disabled={updating || !noteText.trim()}
                  className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl"
                >
                  Add Note
                </button>
              </div>

              {/* Existing Notes */}
              {selectedApp.notes && (
                <div className="p-4 bg-[var(--bg-main)] rounded-xl">
                  <h4 className="font-bold text-[var(--text-main)] mb-2">Notes</h4>
                  <pre className="text-sm text-[var(--text-muted)] whitespace-pre-wrap">{selectedApp.notes}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantTracking;