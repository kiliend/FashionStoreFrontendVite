import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  validarCarritoEcommerce,
  checkoutEcommerce
} from "../../services/ecommerce.service";
import { useAuth } from "../../auth/AuthContext";

const CART_KEY = "fashionstore_cart";

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);

  const [form, setForm] = useState({
    tipo_entrega: "delivery",
    direccion_entrega: "",
    referencia_entrega: ""
  });

  const cargarYValidar = async () => {
    try {
      setLoading(true);

      const carrito = JSON.parse(localStorage.getItem(CART_KEY) || "[]");

      if (carrito.length === 0) {
        setItems([]);
        return;
      }

      const payload = carrito.map((item) => ({
        id_variante: item.id_variante,
        cantidad: item.cantidad
      }));

      const response = await validarCarritoEcommerce(payload);

      if (response.ok) {
        setItems(response.data.items || []);
        setResumen(response.data.resumen || null);
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo validar el checkout",
        "error"
      );

      navigate("/tienda/carrito");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarYValidar();
  }, []);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  };

  const validarFormulario = () => {
    if (!user) {
      Swal.fire(
        "Inicie sesión",
        "Debe iniciar sesión como cliente para confirmar la compra.",
        "warning"
      );
      navigate("/login");
      return false;
    }

    const rol = user?.rol || user?.nombre_rol;

    if (!["cliente", "cliente_ecommerce"].includes(rol)) {
      Swal.fire(
        "Rol no permitido",
        "Solo un cliente del e-commerce puede confirmar compras desde la tienda.",
        "warning"
      );
      return false;
    }

    if (items.length === 0) {
      Swal.fire("Carrito vacío", "No hay productos para comprar.", "warning");
      return false;
    }

    if (
      form.tipo_entrega === "delivery" &&
      !form.direccion_entrega.trim()
    ) {
      Swal.fire(
        "Validación",
        "Ingrese una dirección de entrega para delivery.",
        "warning"
      );
      return false;
    }

    return true;
  };

  const confirmarCompra = async (event) => {
    event.preventDefault();

    if (!validarFormulario()) return;

    const confirmacion = await Swal.fire({
      title: "¿Confirmar solicitud de compra?",
      text: `Total: S/ ${Number(resumen?.total || 0).toFixed(2)}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, confirmar",
      cancelButtonText: "Cancelar"
    });

    if (!confirmacion.isConfirmed) return;

    const payload = {
      tipo_entrega: form.tipo_entrega,
      direccion_entrega:
        form.tipo_entrega === "delivery"
          ? form.direccion_entrega.trim()
          : null,
      referencia_entrega: form.referencia_entrega.trim() || null,
      items: items.map((item) => ({
        id_variante: item.id_variante,
        cantidad: item.cantidad
      }))
    };

    try {
      setProcesando(true);

      const response = await checkoutEcommerce(payload);

      if (response.ok) {
        localStorage.removeItem(CART_KEY);
        window.dispatchEvent(new Event("cart-updated"));

        await Swal.fire(
          "Compra registrada",
          "Tu solicitud de compra fue registrada correctamente. Quedará pendiente de confirmación.",
          "success"
        );

        navigate("/tienda/mis-pedidos");
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo confirmar la compra",
        "error"
      );
    } finally {
      setProcesando(false);
    }
  };

  if (loading) {
    return <p className="store-loading">Validando checkout...</p>;
  }

  return (
    <div className="store-page">
      <section className="store-section-header">
        <div>
          <h2>Checkout</h2>
          <p>Confirme la entrega y registre su solicitud de compra.</p>
        </div>

        <Link className="hero-secondary" to="/tienda/carrito">
          Volver al carrito
        </Link>
      </section>

      {items.length > 0 ? (
        <form className="checkout-layout" onSubmit={confirmarCompra}>
          <section className="checkout-panel">
            <h3>Datos de entrega</h3>

            <div className="form-group">
              <label>Tipo de entrega</label>
              <select
                name="tipo_entrega"
                value={form.tipo_entrega}
                onChange={handleChange}
              >
                <option value="delivery">Delivery</option>
                <option value="recojo_tienda">Recojo en tienda</option>
              </select>
            </div>

            {form.tipo_entrega === "delivery" && (
              <>
                <div className="form-group">
                  <label>Dirección de entrega</label>
                  <textarea
                    name="direccion_entrega"
                    value={form.direccion_entrega}
                    onChange={handleChange}
                    placeholder="Ej. Av. Principal 123"
                  />
                </div>

                <div className="form-group">
                  <label>Referencia</label>
                  <textarea
                    name="referencia_entrega"
                    value={form.referencia_entrega}
                    onChange={handleChange}
                    placeholder="Ej. Frente al parque, segundo piso..."
                  />
                </div>
              </>
            )}

            {form.tipo_entrega === "recojo_tienda" && (
              <div className="checkout-info-box">
                El pedido será preparado para recojo en tienda. La tienda
                confirmará la disponibilidad antes de la entrega.
              </div>
            )}
          </section>

          <aside className="checkout-summary">
            <h3>Resumen de compra</h3>

            <div className="checkout-items">
              {items.map((item) => (
                <div className="checkout-item" key={item.id_variante}>
                  <span>
                    {item.nombre_producto} x {item.cantidad}
                  </span>
                  <strong>S/ {Number(item.subtotal || 0).toFixed(2)}</strong>
                </div>
              ))}
            </div>

            <div className="checkout-total-box">
              <div>
                <span>Subtotal</span>
                <strong>S/ {Number(resumen?.subtotal || 0).toFixed(2)}</strong>
              </div>

              <div>
                <span>IGV</span>
                <strong>S/ {Number(resumen?.igv || 0).toFixed(2)}</strong>
              </div>

              <div className="checkout-final-total">
                <span>Total</span>
                <strong>S/ {Number(resumen?.total || 0).toFixed(2)}</strong>
              </div>
            </div>

            <button
              type="submit"
              className="add-cart-button"
              disabled={procesando}
            >
              {procesando ? "Procesando..." : "Confirmar compra"}
            </button>
          </aside>
        </form>
      ) : (
        <section className="empty-store">
          <h3>No hay productos para confirmar</h3>
          <p>Agrega productos al carrito antes de continuar.</p>
          <Link className="hero-primary" to="/tienda">
            Ver catálogo
          </Link>
        </section>
      )}
    </div>
  );
};

export default Checkout;