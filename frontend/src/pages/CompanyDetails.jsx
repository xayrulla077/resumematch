import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { companiesAPI, jobsAPI } from '../lib/api';
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
  Instagram
} from 'lucide-react';
import JobCard from '../components/JobCard';

const CompanyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
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
          const jobsRes = await jobsAPI.getAll({ search: companyData.company_name });
          // Filter exact matches just in case
          const exactJobs = (jobsRes.data.items || []).filter(
            job => job.company.toLowerCase() === companyData.company_name.toLowerCase()
          );
          setJobs(exactJobs);
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

  if (!company) {
    return null; // or empty state
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-6 lg:p-8 font-['Outfit'] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors font-bold text-sm bg-[var(--bg-surface)] py-2 px-4 rounded-xl border border-[var(--border-main)] w-fit"
        >
          <ArrowLeft size={16} />
          Orqaga
        </button>

        {/* Header Section */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2.5rem] overflow-hidden shadow-2xl">
          {/* Cover */}
          <div className="h-48 sm:h-64 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 relative">
            {company.cover_image ? (
              <img src={company.cover_image} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-indigo-500/10 flex items-center justify-center">
                 <Building2 className="w-24 h-24 text-indigo-500/20" />
              </div>
            )}
          </div>
          
          <div className="p-6 sm:p-10 relative">
            <div className="flex flex-col sm:flex-row gap-6 sm:items-end -mt-20 sm:-mt-24 mb-6">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-[2rem] bg-[var(--bg-main)] border-4 border-[var(--bg-surface)] overflow-hidden shadow-xl shrink-0">
                {company.logo_url ? (
                  <img src={company.logo_url} alt={company.company_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-indigo-500 bg-indigo-500/10">
                    <Building2 className="w-12 h-12" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 pb-2">
                <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-main)] uppercase tracking-tight mb-2">
                  {company.company_name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-[var(--text-muted)] font-bold text-xs sm:text-sm uppercase tracking-wider">
                  {company.industry && (
                    <span className="text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-full">
                      {company.industry}
                    </span>
                  )}
                  {company.location && (
                    <span className="flex items-center gap-1.5 border border-[var(--border-main)] px-3 py-1 rounded-full">
                      <MapPin size={14} /> {company.location}
                    </span>
                  )}
                  {company.company_size && (
                    <span className="flex items-center gap-1.5 border border-[var(--border-main)] px-3 py-1 rounded-full">
                      <Users size={14} /> {company.company_size} xodimlar
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10 border-t border-[var(--border-main)] pt-8">
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h3 className="text-lg font-black text-[var(--text-main)] mb-3 flex items-center gap-2">
                    Kompaniya haqida
                  </h3>
                  <p className="text-[var(--text-muted)] leading-relaxed text-sm">
                    {company.description || "Ushbu kompaniya haqida hozircha ma'lumot kiritilmagan."}
                  </p>
                </div>
              </div>
              
              <div className="space-y-6 bg-[var(--bg-main)]/50 p-6 rounded-3xl border border-[var(--border-main)]">
                <h3 className="text-lg font-black text-[var(--text-main)] border-b border-[var(--border-main)] pb-3">
                  Aloqa
                </h3>
                
                <div className="space-y-4">
                  {company.website && (
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-bold text-[var(--text-muted)] hover:text-indigo-500 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] flex items-center justify-center text-indigo-500 shrink-0">
                        <Globe size={18} />
                      </div>
                      <span className="truncate">{company.website.replace(/^https?:\/\//, '')}</span>
                    </a>
                  )}
                  
                  {company.founded_year && (
                    <div className="flex items-center gap-3 text-sm font-bold text-[var(--text-muted)]">
                      <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] flex items-center justify-center text-emerald-500 shrink-0">
                        <Calendar size={18} />
                      </div>
                      Tashkil etilgan yili: {company.founded_year}
                    </div>
                  )}

                  {(company.linkedin || company.facebook || company.instagram) && (
                    <div className="flex gap-3 pt-2">
                      {company.linkedin && (
                        <a href={company.linkedin} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-[#0077b5]/10 text-[#0077b5] flex items-center justify-center hover:bg-[#0077b5] hover:text-white transition-all">
                          <Linkedin size={18} />
                        </a>
                      )}
                      {company.facebook && (
                        <a href={company.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-[#1877f2]/10 text-[#1877f2] flex items-center justify-center hover:bg-[#1877f2] hover:text-white transition-all">
                          <Facebook size={18} />
                        </a>
                      )}
                      {company.instagram && (
                        <a href={company.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-[#e4405f]/10 text-[#e4405f] flex items-center justify-center hover:bg-[#e4405f] hover:text-white transition-all">
                          <Instagram size={18} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Existing Jobs Section */}
        <div className="pt-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-3">
              <Briefcase className="text-indigo-500" size={28} />
              Ochiq Vakansiyalar
            </h2>
            <span className="bg-indigo-500/10 text-indigo-500 font-black px-4 py-1.5 rounded-full text-sm">
              {jobs.length} ta
            </span>
          </div>

          {jobs.length > 0 ? (
            <div className="grid gap-6">
              {jobs.map(job => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
             <div className="text-center py-16 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2.5rem]">
               <div className="w-20 h-20 bg-slate-500/10 rounded-3xl flex items-center justify-center mx-auto text-slate-500/50 mb-6">
                 <Briefcase size={32} />
               </div>
               <h3 className="text-xl font-black text-[var(--text-main)] mb-2">Vakansiyalar yo'q</h3>
               <p className="text-[var(--text-muted)] font-bold text-sm">Hozircha ushbu kompaniyada ochiq vakansiyalar mavjud emas.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyDetails;
