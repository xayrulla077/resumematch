import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  Building2, Save, Loader2, Globe, MapPin, Calendar, Users, Image,
  AlertCircle, Phone, Mail, Clock, Plus, Trash2, User2, ChevronDown,
  CheckCircle2, Camera, Link2
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;
const token = () => localStorage.getItem('token');

const DAYS_OPTIONS = [
  'Dushanba - Juma',
  'Dushanba - Shanba',
  'Dushanba - Yakshanba',
  'Har kuni',
  'Faqat ish kunlari',
];

const INDUSTRIES = [
  'Technology','Healthcare','Finance','Education','Retail',
  'Manufacturing','Marketing','Consulting','Real Estate','Other'
];
const SIZES = [
  { value: '1-10', label: '1-10 xodim' },
  { value: '11-50', label: '11-50 xodim' },
  { value: '51-200', label: '51-200 xodim' },
  { value: '201-500', label: '201-500 xodim' },
  { value: '500+', label: '500+ xodim' },
];

const emptyFounder = () => ({ name: '', role: '', photo: '' });

// ── Input component ──────────────────────────────────────────────────────────
const Field = ({ label, icon: Icon, children }) => (
  <div>
    <label className="flex items-center gap-2 text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">
      {Icon && <Icon size={13} />} {label}
    </label>
    {children}
  </div>
);

const Input = ({ className = '', ...props }) => (
  <input
    {...props}
    className={`w-full bg-[var(--bg-main)] border border-[var(--border-main)] focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10 rounded-2xl py-3 px-4 text-sm font-bold text-[var(--text-main)] outline-none transition-all placeholder:text-[var(--text-muted)]/50 ${className}`}
  />
);

const Textarea = ({ className = '', ...props }) => (
  <textarea
    {...props}
    className={`w-full bg-[var(--bg-main)] border border-[var(--border-main)] focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10 rounded-2xl py-3 px-4 text-sm font-bold text-[var(--text-main)] outline-none transition-all resize-none placeholder:text-[var(--text-muted)]/50 ${className}`}
  />
);

const Select = ({ children, className = '', ...props }) => (
  <select
    {...props}
    className={`w-full bg-[var(--bg-main)] border border-[var(--border-main)] focus:border-indigo-500/60 rounded-2xl py-3 px-4 text-sm font-bold text-[var(--text-main)] outline-none transition-all appearance-none ${className}`}
  >
    {children}
  </select>
);

