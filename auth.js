// Password protection - check auth on all protected pages
(function() {
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
