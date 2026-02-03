// API utility functions
const API_BASE_URL = '';

// Make authenticated API request
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  // Handle 401 unauthorized
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (window.updateAuthUI) {
      window.updateAuthUI();
    }
    if (window.location.pathname !== '/auth/login') {
      window.location.href = '/auth/login';
    }
    throw new Error('Session expired. Please login again.');
  }

  return response;
}

// Export for use in other scripts
window.apiRequest = apiRequest;
