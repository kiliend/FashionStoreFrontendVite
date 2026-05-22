import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { validarCarritoEcommerce } from "../../services/ecommerce.service";
import { getImageUrl } from "../../utils/imageUrl";

const CART_KEY = "fashionstore_cart";

const Carrito = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [validando, setValidando] = useState(false);
  const [resumenBackend, setResumenBackend] = useState(null);

  const cargarCarrito = () => {
    const carrito = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    setItems(carrito);
  };

  useEffect(() => {
    cargarCarrito();
  }, []);

  const guardarCarrito = (nuevoCarrito) => {
    localStorage.setItem(CART_KEY, JSON.stringify(nuevoCarrito));
    setItems(nuevoCarrito);
    window.dispatchEvent(new Event("cart-updated"));
  };

  const aumentarCantidad = (id_variante) => {
    const nuevoCarrito = items.map((item) => {
      if (Number(item.id_variante) !== Number(id_variante)) return item;

      if (Number(item.cantidad) >= Number(item.stock_actual)) {
        Swal.fire(
          "Stock insuficiente",
          "No puedes superar el stock disponible.",
          "warning"
        );
        return item;
      }

      return {
        ...item,
        cantidad: Number(item.cantidad) + 1
      };
    });

    guardarCarrito(nuevoCarrito);
  };

  const disminuirCantidad = (id_variante) => {
    const nuevoCarrito = items.map((item) => {
      if (Number(item.id_variante) !== Number(id_variante)) return item;

      return {
        ...item,
        cantidad: Math.max(1, Number(item.cantidad) - 1)
      };
    });

    guardarCarrito(nuevoCarrito);
  };

  const cambiarCantidad = (id_variante, value) => {
    const cantidad = Number(value);

    const nuevoCarrito = items.map((item) => {
      if (Number(item.id_variante) !== Number(id_variante)) return item;

      if (cantidad > Number(item.stock_actual)) {
        Swal.fire(
          "Stock insuficiente",
          "La cantidad supera el stock disponible.",
          "warning"
        );

        return {
          ...item,
          cantidad: Number(item.stock_actual)
        };
      }

      return {
        ...item,
        cantidad: cantidad > 0 ? cantidad : 1
      };
    });

    guardarCarrito(nuevoCarrito);
  };

  const eliminarItem = (id_variante) => {
    const nuevoCarrito = items.filter(
      (item) => Number(item.id_variante) !== Number(id_variante)
    );

    guardarCarrito(nuevoCarrito);
  };

  const limpiarCarrito = () => {
    localStorage.removeItem(CART_KEY);
    setItems([]);
    setResumenBackend(null);
    window.dispatchEvent(new Event("cart-updated"));
  };

  const totalLocal = useMemo(() => {
    return items.reduce((acc, item) => {
      return acc + Number(item.precio_unitario || 0) * Number(item.cantidad || 0);
    }, 0);
  }, [items]);

  const validarCarrito = async () => {
    if (items.length === 0) {
      Swal.fire("Carrito vacío", "Agrega productos antes de continuar.", "warning");
      return;
    }

    try {
      setValidando(true);

      const payload = items.map((item) => ({
        id_variante: item.id_variante,
        cantidad: item.cantidad
      }));

      const response = await validarCarritoEcommerce(payload);

      if (response.ok) {
        setResumenBackend(response.data);

        Swal.fire({
          icon: "success",
          title: "Carrito validado",
          text: "Los productos y stock fueron validados correctamente.",
          timer: 1200,
          showConfirmButton: false
        });

        navigate("/tienda/checkout");
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo validar el carrito",
        "error"
      );
    } finally {
      setValidando(false);
    }
  };

  return (
    <div className="store-page">
      <section className="store-section-header">
        <div>
          <h2>Carrito de compras</h2>
          <p>Revise los productos antes de confirmar su solicitud.</p>
        </div>

        <Link className="hero-secondary" to="/tienda">
          Seguir comprando
        </Link>
      </section>

      {items.length > 0 ? (
        <section className="cart-layout">
          <div className="cart-list">
            {items.map((item) => (
              <article className="cart-store-item" key={item.id_variante}>
                <div className="cart-store-image">
                    {item.imagen_url ? (
                    <img
                        src={getImageUrl(item.imagen_url)}
                        alt={item.nombre_producto}
                    />
                    ) : (
                    <span>👕</span>
                    )}
                </div>

                <div className="cart-store-info">
                  <h3>{item.nombre_producto}</h3>
                  <p>
                    {item.nombre_color} · {item.nombre_talla}
                  </p>
                  <small>SKU: {item.sku}</small>

                  <strong>S/ {Number(item.precio_unitario).toFixed(2)}</strong>
                </div>

                <div className="cart-store-controls">
                  <button onClick={() => disminuirCantidad(item.id_variante)}>
                    -
                  </button>

                  <input
                    type="number"
                    min="1"
                    max={item.stock_actual}
                    value={item.cantidad}
                    onChange={(e) =>
                      cambiarCantidad(item.id_variante, e.target.value)
                    }
                  />

                  <button onClick={() => aumentarCantidad(item.id_variante)}>
                    +
                  </button>
                </div>

                <div className="cart-store-total">
                  <strong>
                    S/{" "}
                    {(
                      Number(item.precio_unitario) * Number(item.cantidad)
                    ).toFixed(2)}
                  </strong>

                  <button
                    type="button"
                    className="cart-remove"
                    onClick={() => eliminarItem(item.id_variante)}
                  >
                    Quitar
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className="cart-summary-store">
            <h3>Resumen</h3>

            <div>
              <span>Total referencial</span>
              <strong>S/ {totalLocal.toFixed(2)}</strong>
            </div>

            <p>
              El total final será validado con el stock y precio actual antes de
              confirmar la compra.
            </p>

            <button
              type="button"
              className="add-cart-button"
              onClick={validarCarrito}
              disabled={validando}
            >
              {validando ? "Validando..." : "Continuar al checkout"}
            </button>

            <button
              type="button"
              className="clear-cart-button"
              onClick={limpiarCarrito}
            >
              Vaciar carrito
            </button>
          </aside>
        </section>
      ) : (
        <section className="empty-store">
          <h3>Tu carrito está vacío</h3>
          <p>Agrega productos desde el catálogo para iniciar tu compra.</p>
          <Link className="hero-primary" to="/tienda">
            Ver catálogo
          </Link>
        </section>
      )}
    </div>
  );
};

export default Carrito;