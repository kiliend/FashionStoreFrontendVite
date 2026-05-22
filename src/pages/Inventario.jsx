import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import {
  listarVariantes,
  crearVariante,
  actualizarVariante,
  eliminarVariante
} from "../services/variantes.service";

import { listarProductos } from "../services/productos.service";
import { listarColores } from "../services/colores.service";
import { listarTallas } from "../services/tallas.service";

const initialForm = {
  id_producto: "",
  id_color: "",
  id_talla: "",
  sku: "",
  stock_actual: 0,
  stock_minimo: 5,
  estado_variante: "activo"
};

const Inventario = () => {
  const [variantes, setVariantes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [colores, setColores] = useState([]);
  const [tallas, setTallas] = useState([]);

  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [varRes, prodRes, colRes, talRes] = await Promise.all([
        listarVariantes(),
        listarProductos(),
        listarColores(),
        listarTallas()
      ]);

      if (varRes.ok) setVariantes(varRes.data);
      if (prodRes.ok) setProductos(prodRes.data);
      if (colRes.ok) setColores(colRes.data);
      if (talRes.ok) setTallas(talRes.data);
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo cargar el inventario",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirCrear = () => {
    setEditId(null);
    setForm(initialForm);
    setPanelOpen(true);
  };

  const abrirEditar = (variante) => {
    setEditId(variante.id_variante);

    setForm({
      id_producto: variante.id_producto || "",
      id_color: variante.id_color || "",
      id_talla: variante.id_talla || "",
      sku: variante.sku || "",
      stock_actual: variante.stock_actual || 0,
      stock_minimo: variante.stock_minimo || 5,
      estado_variante: variante.estado_variante || "activo"
    });

    setPanelOpen(true);
  };

  const cerrarPanel = () => {
    setPanelOpen(false);
    setEditId(null);
    setForm(initialForm);
  };

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  };

  const generarSkuAutomatico = () => {
    const producto = productos.find(
      (item) => Number(item.id_producto) === Number(form.id_producto)
    );

    const color = colores.find(
      (item) => Number(item.id_color) === Number(form.id_color)
    );

    const talla = tallas.find(
      (item) => Number(item.id_talla) === Number(form.id_talla)
    );

    if (!producto || !color || !talla) {
      Swal.fire(
        "Datos incompletos",
        "Seleccione producto, color y talla para generar el SKU",
        "warning"
      );
      return;
    }

    const productoCodigo = producto.nombre_producto
      .substring(0, 4)
      .toUpperCase()
      .replace(/\s/g, "");

    const colorCodigo = color.nombre_color
      .substring(0, 3)
      .toUpperCase()
      .replace(/\s/g, "");

    const tallaCodigo = talla.nombre_talla.toUpperCase().replace(/\s/g, "");

    const sku = `${productoCodigo}-${colorCodigo}-${tallaCodigo}`;

    setForm({
      ...form,
      sku
    });
  };

  const validarFormulario = () => {
    if (!form.id_producto) {
      Swal.fire("Validación", "Seleccione un producto", "warning");
      return false;
    }

    if (!form.id_color) {
      Swal.fire("Validación", "Seleccione un color", "warning");
      return false;
    }

    if (!form.id_talla) {
      Swal.fire("Validación", "Seleccione una talla", "warning");
      return false;
    }

    if (!form.sku.trim()) {
      Swal.fire("Validación", "Ingrese o genere un SKU", "warning");
      return false;
    }

    if (Number(form.stock_actual) < 0) {
      Swal.fire("Validación", "El stock actual no puede ser negativo", "warning");
      return false;
    }

    if (Number(form.stock_minimo) < 0) {
      Swal.fire("Validación", "El stock mínimo no puede ser negativo", "warning");
      return false;
    }

    return true;
  };

  const guardarVariante = async (event) => {
    event.preventDefault();

    if (!validarFormulario()) return;

    const payload = {
      id_producto: Number(form.id_producto),
      id_color: Number(form.id_color),
      id_talla: Number(form.id_talla),
      sku: form.sku.trim().toUpperCase(),
      stock_actual: Number(form.stock_actual),
      stock_minimo: Number(form.stock_minimo),
      estado_variante: form.estado_variante
    };

    try {
      if (editId) {
        await actualizarVariante(editId, payload);
        Swal.fire("Actualizado", "Variante actualizada correctamente", "success");
      } else {
        await crearVariante(payload);
        Swal.fire("Creado", "Variante creada correctamente", "success");
      }

      cerrarPanel();
      cargarDatos();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo guardar la variante",
        "error"
      );
    }
  };

  const confirmarEliminar = async (id) => {
    const confirmacion = await Swal.fire({
      title: "¿Eliminar variante?",
      text: "La variante será eliminada lógicamente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (!confirmacion.isConfirmed) return;

    try {
      await eliminarVariante(id);
      Swal.fire("Eliminado", "Variante eliminada correctamente", "success");
      cargarDatos();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo eliminar la variante",
        "error"
      );
    }
  };

  if (loading) {
    return <p>Cargando inventario...</p>;
  }

  return (
    <div className="inventario-page">
      <div className="page-header">
        <div>
          <h1>Inventario</h1>
          <p>Gestión de variantes, stock y alertas de productos.</p>
        </div>

        <button className="btn-primary" onClick={abrirCrear}>
          + Nueva variante
        </button>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Variantes registradas</h2>
            <p>{variantes.length} variantes encontradas</p>
          </div>

          <button className="btn-secondary" onClick={cargarDatos}>
            Actualizar
          </button>
        </div>

        {variantes.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Producto</th>
                  <th>Color</th>
                  <th>Talla</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Mínimo</th>
                  <th>Alerta</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {variantes.map((variante) => (
                  <tr key={variante.id_variante}>
                    <td>{variante.id_variante}</td>
                    <td>{variante.nombre_producto}</td>
                    <td>
                      <span className="color-cell">
                        <span
                          className="color-dot"
                          style={{
                            background: variante.codigo_hex || "#000000"
                          }}
                        />
                        {variante.nombre_color}
                      </span>
                    </td>
                    <td>{variante.nombre_talla}</td>
                    <td>
                      <strong>{variante.sku}</strong>
                    </td>
                    <td>{variante.stock_actual}</td>
                    <td>{variante.stock_minimo}</td>
                    <td>
                      {Number(variante.stock_actual) <=
                      Number(variante.stock_minimo) ? (
                        <span className="status-badge status-danger">
                          Stock bajo
                        </span>
                      ) : (
                        <span className="status-badge status-active">
                          Correcto
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={
                          variante.estado_variante === "activo"
                            ? "status-badge status-active"
                            : "status-badge status-inactive"
                        }
                      >
                        {variante.estado_variante}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-small"
                          onClick={() => abrirEditar(variante)}
                        >
                          Editar
                        </button>

                        <button
                          className="btn-small btn-danger"
                          onClick={() =>
                            confirmarEliminar(variante.id_variante)
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
          <p>No hay variantes registradas.</p>
        )}
      </section>

      {panelOpen && (
        <>
          <div className="drawer-overlay" onClick={cerrarPanel} />

          <aside className="drawer-panel">
            <div className="drawer-header">
              <div>
                <h2>{editId ? "Editar variante" : "Crear variante"}</h2>
                <p>Seleccione producto, color, talla y stock.</p>
              </div>

              <button className="drawer-close" onClick={cerrarPanel}>
                ×
              </button>
            </div>

            <form className="drawer-form" onSubmit={guardarVariante}>
              <div className="form-group">
                <label>Producto</label>
                <select
                  name="id_producto"
                  value={form.id_producto}
                  onChange={handleChange}
                >
                  <option value="">Seleccione producto</option>
                  {productos.map((producto) => (
                    <option
                      key={producto.id_producto}
                      value={producto.id_producto}
                    >
                      {producto.nombre_producto}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Color</label>
                <select
                  name="id_color"
                  value={form.id_color}
                  onChange={handleChange}
                >
                  <option value="">Seleccione color</option>
                  {colores.map((color) => (
                    <option key={color.id_color} value={color.id_color}>
                      {color.nombre_color}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Talla</label>
                <select
                  name="id_talla"
                  value={form.id_talla}
                  onChange={handleChange}
                >
                  <option value="">Seleccione talla</option>
                  {tallas.map((talla) => (
                    <option key={talla.id_talla} value={talla.id_talla}>
                      {talla.nombre_talla}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>SKU</label>
                <div className="sku-row">
                  <input
                    type="text"
                    name="sku"
                    value={form.sku}
                    onChange={handleChange}
                    placeholder="Ej. POLO-NEG-M"
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={generarSkuAutomatico}
                  >
                    Generar
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Stock actual</label>
                <input
                  type="number"
                  name="stock_actual"
                  value={form.stock_actual}
                  onChange={handleChange}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Stock mínimo</label>
                <input
                  type="number"
                  name="stock_minimo"
                  value={form.stock_minimo}
                  onChange={handleChange}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Estado</label>
                <select
                  name="estado_variante"
                  value={form.estado_variante}
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
                  {editId ? "Guardar cambios" : "Crear variante"}
                </button>
              </div>
            </form>
          </aside>
        </>
      )}
    </div>
  );
};

export default Inventario;