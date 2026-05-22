import api from "../api/axios";

export const listarPromociones = async () => {
  const response = await api.get("/promociones");
  return response.data;
};

export const obtenerPromocion = async (id) => {
  const response = await api.get(`/promociones/${id}`);
  return response.data;
};

export const crearPromocion = async (promocion) => {
  const response = await api.post("/promociones", promocion);
  return response.data;
};

export const actualizarPromocion = async (id, promocion) => {
  const response = await api.put(`/promociones/${id}`, promocion);
  return response.data;
};

export const eliminarPromocion = async (id) => {
  const response = await api.delete(`/promociones/${id}`);
  return response.data;
};