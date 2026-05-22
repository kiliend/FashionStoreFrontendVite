import api from "../api/axios";

const buildQuery = (filtros = {}) => {
  const params = new URLSearchParams();

  Object.entries(filtros).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      params.append(key, value);
    }
  });

  return params.toString();
};

export const obtenerResumenGerencial = async (filtros) => {
  const query = buildQuery(filtros);
  const response = await api.get(`/reportes/resumen-gerencial?${query}`);
  return response.data;
};

export const obtenerReporteVentas = async (filtros) => {
  const query = buildQuery(filtros);
  const response = await api.get(`/reportes/ventas?${query}`);
  return response.data;
};

export const obtenerReporteInventario = async (filtros) => {
  const query = buildQuery(filtros);
  const response = await api.get(`/reportes/inventario?${query}`);
  return response.data;
};

export const obtenerReporteCompras = async (filtros) => {
  const query = buildQuery(filtros);
  const response = await api.get(`/reportes/compras?${query}`);
  return response.data;
};

export const obtenerProductosMasVendidos = async (filtros) => {
  const query = buildQuery(filtros);
  const response = await api.get(`/reportes/productos-mas-vendidos?${query}`);
  return response.data;
};