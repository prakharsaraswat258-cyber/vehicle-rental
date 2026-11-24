// Booking form on the vehicle page: dates, live total, clash check and saving.
(function () {
  const box = document.getElementById('booking-box');
  if (!box) return; // vehicle not found

  const vehicleId = new URLSearchParams(location.search).get('id');
  const vehicle = Store.get('vr_vehicles', []).find(function (v) { return v.id === vehicleId; });
  if (!vehicle || !vehicle.available) return; // the details page already shows the notice

  const today = Rental.todayStr();
  box.innerHTML =
    '<div class="card">' +
    '<h2>Choose your dates</h2>' +
    '<div class="form-row">' +
    '<div class="field"><label for="start">Pickup date</label><input type="date" id="start" min="' + today + '"></div>' +
    '<div class="field"><label for="end">Return date</label><input type="date" id="end" min="' + today + '"></div>' +
    '</div>' +
    '<div id="booking-msg"></div>' +
    '<div id="summary"></div>' +
    '<button class="btn" type="button" id="book-btn" disabled>Book</button>' +
    '</div>';

  const startInput = document.getElementById('start');
  const endInput = document.getElementById('end');
  const msg = document.getElementById('booking-msg');
  const summary = document.getElementById('summary');
  const bookBtn = document.getElementById('book-btn');
  const touched = { start: false, end: false };

  function showError(text) {
    msg.innerHTML = '<div class="msg msg-bad" role="alert">' + esc(text) + '</div>';
  }

  // a refused booking: show why, hide the total until the dates change
  function refuse(text) {
    showError(text);
    summary.innerHTML = '';
    bookBtn.disabled = true;
  }

  function update() {
    const start = startInput.value;
    const end = endInput.value;
    const check = Rental.validateDates(start, end, Rental.todayStr());
    msg.innerHTML = '';
    summary.innerHTML = '';

    if (!check.ok) {
      bookBtn.disabled = true;
      // "Pick both dates." only shows after both fields were touched
      if (check.message !== 'Pick both dates.' || (touched.start && touched.end)) showError(check.message);
      return;
    }

    const days = Rental.daysBetween(start, end);
    const total = Rental.totalPrice(vehicle.pricePerDay, start, end);
    summary.innerHTML =
      '<div class="summary">' +
      '<p>' + days + (days === 1 ? ' day' : ' days') + ' x ' + Rental.formatRupees(vehicle.pricePerDay) +
      ' = ' + Rental.formatRupees(total) + '</p>' +
      '<p class="total">Total: ' + Rental.formatRupees(total) + '</p>' +
      '<p class="muted">Pay at pickup.</p>' +
      '</div>';
    bookBtn.disabled = false;
  }

  function book() {
    const start = startInput.value;
    const end = endInput.value;

    // 1. dates
    const check = Rental.validateDates(start, end, Rental.todayStr());
    if (!check.ok) { refuse(check.message); return; }

    // 2. still available? (read again, the admin may have changed it)
    const fresh = Store.get('vr_vehicles', []).find(function (v) { return v.id === vehicleId; });
    if (!fresh || !fresh.available) { refuse('This vehicle is not available for new bookings right now.'); return; }

    // 3. logged in?
    const user = Auth.currentUser();
    if (!user) {
      location.href = 'login.html?next=' + encodeURIComponent('vehicle.html?id=' + vehicleId);
      return;
    }

    // 4. clash with another booking (read storage again, not an old copy)
    const bookings = Store.get('vr_bookings', []);
    const clash = Rental.findClash(bookings, vehicleId, start, end);
    if (clash) {
      refuse('These dates are already booked for this vehicle (' + Rental.formatDate(clash.start) +
        ' to ' + Rental.formatDate(clash.end) + '). Please pick other dates.');
      return;
    }

    // 5. maintenance
    const windows = Store.get('vr_maintenance', []);
    const service = Rental.findMaintenanceClash(windows, vehicleId, start, end);
    if (service) {
      refuse('This vehicle is under maintenance from ' + Rental.formatDate(service.start) +
        ' to ' + Rental.formatDate(service.end) + '.');
      return;
    }

    // 6. save
    const booking = {
      id: Store.nextId('BK-'),
      vehicleId: vehicleId,
      userId: user.id,
      start: start,
      end: end,
      days: Rental.daysBetween(start, end),
      total: Rental.totalPrice(fresh.pricePerDay, start, end),
      status: 'Booked',
      paymentStatus: 'Unpaid',
      createdAt: new Date().toISOString()
    };
    bookings.push(booking);
    if (!Store.set('vr_bookings', bookings)) { refuse('Could not save the booking. Please try again.'); return; }

    Notify.add(user.id, 'Booking ' + booking.id + ' confirmed for ' + fresh.name + ', ' +
      Rental.formatDate(start) + ' to ' + Rental.formatDate(end) + '.');
    Notify.add(Notify.adminId(), 'New booking ' + booking.id + ' for ' + fresh.name + '.');

    location.href = 'my-bookings.html?new=' + encodeURIComponent(booking.id);
  }

  startInput.addEventListener('change', function () { touched.start = true; update(); });
  endInput.addEventListener('change', function () { touched.end = true; update(); });
  startInput.addEventListener('input', update);
  endInput.addEventListener('input', update);
  bookBtn.addEventListener('click', book);
})();
