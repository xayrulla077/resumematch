import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { companiesAPI, jobsAPI, reviewsAPI } from '../lib/api';
import { toast } from 'sonner';
import { 
  Building2, 
  MapPin, 
  Globe, 
  Calendar, 
  ArrowLeft,
  Briefcase,
  Users,
  Linkedin,
  Facebook,
  Instagram,
  Phone,
  Mail,
  Clock,
  Star,
  User2,
  Image as ImageIcon,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Info
} from 'lucide-react';
import JobCard from '../components/JobCard';

const CompanyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [reviews, setReviews] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        // GET company profile
        const companyRes = await companiesAPI.getProfile(id);
        const companyData = companyRes.data;
        setCompany(companyData);

        // GET company jobs (by searching company name)
        if (companyData && companyData.company_name) {
          const [jobsRes, reviewsRes] = await Promise.all([
            jobsAPI.getAll({ search: companyData.company_name }),
            reviewsAPI.getCompany(companyData.company_name)
          ]);

          // Filter exact matches for jobs just in case
          const exactJobs = (jobsRes.data.items || []).filter(
            job => job.company.toLowerCase() === companyData.company_name.toLowerCase()
          );
          setJobs(exactJobs);
          setReviews(reviewsRes.data);
        }
      } catch (error) {
        console.error('Error fetching company details:', error);
        toast.error('Kompaniya ma\'lumotlarini yuklab bo\'lmadi');
        navigate('/companies');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCompanyData();
    }
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-main)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black italic text-xl animate-pulse">
            RM
          </div>
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest animate-pulse">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!company) return null;

  // Safe parsers for JSON strings
  const gallery = (() => {
    try { return JSON.parse(company.gallery_images || '[]'); } catch { return []; }
  })();
  const founders = (() => {
    try { return JSON.parse(company.founders || '[]'); } catch { return []; }
  })();

  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-4 sm:p-8 font-['Outfit'] relative overflow-x-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto space-y-8 relative z-10 pb-20">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors font-bold text-sm bg-[var(--bg-surface)] py-3 px-5 rounded-2xl border border-[var(--border-main)] w-fit shadow-lg shadow-black/5"
        >
          <ArrowLeft size={16} />
          Orqaga qaytish
        </button>

        {/* ── HEADER CARD ──────────────────────────────────────────────────────── */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[3rem] overflow-hidden shadow-2xl shadow-indigo-500/5">
          {/* Cover */}
          <div className="h-56 sm:h-80 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 relative">
            {company.cover_image ? (
              <img src={company.cover_image} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-indigo-500/10 flex items-center justify-center">
                 <Building2 className="w-32 h-32 text-indigo-500/10" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-surface)] to-transparent opacity-60" />
          </div>
          
          <div className="px-6 sm:px-12 pb-10 relative">
            <div className="flex flex-col md:flex-row gap-8 md:items-end -mt-24 sm:-mt-28 mb-8">
              <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-[2.5rem] bg-[var(--bg-main)] border-8 border-[var(--bg-surface)] overflow-hidden shadow-2xl shrink-0 group">
                {company.logo_url ? (
                  <img src={company.logo_url} alt={company.company_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-indigo-500 bg-indigo-500/10">
                    <Building2 className="w-16 h-16" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-4xl sm:text-5xl font-black text-[var(--text-main)] tracking-tight">
                    {company.company_name}
                  </h1>
                  {reviews?.average_rating > 0 && (
                    <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-500 px-4 py-1.5 rounded-2xl font-black text-sm border border-amber-500/20">
                      <Star size={16} className="fill-amber-500" />
                      {reviews.average_rating}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-5 text-[var(--text-muted)] font-black text-xs uppercase tracking-[0.15em]">
                  {company.industry && (
                    <span className="text-indigo-400 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      {company.industry}
                    </span>
                  )}
                  {company.location && (
                    <span className="flex items-center gap-2">
                      <MapPin size={14} className="text-rose-500" /> {company.location}
                    </span>
                  )}
                  {company.company_size && (
                    <span className="flex items-center gap-2">
                      <Users size={14} className="text-blue-500" /> {company.company_size} xodim
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-4 border-t border-[var(--border-main)]/50 pt-10">
              {/* About & Gallery */}
              <div className="lg:col-span-2 space-y-12">
                <div>
                  <h3 className="text-xl font-black text-[var(--text-main)] mb-5 flex items-center gap-3">
                    <Info className="text-indigo-500" size={22} />
                    Kompaniya haqida
                  </h3>
                  <p className="text-[var(--text-muted)] leading-relaxed text-base font-medium">
                    {company.description || "Ushbu kompaniya haqida hozircha batafsil ma'lumot kiritilmagan."}
                  </p>
                </div>

                {/* Gallery */}
                {gallery.length > 0 && (
                  <div>
                    <h3 className="text-xl font-black text-[var(--text-main)] mb-5 flex items-center gap-3">
                      <ImageIcon className="text-purple-500" size={22} />
                      Galereya
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {gallery.map((url, i) => (
                        <div key={i} className={`rounded-3xl overflow-hidden shadow-xl border border-[var(--border-main)] aspect-[4/3] ${i === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}`}>
                          <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Founders */}
                {founders.length > 0 && (
                  <div>
                    <h3 className="text-xl font-black text-[var(--text-main)] mb-5 flex items-center gap-3">
                      <User2 className="text-teal-500" size={22} />
                      Jamoa va Asoschilar
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {founders.map((f, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 bg-[var(--bg-main)]/40 border border-[var(--border-main)] rounded-2xl hover:border-teal-500/30 transition-all">
                          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 flex items-center justify-center overflow-hidden shrink-0">
                            {f.photo ? (
                              <img src={f.photo} alt={f.name} className="w-full h-full object-cover" />
                            ) : (
                              <User2 size={24} className="text-teal-500/50" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-[var(--text-main)]">{f.name}</p>
                            <p className="text-[var(--text-muted)] text-xs font-black uppercase tracking-widest">{f.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Sidebar Info */}
              <div className="space-y-8">
                {/* Contact Card */}
                <div className="space-y-6 bg-indigo-500/5 p-8 rounded-[2.5rem] border border-indigo-500/10">
                  <h3 className="text-lg font-black text-[var(--text-main)] border-b border-indigo-500/10 pb-4">
                    Aloqa va Ma'lumot
                  </h3>
                  
                  <div className="space-y-5">
                    {company.phone && (
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-[var(--bg-surface)] border border-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0 shadow-lg shadow-indigo-500/5">
                          <Phone size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Telefon</p>
                          <p className="text-sm font-bold text-[var(--text-main)]">{company.phone}</p>
                        </div>
                      </div>
                    )}

                    {company.email && (
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-[var(--bg-surface)] border border-rose-500/10 flex items-center justify-center text-rose-500 shrink-0 shadow-lg shadow-rose-500/5">
                          <Mail size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Elektron pochta</p>
                          <p className="text-sm font-bold text-[var(--text-main)]">{company.email}</p>
                        </div>
                      </div>
                    )}

                    {company.website && (
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group">
                        <div className="w-10 h-10 rounded-2xl bg-[var(--bg-surface)] border border-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 shadow-lg shadow-blue-500/5 group-hover:scale-110 transition-transform">
                          <Globe size={18} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Veb-sayt</p>
                          <p className="text-sm font-bold text-[var(--text-main)] truncate">{company.website.replace(/^https?:\/\//, '')}</p>
                        </div>
                      </a>
                    )}
                    
                    {company.founded_year && (
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-[var(--bg-surface)] border border-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 shadow-lg shadow-emerald-500/5">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Tashkil topgan</p>
                          <p className="text-sm font-bold text-[var(--text-main)]">{company.founded_year}-yil</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Social links */}
                  {(company.linkedin || company.facebook || company.instagram) && (
                    <div className="flex gap-4 pt-4">
                      {company.linkedin && (
                        <a href={company.linkedin} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-[#0077b5]/10 text-[#0077b5] flex items-center justify-center hover:bg-[#0077b5] hover:text-white transition-all shadow-lg hover:-translate-y-1">
                          <Linkedin size={20} />
                        </a>
                      )}
                      {company.facebook && (
                        <a href={company.facebook} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-[#1877f2]/10 text-[#1877f2] flex items-center justify-center hover:bg-[#1877f2] hover:text-white transition-all shadow-lg hover:-translate-y-1">
                          <Facebook size={20} />
                        </a>
                      )}
                      {company.instagram && (
                        <a href={company.instagram} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-[#e4405f]/10 text-[#e4405f] flex items-center justify-center hover:bg-[#e4405f] hover:text-white transition-all shadow-lg hover:-translate-y-1">
                          <Instagram size={20} />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Working Hours Card */}
                {company.work_hours_start && (
                  <div className="p-8 bg-amber-500/5 border border-amber-500/10 rounded-[2.5rem] space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                        <Clock size={20} />
                      </div>
                      <h4 className="font-black text-[var(--text-main)] text-sm uppercase tracking-widest">Ish Rejimi</h4>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-amber-600/80">{company.work_days || 'Dushanba - Juma'}</p>
                      <p className="text-2xl font-black text-[var(--text-main)]">{company.work_hours_start} — {company.work_hours_end}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── JOBS SECTION ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
             <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black text-[var(--text-main)] flex items-center gap-4">
                <Briefcase className="text-indigo-500" size={32} />
                Vakansiyalar
              </h2>
              <span className="bg-indigo-600 text-white font-black px-5 py-2 rounded-2xl text-sm shadow-xl shadow-indigo-600/20">
                {jobs.length} ta ochiq
              </span>
            </div>

            {jobs.length > 0 ? (
              <div className="grid gap-6">
                {jobs.map(job => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
                <div className="text-center py-20 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[3rem] shadow-xl shadow-black/5">
                  <div className="w-24 h-24 bg-slate-500/5 rounded-[2rem] flex items-center justify-center mx-auto text-slate-400 mb-6">
                    <Briefcase size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-[var(--text-main)] mb-3">Hozircha vakansiyalar yo'q</h3>
                  <p className="text-[var(--text-muted)] font-bold text-sm max-w-xs mx-auto">Tez orada yangi ish o'rinlari paydo bo'lishi mumkin. Kuzatib boring!</p>
                </div>
            )}
          </div>

          {/* ── REVIEWS SECTION ────────────────────────────────────────────────────── */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black text-[var(--text-main)] flex items-center gap-4">
                <MessageSquare className="text-amber-500" size={32} />
                Izohlar
              </h2>
              <span className="bg-amber-500 text-white font-black px-5 py-2 rounded-2xl text-sm shadow-xl shadow-amber-500/20 text-center min-w-[70px]">
                {reviews?.total_reviews || 0}
              </span>
            </div>

            {reviews?.reviews?.length > 0 ? (
              <div className="space-y-6">
                {reviews.reviews.map((r, i) => (
                  <div key={i} className="bg-[var(--bg-surface)] border border-[var(--border-main)] p-8 rounded-[2.5rem] shadow-xl shadow-black/5 transition-all hover:shadow-indigo-500/5 hover:border-indigo-500/20">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                          {r.user_name?.[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-[var(--text-main)] text-lg">{r.user_name}</p>
                          <p className="text-[var(--text-muted)] text-xs font-black uppercase tracking-widest">{r.work_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-xl font-black text-sm">
                        <Star size={14} className="fill-amber-500" />
                        {r.rating}
                      </div>
                    </div>

                    <h4 className="text-xl font-black text-[var(--text-main)] mb-4">{r.title}</h4>
                    
                    <div className="space-y-4">
                      {r.pros && (
                        <div className="flex gap-4">
                          <ThumbsUp className="w-5 h-5 text-emerald-500 shrink-0 mt-1" />
                          <p className="text-[var(--text-main)] text-sm font-medium leading-relaxed">
                            <span className="font-black text-emerald-500 uppercase text-[10px] tracking-widest block mb-0.5">Ijobiy:</span>
                            {r.pros}
                          </p>
                        </div>
                      )}
                      {r.cons && (
                        <div className="flex gap-4">
                          <ThumbsDown className="w-5 h-5 text-rose-500 shrink-0 mt-1" />
                          <p className="text-[var(--text-main)] text-sm font-medium leading-relaxed">
                            <span className="font-black text-rose-500 uppercase text-[10px] tracking-widest block mb-0.5">Salbiy:</span>
                            {r.cons}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
                <div className="text-center py-20 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[3rem] shadow-xl shadow-black/5">
                  <div className="w-24 h-24 bg-amber-500/5 rounded-[2rem] flex items-center justify-center mx-auto text-amber-400 mb-6">
                    <MessageSquare size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-[var(--text-main)] mb-3">Izohlar yo'q</h3>
                  <p className="text-[var(--text-muted)] font-bold text-sm max-w-xs mx-auto">Birinchi bo'lib o'z fikringizni bildiring!</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetails;
