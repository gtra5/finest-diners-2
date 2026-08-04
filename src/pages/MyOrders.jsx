import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';

const RESTAURANT_ID = import.meta.env.VITE_RESTAURANT_ID;

const OLIVE = "#6B7C2F";
const OLIVE_DIM = "#3a4419";
const OLIVE_LIGHT = "#D4E2B9";
const DARK = "#050A0A";
const SURFACE = "#0f1410";
const BORDER = "#1e251e";

const STATUS_COLOR = {
  pending:          { text: 'text-yellow-400',  border: 'border-yellow-800',  bg: 'bg-yellow-950' },
  confirmed:        { text: 'text-blue-400',    border: 'border-blue-800',    bg: 'bg-blue-950'   },
  preparing:        { text: 'text-orange-400',  border: 'border-orange-800',  bg: 'bg-orange-950' },
  out_for_delivery: { text: 'text-purple-400',  border: 'border-purple-800',  bg: 'bg-purple-950' },
  delivered:        { text: 'text-lime-400',    border: 'border-lime-800',    bg: 'bg-lime-950'   },
  cancelled:        { text: 'text-red-400',     border: 'border-red-800',     bg: 'bg-red-950'    },
};

const STATUS_LABEL = {
  pending:          'PENDING',
  confirmed:        'CONFIRMED',
  preparing:        'PREPARING',
  out_for_delivery: 'OUT FOR DELIVERY',
  delivered:        'DELIVERED',
  cancelled:        'CANCELLED',
};

const STATUS_ICON = {
  pending:          '📋',
  confirmed:        '✅',
  preparing:        '👨‍🍳',
  out_for_delivery: '🛵',
  delivered:        '🎉',
  cancelled:        '✕',
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/orders/my')
      .then(({ data }) => setOrders(data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load orders.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: DARK }}>
        <div className="w-10 h-10 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono tracking-widest" style={{ color: OLIVE_LIGHT }}>LOADING ORDERS...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6" style={{ background: DARK }}>
        <p className="text-red-400 text-sm font-mono text-center">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="font-black tracking-tighter py-3 px-6 transition"
          style={{ background: OLIVE, color: '#fff', fontFamily: 'Arial Black, sans-serif', fontSize: '14px' }}
        >
          RETRY
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white w-full px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-8 sm:pb-10" style={{ background: DARK }}>

      {/* ── PAGE HEADER ── */}
      <section className="max-w-screen-xl mx-auto mb-6 sm:mb-8">
        <motion.p
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="text-[9px] tracking-[0.35em] font-semibold mb-4 uppercase"
          style={{ color: OLIVE }}
        >
          ACCOUNT
        </motion.p>
        <motion.h1
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="font-black leading-none tracking-tighter"
          style={{
            fontSize: "clamp(48px, 8vw, 72px)",
            color: "#fff",
            fontFamily: "Arial Black, sans-serif",
            lineHeight: 0.9,
          }}
        >
          MY
          <br />
          <span style={{ color: OLIVE }}>ORDERS.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm font-mono mt-3"
          style={{ color: "#5a6a5a" }}
        >
          {orders.length} ORDER{orders.length !== 1 ? 'S' : ''} IN YOUR HISTORY
        </motion.p>
      </section>

      {/* ── EMPTY STATE ── */}
      {orders.length === 0 ? (
        <div className="max-w-screen-xl mx-auto flex flex-col items-center justify-center gap-5 py-28 px-6">
          <span className="text-5xl">🛵</span>
          <p className="text-xs font-mono tracking-widest" style={{ color: OLIVE_LIGHT }}>NO ORDERS YET</p>
          <p className="text-sm font-mono text-center max-w-sm" style={{ color: "#5a6a5a" }}>
            You haven't placed any orders. Browse the menu and place your first one.
          </p>
          <Link 
            to={`/menu/${RESTAURANT_ID}`} 
            className="font-black tracking-tighter py-3 px-6 transition"
            style={{ background: OLIVE, color: '#fff', fontFamily: 'Arial Black, sans-serif', fontSize: '14px' }}
          >
            BROWSE MENU
          </Link>
        </div>
      ) : (
        <section className="max-w-screen-xl mx-auto space-y-3">
          {orders.map((order, index) => {
            const s = STATUS_COLOR[order.status] || STATUS_COLOR.pending;
            const activeStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery'];
            const isActive = activeStatuses.includes(order.status);

            return (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                className="border transition-colors"
                style={{ background: SURFACE, borderColor: BORDER }}
              >
                {/* Top bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b" style={{ borderColor: BORDER }}>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-mono tracking-widest px-2 py-1 border ${s.text} ${s.border} ${s.bg}`}
                    >
                      <span>{STATUS_ICON[order.status]}</span>
                      {STATUS_LABEL[order.status]}
                    </span>
                    {order.restaurant && (
                      <span className="text-xs font-mono" style={{ color: "#5a6a5a" }}>
                        {order.restaurant.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono" style={{ color: "#3a4a3a" }}>
                      {formatDate(order.createdAt)}
                    </span>
                    <span className="font-mono text-sm font-bold" style={{ color: '#fff' }}>
                      ${order.totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Items list */}
                <div className="px-5 py-4 flex flex-wrap gap-x-4 gap-y-1">
                  {order.items.map((item, i) => (
                    <span key={i} className="text-xs font-mono" style={{ color: "#7a8a7a" }}>
                      {item.name} × {item.quantity}
                      {i < order.items.length - 1 && <span style={{ color: "#3a4a3a", marginLeft: '16px' }}>·</span>}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t flex flex-wrap items-center justify-between gap-3" style={{ borderColor: BORDER }}>
                  <span className="text-[10px] font-mono tracking-wider truncate max-w-xs" style={{ color: "#3a4a3a" }}>
                    ID: {order._id}
                  </span>
                  <div className="flex gap-2">
                    {isActive && (
                      <Link
                        to={`/orders/${order._id}`}
                        className="font-black tracking-tighter py-1.5 px-3 text-[10px] transition"
                        style={{ background: OLIVE, color: '#fff', fontFamily: 'Arial Black, sans-serif' }}
                      >
                        TRACK LIVE →
                      </Link>
                    )}
                    {!isActive && (
                      <Link
                        to={`/orders/${order._id}`}
                        className="font-mono py-1.5 px-3 text-[10px] transition border"
                        style={{ color: OLIVE_LIGHT, borderColor: BORDER }}
                      >
                        VIEW DETAILS
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </section>
      )}

    </div>
  );
}