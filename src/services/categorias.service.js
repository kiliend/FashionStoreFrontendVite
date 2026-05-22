import api from "../api/axios";

export const listarCategorias = async () => {
  const response = await api.get("/categorias");
  return response.data;
};

export const crearCategoria = async (categoria) => {
  const response = await api.post("/categorias", categoria);
  return response.data;
};

export const actualizarCategoria = async (id, categoria) => {
  const response = await api.put(`/categorias/${id}`, categoria);
  return response.data;
};

export const eliminarCategoria = async (id) => {
  const response = await api.delete(`/categorias/${id}`);
  return response.data;
};