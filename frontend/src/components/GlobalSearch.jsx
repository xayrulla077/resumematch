import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Briefcase, FileText, Building2, User, Loader2, ArrowRight } from 'lucide-react';
import axios from 'axios';

const GlobalSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeType, setActiveType] = useState('all');
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/search/suggestions?q=${query}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setSuggestions(res.data.suggestions || []);
      } catch (error) {
        console.error('Suggestions error:', error);
      }
    };
    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setShowResults(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/search/search?q=${query}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setResults(res.data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = activeType === 'all' 
    ? results?.results 
    : { [activeType]: results?.results[activeType] || [] };

  const totalCount = results ? Object.values(results.results).flat().length : 0;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'jobs': return <Briefcase className="w-4 h-4" />;
      case 'resumes': return <FileText className="w-4 h-4" />;
      case 'companies': return <Building2 className="w-4 h-4" />;
      case 'users': return <User className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="relative" ref={searchRef}>
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder="Search jobs, companies, resumes..."
          className="w-80 px-12 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-main)] font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setResults(null); setShowResults(false); }}
            className="absolute right-4 top-1/2 -translate-y-1/2"
          >
            <X className="w-5 h-5 text-[var(--text-muted)] hover:text-[var(--text-main)]" />
          </button>
        )}
      </form>

      {/* Results Dropdown */}
      {showResults && (
        <div className="absolute top-full mt-2 w-[500px] bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl z-50 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
            </div>
          ) : results ? (
            <>
              {/* Type Filter */}
              <div className="flex gap-2 p-4 border-b border-[var(--border-main)] overflow-x-auto">
                <button
                  onClick={() => setActiveType('all')}
                  className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap ${
                    activeType === 'all' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-[var(--bg-main)] text-[var(--text-muted)]'
                  }`}
                >
                  All ({totalCount})
                </button>
                {Object.keys(results.results).map(type => (
                  <button
                    key={type}
                    onClick={() => setActiveType(type)}
                    className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap flex items-center gap-2 ${
                      activeType === type 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-[var(--bg-main)] text-[var(--text-muted)]'
                    }`}
                  >
                    {getTypeIcon(type)}
                    {type.charAt(0).toUpperCase() + type.slice(1)} ({results.results[type].length})
                  </button>
                ))}
              </div>

              {/* Results List */}
              <div className="max-h-[400px] overflow-y-auto">
                {Object.entries(filteredResults).map(([type, items]) => (
                  items.length > 0 && (
                    <div key={type} className="p-4">
                      <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase mb-3 flex items-center gap-2">
                        {getTypeIcon(type)}
                        {type}
                      </h4>
                      <div className="space-y-2">
                        {items.slice(0, 5).map((item, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              if (type === 'jobs') navigate(`/jobs?id=${item.id}`);
                              if (type === 'companies') navigate(`/companies?search=${item.name || item.company}`);
                              setShowResults(false);
                            }}
                            className="w-full p-3 rounded-xl bg-[var(--bg-main)] hover:bg-[var(--bg-surface)] border border-[var(--border-main)] text-left transition-colors flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold text-[var(--text-main)]">
                                {item.title || item.name || item.full_name || item.company}
                              </p>
                              {item.company && (
                                <p className="text-sm text-[var(--text-muted)]">{item.company}</p>
                              )}
                              {item.location && (
                                <p className="text-sm text-[var(--text-muted)]">{item.location}</p>
                              )}
                            </div>
                            <ArrowRight className="w-4 h-4 text-[var(--text-muted)]" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                ))}
                {totalCount === 0 && (
                  <div className="p-8 text-center text-[var(--text-muted)]">
                    No results found for "{query}"
                  </div>
                )}
              </div>
            </>
          ) : suggestions.length > 0 ? (
            <div className="p-4">
              <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase mb-3">Suggestions</h4>
              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setQuery(s.value); }}
                    className="w-full p-3 rounded-xl bg-[var(--bg-main)] hover:bg-[var(--bg-surface)] text-left transition-colors flex items-center gap-3"
                  >
                    {getTypeIcon(s.type)}
                    <span className="text-[var(--text-main)]">{s.value}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : query.length >= 2 ? (
            <div className="p-8 text-center text-[var(--text-muted)]">
              Type to search...
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;