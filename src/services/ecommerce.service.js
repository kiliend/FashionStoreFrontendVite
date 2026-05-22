import api from "../api/axios";

export const listarProductosEcommerce = async () => {
  const response = await api.get("/ecommerce/productos");
  return response.data;
};

export const obtenerProductoEcommerce = async (id_producto) => {
  const response = await api.get(`/ecommerce/productos/${id_producto}`);
  return response.data;
};

export const validarCarritoEcommerce = async (items) => {
  const response = await api.post("/ecommerce/validar-carrito", {
    items
  });

  return response.data;
};

export const checkoutEcommerce = async (data) => {
  const response = await api.post("/ecommerce/checkout", data);
  return response.data;
};

export const obtenerMisComprasEcommerce = async () => {
  const response = await api.get("/ecommerce/mis-compras");
  return response.data;
};

export const obtenerMisPedidosEcommerce = async () => {
  const response = await api.get("/ecommerce/mis-pedidos");
  return response.data;
};

export const registrarClienteEcommerce = async (data) => {
  const response = await api.post("/ecommerce/registro", data);
  return response.data;
};

export const obtenerMiCuentaEcommerce = async () => {
  const response = await api.get("/ecommerce/mi-cuenta");
  return response.data;
};

export const actualizarMiCuentaEcommerce = async (data) => {
  const response = await api.put("/ecommerce/mi-cuenta", data);
  return response.data;
};