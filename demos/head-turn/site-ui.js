// Controls affect the integration panel only, never the producer's motion.
const toggle = document.getElementById('controls-toggle');
const panel = document.getElementById('head-turn-controls');
const phone = matchMedia('(max-width: 799px)');
function setOpen(open) {
  const expanded = !phone.matches || open;
  panel.toggleAttribute('data-open', expanded);
  panel.inert = !expanded;
  toggle.setAttribute('aria-expanded', String(expanded));
}
setOpen(false);
phone.addEventListener('change', () => setOpen(false));
toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
addEventListener('keydown', (event) => {
  if (phone.matches && event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    setOpen(false);
    toggle.focus();
  }
});
