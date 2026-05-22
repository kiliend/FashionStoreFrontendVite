import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { listarProductosEcommerce } from "../../services/ecommerce.service";
import { getImageUrl } from "../../utils/imageUrl";

const CART_KEY = "fashionstore_cart";

const Tienda = () => {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [loading, setLoading] = useState(true);

  const cargarProductos = async () => {
    try {
      setLoading(true);

      const response = await listarProductosEcommerce();

      if (response.ok) {
        setProductos(response.data || []);
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo cargar la tienda",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const categorias = useMemo(() => {
    return [
      ...new Set(
        productos.map((producto) => producto.nombre_categoria).filter(Boolean)
      )
    ];
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return productos
      .filter((producto) => {
        if (!categoria) return true;
        return producto.nombre_categoria === categoria;
      })
      .filter((producto) => {
        if (!texto) return true;

        return (
          String(producto.nombre_producto || "").toLowerCase().includes(texto) ||
          String(producto.descripcion || "").toLowerCase().includes(texto) ||
          String(producto.nombre_categoria || "").toLowerCase().includes(texto) ||
          String(producto.sku || "").toLowerCase().includes(texto)
        );
      });
  }, [productos, busqueda, categoria]);

  const agregarAlCarrito = (producto) => {
    if (Number(producto.stock_actual || 0) <= 0) {
      Swal.fire("Sin stock", "Este producto no tiene stock disponible.", "warning");
      return;
    }

    const carritoActual = JSON.parse(localStorage.getItem(CART_KEY) || "[]");

    const existe = carritoActual.find(
      (item) => Number(item.id_variante) === Number(producto.id_variante)
    );

    let nuevoCarrito;

    if (existe) {
      if (Number(existe.cantidad) >= Number(producto.stock_actual)) {
        Swal.fire(
          "Stock insuficiente",
          "No puedes agregar más unidades que el stock disponible.",
          "warning"
        );
        return;
      }

      nuevoCarrito = carritoActual.map((item) => {
        if (Number(item.id_variante) !== Number(producto.id_variante)) {
          return item;
        }

        return {
          ...item,
          cantidad: Number(item.cantidad) + 1
        };
      });
    } else {
      nuevoCarrito = [
        ...carritoActual,
        {
          id_producto: producto.id_producto,
          id_variante: producto.id_variante,
          nombre_producto: producto.nombre_producto,
          nombre_categoria: producto.nombre_categoria,
          nombre_color: producto.nombre_color,
          nombre_talla: producto.nombre_talla,
          sku: producto.sku,
          imagen_url: producto.imagen_url,
          precio_unitario: Number(producto.precio_venta || 0),
          stock_actual: Number(producto.stock_actual || 0),
          cantidad: 1
        }
      ];
    }

    localStorage.setItem(CART_KEY, JSON.stringify(nuevoCarrito));
    window.dispatchEvent(new Event("cart-updated"));

    Swal.fire({
      icon: "success",
      title: "Producto agregado",
      text: "El producto fue agregado al carrito.",
      timer: 1200,
      showConfirmButton: false
    });
  };

  if (loading) {
    return <p className="store-loading">Cargando tienda...</p>;
  }

  return (
    <div className="store-page">
      <section className="store-hero">
        <div className="store-hero-content">
          <span className="hero-tag">Nueva colección</span>

          <h2>Moda pensada para tu estilo diario</h2>

          <p>
            Descubre prendas seleccionadas con colores cálidos, diseños cómodos
            y opciones para cada ocasión.
          </p>

            <div className="hero-actions">
              <a
                href="#catalogo"
                className="hero-primary"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("catalogo")?.scrollIntoView({
                    behavior: "smooth"
                  });
                }}
              >
                Ver catálogo
              </a>

              <a
                href="#catalogo"
                className="hero-secondary"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("catalogo")?.scrollIntoView({
                    behavior: "smooth"
                  });
                }}
              >
                Comprar ahora
              </a>
            </div>
        </div>

        <div className="store-hero-card">
          <div className="hero-card-circle">🌸</div>
          <h3>FashionStore</h3>
          <p>Compra online y recibe tu pedido por delivery o recojo en tienda.</p>
        </div>
      </section>

      <section className="store-filters" id="catalogo">
        <div>
          <h2>Catálogo de productos</h2>
          <p>{productosFiltrados.length} productos disponibles</p>
        </div>

        <div className="store-filter-actions">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto..."
          />

          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="">Todas las categorías</option>

            {categorias.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </section>

      {productosFiltrados.length > 0 ? (
        <section className="store-grid">
          {productosFiltrados.map((producto) => (
            <article
              className="store-product-card"
              key={`${producto.id_producto}-${producto.id_variante}`}
            >
              <div className="product-image-box">
                  {producto.imagen_url ? (
                    <img
                      src={getImageUrl(producto.imagen_url)}
                      alt={producto.nombre_producto}
                    />
                  ) : (
                    <div className="product-placeholder">👕</div>
                  )}

                {Number(producto.stock_actual) <= 5 && (
                  <span className="stock-label">Últimas unidades</span>
                )}
              </div>

              <div className="product-info">
                <span className="product-category">
                  {producto.nombre_categoria || "Moda"}
                </span>

                <h3>{producto.nombre_producto}</h3>

                <p>
                  {producto.nombre_color || "Color"} ·{" "}
                  {producto.nombre_talla || "Talla"}
                </p>

                <small>SKU: {producto.sku || "-"}</small>

                <div className="product-bottom">
                  <strong>
                    S/ {Number(producto.precio_venta || 0).toFixed(2)}
                  </strong>
                  <span>Stock: {producto.stock_actual}</span>
                </div>

                <button
                  type="button"
                  className="add-cart-button"
                  disabled={Number(producto.stock_actual || 0) <= 0}
                  onClick={() => agregarAlCarrito(producto)}
                >
                  {Number(producto.stock_actual || 0) <= 0
                    ? "Sin stock"
                    : "Agregar al carrito"}
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="empty-store">
          <h3>No se encontraron productos</h3>
          <p>Intenta cambiar la búsqueda o seleccionar otra categoría.</p>
        </section>
      )}
    </div>
  );
};

export default Tienda;