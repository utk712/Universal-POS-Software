// Save token & user role
export const saveAuthData = (token, role, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  }
};

// Get token
export const getToken = () => {
  return localStorage.getItem("token");
};

// Get user role
export const getRole = () => {
  return localStorage.getItem("role");
};

// Decode JWT token payload (for expiration check)
export const isTokenValid = () => {
  const token = getToken();
  if (!token) return false;

  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return false;
    const payload = JSON.parse(atob(payloadBase64));

    // Check expiration timestamp (in seconds)
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      logout();
      return false;
    }
    return true;
  } catch (err) {
    logout();
    return false;
  }
};

// Authenticated Fetch Wrapper
export const authFetch = async (url, options = {}) => {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 || response.status === 403) {
    // If token expired or unauthorized, clear storage and redirect
    if (response.status === 401 && getToken()) {
      logout();
    }
  }

  return response;
};

// Logout
export const logout = () => {
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.user_id) {
        const customIp = localStorage.getItem("custom_master_ip");
        const baseUrl = customIp
          ? (customIp.startsWith("http") ? customIp : `http://${customIp}:5000`)
          : (process.env.NODE_ENV === "development" ? "http://localhost:5000" : "http://127.0.0.1:5000");

        fetch(`${baseUrl}/api/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.user_id }),
          keepalive: true
        }).catch(() => {});
      }
    }
  } catch (e) {
    console.error(e);
  }

  localStorage.clear();
  window.location.href = "#/";
  window.location.reload();
};