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

export const resumesAPI = {
    getAll: (params) => api.get('/resumes/', { params }),
    upload: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/resumes/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    delete: (id) => api.delete(`/resumes/${id}`),
    getAIFeedback: (id) => api.post(`/resumes/${id}/ai-feedback`),
};

export const jobsAPI = {
    getAll: (params) => api.get('/jobs/', { params }),
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
    exportResumes: () => api.get('/analytics/export-resumes', { responseType: 'blob' }),
    exportJobs: () => api.get('/analytics/export-jobs', { responseType: 'blob' }),
    exportAll: () => api.get('/analytics/export-all', { responseType: 'blob' }),
};

export const statsAPI = {
    getStats: () => api.get('/stats'),
};

export const authAPI = {
    googleLogin: (token) => api.post('/auth/google', { token }),
};

export const notificationsAPI = {
    getAll: () => api.get('/notifications'),
    markAsRead: (id) => api.post(`/notifications/${id}/read`),
    markAllRead: () => api.post('/notifications/read-all'),
};

export default api;
