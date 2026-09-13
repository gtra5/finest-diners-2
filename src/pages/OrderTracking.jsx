import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api, { confirmReceipt, submitComplaint } from '../services/api';
import { getSocket } from '../services/socket';

const RESTAURANT_ID = import.meta.env.VITE_RESTAURANT_ID;

const OLIVE = "#6B7C2F";
const OLIVE_DIM = "#3a4419";
const OLIVE_LIGHT = "#D4E2B9";
const DARK = "#050A0A";
const SURFACE = "#0f1410";
const BORDER = "#1e251e";

const STATUS_STEPS = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

const STATUS_LABELS = {
  pending: 'ORDER PLACED',
  confirmed: 'CONFIRMED',
  preparing: 'PREPARING',
  out_for_delivery: 'OUT FOR DELIVERY',
  delivered: 'DELIVERED',
  cancelled: 'CANCELLED',
};

const STATUS_ICONS = {
  pending: '📋',
  confirmed: '✅',
  preparing: '👨‍🍳',
  out_for_delivery: '🛵',
  delivered: '🎉',
};

const OrderTracking = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState('');
  const [complaint, setComplaint] = useState('');
  const [complaintError, setComplaintError] = useState('');
  const [complaintSuccess, setComplaintSuccess] = useState(false);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [showComplaintForm, setShowComplaintForm] = useState(false);

  // Customer confirms receipt of a delivered order
  const handleConfirmReceipt = async () => {
    setConfirming(true);
    setConfirmMsg('');
    try {
      const { data } = await api.put(`/orders/${id}/receive`);
      setOrder(data);
      setConfirmMsg('Thanks! Enjoy your meal.');
    } catch (err) {
      setConfirmMsg(err?.response?.data?.message || 'Could not confirm receipt.');
    } finally {
      setConfirming(false);
    }
  };

  // Customer files a complaint
  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    setComplaintError('');
    setComplaintSuccess(false);
    setSubmittingComplaint(true);
    try {
      await submitComplaint(id, complaint);
      setComplaintSuccess(true);
      setComplaint('');
    } catch (err) {
      setComplaintError(err?.response?.data?.message || 'Failed to submit complaint.');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data);
      } catch {
        setError('Could not load order details.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
    const interval = setInterval(fetchOrder, 15000);
    return () => clearInterval(interval);
  }, [id]);

  // Socket.IO for live driver location updates, using the shared singleton
  // (getSocket) so the connection is reused with a single authenticated
  // transport instead of opening a new raw socket per page.
  useEffect(() => {
    if (!order) return undefined;

    const token = localStorage.getItem('token');
    if (!token) return undefined;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const join = () => socket.emit('join_order_room', { orderId: id });

    const onUpdate = (data) => {
      if (data.eta !== undefined) setEta(data.eta);
      if (data.distance !== undefined) setDistance(data.distance);
    };
    const onError = (data) => {
      console.error('Tracking error:', data.message);
    };

    socket.on('connect', join);
    socket.on('location:update', onUpdate);
    socket.on('tracking:error', onError);
    if (socket.connected) join();

    return () => {
      socket.off('connect', join);
      socket.off('location:update', onUpdate);
      socket.off('tracking:error', onError);
      socket.emit('leave_order_room', { orderId: id });

      // The singleton is shared across the app (menu, checkout, other tracking
      // hooks), so do NOT blindly disconnect on unmount — another consumer may
      // still need the connection. Only tear it down if this was the last user,
      // which we approximate by disconnecting only when nothing else is active.
      // Other consumers call getSocket() and manage their own lifecycle, so we
      // leave the shared connection in place here.
    };
  }, [id, order]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: DARK }}>
        <div className="w-10 h-10 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono tracking-widest" style={{ color: OLIVE_LIGHT }}>LOADING ORDER...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6" style={{ background: DARK }}>
        <p className="text-red-400 text-sm font-mono text-center">{error || 'Order not found.'}</p>
        <Link 
          to={`/menu/${RESTAURANT_ID}`} 
          className="font-black tracking-tighter py-3 px-6 transition"
          style={{ background: OLIVE, color: '#fff', fontFamily: 'Arial Black, sans-serif', fontSize: '14px' }}
        >
          BACK TO MENU
        </Link>
      </div>
    );
  }

  const currentStep = STATUS_STEPS.indexOf(order.status);
  const progressPct = currentStep >= 0 ? (currentStep / (STATUS_STEPS.length - 1)) * 100 : 0;

  return (
    <div className="min-h-screen text-white w-full px-6 sm:px-12 lg:px-16 pt-20 sm:pt-24 pb-8 sm:pb-10" style={{ background: DARK }}>

      {/* ── PAGE HEADER ── */}
      <section className="max-w-screen-xl mx-auto mb-6 sm:mb-8">
        <motion.p
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="text-[9px] tracking-[0.35em] font-semibold mb-4 uppercase"
          style={{ color: OLIVE }}
        >
          LIVE STATUS
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
          ORDER
          <br />
          <span style={{ color: OLIVE }}>TRACKING.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm font-mono mt-3"
          style={{ color: "#5a6a5a" }}
        >
          ID: {order._id}
        </motion.p>
      </section>

      <div className="max-w-screen-xl mx-auto flex flex-col lg:flex-row gap-6">

        {/* ── LEFT: status + details ── */}
        <div className="flex-1 space-y-5">

          {/* Status stepper */}
          {order.status !== 'cancelled' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="border p-6"
              style={{ background: SURFACE, borderColor: BORDER }}
            >
              <p className="text-[9px] tracking-[0.25em] font-semibold mb-6 uppercase" style={{ color: OLIVE_LIGHT }}>
                DELIVERY PROGRESS
              </p>

              {/* Progress bar */}
              <div className="relative h-1 mb-8" style={{ background: BORDER }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.7 }}
                  className="absolute inset-y-0 left-0"
                  style={{ background: OLIVE }}
                />
              </div>

              {/* Steps */}
              <div className="grid grid-cols-5 gap-1">
                {STATUS_STEPS.map((step, index) => {
                  const done = index < currentStep;
                  const active = index === currentStep;
                  return (
                    <div key={step} className="flex flex-col items-center gap-2 text-center">
                      <div
                        className={`w-9 h-9 flex items-center justify-center text-base border transition-colors ${
                          done || active ? 'border-lime-400 text-lime-400' : 'border-neutral-700 text-neutral-600'
                        }`}
                        style={done || active ? { background: 'rgba(107,124,47,0.15)' } : { background: '#0d0d0d' }}
                      >
                        {done ? '✓' : STATUS_ICONS[step]}
                      </div>
                      <span
                        className={`text-[9px] font-mono tracking-wider leading-tight ${
                          done || active ? 'text-lime-400' : 'text-neutral-600'
                        }`}
                      >
                        {STATUS_LABELS[step]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border border-red-800 bg-red-950 text-red-400 text-xs font-mono px-5 py-4"
            >
              ✕ THIS ORDER HAS BEEN CANCELLED.
            </motion.div>
          )}

          {/* Order items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="border p-6"
            style={{ background: SURFACE, borderColor: BORDER }}
          >
            <p className="text-[9px] tracking-[0.25em] font-semibold mb-4 uppercase" style={{ color: OLIVE_LIGHT }}>
              ITEMS
            </p>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs font-mono border-b pb-3 last:border-0 last:pb-0" style={{ borderColor: BORDER, color: "#7a8a7a" }}>
                  <span>{item.name} × {item.quantity}</span>
                  <span style={{ color: "#fff" }}>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-4 border-t mt-1" style={{ borderColor: BORDER }}>
              <span className="font-black text-sm" style={{ color: "#fff", fontFamily: "Arial Black, sans-serif" }}>TOTAL</span>
              <span className="font-mono font-bold text-sm" style={{ color: "#fff" }}>${order.totalPrice.toFixed(2)}</span>
            </div>
          </motion.div>

        </div>

        {/* ── RIGHT: delivery details ── */}
        <div className="lg:w-72 flex-shrink-0 space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="border p-6"
            style={{ background: SURFACE, borderColor: BORDER }}
          >
            <p className="text-[9px] tracking-[0.25em] font-semibold mb-4 uppercase" style={{ color: OLIVE_LIGHT }}>
              DELIVERY DETAILS
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: "#5a6a5a" }}>ADDRESS</p>
                <p className="text-sm font-mono" style={{ color: "#fff" }}>📍 {order.deliveryAddress}</p>
              </div>
              {order.status === 'out_for_delivery' && (eta !== null || distance !== null) && (
                <div>
                  <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: "#5a6a5a" }}>ETA</p>
                  <p className="text-sm font-mono" style={{ color: OLIVE_LIGHT }}>
                    {eta !== null ? `⏱️ ${eta} min away` : 'Calculating...'}
                  </p>
                  {distance !== null && (
                    <p className="text-xs font-mono mt-1" style={{ color: "#7a8a7a" }}>
                      📏 {distance} km
                    </p>
                  )}
                </div>
              )}
              <div>
                <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: "#5a6a5a" }}>PAYMENT</p>
                <p className="text-sm font-mono" style={{ color: "#fff" }}>
                  💳 {order.paymentMethod === 'card' ? 'Card Payment' : 'Cash on Delivery'}
                </p>
              </div>
              {order.restaurant && (
                <div>
                  <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: "#5a6a5a" }}>RESTAURANT</p>
                  <p className="text-sm font-mono" style={{ color: "#fff" }}>🍽️ {order.restaurant.name}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Confirm receipt + complaint */}
          {order.status === 'delivered' && order.status !== 'received' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="border p-6"
              style={{ background: SURFACE, borderColor: BORDER }}
            >
              {!confirmMsg ? (
                <>
                  <p className="text-[10px] text-center font-semibold uppercase tracking-widest mb-1" style={{ color: OLIVE_LIGHT }}>
                    GOT YOUR ORDER?
                  </p>
                  <p className="text-xs text-center font-mono mb-4" style={{ color: "#5a6a5a" }}>
                    Confirm receipt so we know it arrived safely.
                  </p>
                  <button
                    onClick={handleConfirmReceipt}
                    disabled={confirming}
                    className="w-full text-center font-black tracking-tighter py-3 transition disabled:opacity-50"
                    style={{ background: OLIVE, color: '#fff', fontFamily: 'Arial Black, sans-serif', fontSize: '14px' }}
                  >
                    {confirming ? 'CONFIRMING...' : "I'VE RECEIVED MY ORDER ✓"}
                  </button>
                </>
              ) : (
                <p className="text-center text-sm font-mono" style={{ color: OLIVE_LIGHT }}>
                  {confirmMsg}
                </p>
              )}
            </motion.div>
          )}

          {/* Complaint box — available once received */}
          {order.status === 'received' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="border p-6"
              style={{ background: SURFACE, borderColor: BORDER }}
            >
              {!showComplaintForm ? (
                <button
                  onClick={() => setShowComplaintForm(true)}
                  className="w-full text-center text-[11px] font-semibold uppercase tracking-widest py-3 border transition-colors"
                  style={{ borderColor: BORDER, color: OLIVE_LIGHT }}
                >
                  📝 Having an issue? File a complaint
                </button>
              ) : (
                <form onSubmit={handleSubmitComplaint}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: OLIVE_LIGHT }}>
                    FILE A COMPLAINT
                  </p>
                  <textarea
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    required
                    minLength={10}
                    maxLength={1000}
                    rows={4}
                    placeholder="Tell us what went wrong (min. 10 characters)..."
                    className="w-full bg-neutral-900 border text-white text-sm font-mono px-3 py-2 mb-2 focus:outline-none resize-none"
                    style={{ borderColor: BORDER }}
                  />
                  {complaintError && (
                    <p className="text-xs font-mono mb-2" style={{ color: "#b33939" }}>{complaintError}</p>
                  )}
                  {complaintSuccess && (
                    <p className="text-xs font-mono mb-2" style={{ color: OLIVE_LIGHT }}>
                      Complaint submitted. We'll get back to you shortly.
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={submittingComplaint}
                    className="w-full text-center font-black tracking-tighter py-3 transition disabled:opacity-50"
                    style={{ background: OLIVE, color: '#fff', fontFamily: 'Arial Black, sans-serif', fontSize: '13px' }}
                  >
                    {submittingComplaint ? 'SUBMITTING...' : 'SUBMIT COMPLAINT'}
                  </button>
                </form>
              )}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <Link 
              to={`/menu/${RESTAURANT_ID}`} 
              className="block text-center font-black tracking-tighter py-3 transition"
              style={{ background: OLIVE, color: '#fff', fontFamily: 'Arial Black, sans-serif', fontSize: '14px' }}
            >
              ORDER AGAIN
            </Link>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default OrderTracking;