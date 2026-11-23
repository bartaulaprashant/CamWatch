const API_BASE = "/api";

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Something went wrong");
  }

  return data;
}

export const authAPI = {
  login: (identifier, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    }),

  logout: () =>
    request("/auth/logout", {
      method: "POST",
    }),

  me: () => request("/auth/me"),
};

export const cameraAPI = {
  health: () => request("/health"),
  list: () => request("/cameras/"),
  get: (cameraId) => request(`/cameras/${cameraId}`),
  create: (name, deviceIndex = 0) =>
    request("/cameras/", {
      method: "POST",
      body: JSON.stringify({ name, device_index: deviceIndex }),
    }),
  update: (cameraId, updates) =>
    request(`/cameras/${cameraId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),
};

export const eventAPI = {
  list: (limit = 20, offset = 0, cameraId) => {
    const params = new URLSearchParams({ limit, offset });
    if (cameraId != null) params.set("camera_id", cameraId);
    return request(`/events/?${params.toString()}`);
  },
  imageUrl: (eventId) => `${API_BASE}/events/${eventId}/image`,
};

export const streamAPI = {
  createOffer: (sdp, type, audioEnabled) =>
    request("/offer", {
      method: "POST",
      body: JSON.stringify({
        sdp,
        type,
        audio_enabled: audioEnabled,
      }),
    }),
};