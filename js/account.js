// Login and register forms. The rules themselves are in auth.js.
(function () {
  // someone already logged in does not need these pages
  if (Auth.currentUser()) {
    location.href = 'index.html';
    return;
  }

  const msg = document.getElementById('form-msg');
  function showError(text) {
    msg.innerHTML = '<div class="msg msg-bad" role="alert">' + esc(text) + '</div>';
  }

  // keep ?next= on the link between login and register
  const next = new URLSearchParams(location.search).get('next');
  const switchLink = document.getElementById('switch-link');
  if (next && switchLink) {
    switchLink.href = switchLink.getAttribute('href') + '?next=' + encodeURIComponent(Auth.safeNext(next));
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const result = Auth.login(loginForm.email.value, loginForm.password.value);
      if (!result.ok) { showError(result.message); return; }
      Auth.goNext();
    });
  }

  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const result = Auth.register(
        registerForm.name.value,
        registerForm.email.value,
        registerForm.password.value,
        registerForm.confirm.value
      );
      if (!result.ok) { showError(result.message); return; }
      Auth.goNext();
    });
  }
})();
