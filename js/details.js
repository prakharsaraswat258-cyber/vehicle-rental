// Vehicle details page: vehicle.html?id=v1
(function () {
  const id = new URLSearchParams(location.search).get('id');
  const vehicles = Store.get('vr_vehicles', []);
  const vehicle = vehicles.find(function (v) { return v.id === id; });
  const box = document.getElementById('details');

  if (!vehicle) {
    document.title = 'Vehicle not found - Vehicle Rental';
    box.innerHTML = '<div class="card"><h1>Vehicle not found.</h1>' +
      '<p><a href="vehicles.html">Back to all vehicles</a></p></div>';
    return;
  }

  document.title = vehicle.name + ' - Vehicle Rental';
  const today = Rental.todayStr();

  // upcoming booked dates (Booked or Ongoing, not finished yet)
  const booked = Store.get('vr_bookings', [])
    .filter(function (b) {
      return b.vehicleId === vehicle.id && (b.status === 'Booked' || b.status === 'Ongoing') && b.end >= today;
    })
    .sort(function (a, b) { return a.start < b.start ? -1 : a.start > b.start ? 1 : 0; });

  // upcoming maintenance
  const maintenance = Store.get('vr_maintenance', [])
    .filter(function (m) { return m.vehicleId === vehicle.id && m.end >= today; })
    .sort(function (a, b) { return a.start < b.start ? -1 : a.start > b.start ? 1 : 0; });

  let datesHtml = '';
  if (booked.length === 0 && maintenance.length === 0) {
    datesHtml = '<p class="muted">No upcoming bookings or maintenance.</p>';
  } else {
    datesHtml = '<ul class="date-list">';
    booked.forEach(function (b) {
      datesHtml += '<li>' + Rental.formatDate(b.start) + ' to ' + Rental.formatDate(b.end) + '</li>';
    });
    maintenance.forEach(function (m) {
      datesHtml += '<li>Maintenance: ' + Rental.formatDate(m.start) + ' to ' + Rental.formatDate(m.end) + '</li>';
    });
    datesHtml += '</ul>';
  }

  const availableTag = vehicle.available
    ? '<span class="tag tag-ok">Available</span>'
    : '<span class="tag tag-bad">Not available</span>';

  let html = '<a class="back" href="vehicles.html">&larr; All vehicles</a>' +
    '<div class="details">' +
    '<div>' + photoHtml(vehicle) + '</div>' +
    '<div>' +
    '<div class="card">' +
    '<h1>' + esc(vehicle.name) + '</h1>' +
    '<div class="tags"><span class="tag tag-type">' + esc(vehicle.type) + '</span> ' + availableTag + '</div>' +
    '<p class="price big-price">' + Rental.formatRupees(vehicle.pricePerDay) + ' <small>/ day</small></p>' +
    '<p>' + esc(vehicle.description || '') + '</p>' +
    '<p class="muted">Pay at pickup.<br>Bring your licence.</p>' +
    '</div>';

  if (!vehicle.available) {
    html += '<div class="msg msg-info">This vehicle is not available for new bookings right now.</div>';
  }

  html += '<div id="booking-box"></div>' +
    '<div class="card"><h2>Booked dates</h2>' + datesHtml + '</div>' +
    '</div></div>';

  box.innerHTML = html;
})();
