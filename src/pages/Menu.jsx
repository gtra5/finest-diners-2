import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useScroll, useMotionValueEvent } from "framer-motion";
import api, { cachedGet } from "../services/api";
import { useCart } from "../context/CartContext";
import FoodCard from "../components/FoodCard";
import CustomerReview from "../components/customerReview";

const Menu = () => {
  const { restaurantId } = useParams();
  const { cartItems, addItem } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const heroRef = useRef(null);
  const videoRef = useRef(null);
  const progressRef = useRef(0);

  // Debounce the search box (~300ms) so we don't re-filter the grid on every
  // keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Memoized set of spoonacular ids currently in the cart — Menu is the only
  // component that subscribes to cartItems, so a cart change re-renders just
  // this page, and memoized FoodCards whose isInCart flag didn't change skip.
  const inCartIds = useMemo(
    () => new Set(cartItems.map((i) => i.spoonacularId)),
    [cartItems]
  );

  // Scroll-scrub the hero video: progress goes 0 -> 1 as the page scrolls
  // through the tall section, and the video frame follows it.
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    progressRef.current = latest;
  });

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const FPS = 24;
    const EPS = 0.5 / FPS;
    let lastSeek = -1;
    let rafId;

    const tick = () => {
      rafId = requestAnimationFrame(tick);
      if (v.readyState < 1 || !v.duration) return;
      // Quantize to whole frames: seek at most once per animation frame
      // instead of hammering the decoder with redundant micro-seeks.
      const frameIndex = Math.round(progressRef.current * v.duration * FPS);
      const seekTo = frameIndex / FPS;
      if (seekTo !== lastSeek && Math.abs(v.currentTime - seekTo) > EPS) {
        lastSeek = seekTo;
        v.currentTime = seekTo;
      }
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);
 

  const scallopedWaveFlipped =
    'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100"><g transform="matrix(1 0 0 -1 0 100)"><path d="M0 0v60c9 0 18-3 25-10 13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s37 13 50 0c14-14 37-14 50 0 7 7 16 10 25 10V0H0Z" fill="%23050A0A"></path></g></svg>\')';

  const scallopedWaveNormal =
    'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100"><path d="M0 0v60c9 0 18-3 25-10 13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s36 14 50 0c13-14 36-14 50 0s37 13 50 0c14-14 37-14 50 0 7 7 16 10 25 10V0H0Z" fill="%23050A0A"></path></svg>\')';

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await cachedGet(`/food/menu/${restaurantId}`);
        setRestaurant(data.restaurant);
        setMenu(data.menu);
      } catch (err) {
        const msg = err.response?.data?.message || err.message;
        setError(`Failed to load menu: ${msg}`);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [restaurantId]);

  const categories = [
    "All",
    ...new Set(menu.map((item) => item.category).filter(Boolean)),
  ].filter((cat) => cat !== "Main");

  const filtered =
    (activeCategory === "All"
      ? menu
      : menu.filter((item) => item.category === activeCategory)
    ).filter(
      (item) =>
        !debouncedQuery ||
        item.name.toLowerCase().includes(debouncedQuery) ||
        (item.category || "").toLowerCase().includes(debouncedQuery)
    );

  return (
    <div className="min-h-screen text-white w-full">
      {/* ── PAGE HEADER (scroll-scrubbed video hero) ── */}
      <section
        ref={heroRef}
        data-navbar="#transparent"
        className="relative w-full bg-[#556B2F]"
        style={{ height: "250vh" }}
      >
        <div className="sticky top-0 left-0 w-full h-screen overflow-hidden">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover z-0"
            src="/menu-hero.mp4"
            poster="/menu-hero-poster.jpg"
            muted
            loop
            playsInline
            preload="metadata"
          />

          {/* Scrim so the restaurant name stays legible over the video */}
          <div className="absolute inset-0 bg-black/40 z-[5] pointer-events-none" />

          <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center gap-2 px-6 sm:px-12 lg:px-16">
            {restaurant?.name && (
              <h1 className="hero-title font-semibold tracking-widest text-2xl sm:text-4xl">
                {restaurant.name}
              </h1>
            )}
            {restaurant?.cuisine && (
              <p className="section-label text-white/80">
                {restaurant.cuisine.toUpperCase()}
              </p>
            )}
          </div>

          <div
            className="absolute bottom-0 left-0 w-full pointer-events-none z-10"
            style={{
              backgroundImage: scallopedWaveFlipped,
              backgroundRepeat: "repeat-x",
              backgroundSize: "auto 100%",
              backgroundPosition: "0 0",
              height: "100px",
            }}
          />
        </div>
      </section>

     {/* ── CATEGORY FILTER ── */}
{categories.length > 1 && (
      <section className="w-full border-b border-neutral-800">
    <div className="max-w-screen-xl mx-auto px-6 sm:px-12 lg:px-16 py-5">
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-5 py-2 text-xs font-mono tracking-widest uppercase transition-all duration-200 active:scale-95 ${
                isActive
                  ? "bg-[#556B2F] text-[#FFFFFF]"
                  : "bg-white text-[#556B2F] hover:bg-lime-300"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="section-label text-neutral-600 shrink-0">SEARCH</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search dishes…"
          aria-label="Search menu"
          className="w-full max-w-xs bg-transparent border-b border-neutral-700 px-1 py-1.5 text-sm font-mono text-white placeholder:text-neutral-600 focus:border-lime-400 focus:outline-none transition-colors"
        />
      </div>
    </div>
  </section>
)}

      {/* ── FOOD GRID ── */}
      <section className="w-full relative">
        <div className="max-w-screen-xl mx-auto px-6 sm:px-12 lg:px-16 py-8 sm:py-10 pb-16 sm:pb-20">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <h2 className="hero-title font-semibold tracking-widest text-xs sm:text-sm">
              {activeCategory === "All"
                ? "FULL INDEX"
                : activeCategory.toUpperCase()}
            </h2>
            {!loading && !error && (
              <span className="section-label text-neutral-600">
                {filtered.length} ITEMS
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-10 h-10 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
              <p className="section-label">LOADING MENU...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <p className="text-red-400 text-sm font-mono text-center">
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                RETRY
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <span className="text-4xl">🍽️</span>
              <p className="section-label text-neutral-600">
                NO ITEMS IN THIS CATEGORY
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filtered.map((food) => (
                <FoodCard
                  key={food.spoonacularId}
                  food={food}
                  restaurantId={restaurantId}
                  isInCart={inCartIds.has(food.spoonacularId)}
                  onAdd={addItem}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* scalloped wave divider — overlaps down onto the white section below it */}
      <div
        className="relative z-10 w-full h-20 sm:h-28 -mb-20 sm:-mb-28 pointer-events-none"
        style={{
          backgroundImage: scallopedWaveNormal,
          backgroundRepeat: "repeat-x",
          backgroundSize: "auto 100%",
        }}
      />
      <CustomerReview/>

     
    </div>
  );
};

export default Menu;