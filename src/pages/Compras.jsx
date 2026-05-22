import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import {
  listarCompras,
  crearCompra,
  recibirCompra,
  pagarCompra,
  cancelarCompra
} from "../services/compras.service";

import {
  listarProveedores,
  crearProveedor
} from "../services/proveedores.service";

import { listarVariantes } from "../services/variantes.service";
import { crearProducto } from "../services/productos.service";
import { listarCategorias } from "../services/categorias.service";
import { listarColores } from "../services/colores.service";
import { listarTallas } from "../services/tallas.service";
import { crearVariante } from "../services/variantes.service";
import { subirImagenProducto } from "../services/uploads.service";


const initialCompra = {
  id_proveedor: "",
  numero_factura: "",
  observaciones: ""
};

const initialProveedor = {
  ruc: "",
  razon_social: "",
  nombre_comercial: "",
  correo: "",
  telefono: "",
  direccion: "",
  estado_proveedor: "activo"
};
const initialProductoVariante = {
  id_categoria: "",
  nombre_producto: "",
  descripcion: "",
  precio_venta: "",
  imagen_url: "",
  estado_producto: "activo",

  id_color: "",
  id_talla: "",
  sku: "",
  stock_actual: 0,
  stock_minimo: 5,
  estado_variante: "activo"
};

