import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api, { cachedGet } from "../services/api";
import { useCartStore } from "../stores/cartStore";
import FoodCard from "../components/FoodCard";
import CustomerReview from "../components/customerReview";
import img1 from "../assets/Gemini_Generated_Image_kv2b7mkv2b7mkv2b.png_2K_202609071105.jpeg";

const Menu = () => {
  const { restaurantId } = useParams();
  const cartItems = useCartStore((s) => s.cartItems);
  const addItem = useCartStore((s) => s.addItem);
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Debounce the search box (~300ms) so we don't re-filter the grid on every
  // keystroke.
  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedQuery(query.trim().toLowerCase()),
      300,
    );
    return () => clearTimeout(t);
  }, [query]);

  // Memoized set of spoonacular ids currently in the cart — Menu is the only
  // component that subscribes to cartItems, so a cart change re-renders just
  // this page, and memoized FoodCards whose isInCart flag didn't change skip.
  const inCartIds = useMemo(
    () => new Set(cartItems.map((i) => i.spoonacularId)),
    [cartItems],
  );

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

  const filtered = (
    activeCategory === "All"
      ? menu
      : menu.filter((item) => item.category === activeCategory)
  ).filter(
    (item) =>
      !debouncedQuery ||
      item.name.toLowerCase().includes(debouncedQuery) ||
      (item.category || "").toLowerCase().includes(debouncedQuery),
  );

  return (
    <div className="min-h-screen text-white w-full">
      {/* ── PAGE HEADER (static image hero) ── */}
      <section
        data-navbar="#transparent"
        className="relative w-full bg-[#556B2F] h-[450px] overflow-hidden"
      >
        <img
          src={img1}
          alt=""
          className="absolute inset-0 w-full h-full object-cover z-0"
        />

        {/* Scrim so the restaurant name stays legible over the image */}
        <div className="absolute inset-0 bg-black/40 z-[5] pointer-events-none" />

        <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center gap-2 px-6 sm:px-12 lg:px-16">
         
            <h1
              className="hero-title font-semibold tracking-widest text-2xl sm:text-4xl"
              style={{
                fontSize: "clamp(40px, 8vw, 120px)",
                fontWeight: 900,
                color: "#e7e3e3",
                letterSpacing: "-0.07em",
                whiteSpace: "nowrap",
                lineHeight: 1,
                pointerEvents: "none",
                userSelect: "none",
                fontFamily: "Arial Black, sans-serif",
                textAlign: "center",
                zIndex: 0,
              }}
            >
              ALL MENU
            </h1>
         
          {/* {restaurant?.cuisine && (
            <p className="section-label text-white/80">
              {restaurant.cuisine.toUpperCase()}
            </p>
          )}{restaurant?.description && (
            <p className="section-label text-white/80">
              {restaurant.description}
            </p>
          )} */}
          {/* const restaurant = await Restaurant.create({
              name: 'Finest Diners',
              description: 'Premium food delivered straight to your door. Fresh ingredients, bold flavours.',
              cuisine: 'International',
              address: '1 Finest Street, Lagos, Nigeria',
              phone: '+234 901 800 6888',
              imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
              rating: 4.8,
              deliveryTime: '25-40 min',
              isOpen: true,
              spoonacularQuery: 'chicken,pasta,burger,pizza,rice,seafood, dessert, salad, soup, sandwich, steak, sushi, tacos',
            }); */}
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
              <span className="section-label text-neutral-600 shrink-0">
                SEARCH
              </span>
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

      <CustomerReview />
    </div>
  );
};

export default Menu;
