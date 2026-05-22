import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import {
  listarCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria
} from "../services/categorias.service";

import {
  listarColores,
  crearColor,
  actualizarColor,
  eliminarColor
} from "../services/colores.service";

import {
  listarTallas,
  crearTalla,
  actualizarTalla,
  eliminarTalla
} from "../services/tallas.service";

const initialForms = {
  categorias: {
    nombre_categoria: "",
    descripcion: "",
    estado_categoria: "activo"
  },
  colores: {
    nombre_color: "",
    codigo_hex: "#000000",
    estado_color: "activo"
  },
  tallas: {
    nombre_talla: "",
    descripcion: "",
    estado_talla: "activo"
  }
};

const Catalogos = () => {
  const [activeTab, setActiveTab] = useState("categorias");

  const [categorias, setCategorias] = useState([]);
  const [colores, setColores] = useState([]);
  const [tallas, setTallas] = useState([]);

  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForms.categorias);

  const cargarCatalogos = async () => {
    try {
      setLoading(true);

      const [catRes, colRes, talRes] = await Promise.all([
        listarCategorias(),
        listarColores(),
        listarTallas()
      ]);

      if (catRes.ok) setCategorias(catRes.data);
      if (colRes.ok) setColores(colRes.data);
      if (talRes.ok) setTallas(talRes.data);
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudieron cargar los catálogos",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCatalogos();
  }, []);

  const getTitle = () => {
    const titles = {
      categorias: "Categorías",
      colores: "Colores",
      tallas: "Tallas"
    };

    return titles[activeTab];
  };

  const getCreateButtonText = () => {
    const text = {
      categorias: "Nueva categoría",
      colores: "Nuevo color",
      tallas: "Nueva talla"
    };

    return text[activeTab];
  };

  const abrirCrear = () => {
    setEditId(null);
    setForm(initialForms[activeTab]);
    setPanelOpen(true);
  };

  const abrirEditar = (item) => {
    setEditId(getItemId(item));

    if (activeTab === "categorias") {
      setForm({
        nombre_categoria: item.nombre_categoria || "",
        descripcion: item.descripcion || "",
        estado_categoria: item.estado_categoria || "activo"
      });
    }

    if (activeTab === "colores") {
      setForm({
        nombre_color: item.nombre_color || "",
        codigo_hex: item.codigo_hex || "#000000",
        estado_color: item.estado_color || "activo"
      });
    }

    if (activeTab === "tallas") {
      setForm({
        nombre_talla: item.nombre_talla || "",
        descripcion: item.descripcion || "",
        estado_talla: item.estado_talla || "activo"
      });
    }

    setPanelOpen(true);
  };

  const cerrarPanel = () => {
    setPanelOpen(false);
    setEditId(null);
    setForm(initialForms[activeTab]);
  };

  const getItemId = (item) => {
    if (activeTab === "categorias") return item.id_categoria;
    if (activeTab === "colores") return item.id_color;
    if (activeTab === "tallas") return item.id_talla;
    return null;
  };

  const getData = () => {
    if (activeTab === "categorias") return categorias;
    if (activeTab === "colores") return colores;
    if (activeTab === "tallas") return tallas;
    return [];
  };

  const cambiarTab = (tab) => {
    setActiveTab(tab);
    setPanelOpen(false);
    setEditId(null);
    setForm(initialForms[tab]);
  };

  const validarFormulario = () => {
    if (activeTab === "categorias" && !form.nombre_categoria.trim()) {
      Swal.fire("Validación", "Ingrese el nombre de la categoría", "warning");
      return false;
    }

    if (activeTab === "colores" && !form.nombre_color.trim()) {
      Swal.fire("Validación", "Ingrese el nombre del color", "warning");
      return false;
    }

    if (activeTab === "tallas" && !form.nombre_talla.trim()) {
      Swal.fire("Validación", "Ingrese el nombre de la talla", "warning");
      return false;
    }

    return true;
  };

  const guardar = async (event) => {
    event.preventDefault();

    if (!validarFormulario()) return;

    try {
      if (activeTab === "categorias") {
        const payload = {
          nombre_categoria: form.nombre_categoria.trim(),
          descripcion: form.descripcion.trim(),
          estado_categoria: form.estado_categoria
        };

        if (editId) {
          await actualizarCategoria(editId, payload);
        } else {
          await crearCategoria(payload);
        }
      }

      if (activeTab === "colores") {
        const payload = {
          nombre_color: form.nombre_color.trim(),
          codigo_hex: form.codigo_hex,
          estado_color: form.estado_color
        };

        if (editId) {
          await actualizarColor(editId, payload);
        } else {
          await crearColor(payload);
        }
      }

      if (activeTab === "tallas") {
        const payload = {
          nombre_talla: form.nombre_talla.trim(),
          descripcion: form.descripcion.trim(),
          estado_talla: form.estado_talla
        };

        if (editId) {
          await actualizarTalla(editId, payload);
        } else {
          await crearTalla(payload);
        }
      }

      Swal.fire(
        editId ? "Actualizado" : "Creado",
        `${getTitle().slice(0, -1)} guardado correctamente`,
        "success"
      );

      cerrarPanel();
      cargarCatalogos();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo guardar el registro",
        "error"
      );
    }
  };

  const confirmarEliminar = async (item) => {
    const id = getItemId(item);

    const confirmacion = await Swal.fire({
      title: "¿Eliminar registro?",
      text: "El registro será eliminado lógicamente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (!confirmacion.isConfirmed) return;

    try {
      if (activeTab === "categorias") await eliminarCategoria(id);
      if (activeTab === "colores") await eliminarColor(id);
      if (activeTab === "tallas") await eliminarTalla(id);

      Swal.fire("Eliminado", "Registro eliminado correctamente", "success");
      cargarCatalogos();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo eliminar el registro",
        "error"
      );
    }
  };

  if (loading) {
    return <p>Cargando catálogos...</p>;
  }

  return (
    <div className="catalogos-page">
      <div className="page-header">
        <div>
          <h1>Catálogos</h1>
          <p>Administra los catálogos base del sistema.</p>
        </div>

        <button className="btn-primary" onClick={abrirCrear}>
          + {getCreateButtonText()}
        </button>
      </div>

      <div className="catalog-tabs">
        <button
          className={activeTab === "categorias" ? "active" : ""}
          onClick={() => cambiarTab("categorias")}
        >
          Categorías
        </button>

        <button
          className={activeTab === "colores" ? "active" : ""}
          onClick={() => cambiarTab("colores")}
        >
          Colores
        </button>

        <button
          className={activeTab === "tallas" ? "active" : ""}
          onClick={() => cambiarTab("tallas")}
        >
          Tallas
        </button>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>{getTitle()}</h2>
            <p>{getData().length} registros encontrados</p>
          </div>

          <button className="btn-secondary" onClick={cargarCatalogos}>
            Actualizar
          </button>
        </div>

        <CatalogTable
          activeTab={activeTab}
          data={getData()}
          onEdit={abrirEditar}
          onDelete={confirmarEliminar}
        />
      </section>

      {panelOpen && (
        <CatalogSidePanel
          activeTab={activeTab}
          title={getTitle()}
          editId={editId}
          form={form}
          setForm={setForm}
          onClose={cerrarPanel}
          onSubmit={guardar}
        />
      )}

      {panelOpen && <div className="drawer-overlay" onClick={cerrarPanel} />}
    </div>
  );
};

