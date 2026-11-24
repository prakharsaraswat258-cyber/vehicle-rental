// Admin dashboard: vehicles, bookings (payment + rental status) and maintenance.
(function () {
  const user = Auth.requireLogin('admin.html');
  if (!user) return;

  const main = document.getElementById('admin-main');
  if (user.role !== 'admin') {
    main.innerHTML = '<div class="card"><h1>Admins only.</h1><p><a href="index.html">Go to home</a></p></div>';
    main.hidden = false;
    return;
  }
  main.hidden = false;

  const msg = document.getElementById('admin-msg');
  function showOk(text) { msg.innerHTML = '<div class="msg msg-ok">' + esc(text) + '</div>'; }
  function showError(text) { msg.innerHTML = '<div class="msg msg-bad" role="alert">' + esc(text) + '</div>'; }
  function clearMsg() { msg.innerHTML = ''; }

  function vehicles() { return Store.get('vr_vehicles', []); }
  function vehicleName(id) {
    const v = vehicles().find(function (x) { return x.id === id; });
    return v ? v.name : 'Unknown';
  }

  // ---------- tabs ----------
  const tabs = document.querySelectorAll('.tabs .btn');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) {
        const on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        document.getElementById(t.getAttribute('data-tab')).hidden = !on;
      });
      clearMsg();
    });
  });

  // ---------- vehicles tab ----------
  function drawVehicles() {
    const list = vehicles();
    const area = document.getElementById('vehicles-table');
    if (list.length === 0) { area.innerHTML = '<p class="muted">No vehicles yet.</p>'; return; }
    let html = '<div class="table-wrap"><table><thead><tr><th>Name</th><th>Type</th><th>Price per day</th>' +
      '<th>Availability</th><th>Action</th></tr></thead><tbody>';
    list.forEach(function (v) {
      html += '<tr><td>' + esc(v.name) + '</td><td>' + esc(v.type) + '</td>' +
        '<td class="price">' + Rental.formatRupees(v.pricePerDay) + '</td>' +
        '<td>' + (v.available ? '<span class="tag tag-ok">Available</span>' : '<span class="tag tag-bad">Not available</span>') + '</td>' +
        '<td class="actions"><button class="btn btn-small btn-light" type="button" data-toggle="' + esc(v.id) + '">' +
        (v.available ? 'Make unavailable' : 'Make available') + '</button></td></tr>';
    });
    html += '</tbody></table></div>';
    area.innerHTML = html;
  }

  document.getElementById('vehicles-table').addEventListener('click', function (e) {
    const id = e.target.getAttribute('data-toggle');
    if (!id) return;
    const list = vehicles();
    const v = list.find(function (x) { return x.id === id; });
    if (!v) return;
    v.available = !v.available;
    Store.set('vr_vehicles', list);
    showOk(v.name + (v.available ? ' is now available.' : ' is now not available.'));
    drawVehicles();
    drawMaintenanceForm();
  });

  const addForm = document.getElementById('add-vehicle-form');
  addForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = addForm.vname.value.trim();
    const priceText = addForm.price.value.trim();
    if (!name) { showError('Please enter a vehicle name.'); return; }
    if (!/^\d+$/.test(priceText) || Number(priceText) < 1) { showError('Price must be a whole number of 1 or more.'); return; }

    const list = vehicles();
    // next id: one more than the biggest number used so far
    let biggest = 0;
    list.forEach(function (v) {
      const n = parseInt(String(v.id).replace('v', ''), 10);
      if (n > biggest) biggest = n;
    });
    list.push({
      id: 'v' + (biggest + 1),
      name: name,
      type: addForm.vtype.value,
      pricePerDay: Number(priceText),
      image: addForm.image.value.trim(),
      description: addForm.description.value.trim(),
      available: true
    });
    Store.set('vr_vehicles', list);
    addForm.reset();
    showOk('Vehicle added.');
    drawVehicles();
    drawMaintenanceForm();
  });

  // ---------- bookings tab ----------
  function customer(id) {
    const u = Store.get('vr_users', []).find(function (x) { return x.id === id; });
    return u ? esc(u.name) + '<span class="hint">' + esc(u.email) + '</span>' : 'Unknown';
  }

  function drawBookings() {
    const list = Store.get('vr_bookings', []).slice().reverse();
    const area = document.getElementById('bookings-table');
    if (list.length === 0) { area.innerHTML = '<p class="muted">No bookings yet.</p>'; return; }
    let html = '<div class="table-wrap"><table><thead><tr><th>Booking ID</th><th>Customer</th><th>Vehicle</th>' +
      '<th>Pickup</th><th>Return</th><th>Days</th><th>Total</th><th>Status</th><th>Payment</th><th>Actions</th>' +
      '</tr></thead><tbody>';
    list.forEach(function (b) {
      let actions = '';
      if (b.status !== 'Cancelled') {
        if (b.paymentStatus === 'Unpaid') actions += '<button class="btn btn-small btn-light" type="button" data-act="paid" data-id="' + esc(b.id) + '">Mark paid</button>';
        if (b.status === 'Booked') actions += '<button class="btn btn-small btn-light" type="button" data-act="start" data-id="' + esc(b.id) + '">Start rental</button>';
        if (b.status === 'Ongoing') actions += '<button class="btn btn-small btn-light" type="button" data-act="return" data-id="' + esc(b.id) + '">Mark returned</button>';
      }
      if (!actions) actions = '-';
      html += '<tr><td>' + esc(b.id) + '</td><td>' + customer(b.userId) + '</td>' +
        '<td>' + esc(vehicleName(b.vehicleId)) + '</td>' +
        '<td>' + Rental.formatDate(b.start) + '</td><td>' + Rental.formatDate(b.end) + '</td>' +
        '<td>' + b.days + '</td><td class="price">' + Rental.formatRupees(b.total) + '</td>' +
        '<td><span class="tag tag-' + b.status.toLowerCase() + '">' + esc(b.status) + '</span></td>' +
        '<td><span class="tag tag-' + b.paymentStatus.toLowerCase() + '">' + esc(b.paymentStatus) + '</span></td>' +
        '<td class="actions">' + actions + '</td></tr>';
    });
    html += '</tbody></table></div>';
    area.innerHTML = html;
  }

  document.getElementById('bookings-table').addEventListener('click', function (e) {
    const act = e.target.getAttribute('data-act');
    const id = e.target.getAttribute('data-id');
    if (!act || !id) return;
    const list = Store.get('vr_bookings', []);
    const b = list.find(function (x) { return x.id === id; });
    if (!b || b.status === 'Cancelled') return;

    if (act === 'paid' && b.paymentStatus === 'Unpaid') {
      b.paymentStatus = 'Paid';
      Store.set('vr_bookings', list);
      Notify.add(b.userId, 'Payment for ' + b.id + ' marked as paid.');
      showOk(b.id + ' marked as paid.');
    } else if (act === 'start' && b.status === 'Booked') {
      if (Rental.todayStr() < b.start) { showError('Rental can start on or after the start date.'); return; }
      b.status = 'Ongoing';
      Store.set('vr_bookings', list);
      Notify.add(b.userId, 'Your rental ' + b.id + ' has started.');
      showOk(b.id + ' is now Ongoing.');
    } else if (act === 'return' && b.status === 'Ongoing') {
      b.status = 'Returned';
      Store.set('vr_bookings', list);
      Notify.add(b.userId, b.id + ' marked as returned. Thank you!');
      showOk(b.id + ' marked as returned.');
    }
    drawBookings();
  });

  // ---------- maintenance tab ----------
  function drawMaintenanceForm() {
    const select = document.getElementById('mt-vehicle');
    const chosen = select.value;
    select.innerHTML = vehicles().map(function (v) {
      return '<option value="' + esc(v.id) + '">' + esc(v.name) + '</option>';
    }).join('');
    if (chosen) select.value = chosen;
  }

  function drawMaintenance() {
    const list = Store.get('vr_maintenance', []);
    const area = document.getElementById('maintenance-table');
    if (list.length === 0) { area.innerHTML = '<p class="muted">No maintenance scheduled.</p>'; return; }
    let html = '<div class="table-wrap"><table><thead><tr><th>Vehicle</th><th>Start</th><th>End</th>' +
      '<th>Note</th><th>Action</th></tr></thead><tbody>';
    list.forEach(function (m) {
      html += '<tr><td>' + esc(vehicleName(m.vehicleId)) + '</td>' +
        '<td>' + Rental.formatDate(m.start) + '</td><td>' + Rental.formatDate(m.end) + '</td>' +
        '<td>' + esc(m.note || '-') + '</td>' +
        '<td class="actions"><button class="btn btn-small btn-danger" type="button" data-remove="' + esc(m.id) + '">Remove</button></td></tr>';
    });
    html += '</tbody></table></div>';
    area.innerHTML = html;
  }

  const mtForm = document.getElementById('maintenance-form');
  mtForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const vehicleId = mtForm['mt-vehicle'].value;
    const start = mtForm['mt-start'].value;
    const end = mtForm['mt-end'].value;
    const note = mtForm['mt-note'].value.trim();

    if (!vehicleId) { showError('Please add a vehicle first.'); return; }
    const check = Rental.validateDates(start, end, Rental.todayStr());
    if (!check.ok) { showError(check.message); return; }
    const clash = Rental.findClash(Store.get('vr_bookings', []), vehicleId, start, end);
    if (clash) {
      showError('This vehicle has a booking from ' + Rental.formatDate(clash.start) + ' to ' +
        Rental.formatDate(clash.end) + '. Cancel or finish it first.');
      return;
    }
    const list = Store.get('vr_maintenance', []);
    list.push({ id: Store.nextId('MT-'), vehicleId: vehicleId, start: start, end: end, note: note });
    Store.set('vr_maintenance', list);
    mtForm.reset();
    drawMaintenanceForm();
    showOk('Maintenance scheduled.');
    drawMaintenance();
  });

  document.getElementById('maintenance-table').addEventListener('click', function (e) {
    const id = e.target.getAttribute('data-remove');
    if (!id) return;
    if (!confirm('Remove this maintenance?')) return;
    const list = Store.get('vr_maintenance', []).filter(function (m) { return m.id !== id; });
    Store.set('vr_maintenance', list);
    showOk('Maintenance removed.');
    drawMaintenance();
  });

  drawVehicles();
  drawBookings();
  drawMaintenanceForm();
  drawMaintenance();
})();
