document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form[data-newsletter]').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.querySelector('input[type=email]').value;
      const status = form.parentElement.querySelector('.form-status');
      const submitBtn = form.querySelector('button[type=submit]');

      submitBtn.disabled = true;
      try {
        const res = await fetch('/api/nieuwsbrief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (res.ok) {
          showStatus(status, 'ok', 'Bedankt! Je ontvangt binnenkort onze eerste update.');
          form.reset();
          const unlockTarget = form.dataset.unlock ? document.querySelector(form.dataset.unlock) : null;
          if (unlockTarget) unlockTarget.classList.remove('locked');
        } else {
          showStatus(status, 'err', NIET_GEKOPPELD);
        }
      } catch {
        showStatus(status, 'err', NIET_GEKOPPELD);
      } finally {
        submitBtn.disabled = false;
      }
    });
  });
});

// De nieuwsbrief-endpoint bestaat alleen op de lokale dev-server; op GitHub
// Pages geeft /api/nieuwsbrief een 405. Zolang de koppeling met actinmove.nl
// er niet is, zeggen we dat eerlijk in plaats van "er ging iets mis" — dat
// laatste suggereert een storing die vanzelf overgaat.
const NIET_GEKOPPELD = 'De nieuwsbrief is nog niet gekoppeld, je aanmelding is daarom niet opgeslagen. ' +
  'Mail ons via <a href="mailto:support@actinmove.nl">support@actinmove.nl</a> of via ' +
  '<a href="https://actinmove.nl/contact" target="_blank" rel="noopener">actinmove.nl/contact</a>, ' +
  'dan zetten we je er handmatig op.';

function showStatus(el, kind, message) {
  if (!el) return;
  // De berichten zijn vaste teksten uit dit bestand, geen invoer van bezoekers.
  el.innerHTML = message;
  el.classList.remove('ok', 'err');
  el.classList.add(kind, 'show');
}
