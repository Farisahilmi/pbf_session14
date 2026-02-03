// Authentication utilities
function updateAuthUI() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const authLinks = document.getElementById('auth-links');
  const userLinks = document.getElementById('user-links');
  const adminLink = document.getElementById('admin-link');
  const userName = document.getElementById('user-name');

  if (token && user.name) {
    authLinks.classList.add('hidden');
    userLinks.classList.remove('hidden');
    userName.textContent = `Hello, ${user.name}`;
    
    // Show admin link if user is admin
    if (user.role === 'ADMIN' && adminLink) {
      adminLink.classList.remove('hidden');
    } else if (adminLink) {
      adminLink.classList.add('hidden');
    }
  } else {
    authLinks.classList.remove('hidden');
    userLinks.classList.add('hidden');
    if (adminLink) adminLink.classList.add('hidden');
  }
}

// Logout function
async function logout() {
  try {
    // Call logout API to clear server-side cookie
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
  
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  updateAuthUI();
  window.location.href = '/jobs';
}

// Initialize auth UI on page load
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  
  // Add logout event listener
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }
});

// Export for use in other scripts
window.updateAuthUI = updateAuthUI;
window.logout = logout;
