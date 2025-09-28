(() => {
  const root = document.body;

  if (!root || !root.classList.contains('retro-terminal')) {
    return;
  }

  const output = document.getElementById('terminal-output');
  const form = document.getElementById('terminal-form');
  const input = document.getElementById('terminal-input');
  const terminal = root.querySelector('.terminal');
  const themeButtons = root.querySelectorAll('.terminal__theme-button');
  const pathElement = root.querySelector('[data-terminal-path]');

  if (!output || !form || !input || !terminal) {
    return;
  }

  const promptPrefix = pathElement ? pathElement.textContent.trim() : 'C:\\retro>';
  const themes = new Set(['green', 'amber', 'blue']);

  const bootLines = [
    'Booting cool-retro-term ...',
    '>> Memory check: OK',
    '>> Video signal: stable',
    '>> Loading neon matrix...',
    '>> Bringing phosphor online',
    '>> Ready for user input',
    'Welcome back, operator.'
  ];

  const appendLine = (text, glow) => {
    const line = document.createElement('p');
    line.className = 'terminal__line';
    line.textContent = text;
    line.setAttribute('role', 'text');

    if (glow) {
      line.dataset.glow = glow;
    }

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
      await new Promise(resolve => setTimeout(resolve, 220));
    }

    appendLine('Type HELP for command list', 'pulse');
  };

  const randomFlicker = () => {
    const intensity = Math.random() * 0.25 + 0.85;
    root.style.setProperty('--scanline-alpha', intensity.toFixed(2));
  };

  const setTheme = theme => {
    if (!themes.has(theme)) {
      return;
    }

    root.dataset.theme = theme;

    themeButtons.forEach(button => {
      const isActive = button.dataset.theme === theme;
      button.setAttribute('aria-pressed', isActive.toString());
    });
  };

  const printHelp = () => {
    const helpLines = [
      'Available commands:',
      'help  .............. show this list',
      'theme <color> ...... switch phosphor (green/amber/blue)',
      'cls   .............. clear the screen',
      'about .............. terminal details',
      'neofetch ........... system snapshot'
    ];

    helpLines.forEach(line => appendLine(line));
  };

  const printAbout = () => {
    appendLine('Cool Retro Terminal v1.0');
    appendLine('Simulating CRT experience with ambient flicker');
    appendLine('Font: IBM Plex Mono');
  };

  const printNeofetch = () => {
    const logo = String.raw`
          ____
         / __ \
   _   _| |  | |___  ___ _ __
  | | | | |  | / __|/ _ \ '__|
  | |_| | |__| \__ \  __/ |
   \__, |\____/|___/\___|_|
   __/ |
  |___/
    `.trim().split('\n');

    const info = [
      'operator@cool-retro-term',
      '-------------------------',
      'OS: CRT Simulation 1.0',
      'Kernel: Glass-Tube 68k',
      'Uptime: 42 years',
      'Packages: 7 (phosphor)',
      'Shell: faux-cmd',
      'Resolution: fullscreen',
      `Theme: ${root.dataset.theme || 'green'}`,
      'CPU: Neon Beam 3.5MHz',
      'GPU: Vector Glow 512k',
      'Memory: 640KB (enough for anyone)'
    ];

    logo.forEach((line, index) => {
      const infoLine = info[index] ?? '';
      appendLine(`${line.padEnd(24)}${infoLine}`);
    });

    for (let i = logo.length; i < info.length; i += 1) {
      appendLine(' '.repeat(24) + info[i]);
    }
  };

  const clearScreen = () => {
    output.innerHTML = '';
    appendLine('Type HELP for command list', 'pulse');
  };

  const handleThemeCommand = arg => {
    const nextTheme = arg?.toLowerCase();

    if (!nextTheme || !themes.has(nextTheme)) {
      appendLine('Usage: theme green | theme amber | theme blue');
      return;
    }

    setTheme(nextTheme);
    appendLine(`Theme set to ${nextTheme}`);
  };

  const handleCommand = value => {
    const [rawCommand = '', ...rest] = value.trim().split(/\s+/);
    const command = rawCommand.toLowerCase();
    const arg = rest.join(' ');

    switch (command) {
      case 'help':
        printHelp();
        break;
      case 'cls':
        clearScreen();
        break;
      case 'about':
        printAbout();
        break;
      case 'theme':
        handleThemeCommand(arg);
        break;
      case 'neofetch':
        printNeofetch();
        break;
      case '':
        break;
      default:
        appendLine(`Unknown command: ${rawCommand}`);
    }
  };

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

  themeButtons.forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      setTheme(button.dataset.theme);
    });
  });

  terminal.addEventListener('click', () => {
    input.focus();
  });

  window.addEventListener('load', () => {
    input.focus();
  });

  setTheme(root.dataset.theme || 'green');
  randomFlicker();
  setInterval(randomFlicker, 1800);
  bootSequence();
})();