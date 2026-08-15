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
          showStatus(status, 'err', data.error || 'Er ging iets mis. Probeer het later opnieuw.');
        }
      } catch {
        showStatus(status, 'err', 'Er ging iets mis. Probeer het later opnieuw.');
      } finally {
        submitBtn.disabled = false;
      }
    });
  });
});

function showStatus(el, kind, message) {
  if (!el) return;
  el.textContent = message;
  el.classList.remove('ok', 'err');
  el.classList.add(kind, 'show');
}
