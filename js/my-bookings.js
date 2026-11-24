// My Bookings page: the logged-in user's bookings and the Cancel button.
(function () {
  const user = Auth.requireLogin('my-bookings.html');
  if (!user) return;

  const msg = document.getElementById('page-msg');
  const area = document.getElementById('bookings-area');

  function vehicleName(id) {
    const v = Store.get('vr_vehicles', []).find(function (x) { return x.id === id; });
    return v ? v.name : 'Unknown vehicle';
  }

  function myBookings() {
    return Store.get('vr_bookings', [])
      .filter(function (b) { return b.userId === user.id; })
      .reverse(); // newest first
  }

  function showOk(text) {
    msg.innerHTML = '<div class="msg msg-ok">' + esc(text) + '</div>';
  }

  function draw() {
    const list = myBookings();
    if (list.length === 0) {
      area.innerHTML = '<p>You have no bookings yet.</p><p><a href="vehicles.html">Browse vehicles</a></p>';
      return;
    }
    const today = Rental.todayStr();
    let html = '<div class="table-wrap"><table><thead><tr>' +
      '<th>Booking ID</th><th>Vehicle</th><th>Pickup</th><th>Return</th><th>Days</th>' +
      '<th>Total</th><th>Status</th><th>Payment</th><th>Action</th></tr></thead><tbody>';
    list.forEach(function (b) {
      let action = '-';
      if (b.status === 'Booked') {
        if (Rental.canCancel(b, today)) {
          action = '<button class="btn btn-small btn-danger" type="button" data-cancel="' + esc(b.id) + '">Cancel</button>';
        } else {
          action = '<button class="btn btn-small" type="button" disabled>Cancel</button>' +
            '<span class="hint">Cannot cancel after the start date</span>';
        }
      }
      html += '<tr>' +
        '<td>' + esc(b.id) + '</td>' +
        '<td>' + esc(vehicleName(b.vehicleId)) + '</td>' +
        '<td>' + Rental.formatDate(b.start) + '</td>' +
        '<td>' + Rental.formatDate(b.end) + '</td>' +
        '<td>' + b.days + '</td>' +
        '<td class="price">' + Rental.formatRupees(b.total) + '</td>' +
        '<td><span class="tag tag-' + b.status.toLowerCase() + '">' + esc(b.status) + '</span></td>' +
        '<td><span class="tag tag-' + b.paymentStatus.toLowerCase() + '">' + esc(b.paymentStatus) + '</span></td>' +
        '<td class="actions">' + action + '</td>' +
        '</tr>';
    });
    html += '</tbody></table></div>';
    area.innerHTML = html;
  }

  // one click handler for every Cancel button in the table
  area.addEventListener('click', function (e) {
    const id = e.target.getAttribute('data-cancel');
    if (!id) return;
    if (!confirm('Cancel this booking?')) return;

    const bookings = Store.get('vr_bookings', []);
    const booking = bookings.find(function (b) { return b.id === id && b.userId === user.id; });
    if (!booking || !Rental.canCancel(booking, Rental.todayStr())) {
      msg.innerHTML = '<div class="msg msg-bad">This booking can no longer be cancelled.</div>';
      draw();
      return;
    }
    booking.status = 'Cancelled';
    Store.set('vr_bookings', bookings);
    Notify.add(user.id, 'Booking ' + booking.id + ' was cancelled.');
    Notify.add(Notify.adminId(), 'Booking ' + booking.id + ' was cancelled by the customer.');
    showOk('Booking ' + booking.id + ' cancelled.');
    draw();
    Layout.render(); // update the notifications count
  });

  // green box after a new booking
  const newId = new URLSearchParams(location.search).get('new');
  if (newId && myBookings().some(function (b) { return b.id === newId; })) {
    showOk('Booking confirmed! Your booking ID is ' + newId + '. Pay at pickup. Bring your licence.');
  }

  draw();
})();
