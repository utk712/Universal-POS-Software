const customMasterIp = typeof window !== "undefined" ? localStorage.getItem("master_server_ip") : null;

const API_URL = customMasterIp
  ? (customMasterIp.startsWith("http") ? customMasterIp : `http://${customMasterIp}:5000`)
  : (process.env.NODE_ENV === "development" ? "http://localhost:5000" : "http://127.0.0.1:5000");

export default API_URL;