import api from "../api/axios";

export const listarTareas = async () => {
  const response = await api.get("/tareas");
  return response.data;
};

export const obtenerTarea = async (id) => {
  const response = await api.get(`/tareas/${id}`);
  return response.data;
};

export const crearTarea = async (data) => {
  const response = await api.post("/tareas", data);
  return response.data;
};

export const actualizarEstadoTarea = async (id, data) => {
  const response = await api.put(`/tareas/${id}/estado`, data);
  return response.data;
};

export const eliminarTarea = async (id) => {
  const response = await api.delete(`/tareas/${id}`);
  return response.data;
};