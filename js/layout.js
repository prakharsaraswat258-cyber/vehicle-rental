// Shared navbar for every page, plus small helpers.
const SITE_NAME = 'Vehicle Rental';

// make text safe before putting it into innerHTML
function esc(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// simple hand-drawn pictures (plain SVG shapes) for each vehicle type
function vehicleArt(type) {
  const ink = '#1F2933';
  const hub = '#CFD8DC';
  const light = '#FDE68A';
  let shapes = '';
  if (type === 'Bike') {
    shapes =
      '<circle cx="50" cy="84" r="19" fill="none" stroke="' + ink + '" stroke-width="7"/>' +
      '<circle cx="150" cy="84" r="19" fill="none" stroke="' + ink + '" stroke-width="7"/>' +
      '<circle cx="50" cy="84" r="4" fill="' + ink + '"/><circle cx="150" cy="84" r="4" fill="' + ink + '"/>' +
      '<path d="M50 84 L82 62 L118 62 L150 84" fill="none" class="art-main-stroke" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<rect x="88" y="62" width="24" height="15" rx="3" fill="#9AA5AB"/>' +
      '<path d="M80 62 Q86 44 106 44 L124 46 Q131 48 126 62 Z" class="art-main"/>' +
      '<path d="M58 55 L84 50 L86 57 L60 61 Z" fill="' + ink + '"/>' +
      '<line x1="150" y1="84" x2="132" y2="40" stroke="' + ink + '" stroke-width="5" stroke-linecap="round"/>' +
      '<line x1="124" y1="38" x2="141" y2="35" stroke="' + ink + '" stroke-width="5" stroke-linecap="round"/>' +
      '<circle cx="141" cy="48" r="5" fill="' + light + '"/>';
  } else if (type === 'Scooter') {
    shapes =
      '<path d="M30 82 Q30 56 58 54 L92 54 Q100 54 100 62 L100 82 Z" class="art-main"/>' +
      '<rect x="96" y="74" width="40" height="8" rx="3" class="art-main"/>' +
      '<path d="M130 82 L145 34 L156 34 L143 82 Z" class="art-main"/>' +
      '<rect x="40" y="45" width="48" height="10" rx="5" fill="' + ink + '"/>' +
      '<line x1="138" y1="31" x2="164" y2="29" stroke="' + ink + '" stroke-width="5" stroke-linecap="round"/>' +
      '<circle cx="156" cy="43" r="4" fill="' + light + '"/>' +
      '<circle cx="54" cy="88" r="14" fill="' + ink + '"/><circle cx="54" cy="88" r="5" fill="' + hub + '"/>' +
      '<circle cx="146" cy="88" r="14" fill="' + ink + '"/><circle cx="146" cy="88" r="5" fill="' + hub + '"/>';
  } else {
    shapes =
      '<path d="M25 80 Q25 66 40 64 L62 62 L80 44 Q84 40 92 40 L130 40 Q138 40 143 46 L158 62 L170 64 Q180 66 180 76 L180 84 Q180 88 176 88 L29 88 Q25 88 25 84 Z" class="art-main"/>' +
      '<path d="M68 62 L84 46 Q86 44 90 44 L108 44 L108 62 Z" fill="#fff" opacity="0.85"/>' +
      '<path d="M114 44 L130 44 Q134 44 137 48 L150 62 L114 62 Z" fill="#fff" opacity="0.85"/>' +
      '<rect x="172" y="68" width="7" height="5" rx="2" fill="' + light + '"/>' +
      '<circle cx="58" cy="88" r="14" fill="' + ink + '"/><circle cx="58" cy="88" r="6" fill="' + hub + '"/>' +
      '<circle cx="148" cy="88" r="14" fill="' + ink + '"/><circle cx="148" cy="88" r="6" fill="' + hub + '"/>';
  }
  return '<svg class="art" viewBox="0 0 200 120" aria-hidden="true">' +
    '<ellipse cx="100" cy="104" rx="78" ry="5" fill="#000" opacity="0.08"/>' + shapes + '</svg>';
}

function typeClass(type) {
  const t = String(type).toLowerCase();
  return (t === 'bike' || t === 'scooter') ? 'is-' + t : 'is-car';
}

// photo box: a drawing of the type sits underneath; a real photo (if the file exists) covers it
function photoHtml(vehicle) {
  let html = '<div class="photo ' + typeClass(vehicle.type) + '">' + vehicleArt(vehicle.type);
  if (vehicle.image) {
    html += '<img src="' + esc(vehicle.image) + '" alt="' + esc(vehicle.name) + '" onerror="photoMissing(this)">';
  }
  return html + '</div>';
}

function photoMissing(img) {
  img.remove();
}

const Layout = {
  // the navbar links for each kind of visitor
  links: function (user) {
    const list = [
      { href: 'index.html', text: 'Home' },
      { href: 'vehicles.html', text: 'Vehicles' }
    ];
    if (!user) {
      list.push({ href: 'login.html', text: 'Login' });
      list.push({ href: 'register.html', text: 'Register' });
      return list;
    }
    if (user.role === 'admin') {
      list.push({ href: 'admin.html', text: 'Admin' });
    } else {
      list.push({ href: 'my-bookings.html', text: 'My Bookings' });
    }
    const unread = Notify.unreadCount(user.id);
    list.push({ href: 'notifications.html', text: unread > 0 ? 'Notifications (' + unread + ')' : 'Notifications' });
    list.push({ href: '#logout', text: 'Logout', logout: true });
    return list;
  },

  render: function () {
    const user = Auth.currentUser();
    const page = location.pathname.split('/').pop() || 'index.html';
    const header = document.getElementById('site-header');

    if (header) {
      let html = '<nav class="navbar"><div class="inner">' +
        '<a class="logo" href="index.html">Vehicle Rental</a><div class="nav-links">';
      if (user && user.role !== 'admin') {
        html += '<span class="hi">Hi, ' + esc(user.name.split(' ')[0]) + '</span>';
      }
      Layout.links(user).forEach(function (link) {
        const current = link.href === page ? ' class="current"' : '';
        const extra = link.logout ? ' id="logout-link"' : '';
        html += '<a href="' + link.href + '"' + current + extra + '>' + esc(link.text) + '</a>';
      });
      html += '</div></div></nav>';
      header.innerHTML = html;

      // a small wheel in front of the name as the logo
      const logo = header.querySelector('.logo');
      logo.innerHTML = '<span class="wheel" aria-hidden="true"></span> ' + esc(SITE_NAME);

      const logout = document.getElementById('logout-link');
      if (logout) {
        logout.addEventListener('click', function (e) {
          e.preventDefault();
          Auth.logout();
        });
      }
    }

    // home page picture: one of each vehicle
    const heroArt = document.getElementById('hero-art');
    if (heroArt) {
      heroArt.innerHTML = ['Car', 'Bike', 'Scooter'].map(function (t) {
        return '<div class="hero-pic ' + typeClass(t) + '">' + vehicleArt(t) + '</div>';
      }).join('');
    }
  }
};

document.addEventListener('DOMContentLoaded', Layout.render);
