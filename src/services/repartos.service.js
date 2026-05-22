import api from "../api/axios";

export const listarRepartos = async () => {
  const response = await api.get("/repartos");
  return response.data;
};

export const obtenerReparto = async (id) => {
  const response = await api.get(`/repartos/${id}`);
  return response.data;
};

export const crearReparto = async (reparto) => {
  const response = await api.post("/repartos", reparto);
  return response.data;
};

export const marcarSalidaReparto = async (id) => {
  const response = await api.put(`/repartos/${id}/salida`);
  return response.data;
};

export const marcarEntregaReparto = async (id) => {
  const response = await api.put(`/repartos/${id}/entregar`);
  return response.data;
};

export const marcarRepartoFallido = async (id, data) => {
  const response = await api.put(`/repartos/${id}/fallido`, data);
  return response.data;
};