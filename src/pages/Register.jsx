import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const OLIVE = "#6B7C2F";
const OLIVE_DIM = "#3a4419";
const OLIVE_LIGHT = "#D4E2B9";
const DARK = "#050A0A";
const SURFACE = "#0f1410";
const BORDER = "#1e251e";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white w-full pt-20 sm:pt-24" style={{ background: DARK }}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header block */}
            <div className="mb-8">
              <motion.p
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-[9px] tracking-[0.35em] font-semibold mb-4 uppercase"
                style={{ color: OLIVE }}
              >
                NEW ACCOUNT
              </motion.p>
              <motion.h1
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ delay: 0.2, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="font-black leading-none tracking-tighter"
                style={{
                  fontSize: "clamp(48px, 8vw, 72px)",
                  color: "#fff",
                  fontFamily: "Arial Black, sans-serif",
                  lineHeight: 0.9,
                }}
              >
                JOIN
                <br />
                <span style={{ color: OLIVE }}>US.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm font-mono mt-3"
                style={{ color: "#5a6a5a" }}
              >
                Join Finest Diners today.
              </motion.p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-red-800 bg-red-950 text-red-400 text-xs font-mono px-4 py-3 mb-5"
              >
                {error}
              </motion.div>
            )}

            <form
              onSubmit={handleSubmit}
              className="border p-6 sm:p-8 space-y-5"
              style={{ background: SURFACE, borderColor: BORDER }}
            >
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <label className="text-[9px] tracking-[0.25em] font-semibold mb-2 block uppercase" style={{ color: OLIVE_LIGHT }}>
                  FULL NAME
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="John Doe"
                  className="w-full bg-neutral-900 border text-white text-sm font-mono px-4 py-3 focus:outline-none transition-colors placeholder-neutral-600"
                  style={{ borderColor: BORDER }}
                  onFocus={(e) => e.target.style.borderColor = OLIVE}
                  onBlur={(e) => e.target.style.borderColor = BORDER}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="text-[9px] tracking-[0.25em] font-semibold mb-2 block uppercase" style={{ color: OLIVE_LIGHT }}>
                  EMAIL
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  className="w-full bg-neutral-900 border text-white text-sm font-mono px-4 py-3 focus:outline-none transition-colors placeholder-neutral-600"
                  style={{ borderColor: BORDER }}
                  onFocus={(e) => e.target.style.borderColor = OLIVE}
                  onBlur={(e) => e.target.style.borderColor = BORDER}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <label className="text-[9px] tracking-[0.25em] font-semibold mb-2 block uppercase" style={{ color: OLIVE_LIGHT }}>
                  PASSWORD
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="Min. 6 characters"
                  className="w-full bg-neutral-900 border text-white text-sm font-mono px-4 py-3 focus:outline-none transition-colors placeholder-neutral-600"
                  style={{ borderColor: BORDER }}
                  onFocus={(e) => e.target.style.borderColor = OLIVE}
                  onBlur={(e) => e.target.style.borderColor = BORDER}
                />
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full text-center font-black tracking-tighter py-3 transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: OLIVE,
                  color: "#fff",
                  fontFamily: "Arial Black, sans-serif",
                  fontSize: "14px",
                }}
              >
                {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
              </motion.button>
            </form>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="text-xs font-mono text-center mt-5"
              style={{ color: "#3a4a3a" }}
            >
              HAVE AN ACCOUNT?{' '}
              <Link to="/login" className="font-semibold hover:underline tracking-widest" style={{ color: OLIVE }}>
                SIGN IN
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Register;
