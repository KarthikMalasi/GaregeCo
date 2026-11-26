const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let isRefreshing = false;
let refreshPromise = null;

const getTokens = () => ({
  accessToken: localStorage.getItem('garagego_access_token'),
  refreshToken: localStorage.getItem('garagego_refresh_token'),
});

export const setTokens = (accessToken, refreshToken) => {
  if (accessToken) localStorage.setItem('garagego_access_token', accessToken);
  if (refreshToken) localStorage.setItem('garagego_refresh_token', refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem('garagego_access_token');
  localStorage.removeItem('garagego_refresh_token');
};

const refreshAccessToken = async () => {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  const { refreshToken } = getTokens();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  isRefreshing = true;
  refreshPromise = fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async (res) => {
      const json = await res.json();
      if (!res.ok || !json.success) {
        clearTokens();
        throw new Error(json.message || 'Session expired');
      }
      setTokens(json.data.accessToken, json.data.refreshToken);
      return json.data.accessToken;
    })
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

  return refreshPromise;
};

export const apiRequest = async (endpoint, options = {}) => {
  const { accessToken } = getTokens();

  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers,
  };

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Attempt silent refresh once on 401 (excluding login/register/refresh endpoints)
  if (
    response.status === 401 &&
    !endpoint.startsWith('/auth/login') &&
    !endpoint.startsWith('/auth/register') &&
    !endpoint.startsWith('/auth/refresh')
  ) {
    try {
      const newAccessToken = await refreshAccessToken();
      response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          Authorization: `Bearer ${newAccessToken}`,
        },
      });
    } catch (refreshError) {
      clearTokens();
      throw refreshError;
    }
  }

  const data = await response.json();

  if (!response.ok || data.success === false) {
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    throw error;
  }

  return data;
};
