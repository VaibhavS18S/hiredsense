const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('hiresense_token');

  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
    credentials: 'include',
  };

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, config);
  } catch (networkErr) {
    console.error(`Network fetch failure on ${endpoint}:`, networkErr);
    throw new Error(
      `Cannot connect to API server at ${API_BASE}. Please ensure the backend server is running on port 5000.`
    );
  }

  // If unauthorized, clear invalid session tokens
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
    localStorage.removeItem('hiresense_token');
    localStorage.removeItem('hiresense_user');
  }

  // Handle blob responses (for CSV exports)
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/csv')) {
    return await response.blob();
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return { success: true };
  }

  // Safely read response as text first
  const responseText = await response.text();

  // If response is completely empty
  if (!responseText || responseText.trim() === '') {
    if (!response.ok) {
      throw new Error(`Server returned error status ${response.status} (${response.statusText || 'Empty Response'})`);
    }
    return { success: true };
  }

  // Parse JSON with defensive fallback
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (parseError) {
    // If server returned non-JSON (like an HTML error page from a proxy or gateway)
    if (!response.ok) {
      throw new Error(
        `Server returned status ${response.status}: ${responseText.slice(0, 160)}`
      );
    }
    throw new Error(`Unexpected non-JSON response from server: ${responseText.slice(0, 160)}`);
  }

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) =>
    request(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body || {}),
    }),
  put: (endpoint, body) =>
    request(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body || {}),
    }),
  patch: (endpoint, body) =>
    request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body || {}),
    }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
  upload: (endpoint, formData) =>
    request(endpoint, {
      method: 'POST',
      body: formData,
    }),
};
