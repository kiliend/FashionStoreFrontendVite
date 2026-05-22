import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import {
  listarIncidencias,
  crearIncidencia,
  actualizarEstadoIncidencia
} from "../services/incidencias.service";

import {
  listarDevoluciones,
  crearDevolucion,
  procesarDevolucion,
  rechazarDevolucion
} from "../services/devoluciones.service";

import { listarVentas, obtenerVenta } from "../services/ventas.service";

const initialIncidencia = {
  id_venta: "",
  id_detalle_venta: "",
  cantidad_afectada: 1,
  tipo_incidencia: "producto_defectuoso",
  motivo: "",
  descripcion: "",
  accion_solicitada: "revision",
  estado_producto_recibido: "buen_estado",
  estado_incidencia: "registrada"
};

const initialDevolucion = {
  id_incidencia: "",
  monto_devolucion: "",
  metodo_devolucion: "efectivo",
  repone_stock: "no",
  estado_producto: "buen_estado",
  observacion: ""
};

const estadosIncidencia = [
  "registrada",
  "en_revision",
  "aprobada",
  "rechazada",
  "cerrada"
];

const Postventa = () => {
  const [activeTab, setActiveTab] = useState("incidencias");

  const [incidencias, setIncidencias] = useState([]);
  const [devoluciones, setDevoluciones] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [detalleVentaSeleccionada, setDetalleVentaSeleccionada] = useState([]);

  const [incidenciaPanelOpen, setIncidenciaPanelOpen] = useState(false);
  const [devolucionPanelOpen, setDevolucionPanelOpen] = useState(false);
  const [estadoPanelOpen, setEstadoPanelOpen] = useState(false);

  const [incidenciaForm, setIncidenciaForm] = useState(initialIncidencia);
  const [devolucionForm, setDevolucionForm] = useState(initialDevolucion);

  const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState(null);
  const [nuevoEstadoIncidencia, setNuevoEstadoIncidencia] = useState("");

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [incRes, devRes, venRes] = await Promise.all([
        listarIncidencias(),
        listarDevoluciones(),
        listarVentas()
      ]);

      if (incRes.ok) setIncidencias(incRes.data);
      if (devRes.ok) setDevoluciones(devRes.data);
      if (venRes.ok) setVentas(venRes.data);
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo cargar el módulo postventa",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const nombreClienteVenta = (venta) => {
    if (venta.razon_social) return venta.razon_social;

    return (
      `${venta.nombres || ""} ${venta.apellidos || ""}`.trim() ||
      "Cliente no registrado"
    );
  };

  const obtenerClienteRegistro = (item) => {
    if (item.razon_social) return item.razon_social;

    return (
      `${item.nombres || ""} ${item.apellidos || ""}`.trim() ||
      "Cliente no registrado"
    );
  };

  const claseEstado = (estado) => {
    const estadoNormalizado = String(estado || "").toLowerCase();

    if (
      estadoNormalizado === "resuelta" ||
      estadoNormalizado === "procesada" ||
      estadoNormalizado === "aprobada" ||
      estadoNormalizado === "cerrada"
    ) {
      return "status-badge status-active";
    }

    if (
      estadoNormalizado === "rechazada" ||
      estadoNormalizado === "cancelada"
    ) {
      return "status-badge status-inactive";
    }

    return "status-badge status-warning";
  };

  const abrirIncidencia = () => {
    setIncidenciaForm(initialIncidencia);
    setDetalleVentaSeleccionada([]);
    setIncidenciaPanelOpen(true);
  };

  const cerrarIncidencia = () => {
    setIncidenciaForm(initialIncidencia);
    setDetalleVentaSeleccionada([]);
    setIncidenciaPanelOpen(false);
  };

  const abrirDevolucion = () => {
    setDevolucionForm(initialDevolucion);
    setDevolucionPanelOpen(true);
  };

  const cerrarDevolucion = () => {
    setDevolucionForm(initialDevolucion);
    setDevolucionPanelOpen(false);
  };

  const cargarDetalleVentaParaIncidencia = async (idVenta) => {
    if (!idVenta) {
      setDetalleVentaSeleccionada([]);
      return;
    }

    try {
      const response = await obtenerVenta(idVenta);

      if (response.ok) {
        setDetalleVentaSeleccionada(
          response.data.detalles || response.data.detalle || []
        );
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo cargar el detalle de la venta",
        "error"
      );
    }
  };

  const handleIncidenciaChange = async (event) => {
    const { name, value } = event.target;

    if (name === "id_venta") {
      setIncidenciaForm((prev) => ({
        ...prev,
        id_venta: value,
        id_detalle_venta: ""
      }));

      await cargarDetalleVentaParaIncidencia(value);
      return;
    }

    setIncidenciaForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDevolucionChange = (event) => {
    setDevolucionForm({
      ...devolucionForm,
      [event.target.name]: event.target.value
    });
  };

  const guardarIncidencia = async (event) => {
    event.preventDefault();

    if (!incidenciaForm.id_venta) {
      Swal.fire("Validación", "Seleccione una venta", "warning");
      return;
    }

    if (!incidenciaForm.id_detalle_venta) {
      Swal.fire("Validación", "Seleccione el producto afectado", "warning");
      return;
    }

    if (Number(incidenciaForm.cantidad_afectada) <= 0) {
      Swal.fire("Validación", "La cantidad afectada debe ser mayor a 0", "warning");
      return;
    }

    if (!incidenciaForm.motivo.trim()) {
      Swal.fire("Validación", "Ingrese el motivo de la incidencia", "warning");
      return;
    }

    if (!incidenciaForm.descripcion.trim()) {
      Swal.fire("Validación", "Ingrese una descripción", "warning");
      return;
    }

    const ventaSeleccionada = ventas.find(
      (venta) => Number(venta.id_venta) === Number(incidenciaForm.id_venta)
    );

    if (!ventaSeleccionada?.id_cliente) {
      Swal.fire(
        "Validación",
        "La venta seleccionada no contiene id_cliente. Revisa el SELECT de ventas en el backend.",
        "warning"
      );
      return;
    }

    const payload = {
      id_cliente: Number(ventaSeleccionada.id_cliente),
      id_venta: Number(incidenciaForm.id_venta),
      tipo_incidencia: incidenciaForm.tipo_incidencia,
      motivo: incidenciaForm.motivo.trim(),
      descripcion: incidenciaForm.descripcion.trim(),
      estado_incidencia: "registrada",
      detalles: [
        {
          id_detalle_venta: Number(incidenciaForm.id_detalle_venta),
          cantidad_afectada: Number(incidenciaForm.cantidad_afectada),
          accion_solicitada: incidenciaForm.accion_solicitada,
          estado_producto_recibido: incidenciaForm.estado_producto_recibido,
          observacion: incidenciaForm.descripcion.trim()
        }
      ]
    };

    try {
      setGuardando(true);

      const response = await crearIncidencia(payload);

      if (response.ok) {
        Swal.fire("Registrada", "Incidencia registrada correctamente", "success");
        cerrarIncidencia();
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo registrar la incidencia",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  const abrirCambioEstadoIncidencia = (incidencia) => {
    setIncidenciaSeleccionada(incidencia);
    setNuevoEstadoIncidencia(incidencia.estado_incidencia || "registrada");
    setEstadoPanelOpen(true);
  };

  const cerrarCambioEstadoIncidencia = () => {
    setIncidenciaSeleccionada(null);
    setNuevoEstadoIncidencia("");
    setEstadoPanelOpen(false);
  };

  const guardarEstadoIncidencia = async (event) => {
    event.preventDefault();

    if (!incidenciaSeleccionada) return;

    const payload = {
      estado_incidencia: nuevoEstadoIncidencia
    };

    try {
      setGuardando(true);

      const response = await actualizarEstadoIncidencia(
        incidenciaSeleccionada.id_incidencia,
        payload
      );

      if (response.ok) {
        Swal.fire("Actualizada", "Estado de incidencia actualizado", "success");
        cerrarCambioEstadoIncidencia();
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo actualizar la incidencia",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  const guardarDevolucion = async (event) => {
    event.preventDefault();

    if (!devolucionForm.id_incidencia) {
      Swal.fire("Validación", "Seleccione una incidencia", "warning");
      return;
    }

    if (
      devolucionForm.monto_devolucion === "" ||
      Number(devolucionForm.monto_devolucion) < 0
    ) {
      Swal.fire("Validación", "Ingrese un monto de devolución válido", "warning");
      return;
    }

    if (!devolucionForm.metodo_devolucion) {
      Swal.fire("Validación", "Seleccione el método de devolución", "warning");
      return;
    }

    const payload = {
      id_incidencia: Number(devolucionForm.id_incidencia),
      monto_devolucion: Number(devolucionForm.monto_devolucion || 0),
      metodo_devolucion: devolucionForm.metodo_devolucion,
      repone_stock: devolucionForm.repone_stock === "si",
      estado_producto: devolucionForm.estado_producto,
      observacion: devolucionForm.observacion.trim() || null,
      estado_devolucion: "pendiente"
    };

    try {
      setGuardando(true);

      const response = await crearDevolucion(payload);

      if (response.ok) {
        Swal.fire("Registrada", "Devolución registrada correctamente", "success");
        cerrarDevolucion();
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo registrar la devolución",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  const confirmarProcesarDevolucion = async (id_devolucion) => {
    const confirmacion = await Swal.fire({
      title: "¿Procesar devolución?",
      text: "Se aplicará la devolución según la configuración registrada.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, procesar",
      cancelButtonText: "Cancelar"
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const response = await procesarDevolucion(id_devolucion);

      if (response.ok) {
        Swal.fire("Procesada", "La devolución fue procesada correctamente", "success");
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo procesar la devolución",
        "error"
      );
    }
  };

  const confirmarRechazarDevolucion = async (id_devolucion) => {
    const { value: motivo_rechazo } = await Swal.fire({
      title: "Motivo de rechazo",
      input: "textarea",
      inputPlaceholder: "Explique el motivo del rechazo",
      showCancelButton: true,
      confirmButtonText: "Rechazar",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => {
        if (!value) return "Debe ingresar un motivo";
        return null;
      }
    });

    if (!motivo_rechazo) return;

    try {
      const response = await rechazarDevolucion(id_devolucion, {
        motivo_rechazo
      });

      if (response.ok) {
        Swal.fire("Rechazada", "La devolución fue rechazada", "success");
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo rechazar la devolución",
        "error"
      );
    }
  };

  if (loading) {
    return <p>Cargando postventa...</p>;
  }

  return (
    <div className="postventa-page">
      <div className="page-header">
        <div>
          <h1>Postventa</h1>
          <p>Gestión de incidencias, reclamos, cambios y devoluciones.</p>
        </div>

        <button className="btn-secondary" onClick={cargarDatos}>
          Actualizar
        </button>
      </div>

      <div className="catalog-tabs">
        <button
          className={activeTab === "incidencias" ? "active" : ""}
          onClick={() => setActiveTab("incidencias")}
        >
          Incidencias
        </button>

        <button
          className={activeTab === "devoluciones" ? "active" : ""}
          onClick={() => setActiveTab("devoluciones")}
        >
          Devoluciones
        </button>
      </div>

      {activeTab === "incidencias" && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Incidencias registradas</h2>
              <p>{incidencias.length} incidencias encontradas</p>
            </div>

            <button className="btn-primary" onClick={abrirIncidencia}>
              + Nueva incidencia
            </button>
          </div>

          {incidencias.length > 0 ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Venta</th>
                    <th>Cliente</th>
                    <th>Tipo</th>
                    <th>Motivo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {incidencias.map((item) => (
                    <tr key={item.id_incidencia}>
                      <td>#{item.id_incidencia}</td>
                      <td>#{item.id_venta}</td>
                      <td>{obtenerClienteRegistro(item)}</td>
                      <td>{item.tipo_incidencia}</td>
                      <td>{item.motivo || item.descripcion}</td>
                      <td>
                        <span className={claseEstado(item.estado_incidencia)}>
                          {item.estado_incidencia}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          {!["rechazada", "cerrada"].includes(
                            String(item.estado_incidencia).toLowerCase()
                          ) && (
                            <button
                              className="btn-small btn-warning"
                              onClick={() => abrirCambioEstadoIncidencia(item)}
                            >
                              Estado
                            </button>
                          )}

                          {["rechazada", "cerrada"].includes(
                            String(item.estado_incidencia).toLowerCase()
                          ) && <small>Finalizada</small>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No hay incidencias registradas.</p>
          )}
        </section>
      )}

      {activeTab === "devoluciones" && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Devoluciones registradas</h2>
              <p>{devoluciones.length} devoluciones encontradas</p>
            </div>

            <button className="btn-primary" onClick={abrirDevolucion}>
              + Nueva devolución
            </button>
          </div>

          {devoluciones.length > 0 ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Incidencia</th>
                    <th>Monto</th>
                    <th>Método</th>
                    <th>Repone stock</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {devoluciones.map((item) => {
                    const estado = String(item.estado_devolucion || "").toLowerCase();

                    return (
                      <tr key={item.id_devolucion}>
                        <td>#{item.id_devolucion}</td>
                        <td>#{item.id_incidencia}</td>
                        <td>S/ {Number(item.monto_devolucion || 0).toFixed(2)}</td>
                        <td>{item.metodo_devolucion}</td>
                        <td>{item.repone_stock ? "Sí" : "No"}</td>
                        <td>
                          <span className={claseEstado(item.estado_devolucion)}>
                            {item.estado_devolucion}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            {["pendiente", "aprobada", "solicitada"].includes(
                              estado
                            ) && (
                              <button
                                className="btn-small btn-success"
                                onClick={() =>
                                  confirmarProcesarDevolucion(item.id_devolucion)
                                }
                              >
                                Procesar
                              </button>
                            )}

                            {["pendiente", "solicitada"].includes(estado) && (
                              <button
                                className="btn-small btn-danger"
                                onClick={() =>
                                  confirmarRechazarDevolucion(item.id_devolucion)
                                }
                              >
                                Rechazar
                              </button>
                            )}

                            {["procesada", "rechazada"].includes(estado) && (
                              <small>Finalizada</small>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No hay devoluciones registradas.</p>
          )}
        </section>
      )}

      {incidenciaPanelOpen && (
        <>
          <div className="drawer-overlay" onClick={cerrarIncidencia} />

          <aside className="drawer-panel drawer-wide">
            <div className="drawer-header">
              <div>
                <h2>Nueva incidencia</h2>
                <p>Registre un reclamo o problema asociado a una venta.</p>
              </div>

              <button className="drawer-close" onClick={cerrarIncidencia}>
                ×
              </button>
            </div>

            <form className="drawer-form" onSubmit={guardarIncidencia}>
              <div className="form-group">
                <label>Venta</label>
                <select
                  name="id_venta"
                  value={incidenciaForm.id_venta}
                  onChange={handleIncidenciaChange}
                >
                  <option value="">Seleccione venta</option>
                  {ventas.map((venta) => (
                    <option key={venta.id_venta} value={venta.id_venta}>
                      Venta #{venta.id_venta} - {nombreClienteVenta(venta)} - S/{" "}
                      {Number(venta.total || 0).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Producto afectado</label>
                <select
                  name="id_detalle_venta"
                  value={incidenciaForm.id_detalle_venta}
                  onChange={handleIncidenciaChange}
                >
                  <option value="">Seleccione producto</option>
                  {detalleVentaSeleccionada.map((detalle) => (
                    <option
                      key={detalle.id_detalle_venta}
                      value={detalle.id_detalle_venta}
                    >
                      {detalle.nombre_producto || detalle.descripcion || "Producto"} -
                      Cantidad: {detalle.cantidad}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Cantidad afectada</label>
                <input
                  type="number"
                  min="1"
                  name="cantidad_afectada"
                  value={incidenciaForm.cantidad_afectada}
                  onChange={handleIncidenciaChange}
                />
              </div>

              <div className="form-group">
                <label>Tipo de incidencia</label>
                <select
                  name="tipo_incidencia"
                  value={incidenciaForm.tipo_incidencia}
                  onChange={handleIncidenciaChange}
                >
                  <option value="devolucion">Devolución</option>
                  <option value="rechazo_producto">Rechazo de producto</option>
                  <option value="cambio_producto">Cambio de producto</option>
                  <option value="producto_defectuoso">Producto defectuoso</option>
                  <option value="reclamo">Reclamo</option>
                </select>
              </div>

              <div className="form-group">
                <label>Motivo</label>
                <input
                  type="text"
                  name="motivo"
                  value={incidenciaForm.motivo}
                  onChange={handleIncidenciaChange}
                  placeholder="Ej. Producto dañado al recibir"
                />
              </div>

              <div className="form-group">
                <label>Acción solicitada</label>
                <select
                  name="accion_solicitada"
                  value={incidenciaForm.accion_solicitada}
                  onChange={handleIncidenciaChange}
                >
                  <option value="cambio_producto">Cambio de producto</option>
                  <option value="devolucion_dinero">Devolución de dinero</option>
                  <option value="revision">Revisión del caso</option>
                  <option value="rechazo_producto">Rechazo del producto</option>
                  <option value="compensacion">Bonificación / compensación</option>
                </select>
              </div>

              <div className="form-group">
                <label>Estado del producto recibido</label>
                <select
                  name="estado_producto_recibido"
                  value={incidenciaForm.estado_producto_recibido}
                  onChange={handleIncidenciaChange}
                >
                  <option value="defectuoso">Defectuoso</option>
                  <option value="danado">Dañado</option>
                  <option value="incompleto">Incompleto</option>
                  <option value="incorrecto">Incorrecto</option>
                  <option value="buen_estado">Buen estado</option>
                  <option value="no_recibido">No recibido</option>
                </select>
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  name="descripcion"
                  value={incidenciaForm.descripcion}
                  onChange={handleIncidenciaChange}
                  placeholder="Describa el problema"
                />
              </div>

              <div className="drawer-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cerrarIncidencia}
                >
                  Cancelar
                </button>

                <button type="submit" className="btn-primary" disabled={guardando}>
                  {guardando ? "Guardando..." : "Registrar incidencia"}
                </button>
              </div>
            </form>
          </aside>
        </>
      )}

      {devolucionPanelOpen && (
        <>
          <div className="drawer-overlay" onClick={cerrarDevolucion} />

          <aside className="drawer-panel">
            <div className="drawer-header">
              <div>
                <h2>Nueva devolución</h2>
                <p>Registre una devolución asociada a una incidencia.</p>
              </div>

              <button className="drawer-close" onClick={cerrarDevolucion}>
                ×
              </button>
            </div>

            <form className="drawer-form" onSubmit={guardarDevolucion}>
              <div className="form-group">
                <label>Incidencia asociada</label>
                <select
                  name="id_incidencia"
                  value={devolucionForm.id_incidencia}
                  onChange={handleDevolucionChange}
                >
                  <option value="">Seleccione incidencia</option>
                  {incidencias
                    .filter((incidencia) =>
                      ["registrada", "en_revision", "aprobada"].includes(
                        String(incidencia.estado_incidencia || "").toLowerCase()
                      )
                    )
                    .map((incidencia) => (
                      <option
                        key={incidencia.id_incidencia}
                        value={incidencia.id_incidencia}
                      >
                        Incidencia #{incidencia.id_incidencia} - Venta #
                        {incidencia.id_venta} - {incidencia.tipo_incidencia}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label>Monto devolución</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="monto_devolucion"
                  value={devolucionForm.monto_devolucion}
                  onChange={handleDevolucionChange}
                />
                <small>
                  Si no se devuelve dinero, coloca 0.
                </small>
              </div>

              <div className="form-group">
                <label>Método devolución</label>
                <select
                  name="metodo_devolucion"
                  value={devolucionForm.metodo_devolucion}
                  onChange={handleDevolucionChange}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="yape">Yape</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="nota_credito">Nota de crédito</option>
                  <option value="sin_devolucion">Sin devolución de dinero</option>
                </select>
              </div>

              <div className="form-group">
                <label>¿Reponer stock?</label>
                <select
                  name="repone_stock"
                  value={devolucionForm.repone_stock}
                  onChange={handleDevolucionChange}
                >
                  <option value="no">No</option>
                  <option value="si">Sí</option>
                </select>
                <small>
                  Solo seleccione “Sí” si el producto vuelve en buen estado y puede venderse nuevamente.
                </small>
              </div>

              <div className="form-group">
                <label>Estado del producto</label>
                <select
                  name="estado_producto"
                  value={devolucionForm.estado_producto}
                  onChange={handleDevolucionChange}
                >
                  <option value="buen_estado">Buen estado</option>
                  <option value="defectuoso">Defectuoso</option>
                  <option value="danado">Dañado</option>
                  <option value="incompleto">Incompleto</option>
                  <option value="no_recibido">No recibido físicamente</option>
                </select>
              </div>

              <div className="form-group">
                <label>Observación</label>
                <textarea
                  name="observacion"
                  value={devolucionForm.observacion}
                  onChange={handleDevolucionChange}
                  placeholder="Detalle adicional de la devolución"
                />
              </div>

              <div className="drawer-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cerrarDevolucion}
                >
                  Cancelar
                </button>

                <button type="submit" className="btn-primary" disabled={guardando}>
                  {guardando ? "Guardando..." : "Registrar devolución"}
                </button>
              </div>
            </form>
          </aside>
        </>
      )}

      {estadoPanelOpen && incidenciaSeleccionada && (
        <>
          <div
            className="drawer-overlay"
            onClick={cerrarCambioEstadoIncidencia}
          />

          <aside className="drawer-panel">
            <div className="drawer-header">
              <div>
                <h2>Cambiar estado</h2>
                <p>Incidencia #{incidenciaSeleccionada.id_incidencia}</p>
              </div>

              <button
                className="drawer-close"
                onClick={cerrarCambioEstadoIncidencia}
              >
                ×
              </button>
            </div>

            <form className="drawer-form" onSubmit={guardarEstadoIncidencia}>
              <div className="form-group">
                <label>Nuevo estado</label>
                <select
                  value={nuevoEstadoIncidencia}
                  onChange={(e) => setNuevoEstadoIncidencia(e.target.value)}
                >
                  {estadosIncidencia.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </select>
              </div>

              <div className="drawer-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cerrarCambioEstadoIncidencia}
                >
                  Cancelar
                </button>

                <button type="submit" className="btn-primary" disabled={guardando}>
                  {guardando ? "Guardando..." : "Actualizar"}
                </button>
              </div>
            </form>
          </aside>
        </>
      )}
    </div>
  );
};

export default Postventa;