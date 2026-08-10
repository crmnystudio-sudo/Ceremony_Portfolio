// Initialize theme on page load
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  const root = document.documentElement;

  if (savedTheme === 'dark') {
    root.classList.add('dark-mode');
    updateToggleIcon(true);
  }
}

// Update toggle icon based on theme
function updateToggleIcon(isDark) {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  if (isDark) {
    toggle.innerHTML = '☀️';
    toggle.setAttribute('aria-label', 'Switch to light mode');
  } else {
    toggle.innerHTML = '🌙';
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
