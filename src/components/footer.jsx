import {
  UtensilsCrossed,
  ArrowRight,
  Globe,
  Camera,
  Share2,
  Smartphone,
  Lock,
} from "lucide-react";
import { SiAndroid } from "react-icons/si";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import FooterWave from "./footerwave";
import backgroundImage from "../assets/paper.jpeg";
import backgroundVectors from "../assets/backgroundVectors.webp";
import burgerImg from "../assets/bugers.png";
import cabbageImg from "../assets/cabbage.png";
import saladImg from "../assets/salad (3).png";
import tomatoImg from "../assets/tomatotes.png";
const footerLinks = {
  curations: [
    { label: "Omakase & Raw Bar", href: "#" },
    { label: "Wood-Fired Hearth", href: "#" },
    { label: "Patisserie & Cellar", href: "#" },
    { label: "Rare Truffle Seasonal", href: "#" },
    { label: "Binchotan Grill", href: "#" },
  ],
  concierge: [
    { label: "Live Courier Beacon", href: "#" },
    { label: "Private Salon Booking", href: "#" },
    { label: "Plating Protocol Guide", href: "#" },
    { label: "Vault Temperature Seal", href: "#" },
    { label: "Sommelier On-Call", href: "#" },
  ],
};

const legalLinks = [
  { label: "Privacy Protocol", href: "#" },
  { label: "Tasting Terms", href: "#" },
  { label: "Induction Vault Security", href: "#" },
];

