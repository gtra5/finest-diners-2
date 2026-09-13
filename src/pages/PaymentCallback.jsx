import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { verifyPayment } from '../services/api';

const OLIVE = '#6B7C2F';
const OLIVE_LIGHT = '#D4E2B9';
const DARK = '#050A0A';
const SURFACE = '#0f1410';
const BORDER = '#1e251e';

// Landing page for Paystack's redirect-based flow (/payment/callback).
// Reads the txref/reference and verifies it against the backend, which marks
// the order paid (access-code popups usually skip this since Paystack fires
// onSuccess, but this covers the redirect fallback when popups are blocked).
export default function PaymentCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('txref') || searchParams.get('reference');

  const [status, setStatus] = useState('verifying'); // verifying | success | failed
  const [message, setMessage] = useState('Verifying your payment…');

  useEffect(() => {
    if (!reference) {
      setStatus('failed');
      setMessage('No payment reference was provided.');
      return;
    }
    let cancelled = false;
    verifyPayment(reference)
      .then((data) => {
        if (cancelled) return;
        setStatus('success');
        setMessage(data?.message || 'Payment verified successfully.');
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus('failed');
        setMessage(err?.response?.data?.message || 'We could not verify your payment.');
      });
    return () => {
      cancelled = true;
    };
  }, [reference]);

  const isSuccess = status === 'success';
  const isFailed = status === 'failed';

  return (
    <div className="min-h-screen text-white flex items-center justify-center px-6 sm:px-12 lg:px-16 pt-20 sm:pt-24 pb-8 sm:pb-10" style={{ background: DARK }}>
      <div className="w-full max-w-md border p-8 text-center" style={{ background: SURFACE, borderColor: BORDER }}>
        <div
          className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5 ${status === 'verifying' ? 'animate-pulse' : ''}`}
          style={{ background: isSuccess ? OLIVE : isFailed ? '#b33939' : 'rgba(107,124,47,0.2)' }}
        >
          {status === 'verifying' ? (
            <Loader2 className="w-9 h-9 text-white animate-spin" />
          ) : isSuccess ? (
            <CheckCircle2 className="w-9 h-9 text-white" />
          ) : (
            <XCircle className="w-9 h-9 text-white" />
          )}
        </div>

        <h2
          className="text-2xl font-black mb-2"
          style={{ fontFamily: 'Arial Black, sans-serif', color: '#fff' }}
        >
          {status === 'verifying' ? 'VERIFYING…' : isSuccess ? 'PAYMENT CONFIRMED' : 'PAYMENT FAILED'}
        </h2>
        <p className="text-sm font-mono mb-2" style={{ color: isSuccess ? OLIVE_LIGHT : '#b33939' }}>
          {message}
        </p>
        {isFailed && (
          <p className="text-xs font-mono" style={{ color: '#5a6a5a' }}>
            If your card was charged, contact support. Your order may still be pending.
          </p>
        )}

        {isSuccess ? (
          <MotionButton onClick={() => navigate('/orders')}>
            TRACK MY ORDER <ArrowRight className="w-4 h-4" />
          </MotionButton>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/checkout')}
            className="w-full mt-6 flex items-center justify-center gap-2 font-black tracking-tighter py-3 transition"
            style={{ background: OLIVE, color: '#fff', fontFamily: 'Arial Black, sans-serif', fontSize: '14px' }}
          >
            TRY AGAIN
          </button>
        )}
      </div>
    </div>
  );
}

// Small local button wrapper (kept to the page's visual language without
// pulling in framer-motion just for one element).
function MotionButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full mt-6 flex items-center justify-center gap-2 font-black tracking-tighter py-3 transition"
      style={{ background: OLIVE, color: '#fff', fontFamily: 'Arial Black, sans-serif', fontSize: '14px' }}
    >
      {children}
    </button>
  );
}