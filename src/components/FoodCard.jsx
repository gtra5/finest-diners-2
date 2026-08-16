import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus } from "lucide-react";

const StarRating = ({ rating = 0, max = 5 }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: max }).map((_, i) => (
      <span
        key={i}
        style={{
          color: i < Math.round(rating) ? "#c8f135" : "#2a2a2a",
          fontSize: 10,
        }}
      >
        ★
      </span>
    ))}
  </div>
);

const FoodCardImpl = ({ food, restaurantId, isInCart = false, onAdd }) => {
  const handleAddToCart = () => {
    if (!isInCart) {
      onAdd(food, restaurantId);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="border card-hover border border-neutral-800 overflow-hidden border-neutral-800 overflow-hidden transition-all duration-200 hover:border-neutral-600"
      style={{ background: "#131313", fontFamily: "'Courier New', monospace" }}
    >
      {/* Image */}
      <div className="relative">
        <img
          src={
            food.imageUrl || "https://via.placeholder.com/300x200?text=No+Image"
          }
          alt={food.name}
          loading="lazy"
          decoding="async"
          width={300}
          height={200}
          className="w-full object-cover"
          style={{ height: 160 }}
        />
        {!food.isAvailable && (
          <span className="absolute top-2 left-2 text-xs px-2 py-0.5 font-mono font-bold bg-neutral-900 text-neutral-500">
            UNAVAILABLE
          </span>
        )}
        {food.isAvailable && food.tag && (
          <span className="absolute top-2 left-2 text-xs px-2 py-0.5 font-mono font-bold bg-lime-400 text-black">
            {food.tag}
          </span>
        )}
        <AnimatePresence>
          {isInCart && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-2 right-2 bg-lime-400 text-black px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              ADDED
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Ref + Price */}
        <div className="flex justify-between items-start mb-2">
          <span className="text-neutral-500 text-xs tracking-wider uppercase">
            {food.category || "DISH"}
          </span>
          <div className="text-right">
            {food.oldPrice && (
              <span className="block text-neutral-600 text-xs line-through">
                ${food.oldPrice.toFixed(2)}
              </span>
            )}
            <span
              className="text-xs font-mono font-semibold"
              style={{ color: "#c8f135" }}
            >
              ${food.price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Name */}
        <h3 className="hero-title font-bold text-base text-white leading-tight mb-3 whitespace-pre-line">
          {food.name}
        </h3>
        {/* Stars */}
        <div className="flex items-center gap-2 mb-4">
          <StarRating rating={food.rating || 0} />
          <span className="text-neutral-600 text-xs">
            {food.reviewCount
              ? `${food.reviewCount} reviews`
              : "No reviews yet"}
          </span>
        </div>

        {/* Button */}
        {food.isAvailable ? (
          <motion.button
            onClick={handleAddToCart}
            disabled={isInCart}
            whileHover={!isInCart ? { scale: 1.02 } : {}}
            whileTap={!isInCart ? { scale: 0.98 } : {}}
            className="w-full border border-neutral-700 text-xs tracking-widest py-2.5 transition-colors text-neutral-400 relative overflow-hidden"
            style={{ 
              borderColor: isInCart ? "#c8f135" : "",
              color: isInCart ? "#c8f135" : ""
            }}
          >
            <AnimatePresence mode="wait">
              {isInCart ? (
                <motion.span
                  key="added"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  IN CART
                </motion.span>
              ) : (
                <motion.span
                  key="add"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  ADD TO CART
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        ) : (
          <button
            disabled
            className="w-full border border-neutral-800 text-xs tracking-widest py-2.5 text-neutral-700 cursor-not-allowed"
          >
            UNAVAILABLE
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Memoized so adding an item to the cart only re-renders cards whose
// isInCart prop actually changed (Menu/Home pass per-card booleans).
const FoodCard = memo(FoodCardImpl);

export default FoodCard;