const CatalogTable = ({ activeTab, data, onEdit, onDelete }) => {
  if (data.length === 0) {
    return <p>No hay registros en este catálogo.</p>;
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          {activeTab === "categorias" && (
            <tr>
              <th>ID</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          )}

          {activeTab === "colores" && (
            <tr>
              <th>ID</th>
              <th>Color</th>
              <th>Código HEX</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          )}

          {activeTab === "tallas" && (
            <tr>
              <th>ID</th>
              <th>Talla</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          )}
        </thead>

        <tbody>
          {data.map((item) => (
            <tr key={getRowKey(activeTab, item)}>
              {activeTab === "categorias" && (
                <>
                  <td>{item.id_categoria}</td>
                  <td>
                    <strong>{item.nombre_categoria}</strong>
                  </td>
                  <td>{item.descripcion || "Sin descripción"}</td>
                  <td>
                    <StatusBadge estado={item.estado_categoria} />
                  </td>
                </>
              )}

              {activeTab === "colores" && (
                <>
                  <td>{item.id_color}</td>
                  <td>
                    <span className="color-cell">
                      <span
                        className="color-dot"
                        style={{ background: item.codigo_hex || "#000000" }}
                      />
                      <strong>{item.nombre_color}</strong>
                    </span>
                  </td>
                  <td>{item.codigo_hex}</td>
                  <td>
                    <StatusBadge estado={item.estado_color} />
                  </td>
                </>
              )}

              {activeTab === "tallas" && (
                <>
                  <td>{item.id_talla}</td>
                  <td>
                    <strong>{item.nombre_talla}</strong>
                  </td>
                  <td>{item.descripcion || "Sin descripción"}</td>
                  <td>
                    <StatusBadge estado={item.estado_talla} />
                  </td>
                </>
              )}

              <td>
                <div className="table-actions">
                  <button className="btn-small" onClick={() => onEdit(item)}>
                    Editar
                  </button>

                  <button
                    className="btn-small btn-danger"
                    onClick={() => onDelete(item)}
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
  );
};

const getRowKey = (activeTab, item) => {
  if (activeTab === "categorias") return item.id_categoria;
  if (activeTab === "colores") return item.id_color;
  if (activeTab === "tallas") return item.id_talla;
  return crypto.randomUUID();
};

const StatusBadge = ({ estado }) => {
  return (
    <span
      className={
        estado === "activo"
          ? "status-badge status-active"
          : "status-badge status-inactive"
      }
    >
      {estado}
    </span>
  );
};

const CatalogSidePanel = ({
  activeTab,
  title,
  editId,
  form,
  setForm,
  onClose,
  onSubmit
}) => {
  return (
    <aside className="drawer-panel">
      <div className="drawer-header">
        <div>
          <h2>{editId ? `Editar ${title.slice(0, -1)}` : `Crear ${title.slice(0, -1)}`}</h2>
          <p>Complete la información del registro.</p>
        </div>

        <button className="drawer-close" onClick={onClose}>
          ×
        </button>
      </div>

      <form onSubmit={onSubmit} className="drawer-form">
        {activeTab === "categorias" && (
          <>
            <div className="form-group">
              <label>Nombre de categoría</label>
              <input
                type="text"
                value={form.nombre_categoria}
                onChange={(e) =>
                  setForm({ ...form, nombre_categoria: e.target.value })
                }
                placeholder="Ej. Polos"
              />
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={(e) =>
                  setForm({ ...form, descripcion: e.target.value })
                }
                placeholder="Descripción de la categoría"
              />
            </div>

            <div className="form-group">
              <label>Estado</label>
              <select
                value={form.estado_categoria}
                onChange={(e) =>
                  setForm({ ...form, estado_categoria: e.target.value })
                }
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </>
        )}

        {activeTab === "colores" && (
          <>
            <div className="form-group">
              <label>Nombre de color</label>
              <input
                type="text"
                value={form.nombre_color}
                onChange={(e) =>
                  setForm({ ...form, nombre_color: e.target.value })
                }
                placeholder="Ej. Negro"
              />
            </div>

            <div className="form-group">
              <label>Código HEX</label>
              <div className="color-input-row">
                <input
                  type="color"
                  value={form.codigo_hex}
                  onChange={(e) =>
                    setForm({ ...form, codigo_hex: e.target.value })
                  }
                />

                <input
                  type="text"
                  value={form.codigo_hex}
                  onChange={(e) =>
                    setForm({ ...form, codigo_hex: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label>Estado</label>
              <select
                value={form.estado_color}
                onChange={(e) =>
                  setForm({ ...form, estado_color: e.target.value })
                }
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </>
        )}

        {activeTab === "tallas" && (
          <>
            <div className="form-group">
              <label>Nombre de talla</label>
              <input
                type="text"
                value={form.nombre_talla}
                onChange={(e) =>
                  setForm({ ...form, nombre_talla: e.target.value })
                }
                placeholder="Ej. M"
              />
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={(e) =>
                  setForm({ ...form, descripcion: e.target.value })
                }
                placeholder="Descripción de la talla"
              />
            </div>

            <div className="form-group">
              <label>Estado</label>
              <select
                value={form.estado_talla}
                onChange={(e) =>
                  setForm({ ...form, estado_talla: e.target.value })
                }
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </>
        )}

        <div className="drawer-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>

          <button type="submit" className="btn-primary">
            {editId ? "Guardar cambios" : "Crear registro"}
          </button>
        </div>
      </form>
    </aside>
  );
};

export default Catalogos;