import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  ClipboardList,
  CreditCard
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import { getDashboard } from "../services/dashboard.service";
import { useAuth } from "../auth/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const cargarDashboard = async () => {
    try {
      setLoading(true);

      const response = await getDashboard();

      if (response.ok) {
        setDashboard(response.data);
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo cargar el dashboard",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
  }, []);

  if (loading) {
    return <p>Cargando dashboard...</p>;
  }

  if (!dashboard) {
    return <p>No hay información disponible.</p>;
  }

  const resumen = dashboard.resumen || {};
  const ventasHoy = resumen.ventas_hoy || {};
  const ventasGeneral = resumen.ventas_general || {};

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Bienvenido, {user?.usuario}. Resumen general del sistema.</p>
        </div>

        <button onClick={cargarDashboard} className="btn-primary">
          Actualizar
        </button>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Ventas de hoy"
          value={`S/ ${Number(ventasHoy.total_ventas_hoy || 0).toFixed(2)}`}
          subtitle={`${ventasHoy.cantidad_ventas_hoy || 0} ventas registradas`}
          icon={<ShoppingCart />}
        />

        <StatCard
          title="Ventas generales"
          value={`S/ ${Number(ventasGeneral.total_ventas_general || 0).toFixed(2)}`}
          subtitle={`${ventasGeneral.cantidad_ventas_total || 0} ventas completadas`}
          icon={<CreditCard />}
        />

        <StatCard
          title="Pedidos pendientes"
          value={resumen.pedidos_pendientes || 0}
          subtitle="Pedidos por atender"
          icon={<ClipboardList />}
        />

        <StatCard
          title="Stock bajo"
          value={resumen.productos_stock_bajo || 0}
          subtitle="Variantes con alerta"
          icon={<AlertTriangle />}
          danger
        />

        <StatCard
          title="Compras por pagar"
          value={resumen.compras_pendientes_pago || 0}
          subtitle="Facturas pendientes"
          icon={<Package />}
        />

        <StatCard
          title="Clientes activos"
          value={resumen.clientes_activos || 0}
          subtitle="Clientes registrados"
          icon={<Users />}
        />
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <h2>Ventas por mes</h2>

          {dashboard.ventas_por_mes?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dashboard.ventas_por_mes}>
                <XAxis dataKey="periodo" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_ventas" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p>No hay ventas mensuales registradas.</p>
          )}
        </section>

        <section className="panel">
          <h2>Productos más vendidos</h2>

          {dashboard.productos_mas_vendidos?.length > 0 ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.productos_mas_vendidos.map((item) => (
                    <tr key={item.id_producto}>
                      <td>{item.nombre_producto}</td>
                      <td>{item.cantidad_vendida}</td>
                      <td>S/ {Number(item.total_vendido || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No hay productos vendidos todavía.</p>
          )}
        </section>
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <h2>Alertas de stock</h2>

          {dashboard.alertas_stock?.length > 0 ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>SKU</th>
                    <th>Stock</th>
                    <th>Mínimo</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.alertas_stock.map((item) => (
                    <tr key={item.id_variante}>
                      <td>
                        {item.nombre_producto} - {item.nombre_color} -{" "}
                        {item.nombre_talla}
                      </td>
                      <td>{item.sku}</td>
                      <td>{item.stock_actual}</td>
                      <td>{item.stock_minimo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No hay alertas de stock.</p>
          )}
        </section>

        <section className="panel">
          <h2>Pedidos recientes</h2>

          {dashboard.pedidos_recientes?.length > 0 ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Entrega</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.pedidos_recientes.map((pedido) => (
                    <tr key={pedido.id_pedido}>
                      <td>#{pedido.id_pedido}</td>
                      <td>
                        {pedido.razon_social ||
                          `${pedido.nombres || ""} ${pedido.apellidos || ""}`.trim() ||
                          "Cliente no registrado"}
                      </td>
                      <td>{pedido.tipo_entrega}</td>
                      <td>
                        <span className="status-badge">
                          {pedido.estado_pedido}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No hay pedidos recientes.</p>
          )}
        </section>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, subtitle, icon, danger = false }) => {
  return (
    <div className={`stat-card ${danger ? "stat-danger" : ""}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <h3>{title}</h3>
        <strong>{value}</strong>
        <p>{subtitle}</p>
      </div>
    </div>
  );
};

export default Dashboard;