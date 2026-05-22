import api from "../api/axios";

export const listarUsuarios = async () => {
  const response = await api.get("/usuarios");
  return response.data;
};

export const obtenerUsuario = async (id) => {
  const response = await api.get(`/usuarios/${id}`);
  return response.data;
};

export const crearUsuario = async (usuario) => {
  const response = await api.post("/usuarios", usuario);
  return response.data;
};

export const actualizarUsuario = async (id, usuario) => {
  const response = await api.put(`/usuarios/${id}`, usuario);
  return response.data;
};

export const eliminarUsuario = async (id) => {
  const response = await api.delete(`/usuarios/${id}`);
  return response.data;
};