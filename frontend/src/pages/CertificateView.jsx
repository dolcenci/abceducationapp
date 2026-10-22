import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';

export default function CertificateView() {
    const { code } = useParams();
    const [cert, setCert] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        api.get(`/certificates/verify/${code}`)
            .then((r) => setCert(r.data.certificate))
            .catch(() => setCert(null))
            .finally(() => setLoading(false));
    }, [code]);

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {}
    };

    const print = () => window.print();

    if (loading) return <p className="text-center py-24 text-slate-400">Loading certificate...</p>;

    if (!cert) {
        return (
            <div className="max-w-2xl mx-auto py-24 text-center px-4">
                <p className="text-6xl mb-4">🔍</p>
                <p className="text-2xl font-display font-extrabold text-slate-900 mb-2">
                    Certificate not found
                </p>
                <p className="text-slate-500 mb-8">
                    The verification code <span className="font-mono">{code}</span> doesn't match any certificate.
                </p>
                <Link to="/" className="btn-primary">Back to home</Link>
            </div>
        );
    }

    return (
        <div className="bg-[#fdfcfb] min-h-screen">
            {/* Action bar (hidden when printing) */}
            <section className="print:hidden max-w-5xl mx-auto px-4 py-6 flex items-center justify-between flex-wrap gap-3">
                <Link to="/certificates" className="text-brand-600 hover:text-brand-700 text-sm font-semibold">
                    ← All certificates
                </Link>
                <div className="flex gap-2">
                    <button onClick={copyLink} className="btn-ghost text-sm">
                        {copied ? '✓ Copied' : '🔗 Copy link'}
                    </button>
                    <button onClick={print} className="btn-primary text-sm">
                        🖨️ Download PDF
                    </button>
                </div>
            </section>

            {/* The certificate itself */}
            <section className="max-w-5xl mx-auto px-4 pb-16 print:pb-0">
                <div className="certificate-print relative overflow-hidden rounded-[2rem] shadow-pop bg-white border-8 border-double border-brand-600 aspect-[1.414/1]">
                    {/* Decorative corners */}
                    <div className="absolute top-6 left-6 w-24 h-24 border-t-4 border-l-4 border-accent-500 rounded-tl-3xl" />
                    <div className="absolute top-6 right-6 w-24 h-24 border-t-4 border-r-4 border-accent-500 rounded-tr-3xl" />
                    <div className="absolute bottom-6 left-6 w-24 h-24 border-b-4 border-l-4 border-accent-500 rounded-bl-3xl" />
                    <div className="absolute bottom-6 right-6 w-24 h-24 border-b-4 border-r-4 border-accent-500 rounded-br-3xl" />

                    {/* Watermark */}
                    <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <span className="font-display font-extrabold text-[18rem] text-brand-50 select-none">
              A
            </span>
                    </div>

                    <div className="relative h-full flex flex-col items-center justify-between px-16 py-14 text-center">
                        {/* Header */}
                        <div>
                            <div className="flex items-center justify-center gap-3 mb-6">
                <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 via-coral-400 to-accent-400 grid place-items-center text-white font-display font-extrabold text-xl">
                  A
                </span>
                                <span className="font-display font-extrabold text-lg text-slate-900">
                  ABC Education
                </span>
                            </div>
                            <p className="text-sm uppercase tracking-[0.3em] text-slate-400 font-bold">
                                Certificate of Completion
                            </p>
                        </div>

                        {/* Body */}
                        <div className="max-w-2xl">
                            <p className="text-slate-500 italic mb-3">This is to certify that</p>
                            <h1 className="font-display font-extrabold text-5xl text-slate-900 mb-4 leading-tight">
                                {cert.student_name}
                            </h1>
                            <p className="text-slate-500 italic mb-3">has successfully completed</p>
                            <h2 className="font-display font-extrabold text-2xl text-brand-700 mb-4">
                                {cert.course_title}
                            </h2>
                            <p className="text-slate-500 text-sm max-w-lg mx-auto leading-relaxed">
                                All lessons, exercises, and assessments have been completed as required
                                by ABC Education's curriculum standards.
                            </p>
                        </div>

                        {/* Footer with verification */}
                        <div className="w-full grid grid-cols-3 gap-6 items-end">
                            <div className="text-center">
                                <div className="border-t-2 border-slate-300 pt-2 mt-8">
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Date issued</p>
                                    <p className="font-semibold text-slate-800 text-sm mt-0.5">
                                        {new Date(cert.issued_at).toLocaleDateString('en-ZA', {
                                            year: 'numeric', month: 'long', day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="text-center">
                                {/* Seal */}
                                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-accent-400 to-coral-500 grid place-items-center shadow-soft">
                                    <div className="w-20 h-20 rounded-full border-4 border-white grid place-items-center">
                                        <div className="text-white">
                                            <p className="text-[10px] font-bold uppercase tracking-wider leading-none">Verified</p>
                                            <p className="text-2xl font-display font-extrabold leading-none mt-1">✓</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="border-t-2 border-slate-300 pt-2 mt-8">
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Verification code</p>
                                    <p className="font-mono text-xs text-slate-800 mt-0.5 break-all">
                                        {cert.verification_code}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <p className="text-[10px] text-slate-400 mt-6">
                            Verify this certificate at{' '}
                            <span className="font-mono">
                {typeof window !== 'undefined' ? window.location.origin : ''}/certificates/{cert.verification_code}
              </span>
                        </p>
                    </div>
                </div>
            </section>

            {/* Print styles */}
            <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .certificate-print {
            box-shadow: none !important;
            border-radius: 0 !important;
            border-width: 6px !important;
            width: 100%;
            height: auto;
            page-break-inside: avoid;
          }
          @page { size: A4 landscape; margin: 0.5cm; }
        }
      `}</style>
        </div>
    );
}