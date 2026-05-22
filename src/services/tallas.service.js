import api from "../api/axios";

export const listarTallas = async () => {
  const response = await api.get("/tallas");
  return response.data;
};

export const crearTalla = async (talla) => {
  const response = await api.post("/tallas", talla);
  return response.data;
};

export const actualizarTalla = async (id, talla) => {
  const response = await api.put(`/tallas/${id}`, talla);
  return response.data;
};

export const eliminarTalla = async (id) => {
  const response = await api.delete(`/tallas/${id}`);
  return response.data;
};