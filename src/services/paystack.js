// Paystack Inline popup helper.
// Loads Paystack's official script once, then opens a payment popup for the
// given access_code (amount/key come from the backend's /payments/initialize).
let paystackPromise = null;

const loadPaystack = () => {
  if (window?.PaystackPop) return Promise.resolve(window.PaystackPop);
  if (!paystackPromise) {
    paystackPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://js.paystack.co/v1/inline.js';
      s.async = true;
      s.onload = () => (window.PaystackPop ? resolve(window.PaystackPop) : reject(new Error('Paystack failed to load')));
      s.onerror = () => reject(new Error('Could not load Paystack'));
      document.head.appendChild(s);
    });
  }
  return paystackPromise;
};

// Open the Paystack popup for a transaction initialized by the backend.
// access_code + email + amount come straight from /payments/initialize so the
// charged amount always matches the server's order total.
export const openPaystackPopup = async ({ key, email, amount, access_code, onSuccess, onCancel }) => {
  const PaystackPop = await loadPaystack();
  PaystackPop.setup({
    key,
    email,
    amount,
    access_code,
    onSuccess,
    onCancel,
  });
  PaystackPop.openIframe();
};

export default openPaystackPopup;