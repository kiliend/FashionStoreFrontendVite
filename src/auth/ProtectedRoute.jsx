import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <p style={{ padding: "20px" }}>Validando sesión...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const rolUsuario = user?.rol || user?.nombre_rol;

  if (allowedRoles.length > 0 && !allowedRoles.includes(rolUsuario)) {
    if (rolUsuario === "cliente" || rolUsuario === "cliente_ecommerce") {
      return <Navigate to="/tienda" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;