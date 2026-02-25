{/* Apply Modal */ }
{
    showApplyModal && selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-3xl">
                    <h2 className="text-2xl font-bold text-gray-800">
                        Ish joyiga ariza yuborish
                    </h2>
                    <button
                        onClick={() => {
                            setShowApplyModal(false);
                            setSelectedResume(null);
                            setCoverLetter('');
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Job Info */}
                    <div className="bg-purple-50 p-4 rounded-xl">
                        <h3 className="font-bold text-lg text-gray-800">{selectedJob.title}</h3>
                        <p className="text-purple-600">{selectedJob.company}</p>
                        <p className="text-gray-600 text-sm">{selectedJob.location}</p>
                    </div>

                    {/* Resume Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Resume tanlang *
                        </label>
                        <select
                            value={selectedResume || ''}
                            onChange={(e) => setSelectedResume(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                        >
                            <option value="">Resume tanlang...</option>
                            {resumes.map((resume) => (
                                <option key={resume.id} value={resume.id}>
                                    {resume.filename || resume.file_name}
                                    {resume.full_name ? ` - ${resume.full_name}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Cover Letter */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Qo'shimcha xat (ixtiyoriy)
                        </label>
                        <textarea
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            placeholder="Nima uchun siz bu ish uchun mos ekanligingizni yozing..."
                            rows="6"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
                        />
                    </div>
                </div>

                <div className="sticky bottom-0 bg-gray-50 p-6 flex gap-4 rounded-b-3xl border-t border-gray-200">
                    <button
                        onClick={() => {
                            setShowApplyModal(false);
                            setSelectedResume(null);
                            setCoverLetter('');
                        }}
                        className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                    >
                        Bekor qilish
                    </button>
                    <button
                        onClick={submitApplication}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-colors"
                    >
                        Yuborish
                    </button>
                </div>
            </div>
        </div>
    )
}
