import { useState, useEffect } from 'react';
import { companiesAPI, savedJobsAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { 
  Building2, 
  Search, 
  MapPin, 
  Globe, 
  Users, 
  Verified, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Briefcase,
  Plus
} from 'lucide-react';
import Pagination from '../components/Pagination';

const Companies = () => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [followingCompanies, setFollowingCompanies] = useState([]);
  const itemsPerPage = 8;

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 100, // For now, simple client side filter if needed
        industry: industryFilter !== 'all' ? industryFilter : undefined
      };
      const response = await companiesAPI.getAll(params);
      let data = response.data || [];
      
      if (searchTerm) {
        data = data.filter(c => 
          c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.industry && c.industry.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      setCompanies(data);
    } catch (error) {
      console.error('Companies fetch error:', error);
      toast.error("Kompaniyalarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const loadFollows = async () => {
    if (user?.role !== 'candidate') return;
    try {
      const response = await savedJobsAPI.getFollowedCompanies();
      setFollowingCompanies(response.data.map(f => f.company_name));
    } catch (error) {
       console.error('Follows error:', error);
    }
  };

  useEffect(() => {
    loadCompanies();
    loadFollows();
  }, [industryFilter, searchTerm]);

  const handleToggleFollow = async (companyName) => {
    if (user?.role !== 'candidate') return;
    const isFollowing = followingCompanies.includes(companyName);
    
    try {
      if (isFollowing) {
        await savedJobsAPI.unfollowCompany(companyName);
        setFollowingCompanies(prev => prev.filter(c => c !== companyName));
        toast.success(`${companyName} kuzatishni bekor qildingiz`);
      } else {
        await savedJobsAPI.followCompany(companyName);
        setFollowingCompanies(prev => [...prev, companyName]);
        toast.success(`${companyName}ni kuzatishni boshladingiz! ✨`);
      }
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    }
  };

  const currentCompanies = companies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(companies.length / itemsPerPage);

  const industries = ['all', 'IT', 'Finance', 'Education', 'Medicine', 'Marketing', 'Logistics'];

  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-6 lg:p-8 relative overflow-hidden font-['Outfit']">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--text-main)] tracking-tight">
            Hamkor <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Kompaniyalar</span>
          </h1>
          <p className="text-[var(--text-muted)] font-bold uppercase tracking-[0.2em] text-[8px] sm:text-[10px] pl-1 border-l-2 border-indigo-500/50">
            Platformadagi eng yaxshi ish beruvchilar bilan tanishing
          </p>
        </div>

        {/* Search & Filter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 p-4 sm:p-6 rounded-3xl sm:rounded-[2.5rem] bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-2xl backdrop-blur-3xl">
          <div className="lg:col-span-8 relative group">
            <Search className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Kompaniya nomi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-2xl py-3.5 sm:py-4 pl-12 sm:pl-14 pr-6 text-[var(--text-main)] placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none font-bold text-sm"
            />
          </div>
          <div className="lg:col-span-4">
             <select 
               value={industryFilter}
               onChange={(e) => setIndustryFilter(e.target.value)}
               className="w-full bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-2xl py-3.5 sm:py-4 px-6 text-[var(--text-main)] font-bold text-sm appearance-none outline-none focus:ring-2 focus:ring-indigo-500/20"
             >
               {industries.map(i => (
                 <option key={i} value={i}>{i === 'all' ? 'Barcha sohalar' : i}</option>
               ))}
             </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-[300px] rounded-[2.5rem] bg-[var(--bg-surface)] animate-pulse border border-[var(--border-main)]" />
            ))}
          </div>
        ) : companies.length === 0 ? (
          <div className="py-24 text-center">
             <div className="w-20 h-20 bg-indigo-500/5 rounded-3xl flex items-center justify-center mx-auto text-indigo-500/30 mb-6">
                <Building2 size={40} />
             </div>
             <h3 className="text-xl font-black text-[var(--text-main)]">Hozircha kompaniyalar topilmadi</h3>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {currentCompanies.map((company, idx) => (
                <div 
                  key={company.id}
                  className="group relative p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-xl hover:translate-y-[-8px] transition-all duration-500 flex flex-col items-center text-center overflow-hidden animate-in fade-in zoom-in-95"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {/* Card Background Accent */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Logo Container */}
                  <div className="relative mb-4 sm:mb-6">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-[var(--bg-main)]/50 border border-[var(--border-main)] p-1 overflow-hidden transition-transform duration-500 group-hover:scale-110">
                      {company.logo_url ? (
                        <img src={company.logo_url} alt={company.company_name} className="w-full h-full object-cover rounded-2xl sm:rounded-[1.25rem]" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-indigo-500 bg-indigo-500/10 rounded-2xl sm:rounded-[1.25rem]">
                          <Building2 className="w-8 h-8 sm:w-10 sm:h-10" />
                        </div>
                      )}
                    </div>
                    {company.is_verified && (
                       <div className="absolute -right-1 -bottom-1 sm:-right-2 sm:-bottom-2 w-7 h-7 sm:w-8 sm:h-8 bg-indigo-600 rounded-full border-4 border-[var(--bg-surface)] flex items-center justify-center text-white shadow-lg">
                          <Verified size={12} className="sm:size-[14px]" />
                       </div>
                    )}
                  </div>

                  {/* Company Info */}
                  <div className="space-y-1 sm:space-y-2 mb-4 sm:mb-6 w-full">
                    <h3 className="text-lg sm:text-xl font-black text-[var(--text-main)] truncate uppercase tracking-tight">
                      {company.company_name}
                    </h3>
                    <div className="flex items-center justify-center gap-2 text-[var(--text-muted)] font-black text-[9px] sm:text-[10px] uppercase tracking-widest text-indigo-400">
                      <TrendingUp size={10} className="sm:size-[12px]" />
                      {company.industry || 'Boshqa'}
                    </div>
                    <div className="flex items-center justify-center gap-2 text-[var(--text-muted)] font-bold text-[10px] sm:text-xs">
                      <MapPin size={10} className="sm:size-[12px]" />
                      {company.location || 'Noma\'lum'}
                    </div>
                  </div>

                  <p className="text-[10px] sm:text-[11px] text-[var(--text-muted)] leading-relaxed mb-6 sm:mb-8 line-clamp-2">
                    {company.description || "Ushbu kompaniya haqida hozircha ma'lumot kiritilmagan."}
                  </p>

                  <div className="mt-auto w-full space-y-2 sm:space-y-3">
                    {user?.role === 'candidate' && (
                      <button 
                        onClick={() => handleToggleFollow(company.company_name)}
                        className={`w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all ${
                          followingCompanies.includes(company.company_name)
                            ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                            : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 active:scale-95'
                        }`}
                      >
                        {followingCompanies.includes(company.company_name) ? 'Kuzatilyapti' : 'Kuzatish'}
                      </button>
                    )}
                    <a 
                      href={`/company/${company.id}`}
                      className="w-full py-2.5 sm:py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all inline-block"
                    >
                      Profilni ko'rish
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Companies;
