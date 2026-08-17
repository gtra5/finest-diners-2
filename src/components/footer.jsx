import { useState } from "react";
import { ArrowRight, Send } from "lucide-react";

// Lucide removed all brand/logo icons in 1.0 (legal/trademark reasons),
// so these are small inline SVGs instead of a lucide-react import.
function IconInstagram(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconFacebook(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 4h-2a4 4 0 0 0-4 4v3H7v3h2v6h3v-6h2.5l.5-3H12V8a1 1 0 0 1 1-1h2z" />
    </svg>
  );
}

function IconX(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 5l14 14" />
      <path d="M19 5L5 19" />
    </svg>
  );
}

export default function FooterStatement() {
  const [email, setEmail] = useState("");
  const year = new Date().getFullYear();

  const ink = "#050A0A";
  const olive = "#6B7C2F";

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Mouse+Memoirs&family=Fraunces:opsz,wght@9..144,500&display=swap');`}</style>

      <footer className="relative overflow-hidden text-emerald-50" style={{ backgroundColor: ink }}>
        <div className="mx-auto max-w-7xl px-6 pt-16 md:px-10">
          {/* Brand row */}
          <div className="flex flex-col gap-6 border-b border-emerald-50/10 pb-10 md:flex-row md:items-end md:justify-between">
            <div>
              <p
                className="font-mono text-[10px] uppercase tracking-[0.3em]"
                style={{ color: olive }}
              >
                Now taking reservations
              </p>
              <h3
                className="mt-3 text-3xl text-emerald-50 md:text-4xl"
                style={{ fontFamily: "Fraunces, serif" }}
              >
                Finest Diners.
              </h3>
              <p className="mt-2 max-w-sm text-sm text-emerald-200/60">
                A neighborhood table in Brooklyn — reservations, events, and
                gifts for people who love a long dinner.
              </p>
            </div>

            <button
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-full px-6 py-3 text-lg font-bold text-black transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-50 md:self-auto"
              style={{ backgroundColor: olive, fontFamily: "Mouse Memoirs, serif" }}
            >
              Book a table
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">
                <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          </div>

          {/* Column grid */}
          <div className="grid gap-10 border-b border-emerald-50/10 py-12 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <h4
                className="font-mono text-[10px] uppercase tracking-[0.3em]"
                style={{ color: olive }}
              >
                Explore
              </h4>
              <ul className="mt-4 space-y-2 text-sm text-emerald-100">
                {["Menu", "Reservations", "Events", "Gift Cards"].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="outline-none transition hover:text-amber-300 focus-visible:text-amber-300"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4
                className="font-mono text-[10px] uppercase tracking-[0.3em]"
                style={{ color: olive }}
              >
                Visit
              </h4>
              <ul className="mt-4 space-y-2 text-sm text-emerald-100">
                <li>128 Linden Ave</li>
                <li>Brooklyn, NY</li>
                <li>+1 (212) 555 0182</li>
                <li>hello@finestdiners.com</li>
              </ul>
            </div>

            <div>
              <h4
                className="font-mono text-[10px] uppercase tracking-[0.3em]"
                style={{ color: olive }}
              >
                Stay in the loop
              </h4>
              <p className="mt-4 text-sm text-emerald-200/60">
                One email a month: new menus, private events, last-minute
                tables.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-full border border-emerald-50/15 bg-transparent px-4 py-2.5 text-sm text-emerald-50 outline-none transition placeholder:text-emerald-200/40 focus-visible:border-emerald-50/40"
                />
                <button
                  aria-label="Subscribe"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-black transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-50"
                  style={{ backgroundColor: olive }}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-5 flex items-center gap-4 text-emerald-100">
                <a href="#" aria-label="Instagram" className="transition hover:text-amber-300">
                  <IconInstagram className="h-4 w-4" />
                </a>
                <a href="#" aria-label="Facebook" className="transition hover:text-amber-300">
                  <IconFacebook className="h-4 w-4" />
                </a>
                <a href="#" aria-label="X (formerly Twitter)" className="transition hover:text-amber-300">
                  <IconX className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Oversized cutout wordmark, bleeding at the base */}
        <div className="relative -mb-3 select-none overflow-hidden text-center sm:-mb-6 md:-mb-10">
          
          <h2
            className="relative whitespace-nowrap font-black leading-none"
            style={{
              fontSize: "clamp(64px, 15vw, 260px)",
              WebkitTextStroke: `1.5px ${olive}`,
              color: "transparent",
              letterSpacing: "-0.04em",
              fontFamily: "Arial Black, sans-serif",
            }}
          >
            Finest Diners
          </h2>
        </div>

        <div className="relative border-t border-emerald-50/10 px-6 py-6 text-center text-xs text-emerald-200/50">
          © {year} Finest Diners — Brooklyn, NY
        </div>
      </footer>
    </>
  );
}