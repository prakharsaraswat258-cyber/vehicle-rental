// Vehicles list page: cards, type filter and price sort.
(function (root) {
  // returns a new array; the stored data is never changed
  function filterAndSort(vehicles, type, sort) {
    let result = vehicles.filter(function (v) {
      return type === 'All' || v.type === type;
    });
    result = result.slice(); // copy before sorting
    if (sort === 'low') result.sort(function (a, b) { return a.pricePerDay - b.pricePerDay; });
    if (sort === 'high') result.sort(function (a, b) { return b.pricePerDay - a.pricePerDay; });
    return result;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { filterAndSort: filterAndSort };
    return;
  }
  root.filterAndSort = filterAndSort;

  function cardHtml(v) {
    let html = '<div class="vehicle-card">' + photoHtml(v) + '<div class="body">' +
      '<h3>' + esc(v.name) + '</h3>' +
      '<div><span class="tag tag-type">' + esc(v.type) + '</span>';
    if (!v.available) html += ' <span class="tag tag-bad">Not available</span>';
    html += '</div><div class="bottom">' +
      '<span class="price">' + Rental.formatRupees(v.pricePerDay) + ' <small>/ day</small></span>';
    if (v.available) {
      html += '<a class="btn" href="vehicle.html?id=' + encodeURIComponent(v.id) + '">Book</a>';
    } else {
      html += '<button class="btn" type="button" disabled>Book</button>';
    }
    html += '</div></div></div>';
    return html;
  }

  function draw() {
    const vehicles = Store.get('vr_vehicles', []);
    const type = document.getElementById('type-filter').value;
    const sort = document.getElementById('sort-price').value;
    const shown = filterAndSort(vehicles, type, sort);
    const grid = document.getElementById('vehicle-grid');
    const count = document.getElementById('vehicle-count');

    count.textContent = shown.length === 1 ? '1 vehicle' : shown.length + ' vehicles';
    if (shown.length === 0) {
      grid.innerHTML = '<p class="muted">No vehicles found.</p>';
      return;
    }
    grid.innerHTML = shown.map(cardHtml).join('');
  }

  document.getElementById('type-filter').addEventListener('change', draw);
  document.getElementById('sort-price').addEventListener('change', draw);
  draw();
})(this);
