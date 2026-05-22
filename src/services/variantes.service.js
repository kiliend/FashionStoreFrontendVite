import api from "../api/axios";

export const listarVariantes = async () => {
  const response = await api.get("/variantes");
  return response.data;
};

export const obtenerVariante = async (id) => {
  const response = await api.get(`/variantes/${id}`);
  return response.data;
};

export const crearVariante = async (variante) => {
  const response = await api.post("/variantes", variante);
  return response.data;
};

export const actualizarVariante = async (id, variante) => {
  const response = await api.put(`/variantes/${id}`, variante);
  return response.data;
};

export const eliminarVariante = async (id) => {
  const response = await api.delete(`/variantes/${id}`);
  return response.data;
};