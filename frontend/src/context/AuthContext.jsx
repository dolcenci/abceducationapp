import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }
        api.get('/auth/me')
            .then((r) => setUser(r.data))
            .catch(() => localStorage.removeItem('token'))
            .finally(() => setLoading(false));
    }, []);

    const login = async (email, password) => {
        const r = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', r.data.token);
        setUser(r.data.user);
        return r.data.user;
    };

    const signup = async (payload) => {
        const r = await api.post('/auth/signup', payload);
        localStorage.setItem('token', r.data.token);
        setUser(r.data.user);
        return r.data.user;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);