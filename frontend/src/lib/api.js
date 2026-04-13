import axios from 'axios';

const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Only remove token and redirect if it's a clear auth failure
            const url = error.config?.url || '';
            
            // Don't redirect on these endpoints - they might have other issues
            const noRedirectUrls = ['/auth/me', '/auth/login'];
            const shouldRedirect = !noRedirectUrls.some(u => url.includes(u));
            
            if (shouldRedirect) {
                localStorage.removeItem('token');
                // Only redirect if not already on login/register page
                if (window.location.pathname !== '/login' && 
                    window.location.pathname !== '/register' && 
                    window.location.pathname !== '/') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export const resumesAPI = {
    getAll: (params) => api.get('/resumes/', { params }),
    upload: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/resumes/upload', formData);
    },
    build: (data) => api.post('/resumes/build', data),
    delete: (id) => api.delete(`/resumes/${id}`),
    getAIFeedback: (id) => api.post(`/resumes/${id}/ai-feedback`),
    download: (id) => api.get(`/resumes/${id}/download`, { responseType: 'blob' }),
    // Task 5: Template support
    generatePDF: (data, template = 'modern') => api.post('/resumes/generate-pdf', { ...data, template }, { responseType: 'blob' }),
};

export const careerAPI = {
    generateCoverLetter: (resumeId, jobId) => api.post('/career/generate-cover-letter', null, { params: { resume_id: resumeId, job_id: jobId } }),
    analyzeSkillGap: (resumeId, jobId) => api.post('/career/skill-gap-analysis', null, { params: { resume_id: resumeId, job_id: jobId } }),
    getCareerPath: () => api.get('/career/career-path'),
    getLearningPath: (skill) => api.get(`/career/learning-path/${skill}`),
};

export const jobsAPI = {
    getAll: (params) => api.get('/jobs/', { params }),
    getMyJobs: (params) => api.get('/jobs/my-jobs', { params }),
    getRecommended: (params) => api.get('/jobs/recommended', { params }),
    create: (data) => api.post('/jobs/', data),
    update: (id, data) => api.put(`/jobs/${id}`, data),
    delete: (id) => api.delete(`/jobs/${id}`),
};

export const applicationsAPI = {
    apply: (jobId, resumeId, cover_letter) => api.post('/applications/apply', null, {
        params: { job_id: jobId, resume_id: resumeId, cover_letter }
    }),
    getMyApplications: () => api.get('/applications/my-applications'),
    getJobApplicants: (jobId, params) => api.get(`/applications/job/${jobId}/applicants`, { params }),
    updateStatus: (applicationId, status, adminNotes) =>
        api.put(`/applications/${applicationId}/status`, null, {
            params: { status, admin_notes: adminNotes }
        }),
    generateInterviewQuestions: (applicationId) =>
        api.post(`/applications/${applicationId}/generate-interview-questions`),
    submitInterviewAnswers: (applicationId, answers) =>
        api.post(`/applications/${applicationId}/submit-interview-answers`, answers),
    getNotificationsCount: () => api.get('/applications/notifications/count'),
};

export const adminAPI = {
    getSystemStats: () => api.get('/admin/system-stats'),
    getDBOverview: () => api.get('/admin/db-overview'),
    getActivityLogs: (params) => api.get('/admin/activity-logs', { params }),
    getUsers: () => api.get('/admin/users'),
    createBackup: () => api.get('/admin/backup', { responseType: 'blob' }),
};

export const analyticsAPI = {
    getOverview: (days = 30) => api.get('/analytics/overview', { params: { days } }),
    getTopSkills: (days = 30) => api.get('/analytics/top-skills', { params: { days } }),
    getMatchStats: (days = 30) => api.get('/analytics/match-stats', { params: { days } }),
    getMonthlyStats: () => api.get('/analytics/monthly-stats'),
    exportApplicants: (jobId) => api.get(`/analytics/export/${jobId}`, { responseType: 'blob' }),
    exportApplicantsPDF: (jobId) => api.get(`/analytics/export/${jobId}/pdf`, { responseType: 'blob' }),
    exportResumes: () => api.get('/analytics/export-resumes', { responseType: 'blob' }),
    exportJobs: () => api.get('/analytics/export-jobs', { responseType: 'blob' }),
    exportAll: () => api.get('/analytics/export-all', { responseType: 'blob' }),
};

export const statsAPI = {
    getStats: () => api.get('/stats'),
};

export const candidatesAPI = {
    getBestCandidates: (params) => api.get('/candidates/best-candidates', { params }),
    getCandidateDetails: (userId) => api.get(`/candidates/candidate/${userId}`),
};

