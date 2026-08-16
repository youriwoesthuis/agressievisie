const CATEGORY_CLASS = {
  'Onderzoek': 'badge--onderzoek',
  'Trends': 'badge--trends',
  'Praktijk': 'badge--praktijk',
};

function formatDatumNL(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Zet Article- en BreadcrumbList-schema in de pagina zodat zoekmachines en
// AI-antwoordmachines het artikel als zelfstandig, gedateerd en gecrediteerd stuk herkennen.
function injectArticleSchema(article, canonicalUrl) {
  const uitgever = {
    '@type': 'Organization',
    name: 'AgressieVisie',
    url: 'https://agressievisie.nl/',
    logo: {
      '@type': 'ImageObject',
      url: 'https://agressievisie.nl/img/og-image.jpg',
    },
  };

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.titel,
      description: article.excerpt,
      datePublished: article.datum,
      dateModified: article.datum,
      articleSection: article.categorie,
      inLanguage: 'nl-NL',
      isAccessibleForFree: true,
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
      image: 'https://agressievisie.nl/img/og-image.jpg',
      author: {
        '@type': 'Organization',
        name: 'Redactie AgressieVisie',
        url: 'https://agressievisie.nl/over.html',
      },
      publisher: uitgever,
      citation: article.bron_url
        ? { '@type': 'CreativeWork', name: article.bron_naam, url: article.bron_url }
        : undefined,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://agressievisie.nl/' },
        { '@type': 'ListItem', position: 2, name: 'Artikelen', item: 'https://agressievisie.nl/artikelen.html' },
        { '@type': 'ListItem', position: 3, name: article.titel, item: canonicalUrl },
      ],
    },
  ];

  document.getElementById('article-schema')?.remove();
  const el = document.createElement('script');
  el.type = 'application/ld+json';
  el.id = 'article-schema';
  el.textContent = JSON.stringify(schema);
  document.head.appendChild(el);
}

// Zet een attribuut op een bestaand element in de head, of maakt het aan als
// het er nog niet is.
function zetOfMaak(selector, maak, attribuut, waarde) {
  let el = document.querySelector(selector);
  if (!el) {
    el = maak();
    document.head.appendChild(el);
  }
  el.setAttribute(attribuut, waarde);
}

function articleCardHTML(a) {
  const badgeClass = CATEGORY_CLASS[a.categorie] || '';
  return `
    <a class="card article-card" href="artikel.html?slug=${encodeURIComponent(a.slug)}">
      <span class="badge ${badgeClass}">${a.categorie}</span>
      <h3>${a.titel}</h3>
      <p>${a.excerpt}</p>
      <div class="article-meta">
        <span>${formatDatumNL(a.datum)}</span>
      </div>
    </a>`;
}

async function loadArticles() {
  const res = await fetch('data/artikelen.json');
  const articles = await res.json();
  return articles.sort((a, b) => b.datum.localeCompare(a.datum));
}

// ─── Homepage: laatste 3 artikelen ───
async function renderLatestArticles(targetSelector, count = 3) {
  const target = document.querySelector(targetSelector);
  if (!target) return;
  const articles = await loadArticles();
  target.innerHTML = articles.slice(0, count).map(articleCardHTML).join('');
}

// ─── Artikelen-overzicht met filter + zoeken ───
async function renderArticleList(targetSelector, filterBarSelector, searchSelector) {
  const target = document.querySelector(targetSelector);
  if (!target) return;
  const articles = await loadArticles();
  const categories = ['Alle', ...new Set(articles.map(a => a.categorie))];

  const filterBar = document.querySelector(filterBarSelector);
  const searchInput = searchSelector ? document.querySelector(searchSelector) : null;
  let activeCategory = 'Alle';

  function apply() {
    const q = (searchInput?.value || '').trim().toLowerCase();
    let filtered = activeCategory === 'Alle' ? articles : articles.filter(a => a.categorie === activeCategory);
    if (q) {
      filtered = filtered.filter(a =>
        a.titel.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.inhoud.some(p => p.toLowerCase().includes(q))
      );
    }
    target.innerHTML = filtered.length
      ? filtered.map(articleCardHTML).join('')
      : `<p class="no-results">Geen artikelen gevonden${q ? ` voor "${q}"` : ''}.</p>`;
  }

  if (filterBar) {
    filterBar.innerHTML = categories.map((c, i) =>
      `<button class="filter-chip ${i === 0 ? 'active' : ''}" data-cat="${c}">${c}</button>`
    ).join('');

    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-chip');
      if (!btn) return;
      filterBar.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.cat;
      apply();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', apply);
  }

  apply();
}

