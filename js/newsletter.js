document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form[data-newsletter]').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = form.parentElement.querySelector('.form-status');
      const submitBtn = form.querySelector('button[type=submit]');

      submitBtn.disabled = true;
      try {
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString(),
        });
        if (res.ok) {
          showStatus(status, 'ok', 'Bedankt! Je ontvangt binnenkort onze eerste update.');
          form.reset();
          const unlockTarget = form.dataset.unlock ? document.querySelector(form.dataset.unlock) : null;
          if (unlockTarget) unlockTarget.classList.remove('locked');
        } else {
          showStatus(status, 'err', VERZENDEN_MISLUKT);
        }
      } catch {
        showStatus(status, 'err', VERZENDEN_MISLUKT);
      } finally {
        submitBtn.disabled = false;
      }
    });
  });
});

// Het formulier gaat via Netlify Forms naar youri@actinmove.nl. Komt de
// inzending toch niet aan, zeg dan eerlijk dat hij niet is opgeslagen en geef
// een adres dat wel werkt; "er ging iets mis" laat mensen wachten op antwoord
// dat nooit komt.
const VERZENDEN_MISLUKT = 'Je aanmelding is niet doorgekomen en dus niet opgeslagen. ' +
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
