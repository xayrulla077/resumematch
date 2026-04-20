import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import {
    User as UserIcon,
    Mail,
    Phone,
    FileText,
    Camera,
    Save,
    Edit2,
    X,
    CheckCircle
} from 'lucide-react';

const Profile = () => {
    const { user, setUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        bio: '',
        email: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                phone: user.phone || '',
                bio: user.bio || '',
                email: user.email || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        
        console.log('Submitting form data:', formData);
        
        try {
            const response = await api.put('/auth/me', {
                full_name: formData.full_name,
                phone: formData.phone,
                bio: formData.bio,
                email: formData.email
            });
            
            console.log('Update response:', response.data);
            
            // Update local user state
            if (response.data) {
                setUser(response.data);
            }
            
            setIsEditing(false);
            setMessage({ type: 'success', text: 'Profil muvaffaqiyatli yangilandi!' });
        } catch (error) {
            console.error('Update error:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.detail || error.message || 'Xatolik yuz berdi. Qaytadan urinib ko\'ring.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const response = await api.post('/auth/upload-avatar', uploadData);
            if (response.data?.url) {
                setUser({ ...user, profile_image: response.data.url });
                setMessage({ type: 'success', text: 'Profil rasmi yangilandi!' });
            } else {
                setMessage({ type: 'error', text: 'Rasm URL topilmadi' });
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.detail || 'Rasm yuklashda xatolik.'
            });
        } finally {
            setUploading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[var(--bg-main)] p-8 relative overflow-hidden font-['Outfit']">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px]"></div>

            <div className="max-w-4xl mx-auto relative z-10 space-y-10 animate-in fade-in duration-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold text-[var(--text-main)] tracking-tight">PROFIL <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">SOZLAMALARI</span> ⚙️</h1>
                        <p className="text-[var(--text-muted)] mt-2 font-bold uppercase tracking-widest text-xs">Shaxsiy ma'lumotlaringizni boshqaring va yangilang.</p>
                    </div>
                </div>

                {message.text && (
                    <div className={`p-6 rounded-[2rem] flex items-center gap-4 animate-in slide-in-from-top duration-500 border backdrop-blur-xl ${message.type === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
                        }`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${message.type === 'success' ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                            }`}>
                            {message.type === 'success' ? <CheckCircle size={24} /> : <X size={24} />}
                        </div>
                        <p className="font-bold text-xs uppercase tracking-widest">{message.text}</p>
                    </div>
                )}

                <div className="rounded-[3rem] bg-[var(--bg-surface)] backdrop-blur-3xl border border-[var(--border-main)] shadow-2xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    {/* Profile Header Background */}
                    <div className="h-48 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <path d="M0 100 C 20 0 50 0 100 100 Z" fill="currentColor" />
                            </svg>
                        </div>
                        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[150%] bg-white/10 rounded-full blur-[80px] rotate-12"></div>
                    </div>

                    <div className="px-10 pb-12">
                        {/* Avatar Section */}
                        <div className="relative -mt-24 mb-12 flex flex-col md:flex-row items-end gap-8">
                            <div className="relative group/avatar">
                                <div className="w-44 h-44 rounded-[2.5rem] bg-[var(--bg-main)] p-1.5 shadow-2xl relative overflow-hidden border border-[var(--border-main)] group-hover/avatar:border-indigo-500/50 transition-colors duration-500">
                                    {user.profile_image ? (
                                        <img
                                            src={user.profile_image.startsWith('http') ? user.profile_image : `${import.meta.env.VITE_API_URL || ''}${user.profile_image}`}
                                            alt="Avatar"
                                            className="w-full h-full rounded-[2.1rem] object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full rounded-[2.1rem] bg-[var(--bg-surface)] flex items-center justify-center text-[var(--text-muted)]">
                                            <UserIcon size={64} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                        <Camera size={32} className="text-white transform scale-90 group-hover/avatar:scale-100 transition-transform" />
                                    </div>
                                    <label className="absolute inset-0 cursor-pointer">
                                        <input type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" />
                                    </label>
                                </div>
                                {uploading && (
                                    <div className="absolute inset-0 bg-[#0a0f1d]/80 rounded-[2.5rem] flex items-center justify-center z-20 backdrop-blur-md">
                                        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 pb-4 text-center md:text-left">
                                <h1 className="text-4xl font-bold text-[var(--text-main)] tracking-tight mb-3 uppercase">{user.full_name || user.username}</h1>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                    <span className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">
                                        {user.role}
                                    </span>
                                    <div className="h-1.5 w-1.5 bg-[var(--border-main)] rounded-full"></div>
                                    <span className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-[0.2em]">
                                        Joined {user.created_at ? new Date(user.created_at).toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' }) : 'Noma\'lum'}
                                    </span>
                                </div>
                            </div>

                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="mb-4 flex items-center gap-3 px-8 py-3.5 bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 duration-300"
                                >
                                    <Edit2 size={18} className="text-indigo-400" />
                                    Tahrirlash
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-12">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* General Info */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                            <UserIcon size={20} className="text-indigo-400" />
                                        </div>
                                        <h3 className="text-[var(--text-main)] font-bold uppercase tracking-tight text-lg">Umumiy Ma'lumotlar</h3>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="group/input">
                                            <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-3 ml-1">To'liq ism</label>
                                            <input
                                                type="text"
                                                name="full_name"
                                                disabled={!isEditing}
                                                value={formData.full_name}
                                                onChange={handleChange}
                                                className="w-full px-6 py-4 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl text-sm font-bold text-[var(--text-main)] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all placeholder:text-[var(--text-muted)] disabled:opacity-50"
                                                placeholder="Ism sharifingiz..."
                                            />
                                        </div>

                                        <div className="group/input opacity-80">
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Foydalanuvchi nomi</label>
                                            <input
                                                type="text"
                                                disabled={true}
                                                value={user.username}
                                                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-slate-400 cursor-not-allowed outline-none"
                                            />
                                            <p className="mt-2 text-[10px] text-slate-600 font-bold uppercase tracking-widest flex items-center gap-2">
                                                <X size={12} /> Username o'zgartirib bo'lmaydi
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20">
                                            <Mail size={20} className="text-purple-400" />
                                        </div>
                                        <h3 className="text-[var(--text-main)] font-bold uppercase tracking-tight text-lg">Aloqa Ma'lumotlari</h3>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="group/input">
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Email Address</label>
                                            <div className="relative">
                                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-indigo-400 transition-colors" size={20} />
                                                <input
                                                    type="email"
                                                    name="email"
                                                    disabled={!isEditing}
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    className="w-full pl-14 pr-6 py-4 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl text-sm font-bold text-[var(--text-main)] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all placeholder:text-[var(--text-muted)] disabled:opacity-50"
                                                    placeholder="example@mail.com"
                                                />
                                            </div>
                                        </div>

                                        <div className="group/input">
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Telefon raqam</label>
                                            <div className="relative">
                                                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-indigo-400 transition-colors" size={20} />
                                                <input
                                                    type="text"
                                                    name="phone"
                                                    disabled={!isEditing}
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className="w-full pl-14 pr-6 py-4 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl text-sm font-bold text-[var(--text-main)] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all placeholder:text-[var(--text-muted)] disabled:opacity-50"
                                                    placeholder="+998 90 123 45 67"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bio Section */}
                                <div className="md:col-span-2 space-y-8">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                            <FileText size={20} className="text-blue-400" />
                                        </div>
                                        <h3 className="text-[var(--text-main)] font-bold uppercase tracking-tight text-lg">Men haqimda (Bio)</h3>
                                    </div>
                                    <div className="group/input">
                                        <textarea
                                            name="bio"
                                            rows="4"
                                            disabled={!isEditing}
                                            value={formData.bio}
                                            onChange={handleChange}
                                            className="w-full px-6 py-5 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-3xl text-sm font-bold text-[var(--text-main)] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all placeholder:text-[var(--text-muted)] resize-none disabled:opacity-50 min-h-[160px]"
                                            placeholder="O'zingiz haqingizda qisqacha ma'lumot qoldiring..."
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            {isEditing && (
                                <div className="flex flex-col sm:flex-row items-center justify-end gap-6 pt-12 border-t border-white/5">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="w-full sm:w-auto px-10 py-4 bg-white/5 text-slate-400 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] border border-white/5 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                                    >
                                        Bekor qilish
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="w-full sm:w-auto flex items-center justify-center gap-3 px-12 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 disabled:bg-slate-800 disabled:text-slate-500 cursor-pointer relative z-50"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                O'zgarishlarni Saqlash
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
