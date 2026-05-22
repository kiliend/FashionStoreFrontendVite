import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import {
  listarTareas,
  crearTarea,
  actualizarEstadoTarea,
  eliminarTarea
} from "../services/tareas.service";

import { listarUsuarios } from "../services/usuarios.service";

const initialTarea = {
  id_usuario: "",
  modulo: "",
  referencia_tipo: "",
  referencia_id: "",
  accion: "",
  descripcion: "",
  observacion: ""
};

const estadosTarea = [
  "pendiente",
  "en_proceso",
  "finalizada",
  "observada",
  "cancelada"
];

const Tareas = () => {
  const [tareas, setTareas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  const [form, setForm] = useState(initialTarea);
  const [panelOpen, setPanelOpen] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroModulo, setFiltroModulo] = useState("");

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const REGISTROS_POR_PAGINA = 15;
  const [pagina, setPagina] = useState(1);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [tareasRes, usuariosRes] = await Promise.all([
        listarTareas(),
        listarUsuarios()
      ]);

      if (tareasRes.ok) setTareas(tareasRes.data);
      if (usuariosRes.ok) setUsuarios(usuariosRes.data);
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo cargar el módulo de tareas",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const tareasFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return tareas
      .filter((tarea) => {
        if (!filtroEstado) return true;
        return tarea.estado_tarea === filtroEstado;
      })
      .filter((tarea) => {
        if (!filtroModulo) return true;
        return tarea.modulo === filtroModulo;
      })
      .filter((tarea) => {
        if (!texto) return true;

        return (
          String(tarea.usuario || "").toLowerCase().includes(texto) ||
          String(tarea.modulo || "").toLowerCase().includes(texto) ||
          String(tarea.accion || "").toLowerCase().includes(texto) ||
          String(tarea.descripcion || "").toLowerCase().includes(texto) ||
          String(tarea.referencia_tipo || "").toLowerCase().includes(texto)
        );
      });
  }, [tareas, busqueda, filtroEstado, filtroModulo]);

  const totalPaginas = Math.ceil(tareasFiltradas.length / REGISTROS_POR_PAGINA);

  const tareasPaginadas = tareasFiltradas.slice(
    (pagina - 1) * REGISTROS_POR_PAGINA,
    pagina * REGISTROS_POR_PAGINA
  );

  const modulosDisponibles = useMemo(() => {
    return [...new Set(tareas.map((tarea) => tarea.modulo).filter(Boolean))];
  }, [tareas]);

  const abrirPanel = () => {
    setForm(initialTarea);
    setPanelOpen(true);
  };

  const cerrarPanel = () => {
    setForm(initialTarea);
    setPanelOpen(false);
  };

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  };

  const validarFormulario = () => {
    if (!form.id_usuario) {
      Swal.fire("Validación", "Seleccione un usuario responsable", "warning");
      return false;
    }

    if (!form.modulo.trim()) {
      Swal.fire("Validación", "Ingrese el módulo", "warning");
      return false;
    }

    if (!form.referencia_tipo.trim()) {
      Swal.fire("Validación", "Ingrese el tipo de referencia", "warning");
      return false;
    }

    if (!form.referencia_id || Number(form.referencia_id) <= 0) {
      Swal.fire("Validación", "Ingrese un ID de referencia válido", "warning");
      return false;
    }

    if (!form.accion.trim()) {
      Swal.fire("Validación", "Ingrese la acción de la tarea", "warning");
      return false;
    }

    return true;
  };

  const guardarTarea = async (event) => {
    event.preventDefault();

    if (!validarFormulario()) return;

    const payload = {
      id_usuario: Number(form.id_usuario),
      modulo: form.modulo.trim(),
      referencia_tipo: form.referencia_tipo.trim(),
      referencia_id: Number(form.referencia_id),
      accion: form.accion.trim(),
      descripcion: form.descripcion.trim() || null,
      observacion: form.observacion.trim() || null
    };

    try {
      setGuardando(true);

      const response = await crearTarea(payload);

      if (response.ok) {
        Swal.fire("Tarea creada", "La tarea fue registrada correctamente", "success");
        cerrarPanel();
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo crear la tarea",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (tarea) => {
    const { value: nuevoEstado } = await Swal.fire({
      title: "Actualizar estado",
      input: "select",
      inputOptions: {
        pendiente: "Pendiente",
        en_proceso: "En proceso",
        finalizada: "Finalizada",
        observada: "Observada",
        cancelada: "Cancelada"
      },
      inputValue: tarea.estado_tarea,
      showCancelButton: true,
      confirmButtonText: "Actualizar",
      cancelButtonText: "Cancelar"
    });

    if (!nuevoEstado) return;

    const { value: observacion } = await Swal.fire({
      title: "Observación",
      input: "textarea",
      inputPlaceholder: "Ingrese una observación opcional",
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar"
    });

    try {
      const response = await actualizarEstadoTarea(tarea.id_tarea, {
        estado_tarea: nuevoEstado,
        observacion: observacion || null
      });

      if (response.ok) {
        Swal.fire("Actualizada", "El estado de la tarea fue actualizado", "success");
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo actualizar la tarea",
        "error"
      );
    }
  };

  const confirmarEliminar = async (id_tarea) => {
    const confirmacion = await Swal.fire({
      title: "¿Eliminar tarea?",
      text: "La tarea será eliminada lógicamente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const response = await eliminarTarea(id_tarea);

      if (response.ok) {
        Swal.fire("Eliminada", "La tarea fue eliminada correctamente", "success");
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo eliminar la tarea",
        "error"
      );
    }
  };

  const claseEstado = (estado) => {
    if (estado === "finalizada") return "status-badge status-active";
    if (estado === "cancelada") return "status-badge status-inactive";
    if (estado === "observada") return "status-badge status-warning";
    return "status-badge";
  };

  if (loading) {
    return <p>Cargando tareas...</p>;
  }

  return (
    <div className="tareas-page">
      <div className="page-header">
        <div>
          <h1>Tareas operativas</h1>
          <p>Asignación y seguimiento de tareas por módulo del sistema.</p>
        </div>

        <button className="btn-primary" onClick={abrirPanel}>
          + Nueva tarea
        </button>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Filtros</h2>
            <p>Busque tareas por responsable, módulo, acción o estado.</p>
          </div>

          <button className="btn-secondary" onClick={cargarDatos}>
            Actualizar
          </button>
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
              placeholder="Buscar por usuario, módulo o descripción"
            />
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
              {estadosTarea.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Módulo</label>
            <select
              value={filtroModulo}
              onChange={(e) => {
                setFiltroModulo(e.target.value);
                setPagina(1);
              }}
            >
              <option value="">Todos</option>
              {modulosDisponibles.map((modulo) => (
                <option key={modulo} value={modulo}>
                  {modulo}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Tareas registradas</h2>
            <p>{tareasFiltradas.length} tareas encontradas</p>
          </div>
        </div>

        {tareasFiltradas.length > 0 ? (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Usuario</th>
                    <th>Módulo</th>
                    <th>Referencia</th>
                    <th>Acción</th>
                    <th>Inicio</th>
                    <th>Fin</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {tareasPaginadas.map((tarea) => (
                    <tr key={tarea.id_tarea}>
                      <td>#{tarea.id_tarea}</td>
                      <td>{tarea.usuario}</td>
                      <td>{tarea.modulo}</td>
                      <td>
                        {tarea.referencia_tipo} #{tarea.referencia_id}
                      </td>
                      <td>
                        <strong>{tarea.accion}</strong>
                        <br />
                        <small>{tarea.descripcion || "Sin descripción"}</small>
                      </td>
                      <td>{tarea.fecha_inicio || "-"}</td>
                      <td>{tarea.fecha_fin || "-"}</td>
                      <td>
                        <span className={claseEstado(tarea.estado_tarea)}>
                          {tarea.estado_tarea}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-small"
                            onClick={() => cambiarEstado(tarea)}
                          >
                            Estado
                          </button>

                          <button
                            className="btn-small btn-danger"
                            onClick={() => confirmarEliminar(tarea.id_tarea)}
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
          <p>No hay tareas registradas.</p>
        )}
      </section>

      {panelOpen && (
        <>
          <div className="drawer-overlay" onClick={cerrarPanel} />

          <aside className="drawer-panel">
            <div className="drawer-header">
              <div>
                <h2>Nueva tarea</h2>
                <p>Asigne una tarea operativa a un usuario del sistema.</p>
              </div>

              <button className="drawer-close" onClick={cerrarPanel}>
                ×
              </button>
            </div>

            <form className="drawer-form" onSubmit={guardarTarea}>
              <div className="form-group">
                <label>Usuario responsable</label>
                <select
                  name="id_usuario"
                  value={form.id_usuario}
                  onChange={handleChange}
                >
                  <option value="">Seleccione usuario</option>
                  {usuarios
                    .filter((usuario) => usuario.estado_usuario === "activo")
                    .map((usuario) => (
                      <option key={usuario.id_usuario} value={usuario.id_usuario}>
                        {usuario.usuario}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label>Módulo</label>
                <select
                  name="modulo"
                  value={form.modulo}
                  onChange={handleChange}
                >
                  <option value="">Seleccione módulo</option>
                  <option value="Ventas">Ventas</option>
                  <option value="Compras">Compras</option>
                  <option value="Inventario">Inventario</option>
                  <option value="Pedidos">Pedidos</option>
                  <option value="Reparto">Reparto</option>
                  <option value="Postventa">Postventa</option>
                  <option value="Promociones">Promociones</option>
                  <option value="Reportes">Reportes</option>
                </select>
              </div>

              <div className="form-group">
                <label>Tipo de referencia</label>
                <input
                  type="text"
                  name="referencia_tipo"
                  value={form.referencia_tipo}
                  onChange={handleChange}
                  placeholder="Ej. venta, compra, pedido"
                />
              </div>

              <div className="form-group">
                <label>ID referencia</label>
                <input
                  type="number"
                  name="referencia_id"
                  value={form.referencia_id}
                  onChange={handleChange}
                  placeholder="Ej. 15"
                />
              </div>

              <div className="form-group">
                <label>Acción</label>
                <input
                  type="text"
                  name="accion"
                  value={form.accion}
                  onChange={handleChange}
                  placeholder="Ej. Preparar pedido, revisar stock"
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  placeholder="Detalle de la tarea asignada"
                />
              </div>

              <div className="form-group">
                <label>Observación</label>
                <textarea
                  name="observacion"
                  value={form.observacion}
                  onChange={handleChange}
                  placeholder="Observación inicial opcional"
                />
              </div>

              <div className="drawer-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cerrarPanel}
                >
                  Cancelar
                </button>

                <button type="submit" className="btn-primary" disabled={guardando}>
                  {guardando ? "Guardando..." : "Crear tarea"}
                </button>
              </div>
            </form>
          </aside>
        </>
      )}
    </div>
  );
};

export default Tareas;