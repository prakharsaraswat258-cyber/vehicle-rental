// Notifications page: the logged-in user's messages.
(function () {
  const user = Auth.requireLogin('notifications.html');
  if (!user) return;

  const area = document.getElementById('notes-area');
  const button = document.getElementById('mark-read');

  function when(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return Rental.formatDate(Rental.todayStr(d)) + ', ' +
      String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function draw() {
    const list = Notify.forUser(user.id);
    if (list.length === 0) {
      area.innerHTML = '<p class="muted">No notifications yet.</p>';
      button.disabled = true;
      return;
    }
    button.disabled = Notify.unreadCount(user.id) === 0;
    area.innerHTML = '<ul class="note-list">' + list.map(function (n) {
      return '<li class="' + (n.read ? '' : 'unread') + '">' + esc(n.text) +
        '<span class="hint">' + when(n.createdAt) + (n.read ? '' : ' &middot; New') + '</span></li>';
    }).join('') + '</ul>';
  }

  button.addEventListener('click', function () {
    Notify.markAllRead(user.id);
    draw();
    Layout.render(); // the count in the navbar goes away
  });

  draw();
})();
