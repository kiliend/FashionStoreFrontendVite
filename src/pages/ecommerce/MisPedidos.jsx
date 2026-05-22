import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import {
  obtenerMisComprasEcommerce,
  obtenerMisPedidosEcommerce
} from "../../services/ecommerce.service";
import { useAuth } from "../../auth/AuthContext";

const MisPedidos = () => {
  const { user } = useAuth();

  const [compras, setCompras] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [comprasRes, pedidosRes] = await Promise.all([
        obtenerMisComprasEcommerce(),
        obtenerMisPedidosEcommerce()
      ]);

      if (comprasRes.ok) setCompras(comprasRes.data || []);
      if (pedidosRes.ok) setPedidos(pedidosRes.data || []);
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo cargar su historial",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      cargarDatos();
    } else {
      setLoading(false);
    }
  }, [user]);

  const claseEstado = (estado) => {
    if (["completada", "entregado"].includes(estado)) {
      return "store-status store-status-ok";
    }

    if (["anulada", "rechazado", "cancelado"].includes(estado)) {
      return "store-status store-status-bad";
    }

    return "store-status store-status-pending";
  };

  if (!user) {
    return (
      <div className="store-page">
        <section className="empty-store">
          <h3>Inicia sesión</h3>
          <p>Debes iniciar sesión para ver tus compras y pedidos.</p>
          <Link className="hero-primary" to="/tienda/login">
            Ingresar
          </Link>
        </section>
      </div>
    );
  }

  if (loading) {
    return <p className="store-loading">Cargando tus pedidos...</p>;
  }

  return (
    <div className="store-page">
      <section className="store-section-header">
        <div>
          <h2>Mis compras y pedidos</h2>
          <p>Consulta el estado de tus solicitudes online.</p>
        </div>

        <Link className="hero-secondary" to="/tienda">
          Volver a tienda
        </Link>
      </section>

      <section className="client-history-grid">
        <div className="client-history-panel">
          <h3>Mis compras</h3>

          {compras.length > 0 ? (
            <div className="client-history-list">
              {compras.map((compra) => (
                <article className="client-history-card" key={compra.id_venta}>
                  <div>
                    <h4>Venta #{compra.id_venta}</h4>
                    <p>{compra.fecha_venta}</p>
                    <small>{compra.metodo_pago}</small>
                  </div>

                  <div>
                    <strong>S/ {Number(compra.total || 0).toFixed(2)}</strong>
                    <span className={claseEstado(compra.estado_venta)}>
                      {compra.estado_venta}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p>No tienes compras registradas.</p>
          )}
        </div>

        <div className="client-history-panel">
          <h3>Mis pedidos</h3>

          {pedidos.length > 0 ? (
            <div className="client-history-list">
              {pedidos.map((pedido) => (
                <article className="client-history-card" key={pedido.id_pedido}>
                  <div>
                    <h4>Pedido #{pedido.id_pedido}</h4>
                    <p>{pedido.fecha_pedido}</p>
                    <small>{pedido.tipo_entrega}</small>
                  </div>

                  <div>
                    <strong>S/ {Number(pedido.total || 0).toFixed(2)}</strong>
                    <span className={claseEstado(pedido.estado_pedido)}>
                      {pedido.estado_pedido}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p>Aún no tienes pedidos generados.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default MisPedidos;