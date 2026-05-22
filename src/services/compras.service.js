import api from "../api/axios";

export const listarCompras = async () => {
  const response = await api.get("/compras");
  return response.data;
};

export const obtenerCompra = async (id) => {
  const response = await api.get(`/compras/${id}`);
  return response.data;
};

export const crearCompra = async (compra) => {
  const response = await api.post("/compras", compra);
  return response.data;
};

export const recibirCompra = async (id) => {
  const response = await api.put(`/compras/${id}/recibir`);
  return response.data;
};

export const pagarCompra = async (id) => {
  const response = await api.put(`/compras/${id}/pagar`);
  return response.data;
};

export const cancelarCompra = async (id) => {
  const response = await api.put(`/compras/${id}/cancelar`);
  return response.data;
};