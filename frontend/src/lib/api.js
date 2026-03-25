import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function buildQueryString(params = {}) {
  const cleaned = Object.entries(params).filter(([, value]) => {
    if (value === undefined || value === null) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    return true;
  });

  return new URLSearchParams(cleaned).toString();
}

function buildLoginUrlFromCurrentLocation() {
  if (typeof window === "undefined") return "/login";

  const pathname = window.location.pathname;
  if (!pathname || pathname === "/login") return "/login";

  return `/login?next=${encodeURIComponent(pathname)}`;
}

async function handleUnauthorized() {
  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore sign out errors and continue redirect flow.
  }

  if (typeof window !== "undefined") {
    window.location.replace(buildLoginUrlFromCurrentLocation());
  }
}

/**
 * Make an authenticated API request to the backend
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    await handleUnauthorized();
    throw new Error("Authentication required. Please log in again.");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...options.headers,
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : {};

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      await handleUnauthorized();
    }

    throw new Error(data.error || data.message || "API request failed");
  }

  return data;
}

// ========== Status ==========
export const getStatus = () => apiRequest("/api/status");
export const disconnectWA = () =>
  apiRequest("/api/status/disconnect", { method: "POST" });
export const triggerCleanup = () =>
  apiRequest("/api/status/cleanup", { method: "POST" });

// ========== Groups ==========
export const getAvailableGroups = () => apiRequest("/api/groups/available");
export const getMonitoredGroups = () => apiRequest("/api/groups");
export const addMonitoredGroup = (groupJid, groupName) =>
  apiRequest("/api/groups", {
    method: "POST",
    body: JSON.stringify({ group_jid: groupJid, group_name: groupName }),
  });
export const updateGroup = (id, updates) =>
  apiRequest(`/api/groups/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
export const deleteGroup = (id) =>
  apiRequest(`/api/groups/${id}`, { method: "DELETE" });

// ========== Keywords ==========
export const getKeywords = () => apiRequest("/api/keywords");
export const addKeyword = (keyword) =>
  apiRequest("/api/keywords", {
    method: "POST",
    body: JSON.stringify({ keyword }),
  });
export const updateKeyword = (id, updates) =>
  apiRequest(`/api/keywords/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
export const deleteKeyword = (id) =>
  apiRequest(`/api/keywords/${id}`, { method: "DELETE" });

// ========== Messages ==========
export const getMessages = (params = {}) => {
  const query = buildQueryString(params);
  return apiRequest(`/api/messages?${query}`);
};
export const getMessageStats = () => apiRequest("/api/messages/stats");
export const getMessageActivityOverTime = (params = {}) => {
  const query = buildQueryString(params);
  return apiRequest(`/api/messages/charts/activity-over-time?${query}`);
};
export const getTopGroups = (params = {}) => {
  const query = buildQueryString(params);
  return apiRequest(`/api/messages/charts/top-groups?${query}`);
};
export const getTopKeywords = (params = {}) => {
  const query = buildQueryString(params);
  return apiRequest(`/api/messages/charts/top-keywords?${query}`);
};
export const getMessage = (id) => apiRequest(`/api/messages/${id}`);
export const updateMessageStatus = (id, status) =>
  apiRequest(`/api/messages/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
export const markAsRead = (id) =>
  apiRequest(`/api/messages/${id}/read`, { method: "PATCH" });
export const markAllRead = () =>
  apiRequest("/api/messages/read-all", { method: "PATCH" });
export const deleteMessage = (id) =>
  apiRequest(`/api/messages/${id}`, { method: "DELETE" });
export const getMessageReports = (params = {}) => {
  const query = buildQueryString(params);
  return apiRequest(`/api/messages?${query}`);
};

// ========== Config ==========
export const getConfig = () => apiRequest("/api/config");
export const setConfig = (key, value) =>
  apiRequest(`/api/config/${key}`, {
    method: "PUT",
    body: JSON.stringify({ value }),
  });
export const resetOperationalData = () =>
  apiRequest("/api/config/reset-data", { method: "POST" });

// ========== Forwarding Rules ==========
export const getForwardingRules = () =>
  apiRequest("/api/config/forwarding-rules");
export const addForwardingRule = (rule) =>
  apiRequest("/api/config/forwarding-rules", {
    method: "POST",
    body: JSON.stringify(rule),
  });
export const updateForwardingRule = (id, updates) =>
  apiRequest(`/api/config/forwarding-rules/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
export const deleteForwardingRule = (id) =>
  apiRequest(`/api/config/forwarding-rules/${id}`, { method: "DELETE" });
