import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import RoleRoute from "./auth/RoleRoute";

import AdminLayout from "./layouts/AdminLayout";
import EcommerceLayout from "./layouts/EcommerceLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Productos from "./pages/Productos";
import Ventas from "./pages/Ventas";
import Clientes from "./pages/Clientes";
import Reportes from "./pages/Reportes";
import Catalogos from "./pages/Catalogos";
import Inventario from "./pages/Inventario";
import FacturacionGenerar from "./pages/FacturacionGenerar";
import Compras from "./pages/Compras";
import Pedidos from "./pages/Pedidos";
import Postventa from "./pages/Postventa";
import Promociones from "./pages/Promociones";
import Tareas from "./pages/Tareas";
import Configuracion from "./pages/Configuracion";
import Usuarios from "./pages/Usuarios";

import Tienda from "./pages/ecommerce/Tienda";
import Carrito from "./pages/ecommerce/Carrito";
import Checkout from "./pages/ecommerce/Checkout";
import MisPedidos from "./pages/ecommerce/MisPedidos";
import MiCuenta from "./pages/ecommerce/MiCuenta";
import LoginCliente from "./pages/ecommerce/LoginCliente";

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/tienda" element={<EcommerceLayout />}>
            <Route index element={<Tienda />} />
            <Route path="carrito" element={<Carrito />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="mis-pedidos" element={<MisPedidos />} />
            <Route path="mi-cuenta" element={<MiCuenta />} />
            <Route path="login" element={<LoginCliente />} />
          </Route>

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />

            <Route
              path="dashboard"
              element={
                <RoleRoute
                  allowedRoles={[
                    "admin",
                    "vendedor",
                    "almacen",
                    "despacho",
                    "reparto"
                  ]}
                >
                  <Dashboard />
                </RoleRoute>
              }
            />

            <Route
              path="ventas"
              element={
                <RoleRoute allowedRoles={["admin", "vendedor"]}>
                  <Ventas />
                </RoleRoute>
              }
            />

            <Route
              path="clientes"
              element={
                <RoleRoute allowedRoles={["admin", "vendedor"]}>
                  <Clientes />
                </RoleRoute>
              }
            />

            <Route
              path="promociones"
              element={
                <RoleRoute allowedRoles={["admin", "vendedor"]}>
                  <Promociones />
                </RoleRoute>
              }
            />

            <Route
              path="postventa"
              element={
                <RoleRoute allowedRoles={["admin", "vendedor"]}>
                  <Postventa />
                </RoleRoute>
              }
            />

            <Route
              path="productos"
              element={
                <RoleRoute allowedRoles={["admin", "almacen"]}>
                  <Productos />
                </RoleRoute>
              }
            />

            <Route
              path="compras"
              element={
                <RoleRoute allowedRoles={["admin", "almacen"]}>
                  <Compras />
                </RoleRoute>
              }
            />

            <Route
              path="catalogos"
              element={
                <RoleRoute allowedRoles={["admin", "almacen"]}>
                  <Catalogos />
                </RoleRoute>
              }
            />

            <Route
              path="inventario"
              element={
                <RoleRoute allowedRoles={["admin", "almacen", "despacho"]}>
                  <Inventario />
                </RoleRoute>
              }
            />

            <Route
              path="pedidos"
              element={
                <RoleRoute
                  allowedRoles={[
                    "admin",
                    "vendedor",
                    "almacen",
                    "despacho",
                    "reparto"
                  ]}
                >
                  <Pedidos />
                </RoleRoute>
              }
            />

            <Route
              path="reportes"
              element={
                <RoleRoute allowedRoles={["admin"]}>
                  <Reportes />
                </RoleRoute>
              }
            />

            <Route
              path="tareas"
              element={
                <RoleRoute
                  allowedRoles={[
                    "admin",
                    "vendedor",
                    "almacen",
                    "despacho",
                    "reparto"
                  ]}
                >
                  <Tareas />
                </RoleRoute>
              }
            />

            <Route
              path="configuracion"
              element={
                <RoleRoute allowedRoles={["admin"]}>
                  <Configuracion />
                </RoleRoute>
              }
            />

            <Route
              path="usuarios"
              element={
                <RoleRoute allowedRoles={["admin"]}>
                  <Usuarios />
                </RoleRoute>
              }
            />

            <Route
              path="facturacion/generar/:id_venta"
              element={
                <RoleRoute allowedRoles={["admin", "vendedor"]}>
                  <FacturacionGenerar />
                </RoleRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/tienda" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;