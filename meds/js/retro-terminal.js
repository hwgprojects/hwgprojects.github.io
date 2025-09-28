const output = document.getElementById('terminal-output');

const lines = [
  'BOOTING COOL-RETRO-TERM ...',
  '>> MEMORY CHECK: OK',
  '>> VIDEO SIGNAL: STABLE',
  '>> LOADING NEON MATRIX...',
  '>> BRINGING PHOSPHOR ONLINE',
  '>> READY FOR USER INPUT',
  'WELCOME BACK, OPERATOR.'
];

const createLine = text => {
  const line = document.createElement('p');
  line.className = 'terminal__line';
  line.textContent = text;
  line.setAttribute('role', 'text');
  return line;
};

const typeLine = (text, delay = 42) =>
  new Promise(resolve => {
    const line = createLine('');
    output.append(line);

    let index = 0;
    const typer = setInterval(() => {
      line.textContent = text.slice(0, index);
      index += 1;

      if (index > text.length) {
        clearInterval(typer);
        resolve();
      }
    }, delay);
  });

const bootSequence = async () => {
  for (const [idx, line] of lines.entries()) {
    await typeLine(line, idx < 2 ? 28 : 42);
    await new Promise(r => setTimeout(r, 240));
  }

  const hint = createLine('TYPE HELP FOR COMMAND LIST');
  hint.dataset.glow = 'pulse';
  output.append(hint);
};

const randomFlicker = () => {
  const intensity = Math.random() * 0.25 + 0.85;
  document.documentElement.style.setProperty('--scanline-alpha', intensity.toFixed(2));
};

setInterval(randomFlicker, 1800);

bootSequence();
