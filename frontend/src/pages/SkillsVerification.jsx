import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  Award,
  Plus,
  Trash2,
  Search,
  Loader2,
  Trophy,
  Medal,
  Star,
  CheckCircle,
  Crown
} from 'lucide-react';

const badgeConfig = {
  gold: { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30' },
  silver: { icon: Medal, color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/30' },
  bronze: { icon: Star, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30' },
};

const SkillsVerification = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [adding, setAdding] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    loadSkills();
    loadSuggestions();
    loadLeaderboard();
  }, []);

  const loadSkills = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/skills/verification/my-skills', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSkills(data);
      }
    } catch (error) {
      console.error('Load skills error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      const query = searchTerm ? `?query=${searchTerm}` : '';
      const response = await fetch(`http://127.0.0.1:8000/api/skills/verification/suggestions${query}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Load suggestions error:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/skills/verification/leaderboard');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Load leaderboard error:', error);
    }
  };

  const addSkill = async (skillName, badge = 'bronze', issuer = '') => {
    try {
      setAdding(true);
      const response = await fetch('http://127.0.0.1:8000/api/skills/verification/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          skill_name: skillName,
          issued_by: issuer
        })
      });
      
      if (response.ok) {
        toast.success(`${skillName} skilli qo'shildi!`);
        loadSkills();
        loadLeaderboard();
      }
    } catch (error) {
      console.error('Add skill error:', error);
      toast.error('Skill qo\'shishda xatolik');
    } finally {
      setAdding(false);
    }
  };

  const deleteSkill = async (skillId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/skills/verification/${skillId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        toast.success('Skill o\'chirildi');
        loadSkills();
      }
    } catch (error) {
      console.error('Delete skill error:', error);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, [searchTerm]);

  const getBadgeStats = () => {
    const gold = skills.filter(s => s.badge_type === 'gold').length;
    const silver = skills.filter(s => s.badge_type === 'silver').length;
    const bronze = skills.filter(s => s.badge_type === 'bronze').length;
    return { gold, silver, bronze, total: skills.length };
  };

  const stats = getBadgeStats();

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
          <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/30">
            <Award className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[var(--text-main)]">Skills Verification</h1>
            <p className="text-[var(--text-muted)] text-xs font-bold">Skilllaringizni tasdiqling va badge oling</p>
          </div>
        </div>
        <button 
          onClick={() => setShowLeaderboard(!showLeaderboard)}
          className="px-6 py-3 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-[var(--bg-card)]"
        >
          <Trophy size={18} />
          Leaderboard
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left - Stats & Add */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="p-6 bg-[var(--bg-surface)] rounded-[2rem] border border-[var(--border-main)]">
            <h3 className="font-black text-[var(--text-main)] mb-4">Your Badges</h3>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-yellow-400/10 rounded-2xl">
                <Crown className="text-yellow-400 mx-auto mb-1" size={24} />
                <p className="text-2xl font-black text-yellow-400">{stats.gold}</p>
                <p className="text-[10px] text-[var(--text-muted)]">Gold</p>
              </div>
              <div className="p-3 bg-gray-400/10 rounded-2xl">
                <Medal className="text-gray-400 mx-auto mb-1" size={24} />
                <p className="text-2xl font-black text-gray-400">{stats.silver}</p>
                <p className="text-[10px] text-[var(--text-muted)]">Silver</p>
              </div>
              <div className="p-3 bg-orange-400/10 rounded-2xl">
                <Star className="text-orange-400 mx-auto mb-1" size={24} />
                <p className="text-2xl font-black text-orange-400">{stats.bronze}</p>
                <p className="text-[10px] text-[var(--text-muted)]">Bronze</p>
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-2xl">
                <Award className="text-indigo-400 mx-auto mb-1" size={24} />
                <p className="text-2xl font-black text-indigo-400">{stats.total}</p>
                <p className="text-[10px] text-[var(--text-muted)]">Total</p>
              </div>
            </div>
          </div>

          {/* Add Skill */}
          <div className="p-6 bg-[var(--bg-surface)] rounded-[2rem] border border-[var(--border-main)]">
            <h3 className="font-black text-[var(--text-main)] mb-4">Add New Skill</h3>
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
              <input
                type="text"
                placeholder="Search skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-3 pl-12 pr-4 font-bold"
              />
            </div>
            
            {suggestions.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => addSkill(s.skill, s.badge, s.issuer)}
                    disabled={adding || skills.some(skill => skill.skill_name.toLowerCase() === s.skill.toLowerCase())}
                    className="w-full p-3 bg-[var(--bg-card)] rounded-xl flex items-center justify-between hover:bg-indigo-500/10 disabled:opacity-50"
                  >
                    <span className="font-bold text-sm">{s.skill}</span>
                    <div className={`px-2 py-1 rounded-lg text-[10px] font-bold ${badgeConfig[s.badge]?.color} ${badgeConfig[s.badge]?.bg}`}>
                      {s.badge?.toUpperCase()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="p-6 bg-emerald-500/10 rounded-[2rem] border border-emerald-500/20">
            <h3 className="font-black text-emerald-400 mb-3">Earn More Badges</h3>
            <ul className="text-sm text-[var(--text-muted)] space-y-2">
              <li>• 5 skills = Bronze badge</li>
              <li>• 10 skills = Silver badge</li>
              <li>• 20 skills = Gold badge</li>
              <li>• Industry certifications get Gold!</li>
            </ul>
          </div>
        </div>

        {/* Right - Skills List */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Skills */}
          <div className="p-6 bg-[var(--bg-surface)] rounded-[2rem] border border-[var(--border-main)]">
            <h3 className="font-black text-[var(--text-main)] mb-4">My Verified Skills</h3>
            {skills.length === 0 ? (
              <div className="text-center py-8">
                <Award size={48} className="text-[var(--text-muted)] mx-auto mb-4" />
                <p className="text-[var(--text-muted)]">Hozircha skill yo'q</p>
                <p className="text-[var(--text-muted)] text-sm">Yuqoridan skill qo'shing</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skills.map((skill) => {
                  const config = badgeConfig[skill.badge_type] || badgeConfig.bronze;
                  const Icon = config.icon;
                  return (
                    <div key={skill.id} className={`p-4 rounded-2xl border ${config.border} ${config.bg} flex items-center justify-between`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
                          <Icon className={config.color} size={20} />
                        </div>
                        <div>
                          <p className="font-black text-[var(--text-main)]">{skill.skill_name}</p>
                          <p className="text-xs text-[var(--text-muted)]">{skill.issued_by}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteSkill(skill.id)}
                        className="p-2 hover:bg-rose-500/20 rounded-xl"
                      >
                        <Trash2 size={16} className="text-rose-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Leaderboard */}
          {showLeaderboard && (
            <div className="p-6 bg-[var(--bg-surface)] rounded-[2rem] border border-[var(--border-main)]">
              <h3 className="font-black text-[var(--text-main)] mb-4 flex items-center gap-2">
                <Trophy className="text-yellow-400" size={24} /> Top Skill Holders
              </h3>
              <div className="space-y-3">
                {leaderboard.map((item, i) => (
                  <div key={i} className={`p-4 rounded-2xl flex items-center gap-4 ${
                    i === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' :
                    i === 1 ? 'bg-gray-400/10 border border-gray-400/30' :
                    i === 2 ? 'bg-orange-500/10 border border-orange-500/30' :
                    'bg-[var(--bg-card)]'
                  }`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${
                      i === 0 ? 'bg-yellow-500 text-white' :
                      i === 1 ? 'bg-gray-400 text-white' :
                      i === 2 ? 'bg-orange-500 text-white' :
                      'bg-[var(--bg-surface)] text-[var(--text-muted)]'
                    }`}>
                      {item.rank}
                    </div>
                    <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold">
                      {item.full_name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-[var(--text-main)]">{item.full_name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{item.skill_count} skills</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-indigo-400">{item.total_score}</p>
                      <p className="text-xs text-[var(--text-muted)]">points</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillsVerification;