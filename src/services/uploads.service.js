import api from "../api/axios";

export const subirImagenProducto = async (file) => {
  const formData = new FormData();
  formData.append("imagen", file);

  const response = await api.post("/uploads/productos", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return response.data;
};