import api from "../api/axios";

export const listarClientes = async () => {
  const response = await api.get("/clientes");
  return response.data;
};

export const obtenerCliente = async (id) => {
  const response = await api.get(`/clientes/${id}`);
  return response.data;
};

export const crearCliente = async (cliente) => {
  const response = await api.post("/clientes", cliente);
  return response.data;
};

export const actualizarCliente = async (id, cliente) => {
  const response = await api.put(`/clientes/${id}`, cliente);
  return response.data;
};

export const eliminarCliente = async (id) => {
  const response = await api.delete(`/clientes/${id}`);
  return response.data;
};