function Footer() {
  const location = useLocation();
  const RESTAURANT_ID = import.meta.env.VITE_RESTAURANT_ID;

  const isHome = location.pathname === "/";
  const isMenu = location.pathname.startsWith("/menu");
  const isAbout = location.pathname === "/about";

  return (
    <footer className="relative w-full bg-[#030505]">
       <img
                src={backgroundVectors}
                alt=""
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                style={{ mixBlendMode: "multiply",  }}
              />
      {/* Hero band */}
      <div className="px-4 pb-20 pt-16 text-[#F5F5F0] md:px-8 lg:px-12 lg:pb-28 lg:pt-24">
      <div className="mx-auto max-w-7xl">
          <div
            className="relative mt-8 flex h-[450px] flex-col items-center justify-center rounded-2xl bg-white px-6 text-center lg:px-16 overflow-hidden"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Decorative background produce */}
            <img
              src={burgerImg}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="pointer-events-none select-none absolute -top-8 -left-8 z-1 w-24 sm:w-32 lg:w-44 -rotate-12 opacity-90 drop-shadow-xl"
            />
            <img
              src={tomatoImg}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="pointer-events-none select-none absolute -top-10 -right-10 z-1 w-28 sm:w-40 lg:w-56 rotate-[18deg] opacity-90 drop-shadow-xl"
            />
            <img
              src={saladImg}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="pointer-events-none select-none absolute bottom-16 -left-6 z-2 w-28 sm:w-40 lg:w-52 -rotate-6 drop-shadow-xl"
            />
            <img
              src={cabbageImg}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="pointer-events-none select-none absolute bottom-14 -right-4 z-2 w-24 sm:w-32 lg:w-44 rotate-[10deg] opacity-90 drop-shadow-xl"
            />

            <h2
              className="mt-6 max-w-3xl font-display font-bold uppercase leading-[0.95] tracking-tight text-[#0A0A0A]"
              style={{
                fontSize: "clamp(1.75rem, 4vw, 3.75rem)",
                letterSpacing: "-0.02em",
              }}
            >
              Restaurant-grade, delivered to your door
            </h2>
            <p
              className="mt-5 max-w-lg leading-relaxed text-[#0A0A0A]/60"
              style={{
                fontSize: "clamp(0.875rem, 1.5vw, 1.125rem)",
                letterSpacing: "0.01em",
              }}
            >
              Temperature-locked packaging keeps every plate exactly as the
              kitchen intended from our curations to your table in under 45
              minutes.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#0A0A0A] px-8 font-semibold text-[#F5F5F0] transition-colors hover:bg-[#0A0A0A]/85"
                style={{
                  fontSize: "clamp(0.875rem, 1.25vw, 1rem)",
                  letterSpacing: "0.02em",
                }}
              >
                Order now
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="inline-flex h-12 items-center justify-center rounded-full border border-[#0A0A0A]/15 bg-[#0A0A0A]/5 px-8 font-semibold text-[#0A0A0A] transition-colors hover:bg-[#0A0A0A]/10"
                style={{
                  fontSize: "clamp(0.875rem, 1.25vw, 1rem)",
                  letterSpacing: "0.02em",
                }}
              >
                View this week&apos;s menu
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Wave-backed region — spans the middle grid, bottom meta row, and
         the wordmark below it. */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-0">
          <FooterWave />
        </div>

        <div className="relative z-10 px-4 md:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-2 gap-x-8 gap-y-10 border-b border-[#1F2A0F]/15 py-12 lg:grid-cols-4 lg:gap-x-10">
              {/* Brand */}
              <div className="col-span-2 lg:col-span-1">
                <Link to="/">
                  <div
                    className="text-3xl sm:text-3xl lg:text-4xl uppercase leading-none select-none"
                    style={{
                      fontFamily: "'Baloo 2', sans-serif",
                      fontWeight: 800,
                      letterSpacing: "-0.01em",
                      color: "#0A0A0A",
                      WebkitTextStroke: `clamp(1.25px, 0.3vw, 2px) #F5F0E6`,
                      textShadow: `
                        -2px -2px 0 #F5F0E6, 2px -2px 0 #F5F0E6, -2px 2px 0 #F5F0E6, 2px 2px 0 #F5F0E6,
                         1px 1px 0 #3f4a1c,
                         2px 2px 0 #3f4a1c,
                         3px 3px 0 #3f4a1c,
                         4px 5px 8px rgba(0,0,0,0.3)
                      `,
                    }}
                  >
                    Finest Diners
                  </div>
                </Link>
                <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#0A0A0A]/60">
                  Restaurant-quality dinners, prepared and delivered between
                  9pm and 5am, sealed in temperature-locked packaging so every
                  plate arrives exactly as the kitchen intended.
                </p>
                <div className="mt-5 flex items-center gap-3">
                  {[Globe, Camera, Share2].map((Icon, i) => (
                    <a
                      key={i}
                      href="#"
                      aria-label="Share"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0A0A0A] text-[#F5F5F0]/80 transition-colors hover:bg-[#0A0A0A]/80"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Curations */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-widest text-[#0A0A0A]">
                  Curations
                </h4>
                <ul className="mt-5 space-y-3">
                  {footerLinks.curations.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-[#0A0A0A]/65 transition-colors hover:text-[#0A0A0A]"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Concierge */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-widest text-[#0A0A0A]">
                  Concierge
                </h4>
                <ul className="mt-5 space-y-3">
                  {footerLinks.concierge.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-[#0A0A0A]/65 transition-colors hover:text-[#0A0A0A]"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mobile app */}
              <div className="col-span-2 border-t border-[#1F2A0F]/15 pt-8 lg:col-span-1 lg:border-t-0 lg:pt-0">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-[#0A0A0A]">
                  Mobile App
                </h4>
                <p className="mt-5 max-w-xs text-sm leading-relaxed text-[#0A0A0A]/60">
                  Scan or download for secure checkout and real-time delivery
                  tracking.
                </p>
                <div className="mt-5 flex flex-col gap-3">
                  <a
                    href="#"
                    className="flex h-11 items-center gap-3 rounded-full bg-[#0A0A0A] px-5 text-sm font-medium text-[#F5F5F0] transition-colors hover:bg-[#0A0A0A]/80"
                  >
                    <Smartphone className="h-4 w-4" />
                    iOS TestFlight
                  </a>
                  <a
                    href="#"
                    className="flex h-11 items-center gap-3 rounded-full border border-[#0A0A0A]/15 bg-[#0A0A0A]/10 px-5 text-sm font-medium text-[#0A0A0A] transition-colors hover:bg-[#0A0A0A]/15"
                  >
                    <SiAndroid className="h-4 w-4" />
                    Android APK
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom meta row */}
            <div className="flex flex-col items-center gap-4 py-8 text-center md:flex-row md:justify-between md:text-left">
              <p className="order-3 text-xs text-[#0A0A0A]/55 md:order-1">
                © {new Date().getFullYear()} Finest Diners. All rights reserved.
              </p>
              <div className="order-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                {legalLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-xs text-[#0A0A0A]/55 transition-colors hover:text-[#0A0A0A]"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              <div className="order-1 flex items-center gap-2 text-xs font-medium text-[#0A0A0A]/70 md:order-3">
                <Lock className="h-3.5 w-3.5" />
                Encrypted Vault Dispatch
              </div>
            </div>
          </div>
        </div>

        {/* Giant wordmark */}
        <div className="relative z-10 overflow-hidden px-4 pb-8 pt-4 md:px-8 lg:px-12">
          <Link to="/">
            <p
              className="select-none text-center uppercase leading-[0.85] tracking-tight"
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                fontSize: "clamp(3rem, 12vw, 10rem)",
                color: "rgba(10, 10, 10, 0.12)",
                WebkitTextStroke: "clamp(1.5px, 0.35vw, 3.5px) #F5F0E6",
                textShadow: `
                  -2px -2px 0 #F5F0E6, 2px -2px 0 #F5F0E6, -2px 2px 0 #F5F0E6, 2px 2px 0 #F5F0E6,
                   1px 1px 0 #3f4a1c,
                   2px 2px 0 #3f4a1c,
                   3px 3px 0 #3f4a1c,
                   4px 5px 8px rgba(0,0,0,0.3)
                `,
              }}
            >
              Finest Diners
            </p>
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;