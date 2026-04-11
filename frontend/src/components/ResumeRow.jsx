import { FileText, Download, BarChart3, Eye, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const ResumeRow = ({
  resume,
  user,
  getStatusBadge,
  handleDownload,
  handleAnalyze,
  setSelectedResume,
  setShowModal,
  handleDelete,
  t
}) => {
  return (
    <tr className="border-b border-[var(--border-main)] hover:bg-white/[0.02] transition-colors">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
            <FileText className="text-red-400" size={18} />
          </div>
          <span className="text-[var(--text-main)] font-black text-sm">{resume.file_name}</span>
        </div>
      </td>
      <td className="py-4 px-4 text-[var(--text-muted)] font-medium text-sm">
        {resume.uploaded_at ? format(new Date(resume.uploaded_at), 'MMM dd, yyyy HH:mm') : '-'}
      </td>
      <td className="py-4 px-4 text-[var(--text-muted)] font-medium text-sm">
        {resume.file_size ? `${(resume.file_size / 1024 / 1024).toFixed(2)} MB` : '-'}
      </td>
      <td className="py-4 px-4">
        {getStatusBadge(resume.status)}
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleDownload(resume.id, resume.file_name)}
            className="p-2 hover:bg-emerald-500/10 rounded-xl transition-colors text-emerald-400 hover:text-emerald-300"
            title={t ? t('download') : 'Yuklab olish'}
          >
            <Download size={18} />
          </button>
          {(user?.role === 'admin' || user?.role === 'employer') && resume.status !== 'analyzed' && (
            <button
              onClick={() => handleAnalyze(resume.id)}
              className="p-2 hover:bg-indigo-500/10 rounded-xl transition-colors text-indigo-400 hover:text-indigo-300"
              title={t ? t('analyze') : 'Tahlil qilish'}
            >
              <BarChart3 size={18} />
            </button>
          )}
          <button
            onClick={() => { setSelectedResume(resume); setShowModal(true); }}
            className="p-2 hover:bg-blue-500/10 rounded-xl transition-colors text-blue-400 hover:text-blue-300"
            title={t ? t('view') : 'Ko\'rish'}
          >
            <Eye size={18} />
          </button>
          <button
            onClick={() => handleDelete(resume.id)}
            className="p-2 hover:bg-rose-500/10 rounded-xl transition-colors text-rose-400 hover:text-rose-300"
            title={t ? t('delete') : 'O\'chirish'}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default ResumeRow;
