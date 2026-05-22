import api from "../api/axios";

export const listarVehiculos = async () => {
  const response = await api.get("/vehiculos");
  return response.data;
};

export const obtenerVehiculo = async (id) => {
  const response = await api.get(`/vehiculos/${id}`);
  return response.data;
};

export const crearVehiculo = async (data) => {
  const response = await api.post("/vehiculos", data);
  return response.data;
};

export const actualizarVehiculo = async (id, data) => {
  const response = await api.put(`/vehiculos/${id}`, data);
  return response.data;
};

export const eliminarVehiculo = async (id) => {
  const response = await api.delete(`/vehiculos/${id}`);
  return response.data;
};