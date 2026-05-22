import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

import { useAuth } from "../../auth/AuthContext";
import {
  obtenerMiCuentaEcommerce,
  actualizarMiCuentaEcommerce
} from "../../services/ecommerce.service";

const initialForm = {
  nombres: "",
  apellidos: "",
  tipo_documento: "DNI",
  numero_documento: "",
  correo: "",
  telefono: "",
  direccion: ""
};

const MiCuenta = () => {
  const { user } = useAuth();

  const [cliente, setCliente] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const rolUsuario = String(user?.rol || user?.nombre_rol || "").toLowerCase();

  const esCliente =
    rolUsuario === "cliente" || rolUsuario === "cliente_ecommerce";

  const cargarMiCuenta = async () => {
    if (!user || !esCliente) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await obtenerMiCuentaEcommerce();

      if (response.ok) {
        const data = response.data;

        setCliente(data);

        setForm({
          nombres: data.nombres || "",
          apellidos: data.apellidos || "",
          tipo_documento: data.tipo_documento || "DNI",
          numero_documento: data.numero_documento || "",
          correo: data.correo || "",
          telefono: data.telefono || "",
          direccion: data.direccion || ""
        });
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo cargar la información de la cuenta",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMiCuenta();
  }, [user]);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  };

  const validarFormulario = () => {
    if (!form.nombres.trim()) {
      Swal.fire("Validación", "Los nombres son obligatorios", "warning");
      return false;
    }

    if (!form.numero_documento.trim()) {
      Swal.fire("Validación", "El número de documento es obligatorio", "warning");
      return false;
    }

    if (
      form.tipo_documento === "DNI" &&
      form.numero_documento.trim().length !== 8
    ) {
      Swal.fire("Validación", "El DNI debe tener 8 dígitos", "warning");
      return false;
    }

    if (!form.correo.trim()) {
      Swal.fire("Validación", "El correo es obligatorio", "warning");
      return false;
    }

    const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!correoRegex.test(form.correo.trim())) {
      Swal.fire("Validación", "El correo no tiene un formato válido", "warning");
      return false;
    }

    return true;
  };

  const guardarCambios = async (event) => {
    event.preventDefault();

    if (!validarFormulario()) return;

    const payload = {
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim() || null,
      tipo_documento: form.tipo_documento,
      numero_documento: form.numero_documento.trim(),
      correo: form.correo.trim(),
      telefono: form.telefono.trim() || null,
      direccion: form.direccion.trim() || null
    };

    try {
      setGuardando(true);

      const response = await actualizarMiCuentaEcommerce(payload);

      if (response.ok) {
        Swal.fire(
          "Datos actualizados",
          "Tu información personal fue actualizada correctamente.",
          "success"
        );

        setEditando(false);
        cargarMiCuenta();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo actualizar la información",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  const cancelarEdicion = () => {
    if (cliente) {
      setForm({
        nombres: cliente.nombres || "",
        apellidos: cliente.apellidos || "",
        tipo_documento: cliente.tipo_documento || "DNI",
        numero_documento: cliente.numero_documento || "",
        correo: cliente.correo || "",
        telefono: cliente.telefono || "",
        direccion: cliente.direccion || ""
      });
    }

    setEditando(false);
  };

  const nombreCompleto = () => {
    return (
      `${form.nombres || ""} ${form.apellidos || ""}`.trim() ||
      user?.usuario ||
      "Cliente"
    );
  };

  if (!user) {
    return (
      <div className="store-page">
        <section className="empty-store">
          <h3>Acceso de cliente</h3>
          <p>
            Para revisar tus datos personales, compras o pedidos, primero debes
            iniciar sesión como cliente.
          </p>

          <Link className="hero-primary" to="/tienda/login">
            Iniciar sesión
          </Link>

          <Link className="hero-secondary" to="/tienda">
            Volver a la tienda
          </Link>
        </section>
      </div>
    );
  }

  if (!esCliente) {
    return (
      <div className="store-page">
        <section className="empty-store">
          <h3>Sesión administrativa detectada</h3>
          <p>
            Actualmente estás usando una cuenta del sistema administrativo. Para
            comprar como cliente, usa una cuenta de cliente e-commerce.
          </p>

          <Link className="hero-primary" to="/dashboard">
            Ir al panel administrativo
          </Link>

          <Link className="hero-secondary" to="/tienda">
            Volver a la tienda
          </Link>
        </section>
      </div>
    );
  }

  if (loading) {
    return <p className="store-loading">Cargando mi cuenta...</p>;
  }

  return (
    <div className="store-page">
      <section className="store-section-header">
        <div>
          <h2>Mi cuenta</h2>
          <p>Consulta y actualiza tu información personal de cliente.</p>
        </div>

        <div className="store-header-actions">
          <Link className="hero-secondary" to="/tienda/mis-pedidos">
            Ver mis pedidos
          </Link>

          {!editando && (
            <button
              type="button"
              className="hero-primary"
              onClick={() => setEditando(true)}
            >
              Editar datos
            </button>
          )}
        </div>
      </section>

      <section className="client-account-panel">
        <div className="client-account-avatar">
          {(form.nombres || user.usuario || "C").charAt(0).toUpperCase()}
        </div>

        <div className="client-account-info">
          <h3>{nombreCompleto()}</h3>

          <p>
            <strong>Usuario:</strong> {user.usuario}
          </p>

          <p>
            <strong>Documento:</strong>{" "}
            {form.tipo_documento} {form.numero_documento || "No registrado"}
          </p>

          <p>
            <strong>Correo:</strong> {form.correo || "No registrado"}
          </p>

          <p>
            <strong>Teléfono:</strong> {form.telefono || "No registrado"}
          </p>

          <p>
            <strong>Dirección:</strong> {form.direccion || "No registrada"}
          </p>
        </div>
      </section>

      {editando && (
        <section className="client-account-edit-panel">
          <h3>Editar información personal</h3>

          <form className="client-login-form" onSubmit={guardarCambios}>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Nombres</label>
                <input
                  type="text"
                  name="nombres"
                  value={form.nombres}
                  onChange={handleChange}
                  placeholder="Ingrese sus nombres"
                />
              </div>

              <div className="form-group">
                <label>Apellidos</label>
                <input
                  type="text"
                  name="apellidos"
                  value={form.apellidos}
                  onChange={handleChange}
                  placeholder="Ingrese sus apellidos"
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Tipo de documento</label>
                <select
                  name="tipo_documento"
                  value={form.tipo_documento}
                  onChange={handleChange}
                >
                  <option value="DNI">DNI</option>
                  <option value="CE">Carnet de extranjería</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>
              </div>

              <div className="form-group">
                <label>Número de documento</label>
                <input
                  type="text"
                  name="numero_documento"
                  value={form.numero_documento}
                  onChange={handleChange}
                  placeholder="Ingrese su documento"
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Correo</label>
                <input
                  type="email"
                  name="correo"
                  value={form.correo}
                  onChange={handleChange}
                  placeholder="correo@email.com"
                />
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="text"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  placeholder="999999999"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Dirección</label>
              <textarea
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                placeholder="Dirección principal para delivery"
              />
            </div>

            <div className="client-account-actions">
              <button
                type="button"
                className="hero-secondary"
                onClick={cancelarEdicion}
                disabled={guardando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="add-cart-button"
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
};

export default MiCuenta;