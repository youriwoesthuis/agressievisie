const CATEGORY_CLASS = {
  'Onderzoek': 'badge--onderzoek',
  'Trends': 'badge--trends',
  'Praktijk': 'badge--praktijk',
};

function formatDatumNL(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function articleCardHTML(a) {
  const badgeClass = CATEGORY_CLASS[a.categorie] || '';
  return `
    <a class="card article-card" href="artikel-${a.slug}.html">
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
