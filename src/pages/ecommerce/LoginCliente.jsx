import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { useAuth } from "../../auth/AuthContext";
import { registrarClienteEcommerce } from "../../services/ecommerce.service";

const initialLogin = {
  usuario: "",
  password: ""
};

const initialRegistro = {
  nombres: "",
  apellidos: "",
  tipo_documento: "DNI",
  numero_documento: "",
  usuario: "",
  password: "",
  confirmar_password: "",
  correo: "",
  telefono: "",
  direccion: ""
};

const LoginCliente = () => {
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const [modo, setModo] = useState("login");
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [registroForm, setRegistroForm] = useState(initialRegistro);
  const [loading, setLoading] = useState(false);

  const handleLoginChange = (event) => {
    setLoginForm({
      ...loginForm,
      [event.target.name]: event.target.value
    });
  };

  const handleRegistroChange = (event) => {
    setRegistroForm({
      ...registroForm,
      [event.target.name]: event.target.value
    });
  };

  const obtenerRolUsuario = (usuarioLogueado) => {
    return String(
      usuarioLogueado?.rol || usuarioLogueado?.nombre_rol || ""
    )
      .trim()
      .toLowerCase();
  };

  const esRolCliente = (rol) => {
    return rol === "cliente" || rol === "cliente_ecommerce";
  };

  const iniciarSesion = async (event) => {
    event.preventDefault();

    if (!loginForm.usuario.trim()) {
      Swal.fire("Validación", "Ingrese su usuario", "warning");
      return;
    }

    if (!loginForm.password.trim()) {
      Swal.fire("Validación", "Ingrese su contraseña", "warning");
      return;
    }

    try {
      setLoading(true);

      const usuarioLogueado = await login({
        usuario: loginForm.usuario.trim(),
        password: loginForm.password
      });

      const rol = obtenerRolUsuario(usuarioLogueado);

      if (!esRolCliente(rol)) {
        logout();

        await Swal.fire(
          "Acceso no permitido",
          "Esta cuenta pertenece al sistema administrativo. Use el acceso del sistema.",
          "warning"
        );

        navigate("/login");
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Bienvenido",
        text: "Sesión iniciada correctamente.",
        timer: 1200,
        showConfirmButton: false
      });

      navigate("/tienda");
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message ||
          error.message ||
          "No se pudo iniciar sesión",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const validarRegistro = () => {
    if (!registroForm.nombres.trim()) {
      Swal.fire("Validación", "Ingrese sus nombres", "warning");
      return false;
    }

    if (!registroForm.numero_documento.trim()) {
      Swal.fire("Validación", "Ingrese su número de documento", "warning");
      return false;
    }

    if (
      registroForm.tipo_documento === "DNI" &&
      registroForm.numero_documento.trim().length !== 8
    ) {
      Swal.fire("Validación", "El DNI debe tener 8 dígitos", "warning");
      return false;
    }

    if (!registroForm.usuario.trim()) {
      Swal.fire("Validación", "Ingrese un usuario", "warning");
      return false;
    }

    if (!registroForm.correo.trim()) {
      Swal.fire("Validación", "Ingrese un correo", "warning");
      return false;
    }

    const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!correoRegex.test(registroForm.correo.trim())) {
      Swal.fire("Validación", "El correo no tiene un formato válido", "warning");
      return false;
    }

    if (!registroForm.password || registroForm.password.length < 6) {
      Swal.fire(
        "Validación",
        "La contraseña debe tener al menos 6 caracteres",
        "warning"
      );
      return false;
    }

    if (registroForm.password !== registroForm.confirmar_password) {
      Swal.fire("Validación", "Las contraseñas no coinciden", "warning");
      return false;
    }

    return true;
  };

  const registrarCliente = async (event) => {
    event.preventDefault();

    if (!validarRegistro()) return;

    const payload = {
      nombres: registroForm.nombres.trim(),
      apellidos: registroForm.apellidos.trim() || null,
      tipo_documento: registroForm.tipo_documento,
      numero_documento: registroForm.numero_documento.trim(),
      usuario: registroForm.usuario.trim(),
      password: registroForm.password,
      correo: registroForm.correo.trim(),
      telefono: registroForm.telefono.trim() || null,
      direccion: registroForm.direccion.trim() || null
    };

    try {
      setLoading(true);

      const response = await registrarClienteEcommerce(payload);

      if (response.ok) {
        await Swal.fire(
          "Registro exitoso",
          "Tu cuenta fue creada correctamente. Ahora puedes iniciar sesión.",
          "success"
        );

        setLoginForm({
          usuario: registroForm.usuario,
          password: registroForm.password
        });

        setRegistroForm(initialRegistro);
        setModo("login");
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo registrar el cliente",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="store-page">
      <section className="client-login-wrapper">
        <div className="client-login-hero">
          <span className="hero-tag">FashionStore</span>

          <h2>Acceso para clientes</h2>

          <p>
            Inicia sesión o crea una cuenta para comprar online, revisar tus
            pedidos y gestionar tus datos personales.
          </p>

          <Link className="hero-secondary" to="/tienda">
            Volver a la tienda
          </Link>
        </div>

        <div className="client-login-card">
          <div className="client-login-tabs">
            <button
              type="button"
              className={modo === "login" ? "active" : ""}
              onClick={() => setModo("login")}
            >
              Iniciar sesión
            </button>

            <button
              type="button"
              className={modo === "registro" ? "active" : ""}
              onClick={() => setModo("registro")}
            >
              Crear cuenta
            </button>
          </div>

          {modo === "login" ? (
            <form className="client-login-form" onSubmit={iniciarSesion}>
              <div className="form-group">
                <label>Usuario</label>
                <input
                  type="text"
                  name="usuario"
                  value={loginForm.usuario}
                  onChange={handleLoginChange}
                  placeholder="Ingrese su usuario"
                />
              </div>

              <div className="form-group">
                <label>Contraseña</label>
                <input
                  type="password"
                  name="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  placeholder="Ingrese su contraseña"
                />
              </div>

              <button
                type="submit"
                className="add-cart-button"
                disabled={loading}
              >
                {loading ? "Ingresando..." : "Ingresar"}
              </button>
            </form>
          ) : (
            <form className="client-login-form" onSubmit={registrarCliente}>
              <div className="form-group">
                <label>Nombres</label>
                <input
                  type="text"
                  name="nombres"
                  value={registroForm.nombres}
                  onChange={handleRegistroChange}
                  placeholder="Ingrese sus nombres"
                />
              </div>

              <div className="form-group">
                <label>Apellidos</label>
                <input
                  type="text"
                  name="apellidos"
                  value={registroForm.apellidos}
                  onChange={handleRegistroChange}
                  placeholder="Ingrese sus apellidos"
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Tipo documento</label>
                  <select
                    name="tipo_documento"
                    value={registroForm.tipo_documento}
                    onChange={handleRegistroChange}
                  >
                    <option value="DNI">DNI</option>
                    <option value="CE">Carnet de extranjería</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>N° documento</label>
                  <input
                    type="text"
                    name="numero_documento"
                    value={registroForm.numero_documento}
                    onChange={handleRegistroChange}
                    placeholder="Documento"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Usuario</label>
                <input
                  type="text"
                  name="usuario"
                  value={registroForm.usuario}
                  onChange={handleRegistroChange}
                  placeholder="Usuario de acceso"
                />
              </div>

              <div className="form-group">
                <label>Correo</label>
                <input
                  type="email"
                  name="correo"
                  value={registroForm.correo}
                  onChange={handleRegistroChange}
                  placeholder="correo@email.com"
                />
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="text"
                  name="telefono"
                  value={registroForm.telefono}
                  onChange={handleRegistroChange}
                  placeholder="999999999"
                />
              </div>

              <div className="form-group">
                <label>Dirección</label>
                <textarea
                  name="direccion"
                  value={registroForm.direccion}
                  onChange={handleRegistroChange}
                  placeholder="Dirección para delivery"
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Contraseña</label>
                  <input
                    type="password"
                    name="password"
                    value={registroForm.password}
                    onChange={handleRegistroChange}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div className="form-group">
                  <label>Confirmar contraseña</label>
                  <input
                    type="password"
                    name="confirmar_password"
                    value={registroForm.confirmar_password}
                    onChange={handleRegistroChange}
                    placeholder="Repita contraseña"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="add-cart-button"
                disabled={loading}
              >
                {loading ? "Registrando..." : "Crear cuenta"}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default LoginCliente;