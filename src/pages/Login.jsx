import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogOut } from "lucide-react";
import TicketBand from "../components/TicketBand.jsx";
import backgroundVectors from "../assets/backgroundVectors.webp";

const OLIVE = "#6B7C2F";
const OLIVE_DIM = "#3a4419";
const OLIVE_LIGHT = "#D4E2B9";
const INK = "#12160f";
const PAGE_BG = "#FFFFFF";
const CARD_BG = OLIVE;
const CARD_BORDER = OLIVE_DIM;
const INPUT_BORDER = "rgba(0,0,0,0.35)";
const INPUT_FOCUS = OLIVE_LIGHT;

const Login = () => {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  const sessionExpired = location.state?.sessionExpired;
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full pt-20 sm:pt-24"
      style={{
        color: INK,
        backgroundColor: PAGE_BG,
        backgroundImage: `url(${backgroundVectors})`,
        backgroundRepeat: "repeat",
        backgroundPosition: "top left",
      }}
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header block */}
            <div className="mb-8">
              <motion.h1
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{
                  delay: 0.2,
                  duration: 0.65,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="font-black leading-none tracking-tighter"
                style={{
                  fontSize: "clamp(48px, 8vw, 72px)",
                  color: INK,
                  fontFamily: "Arial Black, sans-serif",
                  lineHeight: 0.9,
                }}
              >
                SIGN
                <br />
                <span style={{ color: OLIVE }}>IN.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm font-mono mt-3"
                style={{ color: "#4a5a4a" }}
              >
                Welcome back to Finest Diners.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              className="mb-8"
            >
              <TicketBand label="MEMBERS ENTRANCE" />
            </motion.div>

            {sessionExpired && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 border border-amber-700 bg-amber-950 text-amber-300 text-xs font-mono px-4 py-3 mb-5"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Your session expired. Please sign in again to continue.
              </motion.div>
            )}

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
              className="relative border p-6 sm:p-8 space-y-5 overflow-hidden"
              style={{
                backgroundColor: CARD_BG,
                borderColor: CARD_BORDER,
                boxShadow: "0 24px 48px -20px rgba(58,68,25,0.45)",
                borderRadius: "20px",
              }}
            >
              {/* Layered Background Vector Image */}
              <img
                src={backgroundVectors}
                alt=""
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                style={{ mixBlendMode: "multiply",  }}
              />

              {/* Form Content - Wrapped in relative z-10 so inputs stay interactive */}
              <div className="relative z-10 space-y-5">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <label
                    className="text-[9px] tracking-[0.25em] font-semibold mb-2 block uppercase"
                    style={{ color: OLIVE_LIGHT }}
                  >
                    EMAIL
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    className="w-full bg-neutral-900 border rounded-4 text-white text-sm font-mono px-4 py-3 focus:outline-none transition-colors placeholder-neutral-600"
                    style={{ borderColor: INPUT_BORDER }}
                    onFocus={(e) => (e.target.style.borderColor = INPUT_FOCUS)}
                    onBlur={(e) => (e.target.style.borderColor = INPUT_BORDER)}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <label
                    className="text-[9px] tracking-[0.25em] font-semibold mb-2 block uppercase"
                    style={{ color: OLIVE_LIGHT }}
                  >
                    PASSWORD
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      placeholder="••••••••"
                      className="w-full bg-neutral-900 border rounded-4 text-white text-sm font-mono px-4 py-3 pr-12 focus:outline-none transition-colors placeholder-neutral-600"
                      style={{ borderColor: INPUT_BORDER }}
                      onFocus={(e) =>
                        (e.target.style.borderColor = INPUT_FOCUS)
                      }
                      onBlur={(e) => (e.target.style.borderColor = INPUT_BORDER)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl text-neutral-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full text-center font-black tracking-tighter py-3 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: OLIVE_LIGHT,
                    color: OLIVE_DIM,
                    fontFamily: "Arial Black, sans-serif",
                    fontSize: "14px",
                    borderRadius: "8px",
                  }}
                >
                  {loading ? "AUTHENTICATING..." : "SIGN IN"}
                </motion.button>
              </div>
            </form>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xs font-mono text-center mt-5"
              style={{ color: "#3a4a3a" }}
            >
              NO ACCOUNT?{" "}
              <Link
                to="/register"
                className="font-semibold hover:underline tracking-widest"
                style={{ color: OLIVE }}
              >
                REGISTER
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;