// Password protection - check auth on all protected pages
(function() {
  // Check if password protection is enabled in config
  if (typeof PASSWORD_ENABLED === 'undefined' || !PASSWORD_ENABLED) {
    return; // Password disabled, allow access
  }

  // Get current page filename
  const currentPage = window.location.pathname.split('/').pop() || 'home.html';

  // Don't protect index.html (the password page itself)
  if (currentPage === 'index.html' || currentPage === '') return;

  // Check if user is authenticated
  if (sessionStorage.getItem('portfolio_auth') !== 'true') {
    // Not authenticated - redirect to password page
    window.location.replace('index.html');
  }
})();
