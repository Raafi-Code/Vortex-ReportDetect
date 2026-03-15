const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

/**
 * Make an authenticated API request to the backend
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

// ========== Status ==========
export const getStatus = () => apiRequest('/api/status');
export const disconnectWA = () => apiRequest('/api/status/disconnect', { method: 'POST' });
export const triggerCleanup = () => apiRequest('/api/status/cleanup', { method: 'POST' });

// ========== Groups ==========
export const getAvailableGroups = () => apiRequest('/api/groups/available');
export const getMonitoredGroups = () => apiRequest('/api/groups');
export const addMonitoredGroup = (groupJid, groupName) =>
  apiRequest('/api/groups', {
    method: 'POST',
    body: JSON.stringify({ group_jid: groupJid, group_name: groupName }),
  });
export const updateGroup = (id, updates) =>
  apiRequest(`/api/groups/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
export const deleteGroup = (id) =>
  apiRequest(`/api/groups/${id}`, { method: 'DELETE' });

// ========== Keywords ==========
export const getKeywords = () => apiRequest('/api/keywords');
export const addKeyword = (keyword) =>
  apiRequest('/api/keywords', {
    method: 'POST',
    body: JSON.stringify({ keyword }),
  });
export const updateKeyword = (id, updates) =>
  apiRequest(`/api/keywords/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
export const deleteKeyword = (id) =>
  apiRequest(`/api/keywords/${id}`, { method: 'DELETE' });

// ========== Messages ==========
export const getMessages = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/api/messages?${query}`);
};
export const getMessageStats = () => apiRequest('/api/messages/stats');
export const getMessage = (id) => apiRequest(`/api/messages/${id}`);
export const markAsRead = (id) =>
  apiRequest(`/api/messages/${id}/read`, { method: 'PATCH' });
export const markAllRead = () =>
  apiRequest('/api/messages/read-all', { method: 'PATCH' });
export const deleteMessage = (id) =>
  apiRequest(`/api/messages/${id}`, { method: 'DELETE' });

// ========== Config ==========
export const getConfig = () => apiRequest('/api/config');
export const setConfig = (key, value) =>
  apiRequest(`/api/config/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ value }),
  });

// ========== Forwarding Rules ==========
export const getForwardingRules = () => apiRequest('/api/config/forwarding-rules');
export const addForwardingRule = (rule) =>
  apiRequest('/api/config/forwarding-rules', {
    method: 'POST',
    body: JSON.stringify(rule),
  });
export const updateForwardingRule = (id, updates) =>
  apiRequest(`/api/config/forwarding-rules/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
export const deleteForwardingRule = (id) =>
  apiRequest(`/api/config/forwarding-rules/${id}`, { method: 'DELETE' });
