import api from "../api/axios";

export const listarIncidencias = async () => {
  const response = await api.get("/incidencias");
  return response.data;
};

export const obtenerIncidencia = async (id) => {
  const response = await api.get(`/incidencias/${id}`);
  return response.data;
};

export const crearIncidencia = async (incidencia) => {
  const response = await api.post("/incidencias", incidencia);
  return response.data;
};

export const actualizarEstadoIncidencia = async (id, data) => {
  const response = await api.put(`/incidencias/${id}/estado`, data);
  return response.data;
};