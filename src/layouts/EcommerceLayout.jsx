import { Link, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";

const CART_KEY = "fashionstore_cart";

const EcommerceLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [cartCount, setCartCount] = useState(0);

  const actualizarContador = () => {
    const carrito = JSON.parse(localStorage.getItem(CART_KEY) || "[]");

    const totalItems = carrito.reduce(
      (acc, item) => acc + Number(item.cantidad || 0),
      0
    );

    setCartCount(totalItems);
  };

  useEffect(() => {
    actualizarContador();

    window.addEventListener("storage", actualizarContador);
    window.addEventListener("cart-updated", actualizarContador);

    return () => {
      window.removeEventListener("storage", actualizarContador);
      window.removeEventListener("cart-updated", actualizarContador);
    };
  }, []);

  const irCatalogo = (event) => {
    event.preventDefault();

    if (window.location.pathname !== "/tienda") {
      navigate("/tienda");

      setTimeout(() => {
        document.getElementById("catalogo")?.scrollIntoView({
          behavior: "smooth"
        });
      }, 150);

      return;
    }

    document.getElementById("catalogo")?.scrollIntoView({
      behavior: "smooth"
    });
  };

  const cerrarSesion = () => {
    logout();
    navigate("/tienda");
  };

  const rolUsuario = user?.rol || user?.nombre_rol;

  const esCliente =
    rolUsuario === "cliente" || rolUsuario === "cliente_ecommerce";

  return (
    <div className="ecommerce-layout">
      <header className="ecommerce-header">
        <div className="ecommerce-brand" onClick={() => navigate("/tienda")}>
          <div className="brand-mark">FS</div>

          <div>
            <h1>FashionStore</h1>
            <span>Moda cálida, simple y moderna</span>
          </div>
        </div>

        <nav className="ecommerce-nav">
          <Link to="/tienda">Inicio</Link>

          <a href="#catalogo" onClick={irCatalogo}>
            Catálogo
          </a>

          <Link to="/tienda/mis-pedidos">Mis pedidos</Link>
        </nav>

        <div className="ecommerce-actions">
          <Link className="cart-button" to="/tienda/carrito">
            🛒 Carrito
            {cartCount > 0 && <span>{cartCount}</span>}
          </Link>

          {user && esCliente ? (
            <div className="client-session-box">
              <button
                type="button"
                className="client-profile-button"
                onClick={() => navigate("/tienda/mi-cuenta")}
              >
                Hola, {user.nombres || user.usuario}
              </button>

              <button type="button" onClick={cerrarSesion}>
                Salir
              </button>
            </div>
          ) : user && !esCliente ? (
            <div className="client-session-box">
              <small>{user.usuario}</small>

              <button type="button" onClick={() => navigate("/dashboard")}>
                Panel
              </button>
            </div>
          ) : (
            <Link className="login-client-button" to="/tienda/login">
              Ingresar
            </Link>
          )}
        </div>
      </header>

      <main className="ecommerce-main">
        <Outlet />
      </main>

      <footer className="ecommerce-footer">
        <strong>FashionStore</strong>
        <span>© 2026 - Tienda online</span>
      </footer>
    </div>
  );
};

export default EcommerceLayout;