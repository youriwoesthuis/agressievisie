// Mobiel menu
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
  }

  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  initCookieBanner();
  initNavDropdown();
  initSkipLink();
  initCurrentPageA11y();
  initScrollProgress();
  initCrisisQuickaccess();
  initSectorMemory();
});

// Onthoudt de laatst bezochte sectorpagina, zodat de homepage bij een volgend
// bezoek een snelkoppeling kan tonen ("ga verder waar je gebleven was").
function initSectorMemory() {
  const path = location.pathname.split('/').pop();
  if (!path || !path.startsWith('sector-')) return;
  const current = document.querySelector('.breadcrumbs .current');
  if (!current) return;
  localStorage.setItem('agressievisie-laatste-sector', JSON.stringify({ naam: current.textContent.trim(), url: path }));
}

// Spoedpad: kleine, sluitbare snelkoppeling naar het oefengesprek, overal op de site
// behalve op het oefengesprek zelf. Keuze om te verbergen wordt onthouden.
function initCrisisQuickaccess() {
  const KEY = 'agressievisie-crisis-dismissed';
  if (localStorage.getItem(KEY)) return;
  if (document.querySelector('.sim-wrap')) return;

  function show() {
    const el = document.createElement('div');
    el.className = 'crisis-quickaccess';
    el.innerHTML = `
      <a href="oefengesprek.html">Nu een lastig gesprek? <span aria-hidden="true">&rarr;</span></a>
      <button type="button" class="crisis-quickaccess-close" aria-label="Verbergen">&times;</button>
    `;
    document.body.appendChild(el);

    el.querySelector('.crisis-quickaccess-close').addEventListener('click', () => {
      localStorage.setItem(KEY, '1');
      el.remove();
    });
  }

  // Niet tegelijk met de cookiebanner tonen (overlapt onderaan op mobiel):
  // wacht tot die is afgehandeld voordat het spoedpad verschijnt.
  const cookieBanner = document.getElementById('cookie-banner');
  if (cookieBanner && cookieBanner.classList.contains('show')) {
    const observer = new MutationObserver(() => {
      if (!cookieBanner.classList.contains('show')) {
        observer.disconnect();
        show();
      }
    });
    observer.observe(cookieBanner, { attributes: true, attributeFilter: ['class'] });
  } else {
    show();
  }
}

// Scroll-voortgangsbalk: dunne gloeiende lijn boven in beeld die aangeeft hoe ver je gescrold bent
function initScrollProgress() {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(bar, document.body.firstChild);

  function update() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    bar.style.width = pct + '%';
  }
  document.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

// "Meer"-dropdown in de header
function initNavDropdown() {
  document.querySelectorAll('.nav-dropdown-toggle').forEach(toggle => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const dropdown = toggle.closest('.nav-dropdown');
      const isOpen = dropdown.classList.contains('open');
      document.querySelectorAll('.nav-dropdown.open').forEach(d => {
        d.classList.remove('open');
        d.querySelector('.nav-dropdown-toggle')?.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        dropdown.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.nav-dropdown.open').forEach(d => {
      d.classList.remove('open');
      d.querySelector('.nav-dropdown-toggle')?.setAttribute('aria-expanded', 'false');
    });
  });
}

// Skip-to-content link voor toetsenbord- en screenreadergebruikers
function initSkipLink() {
  const header = document.querySelector('header.site');
  const main = header?.nextElementSibling;
  if (!header || !main) return;
  if (!main.id) main.id = 'main-content';

  const skip = document.createElement('a');
  skip.href = `#${main.id}`;
  skip.className = 'skip-link';
  skip.textContent = 'Direct naar inhoud';
  document.body.insertBefore(skip, document.body.firstChild);
}

// aria-current="page" op de actieve navigatielink
function initCurrentPageA11y() {
  document.querySelectorAll('.nav-links a.current, .nav-dropdown-menu a.current, .breadcrumbs .current').forEach(el => {
    el.setAttribute('aria-current', 'page');
  });
}

// Cookiebanner (AVG): eenvoudige opt-in, keuze in localStorage
function initCookieBanner() {
  const KEY = 'agressievisie-cookie-consent';
  const banner = document.getElementById('cookie-banner');
  if (!banner) return;

  const consent = localStorage.getItem(KEY);
  if (!consent) {
    banner.classList.add('show');
  }

  banner.querySelector('[data-accept]')?.addEventListener('click', () => {
    localStorage.setItem(KEY, 'accepted');
    banner.classList.remove('show');
  });
  banner.querySelector('[data-decline]')?.addEventListener('click', () => {
    localStorage.setItem(KEY, 'declined');
    banner.classList.remove('show');
  });
}
