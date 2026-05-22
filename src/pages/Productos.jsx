import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  listarProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto
} from "../services/productos.service";
import { listarCategorias } from "../services/categorias.service";
import { subirImagenProducto } from "../services/uploads.service";

const initialForm = {
  id_categoria: "",
  nombre_producto: "",
  descripcion: "",
  precio_venta: "",
  imagen_url: "",
  estado_producto: "activo"
};

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editandoId, setEditandoId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imagenPreview, setImagenPreview] = useState("");
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [productosResponse, categoriasResponse] = await Promise.all([
        listarProductos(),
        listarCategorias()
      ]);

      if (productosResponse.ok) {
        setProductos(productosResponse.data);
      }

      if (categoriasResponse.ok) {
        setCategorias(categoriasResponse.data);
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudieron cargar los productos",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  };

    const limpiarFormulario = () => {
      setForm(initialForm);
      setEditandoId(null);
      setImagenPreview("");
    };

  const validarFormulario = () => {
    if (!form.id_categoria) {
      Swal.fire("Validación", "Seleccione una categoría", "warning");
      return false;
    }

    if (!form.nombre_producto.trim()) {
      Swal.fire("Validación", "Ingrese el nombre del producto", "warning");
      return false;
    }

    if (!form.precio_venta || Number(form.precio_venta) <= 0) {
      Swal.fire("Validación", "El precio debe ser mayor a 0", "warning");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validarFormulario()) return;

    const payload = {
      id_categoria: Number(form.id_categoria),
      nombre_producto: form.nombre_producto.trim(),
      descripcion: form.descripcion.trim(),
      precio_venta: Number(form.precio_venta),
      imagen_url: form.imagen_url.trim(),
      estado_producto: form.estado_producto
    };

    try {
      if (editandoId) {
        const response = await actualizarProducto(editandoId, payload);

        if (response.ok) {
          Swal.fire("Actualizado", "Producto actualizado correctamente", "success");
        }
      } else {
        const response = await crearProducto(payload);

        if (response.ok) {
          Swal.fire("Creado", "Producto creado correctamente", "success");
        }
      }

      limpiarFormulario();
      cargarDatos();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo guardar el producto",
        "error"
      );
    }
  };

  const handleEditar = (producto) => {
    setEditandoId(producto.id_producto);

    setForm({
      id_categoria: producto.id_categoria || "",
      nombre_producto: producto.nombre_producto || "",
      descripcion: producto.descripcion || "",
      precio_venta: producto.precio_venta || "",
      imagen_url: producto.imagen_url || "",
      estado_producto: producto.estado_producto || "activo"
    });

    setImagenPreview(
      producto.imagen_url
        ? `http://localhost:3000${producto.imagen_url}`
        : ""
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleImagenChange = async (event) => {
  const file = event.target.files[0];

  if (!file) return;

  const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];

  if (!tiposPermitidos.includes(file.type)) {
    Swal.fire("Formato no válido", "Solo se permiten JPG, PNG o WEBP", "warning");
    return;
  }

  if (file.size > 3 * 1024 * 1024) {
    Swal.fire("Imagen muy pesada", "La imagen no debe superar los 3MB", "warning");
    return;
  }

  try {
    setSubiendoImagen(true);

    const response = await subirImagenProducto(file);

    if (response.ok) {
      setForm({
        ...form,
        imagen_url: response.data.image_url
      });

      setImagenPreview(`http://localhost:3000${response.data.image_url}`);

      Swal.fire("Imagen subida", "La imagen fue optimizada correctamente", "success");
    }
  } catch (error) {
    Swal.fire(
      "Error",
      error.response?.data?.message || "No se pudo subir la imagen",
      "error"
    );
  } finally {
    setSubiendoImagen(false);
  }
};

  const handleEliminar = async (id) => {
    const confirmacion = await Swal.fire({
      title: "¿Eliminar producto?",
      text: "El producto será eliminado lógicamente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const response = await eliminarProducto(id);

      if (response.ok) {
        Swal.fire("Eliminado", "Producto eliminado correctamente", "success");
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo eliminar el producto",
        "error"
      );
    }
  };

  if (loading) {
    return <p>Cargando productos...</p>;
  }

  return (
    <div className="productos-page">
      <div className="page-header">
        <div>
          <h1>Productos</h1>
          <p>Gestión del catálogo principal de FashionStore.</p>
        </div>

        <button className="btn-primary" onClick={cargarDatos}>
          Actualizar
        </button>
      </div>

      <section className="panel form-panel">
        <h2>{editandoId ? "Editar producto" : "Nuevo producto"}</h2>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label>Categoría</label>
            <select
              name="id_categoria"
              value={form.id_categoria}
              onChange={handleChange}
            >
              <option value="">Seleccione</option>
              {categorias.map((categoria) => (
                <option
                  key={categoria.id_categoria}
                  value={categoria.id_categoria}
                >
                  {categoria.nombre_categoria}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Nombre del producto</label>
            <input
              type="text"
              name="nombre_producto"
              value={form.nombre_producto}
              onChange={handleChange}
              placeholder="Ej. Polo Oversize Negro"
            />
          </div>

          <div className="form-group">
            <label>Precio de venta</label>
            <input
              type="number"
              step="0.01"
              name="precio_venta"
              value={form.precio_venta}
              onChange={handleChange}
              placeholder="Ej. 59.90"
            />
          </div>

          <div className="form-group">
            <label>Estado</label>
            <select
              name="estado_producto"
              value={form.estado_producto}
              onChange={handleChange}
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>

          <div className="form-group form-full">
            <label>Descripción</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Descripción breve del producto"
            />
          </div>

          <div className="form-group form-full">
            <label>Imagen del producto</label>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImagenChange}
            />

            {subiendoImagen && <p>Subiendo y optimizando imagen...</p>}

            {imagenPreview && (
              <div className="image-preview">
                <img src={imagenPreview} alt="Vista previa" />
              </div>
            )}

            {form.imagen_url && (
              <small>Ruta guardada: {form.imagen_url}</small>
            )}
          </div>

          <div className="form-actions form-full">
            <button type="submit" className="btn-primary">
              {editandoId ? "Actualizar producto" : "Crear producto"}
            </button>

            {editandoId && (
              <button
                type="button"
                className="btn-secondary"
                onClick={limpiarFormulario}
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="panel">
        <h2>Listado de productos</h2>

        {productos.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Imagen</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {productos.map((producto) => (
                  <tr key={producto.id_producto}>
                    <td>{producto.id_producto}</td>
                    
                    <td>
                          {producto.imagen_url ? (
                            <img
                              className="product-thumb"
                              src={`http://localhost:3000${producto.imagen_url}`}
                              alt={producto.nombre_producto}
                            />
                          ) : (
                            <span>Sin imagen</span>
                          )}
                        </td>
                        
                    <td>
                      <strong>{producto.nombre_producto}</strong>
                      <br />
                      <small>{producto.descripcion}</small>
                    </td>
                    <td>{producto.nombre_categoria}</td>
                    <td>S/ {Number(producto.precio_venta || 0).toFixed(2)}</td>
                    <td>
                      <span
                        className={
                          producto.estado_producto === "activo"
                            ? "status-badge status-active"
                            : "status-badge status-inactive"
                        }
                      >
                        {producto.estado_producto}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-small"
                          onClick={() => handleEditar(producto)}
                        >
                          Editar
                        </button>

                        <button
                          className="btn-small btn-danger"
                          onClick={() => handleEliminar(producto.id_producto)}
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
          <p>No hay productos registrados.</p>
        )}
      </section>
    </div>
  );
};

export default Productos;