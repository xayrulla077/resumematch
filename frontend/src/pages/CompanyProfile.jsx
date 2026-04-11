import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  Building2,
  Save,
  Loader2,
  Globe,
  MapPin,
  Calendar,
  Users,
  Link,
  Image,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const CompanyProfile = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    company_name: '',
    industry: '',
    company_size: '',
    description: '',
    website: '',
    location: '',
    founded_year: '',
    linkedin: '',
    facebook: '',
    instagram: '',
  });
  
  const [logoUrl, setLogoUrl] = useState('');
  const [coverImage, setCoverImage] = useState('');

  useEffect(() => {
    if (user?.role === 'employer') {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/companies/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setLogoUrl(data.logo_url || '');
        setCoverImage(data.cover_image || '');
      }
    } catch (error) {
      console.error('Load profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      
      const isNew = !profile.id;
      const url = isNew 
        ? 'http://127.0.0.1:8000/api/companies/profile'
        : 'http://127.0.0.1:8000/api/companies/profile';
      
      const method = isNew ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(profile)
      });
      
      if (!response.ok) throw new Error('Failed to save');
      
      toast.success('Company profile saved!');
      await loadProfile();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file) => {
    // For simplicity, using URL input - can be enhanced with file upload
    setLogoUrl(file);
    toast.success('Logo updated!');
  };

  if (user?.role !== 'employer') {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-rose-400 mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Bu sahifa faqat employerlar uchun</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Retail',
    'Manufacturing', 'Marketing', 'Consulting', 'Real Estate', 'Other'
  ];

  const companySizes = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '500+', label: '500+ employees' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-8 font-['Outfit']">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Building2 className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[var(--text-main)]">Company Profile</h1>
            <p className="text-[var(--text-muted)] text-xs font-bold">Your company information for candidates</p>
          </div>
        </div>
        <button 
          onClick={saveProfile}
          disabled={saving}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          Save Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left - Logo & Cover */}
        <div className="space-y-6">
          {/* Logo */}
          <div className="p-6 bg-[var(--bg-surface)] rounded-[2rem] border border-[var(--border-main)]">
            <h3 className="font-black text-[var(--text-main)] mb-4 flex items-center gap-2">
              <Image size={20} /> Company Logo
            </h3>
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 bg-[var(--bg-card)] rounded-2xl flex items-center justify-center mb-4 border-2 border-dashed border-[var(--border-main)]">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <Building2 size={40} className="text-[var(--text-muted)]" />
                )}
              </div>
              <input
                type="text"
                placeholder="Logo URL"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl py-2 px-3 text-sm font-bold text-center"
              />
            </div>
          </div>

          {/* Cover Image */}
          <div className="p-6 bg-[var(--bg-surface)] rounded-[2rem] border border-[var(--border-main)]">
            <h3 className="font-black text-[var(--text-main)] mb-4">Cover Image</h3>
            <div className="w-full h-32 bg-[var(--bg-card)] rounded-2xl flex items-center justify-center mb-4 border-2 border-dashed border-[var(--border-main)] overflow-hidden">
              {coverImage ? (
                <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <Image size={32} className="text-[var(--text-muted)]" />
              )}
            </div>
            <input
              type="text"
              placeholder="Cover Image URL"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl py-2 px-3 text-sm font-bold"
            />
          </div>

          {/* Tips */}
          <div className="p-6 bg-emerald-500/10 rounded-[2rem] border border-emerald-500/20">
            <h3 className="font-black text-emerald-400 mb-3">💡 Tips</h3>
            <ul className="text-sm text-[var(--text-muted)] space-y-2">
              <li>• Use high-quality images (min 200x200 for logo)</li>
              <li>• Add your company website link</li>
              <li>• Describe what makes your company special</li>
              <li>• Include your company size for transparency</li>
            </ul>
          </div>
        </div>

        {/* Right - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="p-6 bg-[var(--bg-surface)] rounded-[2rem] border border-[var(--border-main)]">
            <h3 className="font-black text-[var(--text-main)] mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">Company Name *</label>
                <input
                  type="text"
                  placeholder="Your company name"
                  value={profile.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-3 px-4 font-bold"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">Industry</label>
                <select
                  value={profile.industry}
                  onChange={(e) => handleChange('industry', e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-3 px-4 font-bold"
                >
                  <option value="">Select industry</option>
                  {industries.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">Company Size</label>
                <select
                  value={profile.company_size}
                  onChange={(e) => handleChange('company_size', e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-3 px-4 font-bold"
                >
                  <option value="">Select size</option>
                  {companySizes.map(size => (
                    <option key={size.value} value={size.value}>{size.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">Description</label>
                <textarea
                  placeholder="Tell candidates about your company..."
                  value={profile.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-3 px-4 font-bold resize-none"
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="p-6 bg-[var(--bg-surface)] rounded-[2rem] border border-[var(--border-main)]">
            <h3 className="font-black text-[var(--text-main)] mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[var(--text-muted)] mb-2 flex items-center gap-2">
                  <Globe size={14} /> Website
                </label>
                <input
                  type="url"
                  placeholder="https://yourcompany.com"
                  value={profile.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-3 px-4 font-bold"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-[var(--text-muted)] mb-2 flex items-center gap-2">
                  <MapPin size={14} /> Location
                </label>
                <input
                  type="text"
                  placeholder="City, Country"
                  value={profile.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-3 px-4 font-bold"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-[var(--text-muted)] mb-2 flex items-center gap-2">
                  <Calendar size={14} /> Founded Year
                </label>
                <input
                  type="number"
                  placeholder="2020"
                  value={profile.founded_year}
                  onChange={(e) => handleChange('founded_year', e.target.value)}
                  min="1900"
                  max="2030"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-3 px-4 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="p-6 bg-[var(--bg-surface)] rounded-[2rem] border border-[var(--border-main)]">
            <h3 className="font-black text-[var(--text-main)] mb-4">Social Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">LinkedIn</label>
                <input
                  type="url"
                  placeholder="LinkedIn URL"
                  value={profile.linkedin}
                  onChange={(e) => handleChange('linkedin', e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-3 px-4 font-bold"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">Facebook</label>
                <input
                  type="url"
                  placeholder="Facebook URL"
                  value={profile.facebook}
                  onChange={(e) => handleChange('facebook', e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-3 px-4 font-bold"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">Instagram</label>
                <input
                  type="url"
                  placeholder="Instagram URL"
                  value={profile.instagram}
                  onChange={(e) => handleChange('instagram', e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl py-3 px-4 font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;