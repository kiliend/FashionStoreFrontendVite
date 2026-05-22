import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../auth/AuthContext";

const menuItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    roles: ["admin", "vendedor", "almacen", "despacho", "reparto"]
  },
  {
    label: "Productos",
    path: "/productos",
    roles: ["admin", "almacen"]
  },
  {
    label: "Promociones",
    path: "/promociones",
    roles: ["admin", "vendedor"]
  },
  {
    label: "Ventas",
    path: "/ventas",
    roles: ["admin", "vendedor"]
  },
  {
    label: "Compras",
    path: "/compras",
    roles: ["admin", "almacen"]
  },
  {
    label: "Pedidos",
    path: "/pedidos",
    roles: ["admin", "vendedor", "almacen", "despacho", "reparto"]
  },
  {
    label: "Postventa",
    path: "/postventa",
    roles: ["admin", "vendedor"]
  },
  {
    label: "Clientes",
    path: "/clientes",
    roles: ["admin", "vendedor"]
  },
  {
    label: "Reportes",
    path: "/reportes",
    roles: ["admin"]
  },
  {
    label: "Catálogos",
    path: "/catalogos",
    roles: ["admin", "almacen"]
  },
  {
    label: "Inventario",
    path: "/inventario",
    roles: ["admin", "almacen", "despacho"]
  },
  {
    label: "Tareas",
    path: "/tareas",
    roles: ["admin", "almacen", "despacho", "reparto", "vendedor"]
  },
  {
    label: "Configuración",
    path: "/configuracion",
    roles: ["admin"]
  },
  {
    label: "Usuarios",
    path: "/usuarios",
    roles: ["admin"]
  }
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const rolUsuario = user?.rol || user?.nombre_rol;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuPermitido = menuItems.filter((item) =>
    item.roles.includes(rolUsuario)
  );

  return (
    <div
      className={`admin-layout ${
        sidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
    >
      <aside className="sidebar">
        <div className="sidebar-header">
          {!sidebarCollapsed && <h2>FashionStore</h2>}

          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            title={sidebarCollapsed ? "Expandir menú" : "Contraer menú"}
          >
            {sidebarCollapsed ? "☰" : "×"}
          </button>
        </div>

        <nav>
          {menuPermitido.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={location.pathname.startsWith(item.path) ? "active" : ""}
              title={sidebarCollapsed ? item.label : ""}
            >
              <span className="sidebar-icon">{obtenerIcono(item.label)}</span>

              {!sidebarCollapsed && (
                <span className="sidebar-label">{item.label}</span>
              )}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <header className="navbar">
          <div className="navbar-user-info">
            <div className="user-avatar">{obtenerIniciales(user)}</div>

            <div className="user-details">
              <span className="user-greeting">
                {obtenerSaludo()}, {user?.nombres || user?.usuario}
              </span>

              <strong className="user-name">
                {nombreCompletoUsuario(user)}
              </strong>

              <small className="user-role">
                Rol: {formatearRol(rolUsuario)}
              </small>
            </div>
          </div>

          <div className="navbar-actions">
            <div className="session-info">
              <span className="session-status">● Sesión activa</span>
              <small>{obtenerFechaActual()}</small>
            </div>

            <button className="logout-button" onClick={handleLogout}>
              Salir
            </button>
          </div>
        </header>

        <section className="page-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

const obtenerIcono = (label) => {
  const iconos = {
    Dashboard: "📊",
    Productos: "👕",
    Promociones: "🏷️",
    Ventas: "🛒",
    Compras: "📦",
    Pedidos: "🚚",
    Postventa: "↩️",
    Clientes: "👥",
    Reportes: "📈",
    Catálogos: "📚",
    Inventario: "📋",
    Tareas: "✅",
    Configuración: "⚙️",
    Usuarios: "🔐"
  };

  return iconos[label] || "•";
};

const obtenerSaludo = () => {
  const hora = new Date().getHours();

  if (hora < 12) return "Buenos días";
  if (hora < 18) return "Buenas tardes";
  return "Buenas noches";
};

const nombreCompletoUsuario = (user) => {
  const nombreCompleto = `${user?.nombres || ""} ${
    user?.apellidos || ""
  }`.trim();

  return nombreCompleto || user?.usuario || "Usuario del sistema";
};

const obtenerIniciales = (user) => {
  const nombres = user?.nombres || user?.usuario || "U";
  const apellidos = user?.apellidos || "";

  const inicialNombre = nombres.charAt(0).toUpperCase();
  const inicialApellido = apellidos.charAt(0).toUpperCase();

  return `${inicialNombre}${inicialApellido || ""}`;
};

const formatearRol = (rol) => {
  const roles = {
    admin: "Administrador",
    vendedor: "Vendedor",
    almacen: "Almacén",
    despacho: "Despacho",
    reparto: "Reparto",
    cliente: "Cliente",
    cliente_ecommerce: "Cliente e-commerce"
  };

  return roles[rol] || rol || "Sin rol";
};

const obtenerFechaActual = () => {
  return new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
};

export default AdminLayout;