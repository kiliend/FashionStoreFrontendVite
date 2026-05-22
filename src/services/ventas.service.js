import api from "../api/axios";

export const listarVentas = async () => {
  const response = await api.get("/ventas");
  return response.data;
};

export const obtenerVenta = async (id) => {
  const response = await api.get(`/ventas/${id}`);
  return response.data;
};

export const crearVenta = async (venta) => {
  const response = await api.post("/ventas", venta);
  return response.data;
};

export const anularVenta = async (id) => {
  const response = await api.put(`/ventas/${id}/anular`);
  return response.data;
};

export const completarVenta = async (id) => {
  const response = await api.put(`/ventas/${id}/completar`);
  return response.data;
};