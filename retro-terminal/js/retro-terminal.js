const output = document.getElementById('terminal-output');
const form = document.getElementById('terminal-form');
const input = document.getElementById('terminal-input');
const terminal = document.querySelector('.terminal');
const themeButtons = document.querySelectorAll('.terminal__theme-button');
const pathElement = document.querySelector('[data-terminal-path]');

const promptPrefix = pathElement ? pathElement.textContent.trim() : 'C:\\RETRO>';
const themes = new Set(['green', 'amber', 'blue']);

const bootLines = [
  'BOOTING COOL-RETRO-TERM ...',
  '>> MEMORY CHECK: OK',
  '>> VIDEO SIGNAL: STABLE',
  '>> LOADING NEON MATRIX...',
  '>> BRINGING PHOSPHOR ONLINE',
  '>> READY FOR USER INPUT',
  'WELCOME BACK, OPERATOR.'
];

const createLine = (text, glow) => {
  const line = document.createElement('p');
  line.className = 'terminal__line';
  line.textContent = text;
  line.setAttribute('role', 'text');
  if (glow) {
    line.dataset.glow = glow;
  }
  return line;
};

const appendLine = (text, glow) => {
  const line = createLine(text, glow);
  output.append(line);
  output.scrollTop = output.scrollHeight;
  return line;
};

const typeLine = (text, delay = 42) =>
  new Promise(resolve => {
    const line = appendLine('');
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
  for (const [idx, line] of bootLines.entries()) {
    await typeLine(line, idx < 2 ? 28 : 42);
    await new Promise(r => setTimeout(r, 220));
  }

  appendLine('TYPE HELP FOR COMMAND LIST', 'pulse');
};

const randomFlicker = () => {
  const intensity = Math.random() * 0.25 + 0.85;
  document.documentElement.style.setProperty('--scanline-alpha', intensity.toFixed(2));
};

const setTheme = theme => {
  if (!themes.has(theme)) {
    return;
  }

  document.body.dataset.theme = theme;
  themeButtons.forEach(button => {
    const isActive = button.dataset.theme === theme;
    button.setAttribute('aria-pressed', isActive.toString());
  });
};

const printHelp = () => {
  const helpLines = [
    'AVAILABLE COMMANDS:',
    'HELP  .............. SHOW THIS LIST',
    'THEME <COLOR> ...... SWITCH PHOSPHOR (GREEN/AMBER/BLUE)',
    'CLS   .............. CLEAR THE SCREEN',
    'ABOUT .............. TERMINAL DETAILS'
  ];
  helpLines.forEach(line => appendLine(line));
};

const printAbout = () => {
  appendLine('COOL RETRO TERMINAL v1.0');
  appendLine('SIMULATING CRT EXPERIENCE WITH AMBIENT FLICKER');
  appendLine('FONT: IBM PLEX MONO');
};

const handleThemeCommand = arg => {
  const nextTheme = arg?.toLowerCase();
  if (!nextTheme || !themes.has(nextTheme)) {
    appendLine('USAGE: THEME GREEN | THEME AMBER | THEME BLUE');
    return;
  }

  setTheme(nextTheme);
  appendLine(`THEME SET TO ${nextTheme.toUpperCase()}`);
};

const handleCommand = value => {
  const [command, ...rest] = value.trim().split(/\s+/);
  const upperCommand = command.toUpperCase();
  const arg = rest.join(' ');

  switch (upperCommand) {
    case 'HELP':
      printHelp();
      break;
    case 'CLS':
      output.innerHTML = '';
      appendLine('TYPE HELP FOR COMMAND LIST', 'pulse');
      break;
    case 'ABOUT':
      printAbout();
      break;
    case 'THEME':
      handleThemeCommand(arg);
      break;
    case '':
      break;
    default:
      appendLine(`UNKNOWN COMMAND: ${upperCommand}`);
  }
};

if (form && input) {
  form.addEventListener('submit', event => {
    event.preventDefault();
    const value = input.value;
    if (!value.trim()) {
      return;
    }

    appendLine(`${promptPrefix} ${value}`);
    handleCommand(value);
    input.value = '';
    input.focus();
  });
}

themeButtons.forEach(button => {
  button.addEventListener('click', event => {
    event.stopPropagation();
    setTheme(button.dataset.theme);
  });
});

setTheme(document.body.dataset.theme || 'green');

if (terminal && input) {
  terminal.addEventListener('click', () => {
    input.focus();
  });
}

window.addEventListener('load', () => {
  if (input) {
    input.focus();
  }
});

setInterval(randomFlicker, 1800);

bootSequence();
