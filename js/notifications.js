// In-app notifications (no email, no SMS).
const Notify = {
  add: function (userId, text) {
    if (!userId) return;
    const list = Store.get('vr_notifications', []);
    list.push({ id: Store.nextId('NT-'), userId: userId, text: text, createdAt: new Date().toISOString(), read: false });
    Store.set('vr_notifications', list);
  },

  // newest first
  forUser: function (userId) {
    return Store.get('vr_notifications', [])
      .filter(function (n) { return n.userId === userId; })
      .reverse();
  },

  unreadCount: function (userId) {
    return Notify.forUser(userId).filter(function (n) { return !n.read; }).length;
  },

  markAllRead: function (userId) {
    const list = Store.get('vr_notifications', []);
    list.forEach(function (n) { if (n.userId === userId) n.read = true; });
    Store.set('vr_notifications', list);
  },

  adminId: function () {
    const admin = Store.get('vr_users', []).find(function (u) { return u.role === 'admin'; });
    return admin ? admin.id : null;
  }
};
