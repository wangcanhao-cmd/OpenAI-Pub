const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
document.querySelectorAll('[data-pending-submit]').forEach(button => {
  button.addEventListener('click', () => {
    alert('This form was migrated from the legacy site, but a new submission endpoint has not been configured yet.');
  });
});

/* Official Study Mississippi logo placement */
document.querySelectorAll('.site-header .brand img').forEach(img => {
  img.src = 'assets/study-mississippi-horizontal-exact.svg';
  img.alt = 'Study Mississippi';
});
document.querySelectorAll('.site-footer .footer-brand img').forEach(img => {
  img.src = 'assets/study-mississippi-vertical-exact.svg';
  img.alt = 'Study Mississippi / Mississippi Association of International Educators';
});

/* Header search normalization */
(function () {
  const nav = document.querySelector('.main-nav');
  if (!nav) return;

  let form = nav.querySelector('.header-search');
  const searchLink = Array.from(nav.querySelectorAll('a')).find(a => {
    const href = a.getAttribute('href') || '';
    return href === 'search.html' || href.endsWith('/search.html');
  });

  if (!form) {
    form = document.createElement('form');
    form.className = 'header-search';
    form.action = 'search.html';
    form.method = 'get';
    form.setAttribute('role', 'search');
    form.innerHTML = '<label class="sr-only" for="global-site-search">Search</label>' +
      '<input id="global-site-search" name="q" type="search" placeholder="Search" autocomplete="off">' +
      '<button type="submit" aria-label="Search">⌕</button>';

    if (searchLink) {
      searchLink.replaceWith(form);
    } else {
      nav.appendChild(form);
    }
  } else if (searchLink) {
    searchLink.remove();
  }

  const input = form.querySelector('input[name="q"]');
  if (input && /search\.html$/.test(window.location.pathname)) {
    input.value = new URLSearchParams(window.location.search).get('q') || '';
  }
})();


/* Global stylesheet cache version */
(() => {
  const version = "20261002-left150-headeredge";
  document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
    const href = link.getAttribute("href") || "";
    if (/^styles\.css(?:\?|$)/.test(href)) {
      const next = "styles.css?v=" + version;
      if (href !== next) link.setAttribute("href", next);
    }
  });
})();
