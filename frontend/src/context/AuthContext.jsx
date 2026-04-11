import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(false);

    useEffect(() => {
        const checkUser = async () => {
            const token = localStorage.getItem('token');
            console.log('Auth check - token exists:', !!token);
            if (token) {
                try {
                    const response = await api.get('/auth/me');
                    console.log('Auth check - user data:', response.data);
                    setUser(response.data);
                    setAuthError(false);
                } catch (error) {
                    console.error("Auth check failed:", error.response?.status, error.response?.data);
                    // Token mavjud ammo tekshirish muvaffaqiyatsiz - tokenni olib tashlamasdan, qayta urinish
                    if (error.response?.status === 401) {
                        // Token yaroqsiz - olib tashlash
                        localStorage.removeItem('token');
                        setUser(null);
                    } else {
                        // Server xatosi - userga xabar berish
                        setAuthError(true);
                    }
                }
            }
            setLoading(false);
        };
        checkUser();
    }, []);

    const login = async (username, password) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const response = await api.post('/auth/login', formData);
        const { access_token } = response.data;

        console.log('Login success, token:', access_token ? 'received' : 'MISSING');
        localStorage.setItem('token', access_token);

        try {
            // Fetch user details immediately after login
            const userMe = await api.get('/auth/me');
            console.log('User data fetched:', userMe.data);
            setUser(userMe.data);
            setAuthError(false);
            return userMe.data;
        } catch (error) {
            console.warn("Could not fetch user details, but login was successful:", error);
            // Fallback: Set a temporary user object so the app acts as logged in
            const fallbackUser = { username, role: 'candidate' };
            setUser(fallbackUser);
            return fallbackUser;
        }
    };

    const register = async (userData) => {
        console.log('Register called with:', userData);
        await api.post('/auth/register', userData);
        console.log('Register success, auto-login...');
        // Auto login after register and return user data
        return await login(userData.username, userData.password);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setAuthError(false);
    };

    const googleLogin = async (token) => {
        const response = await api.post('/auth/google', { token });
        const { access_token } = response.data;
        localStorage.setItem('token', access_token);
        const userMe = await api.get('/auth/me');
        setUser(userMe.data);
        setAuthError(false);
        return userMe.data;
    };

    // Refresh user function
    const refreshUser = async () => {
        try {
            const response = await api.get('/auth/me');
            setUser(response.data);
            setAuthError(false);
        } catch (error) {
            console.error("Refresh user failed:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, googleLogin, register, logout, loading, authError, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