export const authAPI = {
    googleLogin: (token) => api.post('/auth/google', { token }),
};

export const notificationsAPI = {
    getAll: () => api.get('/notifications'),
    markAsRead: (id) => api.post(`/notifications/${id}/read`),
    markAllRead: () => api.post('/notifications/read-all'),
};

export const messagesAPI = {
    getConversations: () => api.get('/messages/conversations'),
    getConversation: (applicationId) => api.get(`/messages/conversation/${applicationId}`),
    sendMessage: (applicationId, content) => api.post('/messages/send', null, {
        params: { application_id: applicationId, content }
    }),
    markAsRead: (messageId) => api.post(`/messages/${messageId}/read`),
};

export const testsAPI = {
    getJobTest: (jobId) => api.get(`/tests/job/${jobId}/test`),
    startTest: (testId, applicationId) => api.post(`/tests/${testId}/start`, null, { params: { application_id: applicationId } }),
    submitTest: (testId, attemptId, answers) => api.post(`/tests/${testId}/submit`, null, { params: { attempt_id: attemptId, answers } }),
    getResult: (attemptId) => api.get(`/tests/attempt/${attemptId}/result`),
};

export const jobAlertsAPI = {
    getPreferences: () => api.get('/job-alerts/preferences'),
    updatePreferences: (data) => api.put('/job-alerts/preferences', data),
    checkNewJobs: () => api.get('/job-alerts/check'),
    subscribe: (skill, location) => api.post('/job-alerts/subscribe', null, { params: { skill, location } }),
    unsubscribe: (skill) => api.post('/job-alerts/unsubscribe', null, { params: { skill } }),
};

export const interviewAPI = {
    getMyInterviews: () => api.get('/interviews/my-interviews'),
    getAll: () => api.get('/interviews'),
    schedule: (data) => api.post('/interviews/schedule', data),
    update: (id, data) => api.put(`/interviews/${id}`, data),
    cancel: (id) => api.post(`/interviews/${id}/cancel`),
};

export const videoResumeAPI = {
    upload: (data) => {
        const formData = new FormData();
        if (data.title) formData.append('title', data.title);
        if (data.description) formData.append('description', data.description);
        formData.append('video_type', data.video_type || 'cover_letter');
        formData.append('is_public', data.is_public || false);
        formData.append('file', data.file);
        return api.post('/videos/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    getMyVideos: () => api.get('/videos/my-videos'),
    getPublic: () => api.get('/videos/public'),
    delete: (id) => api.delete(`/videos/${id}`),
};

export const reviewsAPI = {
    getAll: (search, limit) => api.get('/reviews/', { params: { search, limit } }),
    getCompany: (companyName) => api.get(`/reviews/company/${companyName}`),
    create: (data) => api.post('/reviews/review', null, { params: data }),
    getStats: () => api.get('/reviews/stats'),
    addSalary: (data) => api.post('/reviews/salary/add', null, { params: data }),
    getJobSalary: (jobTitle) => api.get(`/reviews/salary/job/${jobTitle}`),
    getCompanySalary: (company) => api.get(`/reviews/salary/company/${company}`),
    getTopSalaries: (limit) => api.get('/reviews/salary/top', { params: { limit } }),
};

export const skillsVerificationAPI = {
    getMySkills: () => api.get('/skills/verification/my-skills'),
    getSuggestions: (query) => api.get('/skills/verification/suggestions', { params: { query } }),
    getLeaderboard: () => api.get('/skills/verification/leaderboard'),
    verify: (data) => api.post('/skills/verification/verify', data),
    delete: (id) => api.delete(`/skills/verification/${id}`),
};

export const savedJobsAPI = {
    saveJob: (jobId, notes) => api.post('/user/saved-jobs', null, { params: { job_id: jobId, notes } }),
    getSavedJobs: () => api.get('/user/saved-jobs'),
    unsaveJob: (jobId) => api.delete(`/user/saved-jobs/${jobId}`),
    checkSaved: (jobId) => api.get(`/user/saved-jobs/check/${jobId}`),
    getRecommendations: (limit) => api.get('/user/recommendations', { params: { limit } }),
    followCompany: (companyName) => api.post('/user/follow-company', null, { params: { company_name: companyName } }),
    getFollowedCompanies: () => api.get('/user/followed-companies'),
    unfollowCompany: (companyName) => api.delete(`/user/follow-company/${companyName}`),
    checkFollowing: (companyName) => api.get(`/user/followed-companies/check/${companyName}`),
};

export default api;