// ─── Artikeldetail ───
async function renderArticleDetail(targetSelector) {
  const target = document.querySelector(targetSelector);
  if (!target) return;
  const params = new URLSearchParams(location.search);
  const slug = params.get('slug');
  const articles = await loadArticles();
  const article = articles.find(a => a.slug === slug);

  if (!article) {
    target.innerHTML = `<p>Dit artikel bestaat niet (meer). <a class="btn-ghost" href="artikelen.html">Terug naar alle artikelen</a></p>`;
    return;
  }

  document.title = `${article.titel} | AgressieVisie`;
  const canonicalUrl = `https://agressievisie.nl/artikel.html?slug=${encodeURIComponent(article.slug)}`;
  const descMeta = document.querySelector('meta[name=description]');
  if (descMeta) descMeta.setAttribute('content', article.excerpt);
  // artikel.html heeft bewust geen vaste canonical of og:url in de HTML, omdat
  // die naar de sjabloon-URL zou wijzen en alle artikelen zou samenvoegen.
  // Hier worden ze aangemaakt met de echte artikel-URL.
  zetOfMaak('link[rel=canonical]', () => {
    const el = document.createElement('link');
    el.rel = 'canonical';
    return el;
  }, 'href', canonicalUrl);

  zetOfMaak('meta[property="og:url"]', () => {
    const el = document.createElement('meta');
    el.setAttribute('property', 'og:url');
    return el;
  }, 'content', canonicalUrl);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', `${article.titel} | AgressieVisie`);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', article.excerpt);
  injectArticleSchema(article, canonicalUrl);
  const badgeClass = CATEGORY_CLASS[article.categorie] || '';

  const breadcrumbs = document.querySelector('#breadcrumbs');
  if (breadcrumbs) {
    breadcrumbs.innerHTML = `<a href="index.html">Home</a><span class="sep">/</span><a href="artikelen.html">Artikelen</a><span class="sep">/</span><span class="current">${article.titel}</span>`;
  }

  target.innerHTML = `
    <span class="badge ${badgeClass}">${article.categorie}</span>
    <h1>${article.titel}</h1>
    <div class="article-meta"><span>${formatDatumNL(article.datum)}</span></div>
    <div class="article-body">
      ${article.inhoud.map(p => `<p>${p}</p>`).join('')}
    </div>
    <div class="source-note">Bron: <a href="${article.bron_url}" target="_blank" rel="noopener" style="text-decoration:underline; color:inherit;">${article.bron_naam}</a></div>
    <div class="term-chips" id="term-chips"></div>
    <div class="share-row" id="share-row"></div>
    <div class="editorial-box">
      <div class="editorial-avatar"></div>
      <div>
        <b>Redactie AgressieVisie</b>
        <span>Kennisplatform over agressie, onderdeel van Act in Move Training & Coaching</span>
      </div>
    </div>
  `;

  const termChips = document.querySelector('#term-chips');
  if (termChips && article.begrippen?.length) {
    const lexRes = await fetch('data/lexicon.json');
    const lexicon = await lexRes.json();
    const terms = article.begrippen.map(slug => lexicon.find(t => t.slug === slug)).filter(Boolean);
    if (terms.length) {
      termChips.innerHTML = `<span class="term-chips-label">Begrippen:</span>` +
        terms.map(t => `<a class="term-chip" href="lexicon.html#${t.slug}">${t.term}</a>`).join('');
    }
  }

  const shareRow = document.querySelector('#share-row');
  if (shareRow) {
    const pageUrl = location.href;
    const shareText = encodeURIComponent(article.titel);
    const encodedUrl = encodeURIComponent(pageUrl);
    shareRow.innerHTML = `
      <span class="share-label">Delen:</span>
      <a class="share-btn" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}" target="_blank" rel="noopener" aria-label="Delen op LinkedIn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.4 20.4h-3.5v-5.5c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.6H9.5V9h3.4v1.6h.1c.5-.9 1.6-1.8 3.4-1.8 3.6 0 4.3 2.4 4.3 5.5v6.1ZM5.7 7.4a2 2 0 1 1 0-4 2 2 0 0 1 0 4ZM7.5 20.4h-3.6V9h3.6v11.4Z"/></svg>
      </a>
      <a class="share-btn" href="https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}" target="_blank" rel="noopener" aria-label="Delen op X">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.3 2H21l-6.6 7.5L22.2 22h-6.9l-5.4-6.7L3.7 22H1l7.1-8.1L1 2h7l4.9 6.1L18.3 2Zm-1.2 18h1.9L7 3.9H5l12.1 16.1Z"/></svg>
      </a>
      <a class="share-btn" href="mailto:?subject=${shareText}&body=${encodedUrl}" aria-label="Delen via e-mail">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>
      </a>
      <button class="share-btn" id="share-copy" aria-label="Kopieer link" type="button">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      </button>
    `;
    document.getElementById('share-copy')?.addEventListener('click', () => {
      navigator.clipboard.writeText(pageUrl).then(() => {
        const btn = document.getElementById('share-copy');
        btn.classList.add('copied');
        setTimeout(() => btn.classList.remove('copied'), 1500);
      });
    });
  }

  // Article- en BreadcrumbList-schema staan al in de pagina via
  // injectArticleSchema() hierboven. Hier stond een tweede, magerdere kopie van
  // allebei; die is verwijderd omdat zoekmachines dan twee keer hetzelfde
  // artikel kregen, met tegenstrijdige publisher-gegevens.

  const related = articles.filter(a => a.slug !== article.slug && a.categorie === article.categorie).slice(0, 3);
  const relatedTarget = document.querySelector('#related-articles');
  if (relatedTarget && related.length) {
    relatedTarget.innerHTML = related.map(articleCardHTML).join('');
  } else if (relatedTarget) {
    relatedTarget.closest('section')?.remove();
  }
}
