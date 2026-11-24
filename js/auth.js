// Accounts: register, log in, log out. The session is the user id in vr_session.
// Passwords are plain text because this is a classroom demo.
const Auth = {
  currentUser: function () {
    const id = Store.get('vr_session', null);
    if (!id) return null;
    const users = Store.get('vr_users', []);
    return users.find(function (u) { return u.id === id; }) || null;
  },

  register: function (name, email, password, confirmPassword) {
    name = name.trim();
    email = email.trim().toLowerCase();
    if (!name) return { ok: false, message: 'Please enter your name.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: 'Please enter a valid email.' };
    const users = Store.get('vr_users', []);
    if (users.some(function (u) { return u.email.toLowerCase() === email; })) {
      return { ok: false, message: 'This email is already registered.' };
    }
    if (password.length < 6) return { ok: false, message: 'Password must be at least 6 characters.' };
    if (password !== confirmPassword) return { ok: false, message: 'Passwords do not match.' };

    const user = { id: 'u' + Date.now(), name: name, email: email, password: password, role: 'user' };
    users.push(user);
    Store.set('vr_users', users);
    Store.set('vr_session', user.id);
    return { ok: true, user: user };
  },

  login: function (email, password) {
    email = email.trim().toLowerCase();
    const users = Store.get('vr_users', []);
    const user = users.find(function (u) { return u.email.toLowerCase() === email && u.password === password; });
    if (!user) return { ok: false, message: 'Wrong email or password.' };
    Store.set('vr_session', user.id);
    return { ok: true, user: user };
  },

  logout: function () {
    try { localStorage.removeItem('vr_session'); } catch (e) { /* nothing to do */ }
    location.href = 'index.html';
  },

  // send guests to the login page, then back to this page
  requireLogin: function (nextPage) {
    const user = Auth.currentUser();
    if (!user) {
      location.href = 'login.html?next=' + encodeURIComponent(nextPage);
      return null;
    }
    return user;
  },

  // only plain local pages like "vehicle.html?id=v3" are allowed as next
  safeNext: function (next) {
    if (!next) return 'index.html';
    if (!/^[A-Za-z0-9_\-]+\.html([?][A-Za-z0-9_\-.=&]*)?$/.test(next)) return 'index.html';
    return next;
  },

  goNext: function () {
    const next = new URLSearchParams(location.search).get('next');
    location.href = Auth.safeNext(next);
  }
};
