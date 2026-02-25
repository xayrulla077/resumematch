import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await api.get('/auth/me');
                    setUser(response.data);
                } catch (error) {
                    console.error("Auth check failed:", error);
                    localStorage.removeItem('token');
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

        localStorage.setItem('token', access_token);

        try {
            // Fetch user details immediately after login
            const userMe = await api.get('/auth/me');
            setUser(userMe.data);
            return userMe.data;
        } catch (error) {
            console.warn("Could not fetch user details, but login was successful:", error);
            // Fallback: Set a temporary user object so the app acts as logged in
            const fallbackUser = { username, role: 'user' };
            setUser(fallbackUser);
            return fallbackUser;
        }
    };

    const register = async (userData) => {
        await api.post('/auth/register', userData);
        // Auto login after register
        await login(userData.username, userData.password);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const googleLogin = async (token) => {
        const response = await api.post('/auth/google', { token });
        const { access_token } = response.data;
        localStorage.setItem('token', access_token);
        const userMe = await api.get('/auth/me');
        setUser(userMe.data);
        return userMe.data;
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, googleLogin, register, logout, loading }}>
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
