import api from "../api/axios";

export const listarComprobantes = async () => {
  const response = await api.get("/comprobantes");
  return response.data;
};

export const obtenerComprobante = async (id) => {
  const response = await api.get(`/comprobantes/${id}`);
  return response.data;
};

export const generarComprobante = async (idVenta, data) => {
  const response = await api.post(`/comprobantes/generar/${idVenta}`, data);
  return response.data;
};