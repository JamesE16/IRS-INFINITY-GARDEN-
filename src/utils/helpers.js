// ============================================================
//  HELPERS — Date formatting, price calculations, ID generation
// ============================================================

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

//Calculatess the number of nights between two date strings
export const calcNights = (checkin, checkout) => {
  if (!checkin || !checkout) return 0;
  const diff = new Date(checkout) - new Date(checkin);
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

//Calculates the subtotal, tax (15%), and total
 
export const calcTotal = (pricePerNight, nights) => {
  const subtotal = pricePerNight * nights;
  const tax      = subtotal * 0.15;
  const total    = subtotal + tax;
  return { subtotal, tax, total };
};

// Generates a unique booking ID
export const generateBookingId = () => 'BK' + Date.now();

// Get today's date as YYYY-MM-DD (for date input min)
 
export const todayStr = () => new Date().toISOString().split('T')[0];

// Get minimum checkout date (day after checkin)
export const minCheckout = (checkin) => {
  if (!checkin) return todayStr();
  const d = new Date(checkin + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};
