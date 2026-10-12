const BASE_URL = "http://localhost:5000/api";

export const loginAPI = (data) =>
  fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(res => res.json());

export const getProduct = (barcode, token) =>
  fetch(`${BASE_URL}/product/${barcode}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => res.json());

export const saveSale = (data, token) =>
  fetch(`${BASE_URL}/sale`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  }).then(res => res.json());

export const addStock = (data, token) =>
  fetch(`${BASE_URL}/add-stock`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  }).then(res => res.json());