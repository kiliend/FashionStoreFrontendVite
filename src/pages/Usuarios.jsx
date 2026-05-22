import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario
} from "../services/usuarios.service";

const initialUsuario = {
  id_rol: "",
  nombres: "",
  apellidos: "",
  usuario: "",
  password: "",
  correo: "",
  telefono: "",
  estado_usuario: "activo"
};

const rolesSistema = [
  {
    id_rol: 1,
    nombre_rol: "admin",
    descripcion: "Administrador general del sistema"
  },
  {
    id_rol: 2,
    nombre_rol: "vendedor",
    descripcion: "Encargado de ventas y caja"
  },
  {
    id_rol: 3,
    nombre_rol: "cliente",
    descripcion: "Cliente del e-commerce"
  },
  {
    id_rol: 4,
    nombre_rol: "almacen",
    descripcion: "Encargado de logística de almacén"
  },
  {
    id_rol: 5,
    nombre_rol: "despacho",
    descripcion: "Encargado de preparar pedidos"
  },
  {
    id_rol: 6,
    nombre_rol: "reparto",
    descripcion: "Encargado de transportar productos al cliente"
  },
  {
    id_rol: 7,
    nombre_rol: "cliente_ecommerce",
    descripcion: "Cliente registrado desde la tienda online"
  }
];

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(initialUsuario);

  const [panelOpen, setPanelOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const REGISTROS_POR_PAGINA = 15;
  const [pagina, setPagina] = useState(1);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const response = await listarUsuarios();

      if (response.ok) {
        setUsuarios(response.data);
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message ||
          "No se pudo cargar el módulo de usuarios",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const usuariosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return usuarios
      .filter((item) => {
        if (!filtroRol) return true;
        return item.nombre_rol === filtroRol;
      })
      .filter((item) => {
        if (!filtroEstado) return true;
        return item.estado_usuario === filtroEstado;
      })
      .filter((item) => {
        if (!texto) return true;

        return (
          String(item.nombres || "").toLowerCase().includes(texto) ||
          String(item.apellidos || "").toLowerCase().includes(texto) ||
          String(item.usuario || "").toLowerCase().includes(texto) ||
          String(item.correo || "").toLowerCase().includes(texto) ||
          String(item.telefono || "").toLowerCase().includes(texto) ||
          String(item.nombre_rol || "").toLowerCase().includes(texto)
        );
      });
  }, [usuarios, busqueda, filtroRol, filtroEstado]);

  const totalPaginas = Math.ceil(
    usuariosFiltrados.length / REGISTROS_POR_PAGINA
  );

  const usuariosPaginados = usuariosFiltrados.slice(
    (pagina - 1) * REGISTROS_POR_PAGINA,
    pagina * REGISTROS_POR_PAGINA
  );

  const abrirCrear = () => {
    setEditId(null);
    setForm(initialUsuario);
    setPanelOpen(true);
  };

  const abrirEditar = (usuario) => {
    setEditId(usuario.id_usuario);

    setForm({
      id_rol: usuario.id_rol || "",
      nombres: usuario.nombres || "",
      apellidos: usuario.apellidos || "",
      usuario: usuario.usuario || "",
      password: "",
      correo: usuario.correo || "",
      telefono: usuario.telefono || "",
      estado_usuario: usuario.estado_usuario || "activo"
    });

    setPanelOpen(true);
  };

  const cerrarPanel = () => {
    setEditId(null);
    setForm(initialUsuario);
    setPanelOpen(false);
  };

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  };

  const validarFormulario = () => {
    if (!form.id_rol) {
      Swal.fire("Validación", "Seleccione un rol", "warning");
      return false;
    }

    if (!form.nombres.trim()) {
      Swal.fire("Validación", "Ingrese los nombres", "warning");
      return false;
    }

    if (!form.usuario.trim()) {
      Swal.fire("Validación", "Ingrese el nombre de usuario", "warning");
      return false;
    }

    if (!editId && !form.password.trim()) {
      Swal.fire(
        "Validación",
        "La contraseña es obligatoria para crear usuario",
        "warning"
      );
      return false;
    }

    if (form.password.trim() && form.password.trim().length < 6) {
      Swal.fire(
        "Validación",
        "La contraseña debe tener al menos 6 caracteres",
        "warning"
      );
      return false;
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

  const guardarUsuario = async (event) => {
    event.preventDefault();

    if (!validarFormulario()) return;

    const payload = {
      id_rol: Number(form.id_rol),
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim() || null,
      usuario: form.usuario.trim(),
      password: form.password.trim(),
      correo: form.correo.trim() || null,
      telefono: form.telefono.trim() || null,
      estado_usuario: form.estado_usuario
    };

    if (editId && !payload.password) {
      delete payload.password;
    }

    try {
      setGuardando(true);

      const response = editId
        ? await actualizarUsuario(editId, payload)
        : await crearUsuario(payload);

      if (response.ok) {
        Swal.fire(
          editId ? "Usuario actualizado" : "Usuario creado",
          "La información fue guardada correctamente",
          "success"
        );

        cerrarPanel();
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo guardar el usuario",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async (id_usuario) => {
    const confirmacion = await Swal.fire({
      title: "¿Eliminar usuario?",
      text: "El usuario será eliminado lógicamente del sistema.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const response = await eliminarUsuario(id_usuario);

      if (response.ok) {
        Swal.fire("Eliminado", "El usuario fue eliminado correctamente", "success");
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo eliminar el usuario",
        "error"
      );
    }
  };

  const cambiarEstadoRapido = async (usuario, nuevoEstado) => {
    const payload = {
      id_rol: usuario.id_rol,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos || null,
      usuario: usuario.usuario,
      correo: usuario.correo || null,
      telefono: usuario.telefono || null,
      estado_usuario: nuevoEstado
    };

    try {
      const response = await actualizarUsuario(usuario.id_usuario, payload);

      if (response.ok) {
        Swal.fire(
          "Estado actualizado",
          "El estado del usuario fue actualizado",
          "success"
        );
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo actualizar el estado",
        "error"
      );
    }
  };

  const claseEstado = (estado) => {
    if (estado === "activo") return "status-badge status-active";
    if (estado === "bloqueado") return "status-badge status-warning";
    return "status-badge status-inactive";
  };

  const nombreCompleto = (usuario) => {
    return `${usuario.nombres || ""} ${usuario.apellidos || ""}`.trim();
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroRol("");
    setFiltroEstado("");
    setPagina(1);
  };

  if (loading) {
    return <p>Cargando usuarios...</p>;
  }

  return (
    <div className="usuarios-page">
      <div className="page-header">
        <div>
          <h1>Control de usuarios</h1>
          <p>
            Administración de accesos, roles internos y usuarios vinculados al
            e-commerce.
          </p>
        </div>

        <button className="btn-primary" onClick={abrirCrear}>
          + Nuevo usuario
        </button>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Filtros</h2>
            <p>Busque usuarios por nombre, rol, correo o estado.</p>
          </div>

          <div className="table-actions">
            <button className="btn-secondary" onClick={limpiarFiltros}>
              Limpiar
            </button>

            <button className="btn-secondary" onClick={cargarDatos}>
              Actualizar
            </button>
          </div>
        </div>

        <div className="venta-form-grid">
          <div className="form-group">
            <label>Buscar</label>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(1);
              }}
              placeholder="Buscar por nombre, usuario, correo o teléfono"
            />
          </div>

          <div className="form-group">
            <label>Rol</label>
            <select
              value={filtroRol}
              onChange={(e) => {
                setFiltroRol(e.target.value);
                setPagina(1);
              }}
            >
              <option value="">Todos</option>
              {rolesSistema.map((rol) => (
                <option key={rol.nombre_rol} value={rol.nombre_rol}>
                  {rol.nombre_rol}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value);
                setPagina(1);
              }}
            >
              <option value="">Todos</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="bloqueado">Bloqueado</option>
            </select>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Usuarios registrados</h2>
            <p>{usuariosFiltrados.length} usuarios encontrados</p>
          </div>
        </div>

        {usuariosFiltrados.length > 0 ? (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Usuario</th>
                    <th>Nombre completo</th>
                    <th>Rol</th>
                    <th>Correo</th>
                    <th>Teléfono</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {usuariosPaginados.map((item) => (
                    <tr key={item.id_usuario}>
                      <td>#{item.id_usuario}</td>

                      <td>
                        <strong>{item.usuario}</strong>
                      </td>

                      <td>{nombreCompleto(item) || "-"}</td>

                      <td>
                        <strong>{item.nombre_rol}</strong>
                        <br />
                        <small>
                          {rolesSistema.find(
                            (rol) => rol.nombre_rol === item.nombre_rol
                          )?.descripcion || "Rol del sistema"}
                        </small>
                      </td>

                      <td>{item.correo || "-"}</td>
                      <td>{item.telefono || "-"}</td>

                      <td>
                        <span className={claseEstado(item.estado_usuario)}>
                          {item.estado_usuario}
                        </span>
                      </td>

                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-small"
                            onClick={() => abrirEditar(item)}
                          >
                            Editar
                          </button>

                          {item.estado_usuario !== "activo" && (
                            <button
                              className="btn-small btn-success"
                              onClick={() => cambiarEstadoRapido(item, "activo")}
                            >
                              Activar
                            </button>
                          )}

                          {item.estado_usuario === "activo" && (
                            <button
                              className="btn-small btn-warning"
                              onClick={() =>
                                cambiarEstadoRapido(item, "bloqueado")
                              }
                            >
                              Bloquear
                            </button>
                          )}

                          {item.estado_usuario !== "inactivo" && (
                            <button
                              className="btn-small btn-secondary-small"
                              onClick={() =>
                                cambiarEstadoRapido(item, "inactivo")
                              }
                            >
                              Inactivar
                            </button>
                          )}

                          <button
                            className="btn-small btn-danger"
                            onClick={() => confirmarEliminar(item.id_usuario)}
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

            {totalPaginas > 1 && (
              <div className="pagination">
                <button
                  type="button"
                  className="btn-small"
                  disabled={pagina === 1}
                  onClick={() => setPagina((prev) => prev - 1)}
                >
                  Anterior
                </button>

                <span>
                  Página {pagina} de {totalPaginas}
                </span>

                <button
                  type="button"
                  className="btn-small"
                  disabled={pagina === totalPaginas}
                  onClick={() => setPagina((prev) => prev + 1)}
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        ) : (
          <p>No hay usuarios registrados.</p>
        )}
      </section>

      {panelOpen && (
        <>
          <div className="drawer-overlay" onClick={cerrarPanel} />

          <aside className="drawer-panel">
            <div className="drawer-header">
              <div>
                <h2>{editId ? "Editar usuario" : "Nuevo usuario"}</h2>
                <p>
                  {editId
                    ? "Actualice los datos del usuario seleccionado."
                    : "Registre un nuevo usuario para el sistema."}
                </p>
              </div>

              <button className="drawer-close" onClick={cerrarPanel}>
                ×
              </button>
            </div>

            <form className="drawer-form" onSubmit={guardarUsuario}>
              <div className="form-group">
                <label>Rol</label>
                <select
                  name="id_rol"
                  value={form.id_rol}
                  onChange={handleChange}
                >
                  <option value="">Seleccione rol</option>

                  {rolesSistema.map((rol) => (
                    <option key={rol.id_rol} value={rol.id_rol}>
                      {rol.nombre_rol} - {rol.descripcion}
                    </option>
                  ))}
                </select>
              </div>

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

              <div className="form-group">
                <label>Usuario</label>
                <input
                  type="text"
                  name="usuario"
                  value={form.usuario}
                  onChange={handleChange}
                  placeholder="Nombre de usuario"
                />
              </div>

              <div className="form-group">
                <label>
                  Contraseña{" "}
                  {editId && <small>(dejar vacío para no cambiar)</small>}
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={editId ? "Nueva contraseña opcional" : "Contraseña"}
                />
              </div>

              <div className="form-group">
                <label>Correo</label>
                <input
                  type="email"
                  name="correo"
                  value={form.correo}
                  onChange={handleChange}
                  placeholder="correo@empresa.com"
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
                <label>Estado</label>
                <select
                  name="estado_usuario"
                  value={form.estado_usuario}
                  onChange={handleChange}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="bloqueado">Bloqueado</option>
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

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={guardando}
                >
                  {guardando
                    ? "Guardando..."
                    : editId
                    ? "Guardar cambios"
                    : "Crear usuario"}
                </button>
              </div>
            </form>
          </aside>
        </>
      )}
    </div>
  );
};

export default Usuarios;