const Compras = () => {
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [variantes, setVariantes] = useState([]);

  const [compraForm, setCompraForm] = useState(initialCompra);
  const [proveedorForm, setProveedorForm] = useState(initialProveedor);

  const [detalleCompra, setDetalleCompra] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const [loading, setLoading] = useState(true);
  const [registrando, setRegistrando] = useState(false);
  const [proveedorPanelOpen, setProveedorPanelOpen] = useState(false);
  const [guardandoProveedor, setGuardandoProveedor] = useState(false);
  const [imagenPreview, setImagenPreview] = useState("");
  const [subiendoImagen, setSubiendoImagen] = useState(false);

    const [categorias, setCategorias] = useState([]);
    const [colores, setColores] = useState([]);
    const [tallas, setTallas] = useState([]);

    const [productoPanelOpen, setProductoPanelOpen] = useState(false);
    const [productoVarianteForm, setProductoVarianteForm] = useState(initialProductoVariante);
    const [guardandoProductoVariante, setGuardandoProductoVariante] = useState(false);

  
      const extraerArray = (response) => {
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response)) return response;
    return [];
    };

    const cargarDatos = async () => {
    try {
      setLoading(true);

        const [
        comprasRes,
        proveedoresRes,
        variantesRes,
        categoriasRes,
        coloresRes,
        tallasRes
        ] = await Promise.all([
        listarCompras(),
        listarProveedores(),
        listarVariantes(),
        listarCategorias(),
        listarColores(),
        listarTallas()
        ]);

        if (comprasRes.ok) setCompras(comprasRes.data);
        if (proveedoresRes.ok) setProveedores(proveedoresRes.data);
        if (variantesRes.ok) setVariantes(variantesRes.data);
        setCategorias(extraerArray(categoriasRes));
        setColores(extraerArray(coloresRes));
        setTallas(extraerArray(tallasRes));

    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo cargar el módulo de compras",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const variantesFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return variantes
      .filter((item) => item.estado_variante === "activo")
      .filter((item) => {
        if (!texto) return true;

        return (
          item.nombre_producto?.toLowerCase().includes(texto) ||
          item.nombre_color?.toLowerCase().includes(texto) ||
          item.nombre_talla?.toLowerCase().includes(texto) ||
          item.sku?.toLowerCase().includes(texto)
        );
      });
  }, [variantes, busqueda]);

  const handleCompraChange = (event) => {
    setCompraForm({
      ...compraForm,
      [event.target.name]: event.target.value
    });
  };

  const agregarDetalle = (variante) => {
    const existe = detalleCompra.find(
      (item) => Number(item.id_variante) === Number(variante.id_variante)
    );

    if (existe) {
      cambiarCantidad(variante.id_variante, Number(existe.cantidad) + 1);
      return;
    }

    const nuevoItem = {
      id_variante: variante.id_variante,
      nombre_producto: variante.nombre_producto,
      nombre_color: variante.nombre_color,
      nombre_talla: variante.nombre_talla,
      sku: variante.sku,
      cantidad: 1,
      costo_unitario: Number(variante.costo_unitario || variante.precio_compra || 0)
    };

    setDetalleCompra([...detalleCompra, nuevoItem]);
  };

  const cambiarCantidad = (id_variante, value) => {
    const cantidad = Number(value);

    setDetalleCompra((prev) =>
      prev.map((item) =>
        Number(item.id_variante) === Number(id_variante)
          ? { ...item, cantidad: cantidad > 0 ? cantidad : 1 }
          : item
      )
    );
  };

  const cambiarCosto = (id_variante, value) => {
    const costo = Number(value);

    setDetalleCompra((prev) =>
      prev.map((item) =>
        Number(item.id_variante) === Number(id_variante)
          ? { ...item, costo_unitario: costo >= 0 ? costo : 0 }
          : item
      )
    );
  };

  const quitarDetalle = (id_variante) => {
    setDetalleCompra((prev) =>
      prev.filter((item) => Number(item.id_variante) !== Number(id_variante))
    );
  };

  const totalCompra = detalleCompra.reduce((acc, item) => {
    return acc + Number(item.cantidad) * Number(item.costo_unitario);
  }, 0);

  const limpiarCompra = () => {
    setCompraForm(initialCompra);
    setDetalleCompra([]);
    setBusqueda("");
  };

  const validarCompra = () => {
    if (!compraForm.id_proveedor) {
      Swal.fire("Validación", "Seleccione un proveedor", "warning");
      return false;
    }

    if (detalleCompra.length === 0) {
      Swal.fire("Validación", "Agregue al menos un producto a la compra", "warning");
      return false;
    }

    for (const item of detalleCompra) {
      if (Number(item.cantidad) <= 0) {
        Swal.fire("Validación", "La cantidad debe ser mayor a 0", "warning");
        return false;
      }

      if (Number(item.costo_unitario) <= 0) {
        Swal.fire(
          "Validación",
          `Ingrese costo unitario para ${item.nombre_producto}`,
          "warning"
        );
        return false;
      }
    }

    return true;
  };

  const registrarCompra = async () => {
    if (!validarCompra()) return;

    const confirmacion = await Swal.fire({
      title: "¿Registrar orden de compra?",
      text: `Total de compra: S/ ${totalCompra.toFixed(2)}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, registrar",
      cancelButtonText: "Cancelar"
    });

    if (!confirmacion.isConfirmed) return;

    const payload = {
      id_proveedor: Number(compraForm.id_proveedor),
      numero_factura: compraForm.numero_factura.trim() || null,
      observaciones: compraForm.observaciones.trim() || null,
      total: Number(totalCompra.toFixed(2)),
            detalles: detalleCompra.map((item) => {
            const descripcionProducto = `${item.nombre_producto || "Producto"} - ${
                item.nombre_color || "Color"
            } - ${item.nombre_talla || "Talla"}`;

            return {
                id_variante: Number(item.id_variante),
                descripcion: descripcionProducto,
                descripcion_producto: descripcionProducto,
                cantidad: Number(item.cantidad),
                costo_unitario: Number(item.costo_unitario),
                precio_compra: Number(item.costo_unitario),
                subtotal: Number(
                (Number(item.cantidad) * Number(item.costo_unitario)).toFixed(2)
                )
            };
            })
    };

    try {
      setRegistrando(true);

      const response = await crearCompra(payload);

      if (response.ok) {
        Swal.fire("Registrado", "Orden de compra registrada correctamente", "success");
        limpiarCompra();
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo registrar la compra",
        "error"
      );
    } finally {
      setRegistrando(false);
    }
  };

  const confirmarRecibir = async (id_compra) => {
    const confirmacion = await Swal.fire({
      title: "¿Recibir mercadería?",
      text: "El stock de las variantes aumentará automáticamente.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, recibir",
      cancelButtonText: "Cancelar"
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const response = await recibirCompra(id_compra);

      if (response.ok) {
        Swal.fire("Recibida", "La mercadería fue recibida correctamente", "success");
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo recibir la compra",
        "error"
      );
    }
  };

  const confirmarPagar = async (id_compra) => {
    const confirmacion = await Swal.fire({
      title: "¿Registrar pago?",
      text: "La factura quedará marcada como pagada.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, pagar",
      cancelButtonText: "Cancelar"
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const response = await pagarCompra(id_compra);

      if (response.ok) {
        Swal.fire("Pagada", "La factura fue marcada como pagada", "success");
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo registrar el pago",
        "error"
      );
    }
  };

  const confirmarCancelar = async (id_compra) => {
    const confirmacion = await Swal.fire({
      title: "¿Cancelar compra?",
      text: "La orden de compra será cancelada.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "Volver"
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const response = await cancelarCompra(id_compra);

      if (response.ok) {
        Swal.fire("Cancelada", "La orden fue cancelada correctamente", "success");
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo cancelar la compra",
        "error"
      );
    }
  };

  const abrirPanelProveedor = () => {
    setProveedorForm(initialProveedor);
    setProveedorPanelOpen(true);
  };

  const cerrarPanelProveedor = () => {
    setProveedorForm(initialProveedor);
    setProveedorPanelOpen(false);
  };

  const handleProveedorChange = (event) => {
    setProveedorForm({
      ...proveedorForm,
      [event.target.name]: event.target.value
    });
  };

  const validarProveedor = () => {
    if (!proveedorForm.ruc.trim()) {
      Swal.fire("Validación", "Ingrese el RUC del proveedor", "warning");
      return false;
    }

    if (proveedorForm.ruc.trim().length !== 11) {
      Swal.fire("Validación", "El RUC debe tener 11 dígitos", "warning");
      return false;
    }

    if (!proveedorForm.razon_social.trim()) {
      Swal.fire("Validación", "Ingrese la razón social", "warning");
      return false;
    }

    return true;
  };

  const guardarProveedorRapido = async (event) => {
    event.preventDefault();

    if (!validarProveedor()) return;

    const payload = {
      ruc: proveedorForm.ruc.trim(),
      razon_social: proveedorForm.razon_social.trim(),
      nombre_comercial: proveedorForm.nombre_comercial.trim() || null,
      correo: proveedorForm.correo.trim() || null,
      telefono: proveedorForm.telefono.trim() || null,
      direccion: proveedorForm.direccion.trim() || null,
      estado_proveedor: "activo"
    };

    try {
      setGuardandoProveedor(true);

      const response = await crearProveedor(payload);

      if (response.ok) {
        Swal.fire("Proveedor creado", "El proveedor fue registrado correctamente", "success");

        await cargarDatos();

        const nuevoProveedor = response.data;

        if (nuevoProveedor?.id_proveedor) {
          setCompraForm({
            ...compraForm,
            id_proveedor: nuevoProveedor.id_proveedor
          });
        }

        cerrarPanelProveedor();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo crear el proveedor",
        "error"
      );
    } finally {
      setGuardandoProveedor(false);
    }
  };

  const nombreProveedor = (proveedor) => {
    return proveedor.razon_social || proveedor.nombre_comercial || "Proveedor";
  };

    const abrirPanelProductoVariante = () => {
    setProductoVarianteForm(initialProductoVariante);
    setImagenPreview("");
    setProductoPanelOpen(true);
    };

    const cerrarPanelProductoVariante = () => {
    setProductoVarianteForm(initialProductoVariante);
    setImagenPreview("");
    setProductoPanelOpen(false);
    };

const handleProductoVarianteChange = (event) => {
  const { name, value } = event.target;

  setProductoVarianteForm({
    ...productoVarianteForm,
    [name]: value
  });
};

const generarSkuProductoCompra = () => {
  const categoria = categorias.find(
    (item) =>
      Number(item.id_categoria) === Number(productoVarianteForm.id_categoria)
  );

  const color = colores.find(
    (item) => Number(item.id_color) === Number(productoVarianteForm.id_color)
  );

  const talla = tallas.find(
    (item) => Number(item.id_talla) === Number(productoVarianteForm.id_talla)
  );

  if (!productoVarianteForm.nombre_producto || !color || !talla) {
    Swal.fire(
      "Datos incompletos",
      "Ingrese producto, color y talla para generar el SKU",
      "warning"
    );
    return;
  }

  const productoCodigo = productoVarianteForm.nombre_producto
    .substring(0, 4)
    .toUpperCase()
    .replace(/\s/g, "");

  const colorCodigo = color.nombre_color
    .substring(0, 3)
    .toUpperCase()
    .replace(/\s/g, "");

  const tallaCodigo = talla.nombre_talla.toUpperCase().replace(/\s/g, "");

  const categoriaCodigo = categoria
    ? categoria.nombre_categoria.substring(0, 3).toUpperCase().replace(/\s/g, "")
    : "CAT";

  const sku = `${categoriaCodigo}-${productoCodigo}-${colorCodigo}-${tallaCodigo}`;

  setProductoVarianteForm({
    ...productoVarianteForm,
    sku
  });
};

const validarProductoVarianteRapido = () => {
  if (!productoVarianteForm.id_categoria) {
    Swal.fire("Validación", "Seleccione una categoría", "warning");
    return false;
  }

  if (!productoVarianteForm.nombre_producto.trim()) {
    Swal.fire("Validación", "Ingrese el nombre del producto", "warning");
    return false;
  }

  if (!productoVarianteForm.descripcion.trim()) {
    Swal.fire("Validación", "Ingrese una descripción del producto", "warning");
    return false;
  }

  if (
    !productoVarianteForm.precio_venta ||
    Number(productoVarianteForm.precio_venta) <= 0
  ) {
    Swal.fire("Validación", "Ingrese un precio de venta válido", "warning");
    return false;
  }

  if (!productoVarianteForm.id_color) {
    Swal.fire("Validación", "Seleccione un color", "warning");
    return false;
  }

  if (!productoVarianteForm.id_talla) {
    Swal.fire("Validación", "Seleccione una talla", "warning");
    return false;
  }

  if (!productoVarianteForm.sku.trim()) {
    Swal.fire("Validación", "Ingrese o genere un SKU", "warning");
    return false;
  }

  if (Number(productoVarianteForm.stock_minimo) < 0) {
    Swal.fire("Validación", "El stock mínimo no puede ser negativo", "warning");
    return false;
  }

  return true;
};

const guardarProductoVarianteRapido = async (event) => {
  event.preventDefault();

  if (!validarProductoVarianteRapido()) return;

  try {
    setGuardandoProductoVariante(true);

    const productoPayload = {
      id_categoria: Number(productoVarianteForm.id_categoria),
      nombre_producto: productoVarianteForm.nombre_producto.trim(),
      descripcion: productoVarianteForm.descripcion.trim(),
      precio_venta: Number(productoVarianteForm.precio_venta),
      imagen_url: productoVarianteForm.imagen_url.trim() || null,
      estado_producto: "activo"
    };

    const productoResponse = await crearProducto(productoPayload);

    if (!productoResponse.ok) {
      throw new Error(productoResponse.message || "No se pudo crear el producto");
    }

    const nuevoProducto = productoResponse.data;

    const variantePayload = {
      id_producto: Number(nuevoProducto.id_producto),
      id_color: Number(productoVarianteForm.id_color),
      id_talla: Number(productoVarianteForm.id_talla),
      sku: productoVarianteForm.sku.trim().toUpperCase(),
      stock_actual: Number(productoVarianteForm.stock_actual || 0),
      stock_minimo: Number(productoVarianteForm.stock_minimo || 5),
      estado_variante: "activo"
    };

    const varianteResponse = await crearVariante(variantePayload);

    if (!varianteResponse.ok) {
      throw new Error(varianteResponse.message || "No se pudo crear la variante");
    }

    Swal.fire(
      "Producto creado",
      "El producto y su variante fueron registrados correctamente",
      "success"
    );

    await cargarDatos();

    cerrarPanelProductoVariante();
  } catch (error) {
    Swal.fire(
      "Error",
      error.response?.data?.message ||
        error.message ||
        "No se pudo crear el producto y variante",
      "error"
    );
  } finally {
    setGuardandoProductoVariante(false);
  }
};

const handleImagenProductoRapido = async (event) => {
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
      setProductoVarianteForm((prev) => ({
        ...prev,
        imagen_url: response.data.image_url
      }));

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

  if (loading) {
    return <p>Cargando compras...</p>;
  }

  return (
    <div className="compras-page">
      <div className="page-header">
        <div>
          <h1>Compras</h1>
          <p>Registro de órdenes de compra, recepción y pagos de facturas.</p>
        </div>

        <button className="btn-secondary" onClick={cargarDatos}>
          Actualizar
        </button>
      </div>

      <div className="compras-layout">
        <section className="panel">
          <h2>Nueva orden de compra</h2>

          <div className="venta-form-grid">
            <div className="form-group">
              <div className="label-action-row">
                <label>Proveedor</label>

                <button
                  type="button"
                  className="btn-link-action"
                  onClick={abrirPanelProveedor}
                >
                  + Nuevo proveedor
                </button>
              </div>

              <select
                name="id_proveedor"
                value={compraForm.id_proveedor}
                onChange={handleCompraChange}
              >
                <option value="">Seleccione proveedor</option>
                {proveedores
                  .filter((proveedor) => proveedor.estado_proveedor === "activo")
                  .map((proveedor) => (
                    <option
                      key={proveedor.id_proveedor}
                      value={proveedor.id_proveedor}
                    >
                      {nombreProveedor(proveedor)} - RUC: {proveedor.ruc}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label>Número de factura</label>
              <input
                type="text"
                name="numero_factura"
                value={compraForm.numero_factura}
                onChange={handleCompraChange}
                placeholder="Ej. F001-000123"
              />
            </div>

            <div className="form-group form-full">
              <label>Observaciones</label>
              <textarea
                name="observaciones"
                value={compraForm.observaciones}
                onChange={handleCompraChange}
                placeholder="Observaciones de la compra"
              />
            </div>
          </div>

            <div className="section-title-row">
            <h3>Variantes disponibles</h3>

            <div className="section-actions-row">
                <button
                type="button"
                className="btn-secondary"
                onClick={abrirPanelProductoVariante}
                >
                + Nuevo producto / variante
                </button>

                <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar producto, color, talla o SKU"
                />
            </div>
            </div>

          <div className="products-sale-grid">
            {variantesFiltradas.length > 0 ? (
              variantesFiltradas.map((variante) => (
                <div className="sale-product-card" key={variante.id_variante}>
                  <div>
                    <h4>{variante.nombre_producto}</h4>
                    <p>
                      {variante.nombre_color} | {variante.nombre_talla}
                    </p>
                    <small>SKU: {variante.sku}</small>
                  </div>

                  <div className="sale-product-bottom">
                    <span>Stock actual: {variante.stock_actual}</span>
                  </div>

                  <button
                    className="btn-small"
                    onClick={() => agregarDetalle(variante)}
                  >
                    Agregar
                  </button>
                </div>
              ))
            ) : (
              <p>No hay variantes disponibles.</p>
            )}
          </div>
        </section>

        <section className="panel cart-panel">
          <h2>Detalle de compra</h2>

          {detalleCompra.length > 0 ? (
            <>
              <div className="cart-items">
                {detalleCompra.map((item) => (
                  <div className="cart-item" key={item.id_variante}>
                    <div className="cart-info">
                      <strong>{item.nombre_producto}</strong>
                      <small>
                        {item.nombre_color} | {item.nombre_talla} | {item.sku}
                      </small>
                    </div>

                    <div className="cart-controls">
                      <label>Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) =>
                          cambiarCantidad(item.id_variante, e.target.value)
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Costo unitario</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.costo_unitario}
                        onChange={(e) =>
                          cambiarCosto(item.id_variante, e.target.value)
                        }
                      />
                    </div>

                    <div className="cart-item-total">
                      <strong>
                        S/{" "}
                        {(
                          Number(item.cantidad) * Number(item.costo_unitario)
                        ).toFixed(2)}
                      </strong>

                      <button
                        className="btn-small btn-danger"
                        onClick={() => quitarDetalle(item.id_variante)}
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="sale-summary">
                <div className="sale-total">
                  <span>Total compra</span>
                  <strong>S/ {totalCompra.toFixed(2)}</strong>
                </div>
              </div>

              <div className="cart-actions">
                <button className="btn-secondary" onClick={limpiarCompra}>
                  Limpiar
                </button>

                <button
                  className="btn-primary"
                  onClick={registrarCompra}
                  disabled={registrando}
                >
                  {registrando ? "Registrando..." : "Registrar compra"}
                </button>
              </div>
            </>
          ) : (
            <p>No hay productos en el detalle de compra.</p>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Órdenes de compra registradas</h2>
            <p>{compras.length} órdenes encontradas</p>
          </div>
        </div>

        {compras.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Proveedor</th>
                  <th>Factura</th>
                  <th>Total</th>
                  <th>Orden</th>
                  <th>Pago</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {compras.map((compra) => (
                  <tr key={compra.id_orden_compra}>
                    <td>#{compra.id_orden_compra}</td>
                    <td>{compra.fecha_orden}</td>
                    <td>{compra.razon_social}</td>
                    <td>{compra.numero_factura || "Sin factura"}</td>
                    <td>S/ {Number(compra.total || 0).toFixed(2)}</td>

                    <td>
                      <span
                        className={
                          compra.estado_orden === "recibida"
                            ? "status-badge status-active"
                            : compra.estado_orden === "cancelada"
                            ? "status-badge status-inactive"
                            : "status-badge"
                        }
                      >
                        {compra.estado_orden}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          compra.estado_factura === "pagada"
                            ? "status-badge status-active"
                            : "status-badge status-warning"
                        }
                      >
                        {compra.estado_factura}
                      </span>
                    </td>

                        <td>
                          <div className="table-actions">
                            {["pendiente", "registrada", "en_proceso", "pendiente_recepcion"].includes(
                              String(compra.estado_orden).toLowerCase()
                            ) && (
                              <button
                                className="btn-small btn-success"
                                onClick={() => confirmarRecibir(compra.id_orden_compra)}
                              >
                                Recibir
                              </button>
                            )}

                            {String(compra.estado_factura).toLowerCase() === "pendiente" &&
                              String(compra.estado_orden).toLowerCase() !== "cancelada" && (
                                <button
                                  className="btn-small btn-warning"
                                  onClick={() => confirmarPagar(compra.id_orden_compra)}
                                >
                                  Pagar
                                </button>
                              )}

                            {!["cancelada", "recibida"].includes(
                              String(compra.estado_orden).toLowerCase()
                            ) && (
                              <button
                                className="btn-small btn-danger"
                                onClick={() => confirmarCancelar(compra.id_orden_compra)}
                              >
                                Cancelar
                              </button>
                            )}

                            {String(compra.estado_orden).toLowerCase() === "cancelada" && (
                              <small>Sin acciones</small>
                            )}
                          </div>
                        </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No hay órdenes de compra registradas.</p>
        )}
      </section>

      {proveedorPanelOpen && (
        <>
          <div className="drawer-overlay" onClick={cerrarPanelProveedor} />

          <aside className="drawer-panel">
            <div className="drawer-header">
              <div>
                <h2>Crear proveedor</h2>
                <p>Registre un proveedor sin salir de compras.</p>
              </div>

              <button className="drawer-close" onClick={cerrarPanelProveedor}>
                ×
              </button>
            </div>

            <form className="drawer-form" onSubmit={guardarProveedorRapido}>
              <div className="form-group">
                <label>RUC</label>
                <input
                  type="text"
                  name="ruc"
                  value={proveedorForm.ruc}
                  onChange={handleProveedorChange}
                  placeholder="Ingrese RUC"
                />
              </div>

              <div className="form-group">
                <label>Razón social</label>
                <input
                  type="text"
                  name="razon_social"
                  value={proveedorForm.razon_social}
                  onChange={handleProveedorChange}
                  placeholder="Proveedor S.A.C."
                />
              </div>

              <div className="form-group">
                <label>Nombre comercial</label>
                <input
                  type="text"
                  name="nombre_comercial"
                  value={proveedorForm.nombre_comercial}
                  onChange={handleProveedorChange}
                  placeholder="Nombre comercial"
                />
              </div>

              <div className="form-group">
                <label>Correo</label>
                <input
                  type="email"
                  name="correo"
                  value={proveedorForm.correo}
                  onChange={handleProveedorChange}
                  placeholder="proveedor@email.com"
                />
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="text"
                  name="telefono"
                  value={proveedorForm.telefono}
                  onChange={handleProveedorChange}
                  placeholder="999999999"
                />
              </div>

              <div className="form-group">
                <label>Dirección</label>
                <textarea
                  name="direccion"
                  value={proveedorForm.direccion}
                  onChange={handleProveedorChange}
                  placeholder="Dirección del proveedor"
                />
              </div>

              <div className="drawer-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cerrarPanelProveedor}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={guardandoProveedor}
                >
                  {guardandoProveedor ? "Guardando..." : "Crear proveedor"}
                </button>
              </div>
            </form>
          </aside>
        </>
      )}

      {productoPanelOpen && (
  <>
    <div className="drawer-overlay" onClick={cerrarPanelProductoVariante} />

    <aside className="drawer-panel drawer-wide">
      <div className="drawer-header">
        <div>
          <h2>Crear producto y variante</h2>
          <p>Registre un producto sin salir del proceso de compra.</p>
        </div>

        <button className="drawer-close" onClick={cerrarPanelProductoVariante}>
          ×
        </button>
      </div>

      <form className="drawer-form" onSubmit={guardarProductoVarianteRapido}>
        <h3>Datos del producto</h3>

        <div className="form-group">
          <label>Categoría</label>
          <select
            name="id_categoria"
            value={productoVarianteForm.id_categoria}
            onChange={handleProductoVarianteChange}
          >
            <option value="">Seleccione categoría</option>
              {categorias
                .filter((categoria) => {
                  const estado = categoria.estado_categoria || categoria.estado || "activo";
                  return estado === "activo";
                })
                .map((categoria) => (
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
            value={productoVarianteForm.nombre_producto}
            onChange={handleProductoVarianteChange}
            placeholder="Ej. Polo Oversize Negro"
          />
        </div>

        <div className="form-group">
          <label>Descripción</label>
          <textarea
            name="descripcion"
            value={productoVarianteForm.descripcion}
            onChange={handleProductoVarianteChange}
            placeholder="Descripción del producto"
          />
        </div>

        <div className="form-group">
          <label>Precio de venta</label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="precio_venta"
            value={productoVarianteForm.precio_venta}
            onChange={handleProductoVarianteChange}
            placeholder="Ej. 59.90"
          />
        </div>

            <div className="form-group">
            <label>Imagen del producto</label>

            <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImagenProductoRapido}
            />

            {subiendoImagen && <small>Subiendo y optimizando imagen...</small>}

            {imagenPreview && (
                <div className="image-preview">
                <img src={imagenPreview} alt="Vista previa" />
                </div>
            )}

            {productoVarianteForm.imagen_url && (
                <small>Ruta guardada: {productoVarianteForm.imagen_url}</small>
            )}
            </div>

        <h3>Datos de la variante</h3>

        <div className="form-group">
          <label>Color</label>
          <select
            name="id_color"
            value={productoVarianteForm.id_color}
            onChange={handleProductoVarianteChange}
          >
            <option value="">Seleccione color</option>
              {colores
                .filter((color) => {
                  const estado = color.estado_color || color.estado || "activo";
                  return estado === "activo";
                })
                .map((color) => (
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
            value={productoVarianteForm.id_talla}
            onChange={handleProductoVarianteChange}
          >
            <option value="">Seleccione talla</option>
              {tallas
                .filter((talla) => {
                  const estado = talla.estado_talla || talla.estado || "activo";
                  return estado === "activo";
                })
                .map((talla) => (
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
              value={productoVarianteForm.sku}
              onChange={handleProductoVarianteChange}
              placeholder="Ej. POL-NEG-M"
            />

            <button
              type="button"
              className="btn-secondary"
              onClick={generarSkuProductoCompra}
            >
              Generar
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Stock inicial</label>
          <input
            type="number"
            min="0"
            name="stock_actual"
            value={productoVarianteForm.stock_actual}
            onChange={handleProductoVarianteChange}
          />
          <small>
            Puedes dejarlo en 0, porque al recibir la compra el stock aumentará.
          </small>
        </div>

        <div className="form-group">
          <label>Stock mínimo</label>
          <input
            type="number"
            min="0"
            name="stock_minimo"
            value={productoVarianteForm.stock_minimo}
            onChange={handleProductoVarianteChange}
          />
        </div>

        <div className="drawer-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={cerrarPanelProductoVariante}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="btn-primary"
            disabled={guardandoProductoVariante}
          >
            {guardandoProductoVariante
              ? "Guardando..."
              : "Crear producto y variante"}
          </button>
        </div>
      </form>
    </aside>
  </>
)}

    </div>
  );
};

export default Compras;