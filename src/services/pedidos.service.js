import api from "../api/axios";

export const listarPedidos = async () => {
  const response = await api.get("/pedidos");
  return response.data;
};

export const obtenerPedido = async (id) => {
  const response = await api.get(`/pedidos/${id}`);
  return response.data;
};

export const crearPedido = async (pedido) => {
  const response = await api.post("/pedidos", pedido);
  return response.data;
};

export const actualizarEstadoPedido = async (id, data) => {
  const response = await api.put(`/pedidos/${id}/estado`, data);
  return response.data;
};

export const asignarPedido = async (id, data) => {
  const response = await api.put(`/pedidos/${id}/asignar`, data);
  return response.data;
};

export const eliminarPedido = async (id) => {
  const response = await api.delete(`/pedidos/${id}`);
  return response.data;
};