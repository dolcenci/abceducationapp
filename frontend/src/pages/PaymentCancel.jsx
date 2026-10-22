import { Link } from 'react-router-dom';

export default function PaymentCancel() {
    return (
        <div className="bg-[#fdfcfb] min-h-screen flex items-center justify-center px-4">
            <div className="max-w-md w-full card p-10 text-center">
                <div className="text-6xl mb-4">🚫</div>
                <p className="text-2xl font-display font-extrabold text-slate-900 mb-2">
                    Payment cancelled
                </p>
                <p className="text-slate-500 mb-6">
                    No charge was made. You can try again whenever you're ready.
                </p>
                <Link to="/courses" className="btn-primary w-full">
                    Back to courses
                </Link>
            </div>
        </div>
    );
}