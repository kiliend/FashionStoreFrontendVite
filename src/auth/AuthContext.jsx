import { createContext, useContext, useEffect, useState } from "react";
import { loginRequest, getProfileRequest } from "../services/auth.service";
import {
  saveToken,
  saveUser,
  getToken,
  getUser,
  clearSession
} from "../utils/token";

const AuthContext = createContext();

const obtenerRolPorId = (id_rol) => {
  const roles = {
    1: "admin",
    2: "vendedor",
    3: "cliente",
    4: "almacen",
    5: "despacho",
    6: "reparto",
    7: "cliente_ecommerce"
  };

  return roles[Number(id_rol)] || "";
};

const normalizarUsuario = (usuario) => {
  if (!usuario) return null;

  const rolNormalizado = String(
    usuario.rol ||
      usuario.nombre_rol ||
      usuario.role ||
      obtenerRolPorId(usuario.id_rol) ||
      ""
  )
    .trim()
    .toLowerCase();

  return {
    ...usuario,
    rol: rolNormalizado,
    nombre_rol: rolNormalizado
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(normalizarUsuario(getUser()));
  const [token, setToken] = useState(getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateSession = async () => {
      const storedToken = getToken();

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await getProfileRequest();

        if (response.ok) {
          const usuarioNormalizado = normalizarUsuario(response.data);

          setUser(usuarioNormalizado);
          saveUser(usuarioNormalizado);
          setToken(storedToken);
        }
      } catch (error) {
        clearSession();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    validateSession();
  }, []);

  const login = async (credentials) => {
    const response = await loginRequest(credentials);

    if (!response.ok) {
      throw new Error(response.message || "Error al iniciar sesión");
    }

    const tokenResponse = response.data.token;
    const userResponse = normalizarUsuario(response.data.usuario);

    saveToken(tokenResponse);
    saveUser(userResponse);

    setToken(tokenResponse);
    setUser(userResponse);

    return userResponse;
  };

  const logout = () => {
    clearSession();
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = Boolean(token && user);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};