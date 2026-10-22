import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import api from './api/client';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CoursesList from './pages/CoursesList';
import CourseDetail from './pages/CourseDetail';
import LessonPage from './pages/LessonPage';
import Certificates from './pages/Certificates';
import CertificateView from './pages/CertificateView';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';
import Checkout from './pages/Checkout';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import Orders from './pages/Orders';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <p className="text-center py-24 text-slate-400">Loading...</p>;
    if (!user) return <Navigate to="/login" />;
    return children;
}

function Shell() {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;
        api.post('/users/heartbeat').catch(() => {});
    }, [user?.id]);

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/courses" element={<CoursesList />} />
                    <Route path="/courses/:slug" element={<CourseDetail />} />
                    <Route path="/courses/:slug/lessons/:lessonId" element={<LessonPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                    <Route path="/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
                    <Route path="/certificates/:code" element={<CertificateView />} />
                    <Route path="/checkout/:slug" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                    <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
                    <Route path="/payment/cancel" element={<PaymentCancel />} />

                    <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                </Routes>
            </main>
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Shell />
            </BrowserRouter>
        </AuthProvider>
    );
}