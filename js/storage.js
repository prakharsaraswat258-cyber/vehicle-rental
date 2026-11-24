// Small helpers around localStorage. Everything is saved as JSON.
const Store = {
  get: function (key, fallback) {
    try {
      const text = localStorage.getItem(key);
      if (text === null) return fallback;
      return JSON.parse(text);
    } catch (e) {
      return fallback;
    }
  },

  set: function (key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  },

  // nextId('BK-') gives BK-1001, then BK-1002 ...
  nextId: function (prefix) {
    const counters = Store.get('vr_counters', {}) || {};
    const next = (counters[prefix] || 1000) + 1;
    counters[prefix] = next;
    Store.set('vr_counters', counters);
    return prefix + next;
  }
};