// ── Section wrapper ──────────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, color = 'indigo', children }) => (
  <div className="p-6 sm:p-8 bg-[var(--bg-surface)] rounded-[2rem] border border-[var(--border-main)] shadow-xl space-y-6">
    <h3 className="flex items-center gap-3 font-black text-[var(--text-main)] text-base">
      <span className={`w-9 h-9 rounded-xl bg-${color}-500/10 text-${color}-500 border border-${color}-500/20 flex items-center justify-center`}>
        <Icon size={17} />
      </span>
      {title}
    </h3>
    {children}
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────
const CompanyProfile = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    company_name: '', industry: '', company_size: '', description: '',
    website: '', location: '', founded_year: '',
    phone: '', email: '',
    work_hours_start: '09:00', work_hours_end: '18:00', work_days: 'Dushanba - Juma',
    linkedin: '', facebook: '', instagram: '',
    logo_url: '', cover_image: '',
    gallery_images: '[]',
    founders: '[]',
  });

  const [gallery, setGallery] = useState([]);   // array of URL strings
  const [founders, setFounders] = useState([]);  // array of {name,role,photo}
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  useEffect(() => { if (user?.role === 'employer') loadProfile(); }, [user]);

  const loadProfile = async () => {
    try {
      const r = await fetch(`${API}/api/companies/profile`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (r.ok) {
        const data = await r.json();
        setProfile(p => ({ ...p, ...data }));
        try { setGallery(JSON.parse(data.gallery_images || '[]')); } catch { setGallery([]); }
        try { setFounders(JSON.parse(data.founders || '[]')); } catch { setFounders([]); }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const set = (field, value) => setProfile(p => ({ ...p, [field]: value }));

  const saveProfile = async () => {
    if (!profile.company_name.trim()) return toast.error("Kompaniya nomi kiritilishi shart!");
    try {
      setSaving(true);
      const payload = {
        ...profile,
        gallery_images: JSON.stringify(gallery),
        founders: JSON.stringify(founders),
      };
      const isNew = !profile.id;
      const r = await fetch(`${API}/api/companies/profile`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error();
      toast.success('✅ Profil muvaffaqiyatli saqlandi!');
      await loadProfile();
    } catch {
      toast.error('❌ Saqlashda xatolik yuz berdi');
    } finally { setSaving(false); }
  };

  // Gallery helpers
  const addGalleryImage = () => {
    if (!newGalleryUrl.trim()) return;
    setGallery(g => [...g, newGalleryUrl.trim()]);
    setNewGalleryUrl('');
  };
  const removeGallery = (i) => setGallery(g => g.filter((_, idx) => idx !== i));

  // Founders helpers
  const addFounder = () => setFounders(f => [...f, emptyFounder()]);
  const updateFounder = (i, field, val) => setFounders(f => f.map((x, idx) => idx === i ? { ...x, [field]: val } : x));
  const removeFounder = (i) => setFounders(f => f.filter((_, idx) => idx !== i));

  if (user?.role !== 'employer') return (
    <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center font-['Outfit']">
      <div className="text-center p-10">
        <AlertCircle size={56} className="text-rose-400 mx-auto mb-5 opacity-70" />
        <p className="text-[var(--text-muted)] font-bold text-lg">Bu sahifa faqat employer foydalanuvchilar uchun</p>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center animate-pulse">
          <Building2 size={24} className="text-white" />
        </div>
        <p className="text-[var(--text-muted)] text-xs font-black uppercase tracking-widest animate-pulse">Yuklanmoqda...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-4 sm:p-8 font-['Outfit'] relative overflow-hidden">
      {/* BG decor */}
      <div className="absolute top-[-10%] left-[-5%] w-[35%] h-[35%] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/30">
              <Building2 className="text-white" size={26} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-main)]">Kompaniya Profili</h1>
              <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mt-0.5">Nomzodlar uchun ma'lumotlar</p>
            </div>
          </div>
          <button
            onClick={saveProfile}
            disabled={saving}
            className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-2xl font-black text-sm shadow-2xl shadow-indigo-500/25 transition-all active:scale-95"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── LEFT COLUMN ────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Logo & Cover preview */}
            <Section title="Logotip & Muqova" icon={Camera} color="purple">
              <div>
                <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 block">Logotip URL</label>
                <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-[var(--border-main)] bg-[var(--bg-main)] flex items-center justify-center mb-3 overflow-hidden mx-auto">
                  {profile.logo_url
                    ? <img src={profile.logo_url} alt="logo" className="w-full h-full object-cover" />
                    : <Building2 size={36} className="text-[var(--text-muted)]/30" />}
                </div>
                <Input
                  type="text" placeholder="https://..." value={profile.logo_url}
                  onChange={e => set('logo_url', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 block">Muqova rasmi URL</label>
                <div className="w-full h-24 rounded-2xl border-2 border-dashed border-[var(--border-main)] bg-[var(--bg-main)] flex items-center justify-center mb-3 overflow-hidden">
                  {profile.cover_image
                    ? <img src={profile.cover_image} alt="cover" className="w-full h-full object-cover" />
                    : <Image size={28} className="text-[var(--text-muted)]/30" />}
                </div>
                <Input
                  type="text" placeholder="https://..." value={profile.cover_image}
                  onChange={e => set('cover_image', e.target.value)}
                />
              </div>
            </Section>

            {/* Tips */}
            <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] space-y-3">
              <h4 className="font-black text-emerald-400 text-sm flex items-center gap-2"><CheckCircle2 size={15}/> Maslahatlar</h4>
              <ul className="text-xs text-[var(--text-muted)] space-y-2 leading-relaxed">
                <li>• Logotip kamida 200×200px bo'lsin</li>
                <li>• Muqova 1200×400px tavsiya etiladi</li>
                <li>• Galereya kompaniyaning muhitini ko'rsatsin</li>
                <li>• Tashkilotchilar ma'lumotlari ishonch oshiradi</li>
              </ul>
            </div>
          </div>

          {/* ── RIGHT COLUMN ───────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Basic Info */}
            <Section title="Asosiy Ma'lumot" icon={Building2} color="indigo">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Field label="Kompaniya Nomi *" icon={Building2}>
                    <Input placeholder="Masalan: Google Tech" value={profile.company_name}
                      onChange={e => set('company_name', e.target.value)} />
                  </Field>
                </div>
                <Field label="Soha" icon={ChevronDown}>
                  <div className="relative">
                    <Select value={profile.industry} onChange={e => set('industry', e.target.value)}>
                      <option value="">Tanlang...</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </Select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                  </div>
                </Field>
                <Field label="Xodimlar Soni" icon={Users}>
                  <div className="relative">
                    <Select value={profile.company_size} onChange={e => set('company_size', e.target.value)}>
                      <option value="">Tanlang...</option>
                      {SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </Select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                  </div>
                </Field>
                <div className="md:col-span-2">
                  <Field label="Kompaniya Haqida" icon={Building2}>
                    <Textarea rows={4} placeholder="Kompaniyangiz haqida nomzodlarga qisqacha yozing..."
                      value={profile.description} onChange={e => set('description', e.target.value)} />
                  </Field>
                </div>
              </div>
            </Section>

            {/* Contact Info */}
            <Section title="Aloqa Ma'lumotlari" icon={Phone} color="emerald">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Telefon" icon={Phone}>
                  <Input type="tel" placeholder="+998 90 123 45 67" value={profile.phone}
                    onChange={e => set('phone', e.target.value)} />
                </Field>
                <Field label="Email" icon={Mail}>
                  <Input type="email" placeholder="info@company.com" value={profile.email}
                    onChange={e => set('email', e.target.value)} />
                </Field>
                <Field label="Manzil" icon={MapPin}>
                  <Input placeholder="Toshkent, O'zbekiston" value={profile.location}
                    onChange={e => set('location', e.target.value)} />
                </Field>
                <Field label="Tashkil etilgan yil" icon={Calendar}>
                  <Input type="number" placeholder="2020" min="1900" max="2030"
                    value={profile.founded_year} onChange={e => set('founded_year', e.target.value)} />
                </Field>
                <Field label="Veb-Sayt" icon={Globe}>
                  <Input type="url" placeholder="https://company.uz" value={profile.website}
                    onChange={e => set('website', e.target.value)} />
                </Field>
              </div>
            </Section>

            {/* Work Hours */}
            <Section title="Ish Vaqti" icon={Clock} color="amber">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Boshlanish" icon={Clock}>
                  <Input type="time" value={profile.work_hours_start}
                    onChange={e => set('work_hours_start', e.target.value)} />
                </Field>
                <Field label="Tugash" icon={Clock}>
                  <Input type="time" value={profile.work_hours_end}
                    onChange={e => set('work_hours_end', e.target.value)} />
                </Field>
                <Field label="Ish kunlari" icon={Calendar}>
                  <div className="relative">
                    <Select value={profile.work_days} onChange={e => set('work_days', e.target.value)}>
                      {DAYS_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </Select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                  </div>
                </Field>
              </div>
              {/* Preview */}
              {profile.work_hours_start && profile.work_hours_end && (
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-center gap-3 text-sm font-black text-amber-400">
                  <Clock size={16} />
                  <span>{profile.work_days} · {profile.work_hours_start} – {profile.work_hours_end}</span>
                </div>
              )}
            </Section>

            {/* Social Links */}
            <Section title="Ijtimoiy Tarmoqlar" icon={Link2} color="blue">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="LinkedIn">
                  <Input type="url" placeholder="linkedin.com/company/..." value={profile.linkedin}
                    onChange={e => set('linkedin', e.target.value)} />
                </Field>
                <Field label="Facebook">
                  <Input type="url" placeholder="facebook.com/..." value={profile.facebook}
                    onChange={e => set('facebook', e.target.value)} />
                </Field>
                <Field label="Instagram">
                  <Input type="url" placeholder="instagram.com/..." value={profile.instagram}
                    onChange={e => set('instagram', e.target.value)} />
                </Field>
              </div>
            </Section>

            {/* Gallery */}
            <Section title="Rasm Galereyasi" icon={Image} color="pink">
              <p className="text-xs text-[var(--text-muted)] font-bold -mt-2">Kompaniya muhiti, ofis, jamoa rasmlari</p>

              {/* Grid of images */}
              {gallery.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {gallery.map((url, i) => (
                    <div key={i} className="relative group rounded-2xl overflow-hidden aspect-video bg-[var(--bg-main)] border border-[var(--border-main)]">
                      <img src={url} alt={`gallery-${i}`} className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; }} />
                      <button onClick={() => removeGallery(i)}
                        className="absolute top-2 right-2 w-7 h-7 bg-rose-600 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
                        <Trash2 size={13} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add image */}
              <div className="flex gap-3">
                <Input placeholder="Rasm URL manzilini kiriting..." value={newGalleryUrl}
                  onChange={e => setNewGalleryUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addGalleryImage()} />
                <button onClick={addGalleryImage}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm flex items-center gap-2 shrink-0 transition-all shadow-lg">
                  <Plus size={16} /> Qo'shish
                </button>
              </div>
            </Section>

            {/* Founders */}
            <Section title="Kompaniya Tashkilotchilari" icon={User2} color="teal">
              <p className="text-xs text-[var(--text-muted)] font-bold -mt-2">Rahbariyat va asoschilar</p>

              <div className="space-y-4">
                {founders.map((f, i) => (
                  <div key={i} className="p-5 bg-[var(--bg-main)]/70 border border-[var(--border-main)] rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center overflow-hidden">
                          {f.photo
                            ? <img src={f.photo} alt={f.name} className="w-full h-full object-cover" />
                            : <User2 size={18} className="text-teal-500" />}
                        </div>
                        <span className="text-sm font-black text-[var(--text-main)]">{f.name || `Tashkilotchi ${i+1}`}</span>
                      </div>
                      <button onClick={() => removeFounder(i)}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input placeholder="Ism Familiya" value={f.name}
                        onChange={e => updateFounder(i, 'name', e.target.value)} />
                      <Input placeholder="Lavozim (CEO, CTO...)" value={f.role}
                        onChange={e => updateFounder(i, 'role', e.target.value)} />
                      <Input placeholder="Foto URL" value={f.photo}
                        onChange={e => updateFounder(i, 'photo', e.target.value)} />
                    </div>
                  </div>
                ))}

                <button onClick={addFounder}
                  className="w-full py-4 border-2 border-dashed border-[var(--border-main)] hover:border-teal-500/40 hover:bg-teal-500/5 text-[var(--text-muted)] hover:text-teal-400 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all">
                  <Plus size={16} /> Tashkilotchi/Rahbar Qo'shish
                </button>
              </div>
            </Section>

            {/* Save button bottom */}
            <button onClick={saveProfile} disabled={saving}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-2xl shadow-indigo-500/25 transition-all active:scale-95">
              {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              {saving ? 'Saqlanmoqda...' : 'Profilni Saqlash'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;