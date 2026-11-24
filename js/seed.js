// First load only: put the sample data into localStorage.
// It never overwrites data that is already there.
(function () {
  if (Store.get('vr_vehicles', null) === null) Store.set('vr_vehicles', SAMPLE_VEHICLES);
  if (Store.get('vr_users', null) === null) {
    Store.set('vr_users', [
      { id: 'u1', name: 'Admin', email: 'admin@demo.com', password: 'admin123', role: 'admin' }
    ]);
  }
  ['vr_bookings', 'vr_maintenance', 'vr_notifications'].forEach(function (key) {
    if (Store.get(key, null) === null) Store.set(key, []);
  });
})();
