import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    className = ""
}) => {
    if (totalPages <= 1) return null;

    const renderPageButtons = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Logic for adding ellipsis
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, 'ellipsis', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
            }
        }

        return pages.map((page, index) => {
            if (page === 'ellipsis') {
                return (
                    <div key={`ellipsis-${index}`} className="w-10 h-10 flex items-center justify-center text-slate-500">
                        <MoreHorizontal size={16} />
                    </div>
                );
            }

            const isActive = currentPage === page;

            return (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`
            w-10 h-10 rounded-xl font-black text-xs transition-all duration-300 border
            ${isActive
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
                            : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
                        }
          `}
                >
                    {page}
                </button>
            );
        });
    };

    return (
        <div className={`flex items-center justify-center gap-2 mt-12 ${className}`}>
            <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
                <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-2">
                {renderPageButtons()}
            </div>

            <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
                <ChevronRight size={18} />
            </button>
        </div>
    );
};

export default Pagination;
