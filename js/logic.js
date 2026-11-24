// Rule functions for the whole site: price, dates, clash and cancel.
// No page code here. Pages call these functions, they never copy the formulas.
// Dates are always strings like "2026-12-05".
(function (root) {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // turn "2026-12-05" into a day number (UTC, so daylight saving never changes a count)
  function dayNumber(str) {
    const parts = str.split('-');
    return Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])) / 86400000;
  }

  const Rental = {
    // days counting both the pickup day and the return day
    daysBetween: function (start, end) {
      return dayNumber(end) - dayNumber(start) + 1;
    },

    // total = days x price per day. Nothing else is added.
    totalPrice: function (pricePerDay, start, end) {
      return Rental.daysBetween(start, end) * pricePerDay;
    },

    validateDates: function (start, end, today) {
      if (!start || !end) return { ok: false, message: 'Pick both dates.' };
      if (start < today) return { ok: false, message: 'Pickup date cannot be in the past.' };
      if (end < start) return { ok: false, message: 'Return date cannot be before pickup date.' };
      if (Rental.daysBetween(start, end) > 30) return { ok: false, message: 'Longest rental is 30 days.' };
      return { ok: true };
    },

    overlaps: function (aStart, aEnd, bStart, bEnd) {
      return aStart <= bEnd && aEnd >= bStart;
    },

    // only Booked and Ongoing bookings hold their dates
    findClash: function (bookings, vehicleId, start, end) {
      for (let i = 0; i < bookings.length; i++) {
        const b = bookings[i];
        if (b.vehicleId !== vehicleId) continue;
        if (b.status !== 'Booked' && b.status !== 'Ongoing') continue;
        if (Rental.overlaps(start, end, b.start, b.end)) return b;
      }
      return null;
    },

    findMaintenanceClash: function (windows, vehicleId, start, end) {
      for (let i = 0; i < windows.length; i++) {
        const w = windows[i];
        if (w.vehicleId === vehicleId && Rental.overlaps(start, end, w.start, w.end)) return w;
      }
      return null;
    },

    canCancel: function (booking, today) {
      return booking.status === 'Booked' && today < booking.start;
    },

    todayStr: function (date) {
      const d = date || new Date();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return d.getFullYear() + '-' + m + '-' + day;
    },

    formatRupees: function (n) {
      return '₹' + n.toLocaleString('en-IN');
    },

    formatDate: function (str) {
      const parts = str.split('-');
      return Number(parts[2]) + ' ' + MONTHS[Number(parts[1]) - 1] + ' ' + parts[0];
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Rental;
  else root.Rental = Rental;
})(this);
