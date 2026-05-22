import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import {
  listarPromociones,
  obtenerPromocion,
  crearPromocion,
  actualizarPromocion,
  eliminarPromocion
} from "../services/promociones.service";

import {
  listarCombos,
  obtenerCombo,
  crearCombo,
  actualizarCombo,
  eliminarCombo
} from "../services/combos.service";

import { listarVariantes } from "../services/variantes.service";

const initialPromocion = {
  id_variante: "",
  nombre_promocion: "",
  descripcion: "",
  tipo_descuento: "porcentaje",
  valor_descuento: "",
  fecha_inicio: "",
  fecha_fin: "",
  estado_promocion: "activa"
};

const initialCombo = {
  nombre_combo: "",
  descripcion: "",
  precio_combo: "",
  fecha_inicio: "",
  fecha_fin: "",
  estado_combo: "activo"
};

const Promociones = () => {
  const [activeTab, setActiveTab] = useState("promociones");

  const [promociones, setPromociones] = useState([]);
  const [combos, setCombos] = useState([]);
  const [variantes, setVariantes] = useState([]);

  const [promocionPanelOpen, setPromocionPanelOpen] = useState(false);
  const [comboPanelOpen, setComboPanelOpen] = useState(false);

  const [promocionForm, setPromocionForm] = useState(initialPromocion);
  const [comboForm, setComboForm] = useState(initialCombo);
  const [comboDetalle, setComboDetalle] = useState([]);

  const [editPromocionId, setEditPromocionId] = useState(null);
  const [editComboId, setEditComboId] = useState(null);

  const [busquedaVariante, setBusquedaVariante] = useState("");

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [detallePanelOpen, setDetallePanelOpen] = useState(false);
  const [detalleTipo, setDetalleTipo] = useState("");
  const [detalleRegistro, setDetalleRegistro] = useState(null);

  const extraerArray = (response) => {
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data?.data)) return response.data.data;

    if (Array.isArray(response?.variantes)) return response.variantes;
    if (Array.isArray(response?.data?.variantes)) return response.data.variantes;

    if (Array.isArray(response?.productos)) return response.productos;
    if (Array.isArray(response?.data?.productos)) return response.data.productos;

    return [];
  };

  const normalizarVariantes = (items) => {
    return items.flatMap((item) => {
      if (Array.isArray(item.variantes)) {
        return item.variantes.map((variante) => ({
          ...variante,
          id_producto: item.id_producto,
          nombre_producto: item.nombre_producto,
          precio_venta:
            variante.precio_venta ??
            item.precio_venta ??
            item.precio_producto ??
            0,
          estado_producto: item.estado_producto,
          imagen_url: variante.imagen_url || item.imagen_url
        }));
      }

      return {
        ...item,
        precio_venta:
          item.precio_venta ??
          item.precio_producto ??
          item.precio_unitario ??
          0
      };
    });
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [promoRes, comboRes, variantesRes] = await Promise.all([
        listarPromociones(),
        listarCombos(),
        listarVariantes()
      ]);

      console.log("PROMOCIONES:", promoRes);
      console.log("COMBOS:", comboRes);
      console.log("VARIANTES:", variantesRes);

      setPromociones(extraerArray(promoRes));
      setCombos(extraerArray(comboRes));

      const variantesNormalizadas = normalizarVariantes(extraerArray(variantesRes));

      console.log("VARIANTES NORMALIZADAS:", variantesNormalizadas);

      setVariantes(variantesNormalizadas);
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message ||
          "No se pudo cargar el módulo de promociones",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

const variantesActivas = useMemo(() => {
  const texto = busquedaVariante.toLowerCase().trim();

  return variantes
    .filter((item) => {
      const estado = String(
        item.estado_variante ||
          item.estado_producto ||
          item.estado ||
          "activo"
      ).toLowerCase();

      return !["inactivo", "inactiva", "eliminado", "eliminada"].includes(
        estado
      );
    })
    .filter((item) => {
      if (!texto) return true;

      return (
        String(item.nombre_producto || "").toLowerCase().includes(texto) ||
        String(item.nombre_color || "").toLowerCase().includes(texto) ||
        String(item.nombre_talla || "").toLowerCase().includes(texto) ||
        String(item.sku || "").toLowerCase().includes(texto)
      );
    });
}, [variantes, busquedaVariante]);

  const nombreVariante = (item) => {
    return `${item.nombre_producto || "Producto"} - ${
      item.nombre_color || "Color"
    } - ${item.nombre_talla || "Talla"}`;
  };

  const claseEstadoPromocion = (estado) => {
    const estadoNormalizado = String(estado || "").toLowerCase();

    if (estadoNormalizado === "activa" || estadoNormalizado === "activo") {
      return "status-badge status-active";
    }

    if (
      estadoNormalizado === "inactiva" ||
      estadoNormalizado === "inactivo" ||
      estadoNormalizado === "vencida"
    ) {
      return "status-badge status-inactive";
    }

    return "status-badge status-warning";
  };

  const abrirCrearPromocion = () => {
    setEditPromocionId(null);
    setPromocionForm(initialPromocion);
    setBusquedaVariante("");
    setPromocionPanelOpen(true);
  };

  const abrirEditarPromocion = (promocion) => {
    const primerDetalle =
      promocion.detalles?.[0] || promocion.detalle?.[0] || promocion;

    setEditPromocionId(promocion.id_promocion);

    setPromocionForm({
      id_variante: primerDetalle.id_variante || promocion.id_variante || "",
      nombre_promocion: promocion.nombre_promocion || "",
      descripcion: promocion.descripcion || "",
      tipo_descuento: promocion.tipo_descuento || "porcentaje",
      valor_descuento: promocion.valor_descuento || "",
      fecha_inicio: promocion.fecha_inicio?.substring(0, 10) || "",
      fecha_fin: promocion.fecha_fin?.substring(0, 10) || "",
      estado_promocion: promocion.estado_promocion || "activa"
    });

    setPromocionPanelOpen(true);
  };

  const cerrarPromocion = () => {
    setEditPromocionId(null);
    setPromocionForm(initialPromocion);
    setBusquedaVariante("");
    setPromocionPanelOpen(false);
  };

  const handlePromocionChange = (event) => {
    setPromocionForm({
      ...promocionForm,
      [event.target.name]: event.target.value
    });
  };

  const validarPromocion = () => {
    if (!promocionForm.id_variante) {
      Swal.fire("Validación", "Seleccione una variante", "warning");
      return false;
    }

    if (!promocionForm.nombre_promocion.trim()) {
      Swal.fire("Validación", "Ingrese el nombre de la promoción", "warning");
      return false;
    }

    if (
      promocionForm.valor_descuento === "" ||
      Number(promocionForm.valor_descuento) <= 0
    ) {
      Swal.fire("Validación", "Ingrese un descuento válido", "warning");
      return false;
    }

    if (
      promocionForm.tipo_descuento === "porcentaje" &&
      Number(promocionForm.valor_descuento) > 100
    ) {
      Swal.fire("Validación", "El porcentaje no puede superar el 100%", "warning");
      return false;
    }

    if (!promocionForm.fecha_inicio || !promocionForm.fecha_fin) {
      Swal.fire("Validación", "Ingrese fecha de inicio y fin", "warning");
      return false;
    }

    if (promocionForm.fecha_inicio > promocionForm.fecha_fin) {
      Swal.fire(
        "Validación",
        "La fecha de inicio no puede ser mayor que la fecha fin",
        "warning"
      );
      return false;
    }

    return true;
  };

  const guardarPromocion = async (event) => {
    event.preventDefault();

    if (!validarPromocion()) return;

    const payload = {
      nombre_promocion: promocionForm.nombre_promocion.trim(),
      descripcion: promocionForm.descripcion.trim() || null,
      tipo_promocion: "descuento_producto",
      tipo_descuento: promocionForm.tipo_descuento,
      valor_descuento: Number(promocionForm.valor_descuento),
      fecha_inicio: promocionForm.fecha_inicio,
      fecha_fin: promocionForm.fecha_fin,
      estado_promocion: promocionForm.estado_promocion,
      detalles: [
        {
          id_producto: null,
          id_variante: Number(promocionForm.id_variante),
          cantidad_minima: 1
        }
      ]
    };

    try {
      setGuardando(true);

      const response = editPromocionId
        ? await actualizarPromocion(editPromocionId, payload)
        : await crearPromocion(payload);

      if (response.ok) {
        Swal.fire(
          editPromocionId ? "Actualizada" : "Creada",
          "Promoción guardada correctamente",
          "success"
        );

        cerrarPromocion();
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo guardar la promoción",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminarPromocion = async (id_promocion) => {
    const confirmacion = await Swal.fire({
      title: "¿Eliminar promoción?",
      text: "La promoción será eliminada o desactivada según la lógica del backend.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const response = await eliminarPromocion(id_promocion);

      if (response.ok) {
        Swal.fire("Eliminada", "Promoción eliminada correctamente", "success");
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo eliminar la promoción",
        "error"
      );
    }
  };

  const abrirCrearCombo = () => {
    setEditComboId(null);
    setComboForm(initialCombo);
    setComboDetalle([]);
    setBusquedaVariante("");
    setComboPanelOpen(true);
  };

  const abrirEditarCombo = (combo) => {
    setEditComboId(combo.id_combo);

    setComboForm({
      nombre_combo: combo.nombre_combo || "",
      descripcion: combo.descripcion || "",
      precio_combo: combo.precio_combo || "",
      fecha_inicio: combo.fecha_inicio?.substring(0, 10) || "",
      fecha_fin: combo.fecha_fin?.substring(0, 10) || "",
      estado_combo: combo.estado_combo || "activo"
    });

    setComboDetalle(combo.detalles || combo.detalle || []);
    setComboPanelOpen(true);
  };

  const cerrarCombo = () => {
    setEditComboId(null);
    setComboForm(initialCombo);
    setComboDetalle([]);
    setBusquedaVariante("");
    setComboPanelOpen(false);
  };

  const handleComboChange = (event) => {
    setComboForm({
      ...comboForm,
      [event.target.name]: event.target.value
    });
  };

  const agregarVarianteCombo = (variante) => {
    const existe = comboDetalle.find(
      (item) => Number(item.id_variante) === Number(variante.id_variante)
    );

    if (existe) {
      setComboDetalle((prev) =>
        prev.map((item) =>
          Number(item.id_variante) === Number(variante.id_variante)
            ? { ...item, cantidad: Number(item.cantidad) + 1 }
            : item
        )
      );
      return;
    }

    setComboDetalle([
      ...comboDetalle,
      {
        id_variante: variante.id_variante,
        nombre_producto: variante.nombre_producto,
        nombre_color: variante.nombre_color,
        nombre_talla: variante.nombre_talla,
        sku: variante.sku,
        stock_actual: variante.stock_actual,
        precio_venta: Number(
          variante.precio_venta ??
            variante.precio_producto ??
            variante.precio_unitario ??
            0
        ),
        cantidad: 1
      }
    ]);
  };

  const cambiarCantidadCombo = (id_variante, value) => {
    const cantidad = Number(value);

    setComboDetalle((prev) =>
      prev.map((item) =>
        Number(item.id_variante) === Number(id_variante)
          ? { ...item, cantidad: cantidad > 0 ? cantidad : 1 }
          : item
      )
    );
  };

  const quitarVarianteCombo = (id_variante) => {
    setComboDetalle((prev) =>
      prev.filter((item) => Number(item.id_variante) !== Number(id_variante))
    );
  };

  const precioNormalCombo = comboDetalle.reduce((acc, item) => {
    return acc + Number(item.precio_venta || 0) * Number(item.cantidad || 0);
  }, 0);

  const validarCombo = () => {
    if (!comboForm.nombre_combo.trim()) {
      Swal.fire("Validación", "Ingrese el nombre del combo", "warning");
      return false;
    }

    if (comboDetalle.length === 0) {
      Swal.fire("Validación", "Agregue al menos un producto al combo", "warning");
      return false;
    }

    if (comboForm.precio_combo === "" || Number(comboForm.precio_combo) <= 0) {
      Swal.fire("Validación", "Ingrese un precio de combo válido", "warning");
      return false;
    }

    if (!comboForm.fecha_inicio || !comboForm.fecha_fin) {
      Swal.fire("Validación", "Ingrese fecha de inicio y fin", "warning");
      return false;
    }

    if (comboForm.fecha_inicio > comboForm.fecha_fin) {
      Swal.fire(
        "Validación",
        "La fecha de inicio no puede ser mayor que la fecha fin",
        "warning"
      );
      return false;
    }

    return true;
  };

  const guardarCombo = async (event) => {
    event.preventDefault();

    if (!validarCombo()) return;

    const payload = {
      id_promocion: null,
      nombre_combo: comboForm.nombre_combo.trim(),
      descripcion: comboForm.descripcion.trim() || null,
      precio_combo: Number(comboForm.precio_combo),
      precio_normal: Number(precioNormalCombo.toFixed(2)),
      fecha_inicio: comboForm.fecha_inicio,
      fecha_fin: comboForm.fecha_fin,
      estado_combo: comboForm.estado_combo,
      detalles: comboDetalle.map((item) => ({
        id_variante: Number(item.id_variante),
        cantidad: Number(item.cantidad),
        precio_referencial: Number(item.precio_venta || 0)
      }))
    };

    try {
      setGuardando(true);

      const response = editComboId
        ? await actualizarCombo(editComboId, payload)
        : await crearCombo(payload);

      if (response.ok) {
        Swal.fire(
          editComboId ? "Actualizado" : "Creado",
          "Combo guardado correctamente",
          "success"
        );

        cerrarCombo();
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo guardar el combo",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminarCombo = async (id_combo) => {
    const confirmacion = await Swal.fire({
      title: "¿Eliminar combo?",
      text: "El combo será eliminado o desactivado según la lógica del backend.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const response = await eliminarCombo(id_combo);

      if (response.ok) {
        Swal.fire("Eliminado", "Combo eliminado correctamente", "success");
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo eliminar el combo",
        "error"
      );
    }
  };

const verDetallePromocion = async (id_promocion) => {
  try {
    const response = await obtenerPromocion(id_promocion);

    if (response.ok) {
      setDetalleTipo("promocion");
      setDetalleRegistro(response.data);
      setDetallePanelOpen(true);
    }
  } catch (error) {
    Swal.fire(
      "Error",
      error.response?.data?.message || "No se pudo obtener el detalle de la promoción",
      "error"
    );
  }
};

const verDetalleCombo = async (id_combo) => {
  try {
    const response = await obtenerCombo(id_combo);

    if (response.ok) {
      setDetalleTipo("combo");
      setDetalleRegistro(response.data);
      setDetallePanelOpen(true);
    }
  } catch (error) {
    Swal.fire(
      "Error",
      error.response?.data?.message || "No se pudo obtener el detalle del combo",
      "error"
    );
  }
};

const cerrarDetalle = () => {
  setDetalleTipo("");
  setDetalleRegistro(null);
  setDetallePanelOpen(false);
};


  if (loading) {
    return <p>Cargando promociones...</p>;
  }

  return (
    <div className="promociones-page">
      <div className="page-header">
        <div>
          <h1>Promociones y combos</h1>
          <p>Gestión comercial de descuentos, campañas y combos de productos.</p>
        </div>

        <button className="btn-secondary" onClick={cargarDatos}>
          Actualizar
        </button>
      </div>

      <div className="catalog-tabs">
        <button
          className={activeTab === "promociones" ? "active" : ""}
          onClick={() => setActiveTab("promociones")}
        >
          Promociones
        </button>

        <button
          className={activeTab === "combos" ? "active" : ""}
          onClick={() => setActiveTab("combos")}
        >
          Combos
        </button>
      </div>

      {activeTab === "promociones" && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Promociones registradas</h2>
              <p>{promociones.length} promociones encontradas</p>
            </div>

            <button className="btn-primary" onClick={abrirCrearPromocion}>
              + Nueva promoción
            </button>
          </div>

          {promociones.length > 0 ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Promoción</th>
                    <th>Tipo</th>
                    <th>Descuento</th>
                    <th>Vigencia</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {promociones.map((promo) => (
                    <tr key={promo.id_promocion}>
                      <td>#{promo.id_promocion}</td>
                      <td>
                        <strong>{promo.nombre_promocion}</strong>
                        <br />
                        <small>{promo.descripcion || "Sin descripción"}</small>
                      </td>

                      <td>{promo.tipo_promocion || "descuento_producto"}</td>

                      <td>
                        {promo.tipo_descuento === "porcentaje"
                          ? `${Number(promo.valor_descuento || 0).toFixed(2)}%`
                          : `S/ ${Number(promo.valor_descuento || 0).toFixed(2)}`}
                      </td>

                      <td>
                        {promo.fecha_inicio || "-"} <br />
                        <small>hasta {promo.fecha_fin || "-"}</small>
                      </td>

                      <td>
                        <span className={claseEstadoPromocion(promo.estado_promocion)}>
                          {promo.estado_promocion}
                        </span>
                      </td>

                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-small"
                            onClick={() => abrirEditarPromocion(promo)}
                          >
                            Editar
                          </button>

                            <button
                              className="btn-small"
                              onClick={() => verDetallePromocion(promo.id_promocion)}
                            >
                              Ver
                            </button>

                          <button
                            className="btn-small btn-danger"
                            onClick={() =>
                              confirmarEliminarPromocion(promo.id_promocion)
                            }
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
            <p>No hay promociones registradas.</p>
          )}
        </section>
      )}

      {activeTab === "combos" && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Combos registrados</h2>
              <p>{combos.length} combos encontrados</p>
            </div>

            <button className="btn-primary" onClick={abrirCrearCombo}>
              + Nuevo combo
            </button>
          </div>

          {combos.length > 0 ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Combo</th>
                    <th>Precio normal</th>
                    <th>Precio combo</th>
                    <th>Vigencia</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {combos.map((combo) => (
                    <tr key={combo.id_combo}>
                      <td>#{combo.id_combo}</td>
                      <td>
                        <strong>{combo.nombre_combo}</strong>
                        <br />
                        <small>{combo.descripcion || "Sin descripción"}</small>
                      </td>
                      <td>S/ {Number(combo.precio_normal || 0).toFixed(2)}</td>
                      <td>S/ {Number(combo.precio_combo || 0).toFixed(2)}</td>
                      <td>
                        {combo.fecha_inicio || "-"} <br />
                        <small>hasta {combo.fecha_fin || "-"}</small>
                      </td>
                      <td>
                        <span className={claseEstadoPromocion(combo.estado_combo)}>
                          {combo.estado_combo}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-small"
                            onClick={() => verDetalleCombo(combo.id_combo)}
                          >
                            Ver
                          </button>

                          <button
                            className="btn-small"
                            onClick={() => abrirEditarCombo(combo)}
                          >
                            Editar
                          </button>

                          <button
                            className="btn-small btn-danger"
                            onClick={() => confirmarEliminarCombo(combo.id_combo)}
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
            <p>No hay combos registrados.</p>
          )}
        </section>
      )}

      {promocionPanelOpen && (
        <>
          <div className="drawer-overlay" onClick={cerrarPromocion} />

          <aside className="drawer-panel drawer-wide">
            <div className="drawer-header">
              <div>
                <h2>{editPromocionId ? "Editar promoción" : "Nueva promoción"}</h2>
                <p>Configure un descuento aplicado a una variante.</p>
              </div>

              <button className="drawer-close" onClick={cerrarPromocion}>
                ×
              </button>
            </div>

            <form className="drawer-form" onSubmit={guardarPromocion}>
              <div className="form-group">
                <label>Buscar producto</label>
                <input
                  type="text"
                  value={busquedaVariante}
                  onChange={(e) => setBusquedaVariante(e.target.value)}
                  placeholder="Buscar por producto, color, talla o SKU"
                />
              </div>

              <div className="form-group">
                <label>Producto / variante</label>
                <select
                  name="id_variante"
                  value={promocionForm.id_variante}
                  onChange={handlePromocionChange}
                >
                  <option value="">Seleccione variante</option>

                  {variantesActivas.map((variante) => (
                    <option
                      key={variante.id_variante}
                      value={variante.id_variante}
                    >
                      {nombreVariante(variante)} - SKU: {variante.sku || "Sin SKU"}
                    </option>
                  ))}
                </select>

                {variantesActivas.length === 0 && (
                  <small>
                    No hay variantes disponibles. Revisa la consola en
                    “VARIANTES NORMALIZADAS”.
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Nombre de promoción</label>
                <input
                  type="text"
                  name="nombre_promocion"
                  value={promocionForm.nombre_promocion}
                  onChange={handlePromocionChange}
                  placeholder="Ej. 10% en polos"
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  name="descripcion"
                  value={promocionForm.descripcion}
                  onChange={handlePromocionChange}
                  placeholder="Descripción de la promoción"
                />
              </div>

              <div className="form-group">
                <label>Tipo de descuento</label>
                <select
                  name="tipo_descuento"
                  value={promocionForm.tipo_descuento}
                  onChange={handlePromocionChange}
                >
                  <option value="porcentaje">Porcentaje</option>
                  <option value="monto_fijo">Monto fijo</option>
                </select>
              </div>

              <div className="form-group">
                <label>Valor descuento</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="valor_descuento"
                  value={promocionForm.valor_descuento}
                  onChange={handlePromocionChange}
                />
              </div>

              <div className="form-group">
                <label>Fecha inicio</label>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={promocionForm.fecha_inicio}
                  onChange={handlePromocionChange}
                />
              </div>

              <div className="form-group">
                <label>Fecha fin</label>
                <input
                  type="date"
                  name="fecha_fin"
                  value={promocionForm.fecha_fin}
                  onChange={handlePromocionChange}
                />
              </div>

              <div className="form-group">
                <label>Estado</label>
                <select
                  name="estado_promocion"
                  value={promocionForm.estado_promocion}
                  onChange={handlePromocionChange}
                >
                  <option value="activa">Activa</option>
                  <option value="inactiva">Inactiva</option>
                  <option value="vencida">Vencida</option>
                </select>
              </div>

              <div className="drawer-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cerrarPromocion}
                >
                  Cancelar
                </button>

                <button type="submit" className="btn-primary" disabled={guardando}>
                  {guardando
                    ? "Guardando..."
                    : editPromocionId
                    ? "Guardar cambios"
                    : "Crear promoción"}
                </button>
              </div>
            </form>
          </aside>
        </>
      )}

      {comboPanelOpen && (
        <>
          <div className="drawer-overlay" onClick={cerrarCombo} />

          <aside className="drawer-panel drawer-wide">
            <div className="drawer-header">
              <div>
                <h2>{editComboId ? "Editar combo" : "Nuevo combo"}</h2>
                <p>Configure un paquete comercial con varios productos.</p>
              </div>

              <button className="drawer-close" onClick={cerrarCombo}>
                ×
              </button>
            </div>

            <form className="drawer-form" onSubmit={guardarCombo}>
              <h3>Datos del combo</h3>

              <div className="form-group">
                <label>Nombre del combo</label>
                <input
                  type="text"
                  name="nombre_combo"
                  value={comboForm.nombre_combo}
                  onChange={handleComboChange}
                  placeholder="Ej. Combo urbano"
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  name="descripcion"
                  value={comboForm.descripcion}
                  onChange={handleComboChange}
                  placeholder="Descripción del combo"
                />
              </div>

              <div className="form-group">
                <label>Precio normal</label>
                <input
                  type="text"
                  value={`S/ ${precioNormalCombo.toFixed(2)}`}
                  disabled
                />
              </div>

              <div className="form-group">
                <label>Precio combo</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="precio_combo"
                  value={comboForm.precio_combo}
                  onChange={handleComboChange}
                />
              </div>

              <div className="form-group">
                <label>Fecha inicio</label>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={comboForm.fecha_inicio}
                  onChange={handleComboChange}
                />
              </div>

              <div className="form-group">
                <label>Fecha fin</label>
                <input
                  type="date"
                  name="fecha_fin"
                  value={comboForm.fecha_fin}
                  onChange={handleComboChange}
                />
              </div>

              <div className="form-group">
                <label>Estado</label>
                <select
                  name="estado_combo"
                  value={comboForm.estado_combo}
                  onChange={handleComboChange}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>

                  <h3>Productos del combo</h3>

                <div className="combo-builder-section form-full">
                  <h3>Productos del combo</h3>

                  <div className="form-group">
                    <label>Buscar producto</label>
                    <input
                      type="text"
                      value={busquedaVariante}
                      onChange={(e) => setBusquedaVariante(e.target.value)}
                      placeholder="Buscar por producto, color, talla o SKU"
                    />
                    <small>
                      Variantes encontradas: <strong>{variantesActivas.length}</strong>
                    </small>
                  </div>

                  <div className="table-wrapper combo-search-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Color</th>
                          <th>Talla</th>
                          <th>SKU</th>
                          <th>Stock</th>
                          <th>Precio</th>
                          <th>Acción</th>
                        </tr>
                      </thead>

                      <tbody>
                        {variantesActivas.length > 0 ? (
                          variantesActivas.map((variante) => {
                            const yaAgregado = comboDetalle.some(
                              (item) =>
                                Number(item.id_variante) === Number(variante.id_variante)
                            );

                            return (
                              <tr key={variante.id_variante}>
                                <td>{variante.nombre_producto || "Producto sin nombre"}</td>
                                <td>{variante.nombre_color || "-"}</td>
                                <td>{variante.nombre_talla || "-"}</td>
                                <td>{variante.sku || "Sin SKU"}</td>
                                <td>{variante.stock_actual ?? "-"}</td>
                                <td>
                                  S/{" "}
                                  {Number(
                                    variante.precio_venta ??
                                      variante.precio_producto ??
                                      variante.precio_unitario ??
                                      0
                                  ).toFixed(2)}
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className={yaAgregado ? "btn-small btn-success" : "btn-small"}
                                    onClick={() => agregarVarianteCombo(variante)}
                                  >
                                    {yaAgregado ? "Agregar +1" : "Agregar"}
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="7">
                              No hay productos disponibles. Verifica que existan variantes activas
                              con color, talla y stock.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <h3>Detalle del combo</h3>

                  {comboDetalle.length > 0 ? (
                    <div className="table-wrapper combo-detail-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>SKU</th>
                            <th>Cantidad</th>
                            <th>Precio unitario</th>
                            <th>Subtotal</th>
                            <th>Acción</th>
                          </tr>
                        </thead>

                        <tbody>
                          {comboDetalle.map((item) => (
                            <tr key={item.id_variante}>
                              <td>{nombreVariante(item)}</td>
                              <td>{item.sku || "Sin SKU"}</td>
                              <td>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.cantidad}
                                  onChange={(e) =>
                                    cambiarCantidadCombo(item.id_variante, e.target.value)
                                  }
                                  style={{ width: "80px" }}
                                />
                              </td>
                              <td>S/ {Number(item.precio_venta || 0).toFixed(2)}</td>
                              <td>
                                S/{" "}
                                {(
                                  Number(item.precio_venta || 0) *
                                  Number(item.cantidad || 0)
                                ).toFixed(2)}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn-small btn-danger"
                                  onClick={() => quitarVarianteCombo(item.id_variante)}
                                >
                                  Quitar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>

                        <tfoot>
                          <tr>
                            <td colSpan="4">
                              <strong>Total normal</strong>
                            </td>
                            <td colSpan="2">
                              <strong>S/ {precioNormalCombo.toFixed(2)}</strong>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <p>No hay productos agregados al combo.</p>
                  )}
                </div>

              <div className="drawer-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cerrarCombo}
                >
                  Cancelar
                </button>

                <button type="submit" className="btn-primary" disabled={guardando}>
                  {guardando
                    ? "Guardando..."
                    : editComboId
                    ? "Guardar cambios"
                    : "Crear combo"}
                </button>
              </div>
            </form>
          </aside>
        </>
      )}

{detallePanelOpen && detalleRegistro && (
  <>
    <div className="drawer-overlay" onClick={cerrarDetalle} />

    <aside className="drawer-panel drawer-wide">
      <div className="drawer-header">
        <div>
          <h2>
            {detalleTipo === "promocion"
              ? `Detalle de promoción #${detalleRegistro.id_promocion}`
              : `Detalle de combo #${detalleRegistro.id_combo}`}
          </h2>
          <p>Información completa del registro seleccionado.</p>
        </div>

        <button className="drawer-close" onClick={cerrarDetalle}>
          ×
        </button>
      </div>

      {detalleTipo === "promocion" && (
        <div className="sale-detail-content">
          <div className="detail-grid">
            <div className="detail-item">
              <span>Nombre</span>
              <strong>{detalleRegistro.nombre_promocion}</strong>
            </div>

            <div className="detail-item">
              <span>Tipo promoción</span>
              <strong>{detalleRegistro.tipo_promocion}</strong>
            </div>

            <div className="detail-item">
              <span>Tipo descuento</span>
              <strong>{detalleRegistro.tipo_descuento}</strong>
            </div>

            <div className="detail-item">
              <span>Valor descuento</span>
              <strong>
                {detalleRegistro.tipo_descuento === "porcentaje"
                  ? `${Number(detalleRegistro.valor_descuento || 0).toFixed(2)}%`
                  : `S/ ${Number(detalleRegistro.valor_descuento || 0).toFixed(2)}`}
              </strong>
            </div>

            <div className="detail-item">
              <span>Vigencia</span>
              <strong>
                {detalleRegistro.fecha_inicio || "-"} al{" "}
                {detalleRegistro.fecha_fin || "-"}
              </strong>
            </div>

            <div className="detail-item">
              <span>Estado</span>
              <strong>{detalleRegistro.estado_promocion}</strong>
            </div>
          </div>

          <h3>Productos de la promoción</h3>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>SKU</th>
                  <th>Color</th>
                  <th>Talla</th>
                  <th>Cantidad mínima</th>
                </tr>
              </thead>

              <tbody>
                {(detalleRegistro.detalles || []).length > 0 ? (
                  detalleRegistro.detalles.map((item, index) => (
                    <tr key={item.id_promocion_producto || index}>
                      <td>{item.nombre_producto || "Producto"}</td>
                      <td>{item.sku || "-"}</td>
                      <td>{item.nombre_color || "-"}</td>
                      <td>{item.nombre_talla || "-"}</td>
                      <td>{item.cantidad_minima || 1}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">No hay detalle registrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detalleTipo === "combo" && (
        <div className="sale-detail-content">
          <div className="detail-grid">
            <div className="detail-item">
              <span>Nombre</span>
              <strong>{detalleRegistro.nombre_combo}</strong>
            </div>

            <div className="detail-item">
              <span>Precio normal</span>
              <strong>S/ {Number(detalleRegistro.precio_normal || 0).toFixed(2)}</strong>
            </div>

            <div className="detail-item">
              <span>Precio combo</span>
              <strong>S/ {Number(detalleRegistro.precio_combo || 0).toFixed(2)}</strong>
            </div>

            <div className="detail-item">
              <span>Vigencia</span>
              <strong>
                {detalleRegistro.fecha_inicio || "-"} al{" "}
                {detalleRegistro.fecha_fin || "-"}
              </strong>
            </div>

            <div className="detail-item">
              <span>Estado</span>
              <strong>{detalleRegistro.estado_combo}</strong>
            </div>
          </div>

          <h3>Productos del combo</h3>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>SKU</th>
                  <th>Color</th>
                  <th>Talla</th>
                  <th>Cantidad</th>
                  <th>Precio ref.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>

              <tbody>
                {(detalleRegistro.detalles || []).length > 0 ? (
                  detalleRegistro.detalles.map((item, index) => (
                    <tr key={item.id_combo_detalle || index}>
                      <td>{item.nombre_producto || "Producto"}</td>
                      <td>{item.sku || "-"}</td>
                      <td>{item.nombre_color || "-"}</td>
                      <td>{item.nombre_talla || "-"}</td>
                      <td>{item.cantidad || 1}</td>
                      <td>S/ {Number(item.precio_referencial || 0).toFixed(2)}</td>
                      <td>
                        S/{" "}
                        {(
                          Number(item.precio_referencial || 0) *
                          Number(item.cantidad || 0)
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">No hay productos registrados en este combo.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </aside>
  </>
)}

    </div>
  );
};

export default Promociones;