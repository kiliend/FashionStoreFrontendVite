import api from "../api/axios";

export const listarDevoluciones = async () => {
  const response = await api.get("/devoluciones");
  return response.data;
};

export const obtenerDevolucion = async (id) => {
  const response = await api.get(`/devoluciones/${id}`);
  return response.data;
};

export const crearDevolucion = async (devolucion) => {
  const response = await api.post("/devoluciones", devolucion);
  return response.data;
};

export const procesarDevolucion = async (id) => {
  const response = await api.put(`/devoluciones/${id}/procesar`);
  return response.data;
};

export const rechazarDevolucion = async (id, data) => {
  const response = await api.put(`/devoluciones/${id}/rechazar`, data);
  return response.data;
};