import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import {
  listarClientes,
  crearCliente,
  actualizarCliente,
  eliminarCliente
} from "../services/clientes.service";

const initialForm = {
  tipo_documento: "DNI",
  numero_documento: "",
  nombres: "",
  apellidos: "",
  razon_social: "",
  correo: "",
  telefono: "",
  direccion: "",
  estado_cliente: "activo"
};

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const cargarClientes = async () => {
    try {
      setLoading(true);

      const response = await listarClientes();

      if (response.ok) {
        setClientes(response.data);
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudieron cargar los clientes",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const abrirCrear = () => {
    setEditId(null);
    setForm(initialForm);
    setPanelOpen(true);
  };

  const abrirEditar = (cliente) => {
    setEditId(cliente.id_cliente);

    setForm({
      tipo_documento: cliente.tipo_documento || "DNI",
      numero_documento: cliente.numero_documento || "",
      nombres: cliente.nombres || "",
      apellidos: cliente.apellidos || "",
      razon_social: cliente.razon_social || "",
      correo: cliente.correo || "",
      telefono: cliente.telefono || "",
      direccion: cliente.direccion || "",
      estado_cliente: cliente.estado_cliente || "activo"
    });

    setPanelOpen(true);
  };

  const cerrarPanel = () => {
    setPanelOpen(false);
    setEditId(null);
    setForm(initialForm);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm({
      ...form,
      [name]: value
    });
  };

  const validarFormulario = () => {
    if (!form.tipo_documento) {
      Swal.fire("Validación", "Seleccione el tipo de documento", "warning");
      return false;
    }

    if (!form.numero_documento.trim()) {
      Swal.fire("Validación", "Ingrese el número de documento", "warning");
      return false;
    }

    if (form.tipo_documento === "DNI" && form.numero_documento.trim().length !== 8) {
      Swal.fire("Validación", "El DNI debe tener 8 dígitos", "warning");
      return false;
    }

    if (form.tipo_documento === "RUC" && form.numero_documento.trim().length !== 11) {
      Swal.fire("Validación", "El RUC debe tener 11 dígitos", "warning");
      return false;
    }

    if (form.tipo_documento === "RUC") {
      if (!form.razon_social.trim()) {
        Swal.fire("Validación", "Para RUC debe ingresar razón social", "warning");
        return false;
      }
    } else {
      if (!form.nombres.trim()) {
        Swal.fire("Validación", "Ingrese los nombres del cliente", "warning");
        return false;
      }

      if (!form.apellidos.trim()) {
        Swal.fire("Validación", "Ingrese los apellidos del cliente", "warning");
        return false;
      }
    }

    if (form.correo.trim()) {
      const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!correoRegex.test(form.correo.trim())) {
        Swal.fire("Validación", "El correo no tiene un formato válido", "warning");
        return false;
      }
    }

    return true;
  };

  const guardarCliente = async (event) => {
    event.preventDefault();

    if (!validarFormulario()) return;

    const payload = {
      tipo_documento: form.tipo_documento,
      numero_documento: form.numero_documento.trim(),
      nombres: form.tipo_documento === "RUC" ? null : form.nombres.trim(),
      apellidos: form.tipo_documento === "RUC" ? null : form.apellidos.trim(),
      razon_social: form.tipo_documento === "RUC" ? form.razon_social.trim() : null,
      correo: form.correo.trim() || null,
      telefono: form.telefono.trim() || null,
      direccion: form.direccion.trim() || null,
      estado_cliente: form.estado_cliente
    };

    try {
      if (editId) {
        await actualizarCliente(editId, payload);
        Swal.fire("Actualizado", "Cliente actualizado correctamente", "success");
      } else {
        await crearCliente(payload);
        Swal.fire("Creado", "Cliente creado correctamente", "success");
      }

      cerrarPanel();
      cargarClientes();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo guardar el cliente",
        "error"
      );
    }
  };

  const confirmarEliminar = async (id) => {
    const confirmacion = await Swal.fire({
      title: "¿Eliminar cliente?",
      text: "El cliente será eliminado lógicamente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (!confirmacion.isConfirmed) return;

    try {
      await eliminarCliente(id);
      Swal.fire("Eliminado", "Cliente eliminado correctamente", "success");
      cargarClientes();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo eliminar el cliente",
        "error"
      );
    }
  };

  const obtenerNombreCliente = (cliente) => {
    if (cliente.razon_social) return cliente.razon_social;

    return `${cliente.nombres || ""} ${cliente.apellidos || ""}`.trim();
  };

  if (loading) {
    return <p>Cargando clientes...</p>;
  }

  return (
    <div className="clientes-page">
      <div className="page-header">
        <div>
          <h1>Clientes</h1>
          <p>Gestión de clientes para ventas y comprobantes.</p>
        </div>

        <button className="btn-primary" onClick={abrirCrear}>
          + Nuevo cliente
        </button>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Clientes registrados</h2>
            <p>{clientes.length} clientes encontrados</p>
          </div>

          <button className="btn-secondary" onClick={cargarClientes}>
            Actualizar
          </button>
        </div>

        {clientes.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Documento</th>
                  <th>Correo</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id_cliente}>
                    <td>{cliente.id_cliente}</td>

                    <td>
                      <strong>{obtenerNombreCliente(cliente)}</strong>
                      <br />
                      <small>{cliente.direccion || "Sin dirección"}</small>
                    </td>

                    <td>
                      <strong>{cliente.tipo_documento}</strong>
                      <br />
                      <small>{cliente.numero_documento}</small>
                    </td>

                    <td>{cliente.correo || "Sin correo"}</td>
                    <td>{cliente.telefono || "Sin teléfono"}</td>

                    <td>
                      <span
                        className={
                          cliente.estado_cliente === "activo"
                            ? "status-badge status-active"
                            : "status-badge status-inactive"
                        }
                      >
                        {cliente.estado_cliente}
                      </span>
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-small"
                          onClick={() => abrirEditar(cliente)}
                        >
                          Editar
                        </button>

                        <button
                          className="btn-small btn-danger"
                          onClick={() => confirmarEliminar(cliente.id_cliente)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No hay clientes registrados.</p>
        )}
      </section>

      {panelOpen && (
        <>
          <div className="drawer-overlay" onClick={cerrarPanel} />

          <aside className="drawer-panel">
            <div className="drawer-header">
              <div>
                <h2>{editId ? "Editar cliente" : "Crear cliente"}</h2>
                <p>Complete la información del cliente.</p>
              </div>

              <button className="drawer-close" onClick={cerrarPanel}>
                ×
              </button>
            </div>

            <form className="drawer-form" onSubmit={guardarCliente}>
              <div className="form-group">
                <label>Tipo de documento</label>
                <select
                  name="tipo_documento"
                  value={form.tipo_documento}
                  onChange={handleChange}
                >
                  <option value="DNI">DNI</option>
                  <option value="RUC">RUC</option>
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
                  placeholder="Ingrese documento"
                />
              </div>

              {form.tipo_documento === "RUC" ? (
                <div className="form-group">
                  <label>Razón social</label>
                  <input
                    type="text"
                    name="razon_social"
                    value={form.razon_social}
                    onChange={handleChange}
                    placeholder="Ej. Empresa S.A.C."
                  />
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label>Nombres</label>
                    <input
                      type="text"
                      name="nombres"
                      value={form.nombres}
                      onChange={handleChange}
                      placeholder="Nombres"
                    />
                  </div>

                  <div className="form-group">
                    <label>Apellidos</label>
                    <input
                      type="text"
                      name="apellidos"
                      value={form.apellidos}
                      onChange={handleChange}
                      placeholder="Apellidos"
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Correo</label>
                <input
                  type="email"
                  name="correo"
                  value={form.correo}
                  onChange={handleChange}
                  placeholder="cliente@email.com"
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

              <div className="form-group">
                <label>Dirección</label>
                <textarea
                  name="direccion"
                  value={form.direccion}
                  onChange={handleChange}
                  placeholder="Dirección del cliente"
                />
              </div>

              <div className="form-group">
                <label>Estado</label>
                <select
                  name="estado_cliente"
                  value={form.estado_cliente}
                  onChange={handleChange}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>

              <div className="drawer-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cerrarPanel}
                >
                  Cancelar
                </button>

                <button type="submit" className="btn-primary">
                  {editId ? "Guardar cambios" : "Crear cliente"}
                </button>
              </div>
            </form>
          </aside>
        </>
      )}
    </div>
  );
};

export default Clientes;