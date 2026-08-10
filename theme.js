// Initialize theme on page load
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  const root = document.documentElement;

  if (savedTheme === 'dark') {
    root.classList.add('dark-mode');
    updateToggleIcon(true);
  } else {
    updateToggleIcon(false);
  }
}

// Update toggle icon based on theme
function updateToggleIcon(isDark) {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  if (isDark) {
    // Sun icon (white) for dark mode
    toggle.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
    toggle.setAttribute('aria-label', 'Switch to light mode');
  } else {
    // Moon icon (black) for light mode
    toggle.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="black"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    toggle.setAttribute('aria-label', 'Switch to dark mode');
  }
}

// Toggle theme
function toggleTheme() {
  const root = document.documentElement;
  const isDark = root.classList.toggle('dark-mode');

  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateToggleIcon(isDark);
}

// Setup toggle button
function setupThemeToggle() {
  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', toggleTheme);
  }
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupThemeToggle();
  });
} else {
  initTheme();
  setupThemeToggle();
}
