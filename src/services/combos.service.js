import api from "../api/axios";

export const listarCombos = async () => {
  const response = await api.get("/combos");
  return response.data;
};

export const obtenerCombo = async (id) => {
  const response = await api.get(`/combos/${id}`);
  return response.data;
};

export const crearCombo = async (combo) => {
  const response = await api.post("/combos", combo);
  return response.data;
};

export const actualizarCombo = async (id, combo) => {
  const response = await api.put(`/combos/${id}`, combo);
  return response.data;
};

export const eliminarCombo = async (id) => {
  const response = await api.delete(`/combos/${id}`);
  return response.data;
};