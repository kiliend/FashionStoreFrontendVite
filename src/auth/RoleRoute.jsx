import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const RoleRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <p style={{ padding: "20px" }}>Validando permisos...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const rolUsuario = user?.rol || user?.nombre_rol;

  const rolesCliente = ["cliente", "cliente_ecommerce"];

  if (!allowedRoles.includes(rolUsuario)) {
    if (rolesCliente.includes(rolUsuario)) {
      return <Navigate to="/tienda" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RoleRoute;