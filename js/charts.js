// ─── Herbruikbare interactieve balkgrafiek ───
// bars: [{ label, value (0-100), displayValue, source, sourceUrl }]
function renderInteractiveBars(containerId, bars) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = bars.map((b, i) => `
    <div class="ibar-row" tabindex="0" role="img" aria-label="${b.label}: ${b.displayValue}${b.source ? ', bron: ' + b.source : ''}">
      <span class="ibar-label">${b.label}</span>
      <div class="ibar-track"><div class="ibar-fill" style="width:0%;" data-target="${b.value}"></div></div>
      <span class="ibar-value">${b.displayValue}</span>
      ${b.source ? `
      <div class="ibar-tooltip">
        Bron: ${b.sourceUrl ? `<a href="${b.sourceUrl}" target="_blank" rel="noopener">${b.source}</a>` : b.source}
      </div>` : ''}
    </div>
  `).join('');

  const rows = container.querySelectorAll('.ibar-fill');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fill = entry.target;
        fill.style.width = fill.dataset.target + '%';
        observer.unobserve(fill);
      }
    });
  }, { threshold: 0.15 });
  rows.forEach(f => observer.observe(f));
}

// ─── Herbruikbare interactieve lijngrafiek (SVG) ───
// points: [{ label, value, displayValue }]
function renderLineChart(svgId, points, opts = {}) {
  const svg = document.getElementById(svgId);
  if (!svg) return;

  const w = 640, h = 220, padL = 50, padR = 50, padT = 24, padB = 34;
  const values = points.map(p => p.value);
  const min = opts.min ?? Math.min(...values) * 0.92;
  const max = opts.max ?? Math.max(...values) * 1.08;
  const stepX = (w - padL - padR) / (points.length - 1);
  const yFor = v => h - padB - ((v - min) / (max - min)) * (h - padT - padB);
  const coords = points.map((p, i) => ({ x: padL + i * stepX, y: yFor(p.value), ...p }));
  const line = coords.map(c => `${c.x},${c.y}`).join(' ');

  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.innerHTML = `
    <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${h - padB}" stroke="#e4e4e8" stroke-width="1"/>
    <line x1="${padL}" y1="${h - padB}" x2="${w - padR + 10}" y2="${h - padB}" stroke="#e4e4e8" stroke-width="1"/>
    <polyline points="${line}" fill="none" stroke="#e0401f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="ichart-line" />
    ${coords.map((c, i) => `
      <g class="ichart-point" tabindex="0" role="img" aria-label="${c.label}: ${c.displayValue}">
        <circle cx="${c.x}" cy="${c.y}" r="12" fill="transparent" data-i="${i}" class="ichart-hitzone" />
        <circle cx="${c.x}" cy="${c.y}" r="5" fill="#e0401f" class="ichart-dot" />
        <text x="${c.x}" y="${h - padB + 20}" font-size="12" fill="#6c6c75" text-anchor="middle">${c.label}</text>
      </g>
    `).join('')}
  `;

  const tooltip = document.createElement('div');
  tooltip.className = 'ichart-tooltip';
  svg.parentElement.style.position = 'relative';
  svg.parentElement.appendChild(tooltip);

  svg.querySelectorAll('.ichart-point').forEach((g, i) => {
    const c = coords[i];
    const show = () => {
      tooltip.textContent = `${c.label}: ${c.displayValue}`;
      tooltip.style.left = `${(c.x / w) * 100}%`;
      tooltip.style.top = `${(c.y / h) * 100}%`;
      tooltip.classList.add('show');
      g.querySelector('.ichart-dot').setAttribute('r', '7');
    };
    const hide = () => {
      tooltip.classList.remove('show');
      g.querySelector('.ichart-dot').setAttribute('r', '5');
    };
    g.addEventListener('mouseenter', show);
    g.addEventListener('mouseleave', hide);
    g.addEventListener('focus', show);
    g.addEventListener('blur', hide);
  });
}
