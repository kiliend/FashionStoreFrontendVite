import api from "../api/axios";

/* =========================
   EMPRESA
========================= */

export const obtenerEmpresa = async () => {
  const response = await api.get("/sunat-base/empresa");
  return response.data;
};

export const crearEmpresa = async (data) => {
  const response = await api.post("/sunat-base/empresa", data);
  return response.data;
};

export const actualizarEmpresa = async (id, data) => {
  const response = await api.put(`/sunat-base/empresa/${id}`, data);
  return response.data;
};

/* =========================
   PARAMETROS SUNAT
========================= */

export const obtenerParametrosSunat = async () => {
  const response = await api.get("/sunat-base/parametros");
  return response.data;
};

export const crearParametrosSunat = async (data) => {
  const response = await api.post("/sunat-base/parametros", data);
  return response.data;
};

export const actualizarParametrosSunat = async (id, data) => {
  const response = await api.put(`/sunat-base/parametros/${id}`, data);
  return response.data;
};

/* =========================
   SERIES
========================= */

export const listarSeries = async () => {
  const response = await api.get("/sunat-base/series");
  return response.data;
};

export const crearSerie = async (data) => {
  const response = await api.post("/sunat-base/series", data);
  return response.data;
};

export const actualizarSerie = async (id, data) => {
  const response = await api.put(`/sunat-base/series/${id}`, data);
  return response.data;
};