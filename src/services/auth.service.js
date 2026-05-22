import api from "../api/axios";

export const loginRequest = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

export const getProfileRequest = async () => {
  const response = await api.get("/auth/profile");
  return response.data;
};