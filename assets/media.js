// Looping videos: they play only when the reader allows motion, and always carry a play/pause button.
// Without this script the videos show their poster and the browser's own controls, so nothing depends on it.
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  for (const video of document.querySelectorAll('video[data-loop]')) {
    const name = video.dataset.loop || 'animation';
    video.removeAttribute('controls');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'media-toggle';
    const sync = () => {
      const playing = !video.paused;
      button.textContent = playing ? 'Pause' : 'Play';
      button.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${name}`);
      button.dataset.state = playing ? 'playing' : 'paused';
    };
    button.addEventListener('click', () => {
      if (video.paused) video.play().catch(sync);
      else video.pause();
    });
    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);
    video.insertAdjacentElement('afterend', button);
    if (!reduce.matches) video.play().catch(sync);
    sync();
  }
})();
