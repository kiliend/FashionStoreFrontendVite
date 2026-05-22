import api from "../api/axios";

export const listarColores = async () => {
  const response = await api.get("/colores");
  return response.data;
};

export const crearColor = async (color) => {
  const response = await api.post("/colores", color);
  return response.data;
};

export const actualizarColor = async (id, color) => {
  const response = await api.put(`/colores/${id}`, color);
  return response.data;
};

export const eliminarColor = async (id) => {
  const response = await api.delete(`/colores/${id}`);
  return response.data;
};