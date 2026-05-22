import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

import {
  listarVentas,
  obtenerVenta,
  crearVenta,
  anularVenta,
  completarVenta
} from "../services/ventas.service";

import {
  listarClientes,
  crearCliente
} from "../services/clientes.service";

import { listarVariantes } from "../services/variantes.service";

import {
  listarPromociones,
  obtenerPromocion
} from "../services/promociones.service";

import { listarCombos } from "../services/combos.service";

import { generarTicketVentaPDF } from "../utils/ticketVenta";
import { crearPedido } from "../services/pedidos.service";

const initialClienteForm = {
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

const initialVenta = {
  id_cliente: "",
  origen_venta: "presencial",
  metodo_pago: "efectivo",
  estado_venta: "completada"
};

const Ventas = () => {
  const navigate = useNavigate();

  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [variantes, setVariantes] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [combos, setCombos] = useState([]);

  const [ventaForm, setVentaForm] = useState(initialVenta);
  const [carrito, setCarrito] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [tipoItemVenta, setTipoItemVenta] = useState("productos");

  const [loading, setLoading] = useState(true);
  const [registrando, setRegistrando] = useState(false);

  const [clientePanelOpen, setClientePanelOpen] = useState(false);
  const [clienteForm, setClienteForm] = useState(initialClienteForm);
  const [guardandoCliente, setGuardandoCliente] = useState(false);

  const [ventaDetalle, setVentaDetalle] = useState(null);
  const [detallePanelOpen, setDetallePanelOpen] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  
  const REGISTROS_POR_PAGINA = 15;
  const [paginaVentas, setPaginaVentas] = useState(1);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [ventasRes, clientesRes, variantesRes, promocionesRes, combosRes] =
        await Promise.all([
          listarVentas(),
          listarClientes(),
          listarVariantes(),
          listarPromociones(),
          listarCombos()
        ]);

      if (ventasRes.ok) setVentas(ventasRes.data);
      if (clientesRes.ok) setClientes(clientesRes.data);
      if (variantesRes.ok) setVariantes(variantesRes.data);
      if (promocionesRes.ok) setPromociones(promocionesRes.data);
      if (combosRes.ok) setCombos(combosRes.data);
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo cargar el módulo de ventas",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const obtenerKeyItem = (item) => {
    if (item.tipo_item === "combo") return `combo-${item.id_combo}`;
    if (item.tipo_item === "promocion") {
      return `promocion-${item.id_promocion}-${item.id_variante}`;
    }

    return `producto-${item.id_variante}`;
  };

  const variantesFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return variantes
      .filter((item) => item.estado_variante === "activo")
      .filter((item) => Number(item.stock_actual) > 0)
      .filter((item) => {
        if (!texto) return true;

        return (
          String(item.nombre_producto || "").toLowerCase().includes(texto) ||
          String(item.nombre_color || "").toLowerCase().includes(texto) ||
          String(item.nombre_talla || "").toLowerCase().includes(texto) ||
          String(item.sku || "").toLowerCase().includes(texto)
        );
      });
  }, [variantes, busqueda]);

  const promocionesFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return promociones
      .filter((promo) =>
        ["activa", "activo"].includes(
          String(promo.estado_promocion || "").toLowerCase()
        )
      )
      .filter((promo) => {
        if (!texto) return true;

        return (
          String(promo.nombre_promocion || "").toLowerCase().includes(texto) ||
          String(promo.descripcion || "").toLowerCase().includes(texto)
        );
      });
  }, [promociones, busqueda]);

  const combosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return combos
      .filter((combo) =>
        ["activo", "activa"].includes(
          String(combo.estado_combo || "").toLowerCase()
        )
      )
      .filter((combo) => {
        if (!texto) return true;

        return (
          String(combo.nombre_combo || "").toLowerCase().includes(texto) ||
          String(combo.descripcion || "").toLowerCase().includes(texto)
        );
      });
  }, [combos, busqueda]);

  const handleVentaChange = (event) => {
    setVentaForm({
      ...ventaForm,
      [event.target.name]: event.target.value
    });
  };

  const agregarAlCarrito = (variante) => {
    const existe = carrito.find(
      (item) =>
        item.tipo_item === "producto" &&
        Number(item.id_variante) === Number(variante.id_variante)
    );

    if (existe) {
      aumentarCantidad(obtenerKeyItem(existe));
      return;
    }

    const nuevoItem = {
      tipo_item: "producto",
      id_variante: variante.id_variante,
      id_promocion: null,
      id_combo: null,
      descripcion_item: variante.nombre_producto,
      nombre_producto: variante.nombre_producto,
      nombre_color: variante.nombre_color,
      nombre_talla: variante.nombre_talla,
      sku: variante.sku,
      stock_actual: Number(variante.stock_actual),
      cantidad: 1,
      precio_unitario: Number(
        variante.precio_venta ??
          variante.precio_producto ??
          variante.precio_unitario ??
          0
      ),
      descuento: 0
    };

    if (nuevoItem.precio_unitario <= 0) {
      Swal.fire(
        "Precio no válido",
        "La variante seleccionada no tiene precio de venta configurado.",
        "warning"
      );
      return;
    }

    setCarrito([...carrito, nuevoItem]);
  };

  const calcularPrecioPromocion = (promo, detalle) => {
    const precioBase = Number(
      detalle?.precio_venta ??
        promo.precio_venta ??
        0
    );

    const descuento = Number(promo.valor_descuento || 0);

    if (promo.tipo_descuento === "porcentaje") {
      return Math.max(precioBase - (precioBase * descuento) / 100, 0);
    }

    if (promo.tipo_descuento === "monto_fijo") {
      return Math.max(precioBase - descuento, 0);
    }

    return precioBase;
  };

  const agregarPromocionCarrito = async (promo) => {
    try {
      const response = await obtenerPromocion(promo.id_promocion);

      if (!response.ok) return;

      const promocionCompleta = response.data;
      const detalle = promocionCompleta.detalles?.[0];

      if (!detalle?.id_variante) {
        Swal.fire(
          "Promoción incompleta",
          "La promoción no tiene una variante asociada.",
          "warning"
        );
        return;
      }

      const varianteBase = variantes.find(
        (item) => Number(item.id_variante) === Number(detalle.id_variante)
      );

      const precioBase = Number(
        detalle.precio_venta ??
          varianteBase?.precio_venta ??
          varianteBase?.precio_producto ??
          varianteBase?.precio_unitario ??
          0
      );

      const precioFinal = calcularPrecioPromocion(
        {
          ...promocionCompleta,
          precio_venta: precioBase
        },
        {
          ...detalle,
          precio_venta: precioBase
        }
      );

      const descuentoAplicado = Number((precioBase - precioFinal).toFixed(2));

      if (precioBase <= 0 || precioFinal <= 0) {
        Swal.fire(
          "Precio no válido",
          "La promoción no tiene un precio válido.",
          "warning"
        );
        return;
      }

      const nuevoItem = {
        tipo_item: "promocion",
        id_variante: detalle.id_variante,
        id_promocion: promocionCompleta.id_promocion,
        id_combo: null,
        descripcion_item: promocionCompleta.nombre_promocion,
        nombre_producto: promocionCompleta.nombre_promocion,
        nombre_color: detalle.nombre_color || varianteBase?.nombre_color || "",
        nombre_talla: detalle.nombre_talla || varianteBase?.nombre_talla || "",
        sku: detalle.sku || varianteBase?.sku || "PROMO",
        stock_actual: Number(detalle.stock_actual || varianteBase?.stock_actual || 0),
        cantidad: 1,
        precio_unitario: precioBase,
        descuento: descuentoAplicado
      };

      const existe = carrito.find(
        (item) => obtenerKeyItem(item) === obtenerKeyItem(nuevoItem)
      );

      if (existe) {
        aumentarCantidad(obtenerKeyItem(existe));
        return;
      }

      setCarrito((prev) => [...prev, nuevoItem]);
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo agregar la promoción",
        "error"
      );
    }
  };

  const agregarComboCarrito = (combo) => {
    const precioCombo = Number(combo.precio_combo || 0);

    if (precioCombo <= 0) {
      Swal.fire(
        "Precio no válido",
        "El combo no tiene precio configurado.",
        "warning"
      );
      return;
    }

    const nuevoItem = {
      tipo_item: "combo",
      id_variante: null,
      id_promocion: null,
      id_combo: combo.id_combo,
      descripcion_item: combo.nombre_combo,
      nombre_producto: combo.nombre_combo,
      nombre_color: "",
      nombre_talla: "",
      sku: "COMBO",
      stock_actual: null,
      cantidad: 1,
      precio_unitario: precioCombo,
      descuento: 0
    };

    const existe = carrito.find(
      (item) => obtenerKeyItem(item) === obtenerKeyItem(nuevoItem)
    );

    if (existe) {
      aumentarCantidad(obtenerKeyItem(existe));
      return;
    }

    setCarrito((prev) => [...prev, nuevoItem]);
  };

  const aumentarCantidad = (keyItem) => {
    setCarrito((prev) =>
      prev.map((item) => {
        if (obtenerKeyItem(item) !== keyItem) return item;

        if (
          item.tipo_item !== "combo" &&
          Number(item.cantidad) >= Number(item.stock_actual)
        ) {
          Swal.fire(
            "Stock insuficiente",
            "No puedes vender más unidades que el stock disponible.",
            "warning"
          );
          return item;
        }

        return {
          ...item,
          cantidad: Number(item.cantidad) + 1
        };
      })
    );
  };

  const disminuirCantidad = (keyItem) => {
    setCarrito((prev) =>
      prev.map((item) => {
        if (obtenerKeyItem(item) !== keyItem) return item;

        return {
          ...item,
          cantidad: Math.max(1, Number(item.cantidad) - 1)
        };
      })
    );
  };

  const cambiarCantidad = (keyItem, value) => {
    const cantidad = Number(value);

    setCarrito((prev) =>
      prev.map((item) => {
        if (obtenerKeyItem(item) !== keyItem) return item;

        if (
          item.tipo_item !== "combo" &&
          cantidad > Number(item.stock_actual)
        ) {
          Swal.fire(
            "Stock insuficiente",
            "La cantidad supera el stock disponible.",
            "warning"
          );

          return {
            ...item,
            cantidad: Number(item.stock_actual)
          };
        }

        return {
          ...item,
          cantidad: cantidad > 0 ? cantidad : 1
        };
      })
    );
  };

  const cambiarDescuento = (keyItem, value) => {
    const descuento = Number(value);

    setCarrito((prev) =>
      prev.map((item) => {
        if (obtenerKeyItem(item) !== keyItem) return item;

        const bruto = Number(item.precio_unitario) * Number(item.cantidad);

        return {
          ...item,
          descuento: descuento >= 0 && descuento <= bruto ? descuento : 0
        };
      })
    );
  };

  const eliminarItem = (keyItem) => {
    setCarrito((prev) =>
      prev.filter((item) => obtenerKeyItem(item) !== keyItem)
    );
  };

  const limpiarVenta = () => {
    setVentaForm(initialVenta);
    setCarrito([]);
    setBusqueda("");
    setTipoItemVenta("productos");
  };

  const subtotalBruto = carrito.reduce((acc, item) => {
    return acc + Number(item.precio_unitario) * Number(item.cantidad);
  }, 0);

  const descuentoTotal = carrito.reduce((acc, item) => {
    return acc + Number(item.descuento || 0);
  }, 0);

  const totalVenta = subtotalBruto - descuentoTotal;

  const subtotalSinIgv = totalVenta / 1.18;
  const igv = totalVenta - subtotalSinIgv;

  const validarVenta = () => {
    if (!ventaForm.id_cliente) {
      Swal.fire("Validación", "Seleccione un cliente", "warning");
      return false;
    }

    if (carrito.length === 0) {
      Swal.fire(
        "Validación",
        "Agregue al menos un producto, promoción o combo a la venta",
        "warning"
      );
      return false;
    }

    for (const item of carrito) {
      if (Number(item.cantidad) <= 0) {
        Swal.fire("Validación", "La cantidad debe ser mayor a 0", "warning");
        return false;
      }

      if (
        item.tipo_item !== "combo" &&
        Number(item.cantidad) > Number(item.stock_actual)
      ) {
        Swal.fire(
          "Stock insuficiente",
          `El producto ${item.nombre_producto} supera el stock disponible.`,
          "warning"
        );
        return false;
      }

      if (Number(item.precio_unitario) <= 0) {
        Swal.fire(
          "Precio no válido",
          `El ítem ${item.nombre_producto} no tiene precio válido.`,
          "warning"
        );
        return false;
      }
    }

    return true;
  };

  const registrarVenta = async () => {
    if (!validarVenta()) return;

    const confirmacion = await Swal.fire({
      title: "¿Registrar venta?",
      text: `Total a pagar: S/ ${totalVenta.toFixed(2)}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, registrar",
      cancelButtonText: "Cancelar"
    });

    if (!confirmacion.isConfirmed) return;

    const payload = {
      id_cliente: Number(ventaForm.id_cliente),
      origen_venta: ventaForm.origen_venta,
      metodo_pago: ventaForm.metodo_pago,
      estado_venta: ventaForm.estado_venta,

      /*
        El descuento ya viaja en cada detalle.
        Enviamos descuento_total en 0 para evitar doble descuento
        con el backend actual.
      */
      descuento_total: 0,

      detalles: carrito.map((item) => ({
        tipo_item: item.tipo_item || "producto",
        id_variante: item.id_variante ? Number(item.id_variante) : null,
        id_promocion: item.id_promocion ? Number(item.id_promocion) : null,
        id_combo: item.id_combo ? Number(item.id_combo) : null,
        descripcion_item: item.descripcion_item || item.nombre_producto || null,
        cantidad: Number(item.cantidad),
        precio_unitario: Number(item.precio_unitario),
        descuento: Number(item.descuento || 0)
      }))
    };

    try {
      setRegistrando(true);

      const response = await crearVenta(payload);

      if (response.ok) {
        Swal.fire(
          "Venta registrada",
          "La venta fue registrada correctamente",
          "success"
        );
        limpiarVenta();
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo registrar la venta",
        "error"
      );
    } finally {
      setRegistrando(false);
    }
  };

  const confirmarAnular = async (id_venta) => {
    const confirmacion = await Swal.fire({
      title: "¿Anular venta?",
      text: "La venta será anulada y el stock debería retornar según la lógica del backend.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, anular",
      cancelButtonText: "Cancelar"
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const response = await anularVenta(id_venta);

      if (response.ok) {
        Swal.fire("Anulada", "La venta fue anulada correctamente", "success");
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo anular la venta",
        "error"
      );
    }
  };

  const nombreCliente = (cliente) => {
    if (cliente.razon_social) return cliente.razon_social;

    return (
      `${cliente.nombres || ""} ${cliente.apellidos || ""}`.trim() ||
      "Cliente sin nombre"
    );
  };

  const nombreClienteVenta = (venta) => {
    return (
      venta.razon_social ||
      venta.cliente_nombre ||
      `${venta.nombres || ""} ${venta.apellidos || ""}`.trim() ||
      "Cliente no registrado"
    );
  };

  const abrirPanelCliente = () => {
    setClienteForm(initialClienteForm);
    setClientePanelOpen(true);
  };

  const cerrarPanelCliente = () => {
    setClientePanelOpen(false);
    setClienteForm(initialClienteForm);
  };

  const handleClienteChange = (event) => {
    const { name, value } = event.target;

    setClienteForm({
      ...clienteForm,
      [name]: value
    });
  };

  const validarClienteRapido = () => {
    if (!clienteForm.tipo_documento) {
      Swal.fire("Validación", "Seleccione el tipo de documento", "warning");
      return false;
    }

    if (!clienteForm.numero_documento.trim()) {
      Swal.fire("Validación", "Ingrese el número de documento", "warning");
      return false;
    }

    if (
      clienteForm.tipo_documento === "DNI" &&
      clienteForm.numero_documento.trim().length !== 8
    ) {
      Swal.fire("Validación", "El DNI debe tener 8 dígitos", "warning");
      return false;
    }

    if (
      clienteForm.tipo_documento === "RUC" &&
      clienteForm.numero_documento.trim().length !== 11
    ) {
      Swal.fire("Validación", "El RUC debe tener 11 dígitos", "warning");
      return false;
    }

    if (clienteForm.tipo_documento === "RUC") {
      if (!clienteForm.razon_social.trim()) {
        Swal.fire("Validación", "Para RUC debe ingresar razón social", "warning");
        return false;
      }
    } else {
      if (!clienteForm.nombres.trim()) {
        Swal.fire("Validación", "Ingrese los nombres del cliente", "warning");
        return false;
      }

      if (!clienteForm.apellidos.trim()) {
        Swal.fire("Validación", "Ingrese los apellidos del cliente", "warning");
        return false;
      }
    }

    if (clienteForm.correo.trim()) {
      const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!correoRegex.test(clienteForm.correo.trim())) {
        Swal.fire("Validación", "El correo no tiene un formato válido", "warning");
        return false;
      }
    }

    return true;
  };

  const guardarClienteRapido = async (event) => {
    event.preventDefault();

    if (!validarClienteRapido()) return;

    const payload = {
      tipo_documento: clienteForm.tipo_documento,
      numero_documento: clienteForm.numero_documento.trim(),
      nombres:
        clienteForm.tipo_documento === "RUC"
          ? null
          : clienteForm.nombres.trim(),
      apellidos:
        clienteForm.tipo_documento === "RUC"
          ? null
          : clienteForm.apellidos.trim(),
      razon_social:
        clienteForm.tipo_documento === "RUC"
          ? clienteForm.razon_social.trim()
          : null,
      correo: clienteForm.correo.trim() || null,
      telefono: clienteForm.telefono.trim() || null,
      direccion: clienteForm.direccion.trim() || null,
      estado_cliente: "activo"
    };

    try {
      setGuardandoCliente(true);

      const response = await crearCliente(payload);

      if (response.ok) {
        Swal.fire("Cliente creado", "El cliente fue agregado correctamente", "success");

        await cargarDatos();

        const nuevoCliente = response.data;

        if (nuevoCliente?.id_cliente) {
          setVentaForm({
            ...ventaForm,
            id_cliente: nuevoCliente.id_cliente
          });
        }

        cerrarPanelCliente();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo crear el cliente",
        "error"
      );
    } finally {
      setGuardandoCliente(false);
    }
  };

  const irAFacturar = (id_venta) => {
    navigate(`/facturacion/generar/${id_venta}`);
  };

  const confirmarCompletar = async (id_venta) => {
    const confirmacion = await Swal.fire({
      title: "¿Completar venta?",
      text: "Se descontará el stock y la venta quedará lista para facturación.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, completar",
      cancelButtonText: "Cancelar"
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const response = await completarVenta(id_venta);

      if (response.ok) {
        Swal.fire(
          "Venta completada",
          "La venta fue completada correctamente",
          "success"
        );

        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo completar la venta",
        "error"
      );
    }
  };

  const verDetalleVenta = async (id_venta) => {
    try {
      setCargandoDetalle(true);

      const response = await obtenerVenta(id_venta);

      if (response.ok) {
        setVentaDetalle(response.data);
        setDetallePanelOpen(true);
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo obtener el detalle de la venta",
        "error"
      );
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cerrarDetalleVenta = () => {
    setDetallePanelOpen(false);
    setVentaDetalle(null);
  };

  const descargarTicket = async (venta) => {
    try {
      let ventaParaTicket = ventaDetalle;

      if (!ventaParaTicket || ventaParaTicket.id_venta !== venta.id_venta) {
        const response = await obtenerVenta(venta.id_venta);

        if (response.ok) {
          ventaParaTicket = response.data;
        }
      }

      generarTicketVentaPDF(ventaParaTicket);
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo generar el ticket",
        "error"
      );
    }
  };

  const confirmarGenerarPedido = async (venta) => {
    if (venta.estado_venta !== "completada") {
      Swal.fire(
        "Venta no completada",
        "Solo se puede generar pedido para ventas completadas.",
        "warning"
      );
      return;
    }

    const confirmacion = await Swal.fire({
      title: "¿Generar pedido?",
      text: `Se creará un pedido para la venta #${venta.id_venta}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, generar",
      cancelButtonText: "Cancelar"
    });

    if (!confirmacion.isConfirmed) return;

    const payload = {
      id_venta: Number(venta.id_venta),
      id_cliente: Number(venta.id_cliente),
      tipo_entrega:
        venta.origen_venta === "ecommerce" ? "delivery" : "recojo_tienda",
      estado_pedido: "pendiente"
    };

    try {
      const response = await crearPedido(payload);

      if (response.ok) {
        Swal.fire(
          "Pedido generado",
          "El pedido fue creado correctamente.",
          "success"
        );

        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo generar el pedido",
        "error"
      );
    }
  };

  if (loading) {
    return <p>Cargando ventas...</p>;
  }

  const totalPaginasVentas = Math.ceil(ventas.length / REGISTROS_POR_PAGINA);

  const ventasPaginadas = ventas.slice(
    (paginaVentas - 1) * REGISTROS_POR_PAGINA,
    paginaVentas * REGISTROS_POR_PAGINA
  );

  return (
    <div className="ventas-page">
      <div className="page-header">
        <div>
          <h1>Ventas</h1>
          <p>Registro de ventas y descuento automático de inventario.</p>
        </div>

        <button className="btn-secondary" onClick={cargarDatos}>
          Actualizar
        </button>
      </div>

      <div className="ventas-layout">
        <section className="panel venta-panel">
          <h2>Nueva venta</h2>

          <div className="venta-form-grid">
            <div className="form-group">
              <div className="label-action-row">
                <label>Cliente</label>

                <button
                  type="button"
                  className="btn-link-action"
                  onClick={abrirPanelCliente}
                >
                  + Nuevo cliente
                </button>
              </div>

              <select
                name="id_cliente"
                value={ventaForm.id_cliente}
                onChange={handleVentaChange}
              >
                <option value="">Seleccione cliente</option>
                {clientes
                  .filter((cliente) => cliente.estado_cliente === "activo")
                  .map((cliente) => (
                    <option key={cliente.id_cliente} value={cliente.id_cliente}>
                      {nombreCliente(cliente)} - {cliente.tipo_documento}:{" "}
                      {cliente.numero_documento}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label>Origen de venta</label>
              <select
                name="origen_venta"
                value={ventaForm.origen_venta}
                onChange={handleVentaChange}
              >
                <option value="presencial">Presencial</option>
                <option value="ecommerce">Ecommerce</option>
              </select>
            </div>

            <div className="form-group">
              <label>Método de pago</label>
              <select
                name="metodo_pago"
                value={ventaForm.metodo_pago}
                onChange={handleVentaChange}
              >
                <option value="efectivo">Efectivo</option>
                <option value="yape">Yape</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>

            <div className="form-group">
              <label>Estado</label>
              <select
                name="estado_venta"
                value={ventaForm.estado_venta}
                onChange={handleVentaChange}
              >
                <option value="completada">Completada</option>
                <option value="pendiente">Pendiente</option>
              </select>
            </div>
          </div>

          <div className="venta-products-section">
            <div className="catalog-tabs">
              <button
                type="button"
                className={tipoItemVenta === "productos" ? "active" : ""}
                onClick={() => setTipoItemVenta("productos")}
              >
                Productos
              </button>

              <button
                type="button"
                className={tipoItemVenta === "promociones" ? "active" : ""}
                onClick={() => setTipoItemVenta("promociones")}
              >
                Promociones
              </button>

              <button
                type="button"
                className={tipoItemVenta === "combos" ? "active" : ""}
                onClick={() => setTipoItemVenta("combos")}
              >
                Combos
              </button>
            </div>

            <div className="section-title-row">
              <h3>
                {tipoItemVenta === "productos" && "Productos disponibles"}
                {tipoItemVenta === "promociones" && "Promociones disponibles"}
                {tipoItemVenta === "combos" && "Combos disponibles"}
              </h3>

              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, SKU o descripción"
              />
            </div>

            <div className="products-sale-grid">
              {tipoItemVenta === "productos" &&
                (variantesFiltradas.length > 0 ? (
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
                        <strong>
                          S/{" "}
                          {Number(
                            variante.precio_venta ??
                              variante.precio_producto ??
                              variante.precio_unitario ??
                              0
                          ).toFixed(2)}
                        </strong>
                        <span>Stock: {variante.stock_actual}</span>
                      </div>

                      <button
                        type="button"
                        className="btn-small"
                        onClick={() => agregarAlCarrito(variante)}
                      >
                        Agregar
                      </button>
                    </div>
                  ))
                ) : (
                  <p>No hay productos disponibles para venta.</p>
                ))}

              {tipoItemVenta === "promociones" &&
                (promocionesFiltradas.length > 0 ? (
                  promocionesFiltradas.map((promo) => (
                    <div className="sale-product-card" key={promo.id_promocion}>
                      <div>
                        <h4>{promo.nombre_promocion}</h4>
                        <p>{promo.descripcion || "Promoción"}</p>
                        <small>
                          Descuento:{" "}
                          {promo.tipo_descuento === "porcentaje"
                            ? `${Number(promo.valor_descuento || 0).toFixed(2)}%`
                            : `S/ ${Number(promo.valor_descuento || 0).toFixed(2)}`}
                        </small>
                      </div>

                      <div className="sale-product-bottom">
                        <strong>{promo.estado_promocion}</strong>
                        <span>
                          {promo.fecha_inicio || "-"} / {promo.fecha_fin || "-"}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="btn-small"
                        onClick={() => agregarPromocionCarrito(promo)}
                      >
                        Agregar promo
                      </button>
                    </div>
                  ))
                ) : (
                  <p>No hay promociones disponibles.</p>
                ))}

              {tipoItemVenta === "combos" &&
                (combosFiltrados.length > 0 ? (
                  combosFiltrados.map((combo) => (
                    <div className="sale-product-card" key={combo.id_combo}>
                      <div>
                        <h4>{combo.nombre_combo}</h4>
                        <p>{combo.descripcion || "Combo comercial"}</p>
                        <small>
                          Precio normal: S/{" "}
                          {Number(combo.precio_normal || 0).toFixed(2)}
                        </small>
                      </div>

                      <div className="sale-product-bottom">
                        <strong>
                          S/ {Number(combo.precio_combo || 0).toFixed(2)}
                        </strong>
                        <span>{combo.estado_combo}</span>
                      </div>

                      <button
                        type="button"
                        className="btn-small"
                        onClick={() => agregarComboCarrito(combo)}
                      >
                        Agregar combo
                      </button>
                    </div>
                  ))
                ) : (
                  <p>No hay combos disponibles.</p>
                ))}
            </div>
          </div>
        </section>

        <section className="panel cart-panel">
          <h2>Carrito de venta</h2>

          {carrito.length > 0 ? (
            <>
              <div className="cart-items">
                {carrito.map((item) => (
                  <div className="cart-item" key={obtenerKeyItem(item)}>
                    <div className="cart-info">
                      <strong>{item.nombre_producto}</strong>

                      <small>
                        {item.tipo_item === "combo"
                          ? "Combo"
                          : item.tipo_item === "promocion"
                          ? `Promoción | ${item.nombre_color} | ${item.nombre_talla} | ${item.sku}`
                          : `${item.nombre_color} | ${item.nombre_talla} | ${item.sku}`}
                      </small>

                      <small>
                        S/ {Number(item.precio_unitario).toFixed(2)} c/u
                      </small>
                    </div>

                    <div className="cart-controls">
                      <button
                        type="button"
                        onClick={() => disminuirCantidad(obtenerKeyItem(item))}
                      >
                        -
                      </button>

                      <input
                        type="number"
                        min="1"
                        max={item.tipo_item === "combo" ? undefined : item.stock_actual}
                        value={item.cantidad}
                        onChange={(e) =>
                          cambiarCantidad(obtenerKeyItem(item), e.target.value)
                        }
                      />

                      <button
                        type="button"
                        onClick={() => aumentarCantidad(obtenerKeyItem(item))}
                      >
                        +
                      </button>
                    </div>

                    <div className="form-group discount-group">
                      <label>Descuento S/</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.descuento}
                        onChange={(e) =>
                          cambiarDescuento(obtenerKeyItem(item), e.target.value)
                        }
                      />
                    </div>

                    <div className="cart-item-total">
                      <strong>
                        S/{" "}
                        {(
                          Number(item.precio_unitario) * Number(item.cantidad) -
                          Number(item.descuento || 0)
                        ).toFixed(2)}
                      </strong>

                      <button
                        type="button"
                        className="btn-small btn-danger"
                        onClick={() => eliminarItem(obtenerKeyItem(item))}
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="sale-summary">
                <div>
                  <span>Subtotal bruto</span>
                  <strong>S/ {subtotalBruto.toFixed(2)}</strong>
                </div>

                <div>
                  <span>Descuento</span>
                  <strong>S/ {descuentoTotal.toFixed(2)}</strong>
                </div>

                <div>
                  <span>Subtotal sin IGV</span>
                  <strong>S/ {subtotalSinIgv.toFixed(2)}</strong>
                </div>

                <div>
                  <span>IGV 18%</span>
                  <strong>S/ {igv.toFixed(2)}</strong>
                </div>

                <div className="sale-total">
                  <span>Total</span>
                  <strong>S/ {totalVenta.toFixed(2)}</strong>
                </div>
              </div>

              <div className="cart-actions">
                <button className="btn-secondary" onClick={limpiarVenta}>
                  Limpiar
                </button>

                <button
                  className="btn-primary"
                  onClick={registrarVenta}
                  disabled={registrando}
                >
                  {registrando ? "Registrando..." : "Registrar venta"}
                </button>
              </div>
            </>
          ) : (
            <p>No hay productos en el carrito.</p>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Ventas registradas</h2>
            <p>{ventas.length} ventas encontradas</p>
          </div>
        </div>

        {ventas.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Origen</th>
                  <th>Pago</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {ventasPaginadas.map((venta) => (
                  <tr key={venta.id_venta}>
                    <td>#{venta.id_venta}</td>
                    <td>{venta.fecha_venta}</td>
                    <td>{nombreClienteVenta(venta)}</td>
                    <td>{venta.origen_venta}</td>
                    <td>{venta.metodo_pago}</td>
                    <td>S/ {Number(venta.total || 0).toFixed(2)}</td>
                    <td>
                      <span
                        className={
                          venta.estado_venta === "completada"
                            ? "status-badge status-active"
                            : venta.estado_venta === "anulada"
                            ? "status-badge status-inactive"
                            : "status-badge"
                        }
                      >
                        {venta.estado_venta}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-small"
                          onClick={() => verDetalleVenta(venta.id_venta)}
                          disabled={cargandoDetalle}
                        >
                          Ver
                        </button>

                        <button
                          className="btn-small btn-secondary-small"
                          onClick={() => descargarTicket(venta)}
                        >
                          Ticket
                        </button>

                        {venta.estado_venta === "pendiente" && (
                          <button
                            className="btn-small btn-warning"
                            onClick={() => confirmarCompletar(venta.id_venta)}
                          >
                            Completar
                          </button>
                        )}

                        {venta.estado_venta === "completada" && (
                          <button
                            className="btn-small btn-secondary-small"
                            onClick={() => confirmarGenerarPedido(venta)}
                          >
                            Generar pedido
                          </button>
                        )}

                        {venta.estado_venta === "completada" && (
                          <button
                            className="btn-small btn-success"
                            onClick={() => irAFacturar(venta.id_venta)}
                          >
                            Facturar
                          </button>
                        )}

                        {venta.estado_venta !== "anulada" && (
                          <button
                            className="btn-small btn-danger"
                            onClick={() => confirmarAnular(venta.id_venta)}
                          >
                            Anular
                          </button>
                        )}

                        {venta.estado_venta === "anulada" && <small>Sin acciones</small>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {totalPaginasVentas > 1 && (
                <div className="pagination">
                  <button
                    type="button"
                    className="btn-small"
                    disabled={paginaVentas === 1}
                    onClick={() => setPaginaVentas((prev) => prev - 1)}
                  >
                    Anterior
                  </button>

                  <span>
                    Página {paginaVentas} de {totalPaginasVentas}
                  </span>

                  <button
                    type="button"
                    className="btn-small"
                    disabled={paginaVentas === totalPaginasVentas}
                    onClick={() => setPaginaVentas((prev) => prev + 1)}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </table>
          </div>
        ) : (
          <p>No hay ventas registradas.</p>
        )}

      </section>

      {clientePanelOpen && (
        <>
          <div className="drawer-overlay" onClick={cerrarPanelCliente} />

          <aside className="drawer-panel">
            <div className="drawer-header">
              <div>
                <h2>Crear cliente</h2>
                <p>Registre un cliente sin salir del proceso de venta.</p>
              </div>

              <button className="drawer-close" onClick={cerrarPanelCliente}>
                ×
              </button>
            </div>

            <form className="drawer-form" onSubmit={guardarClienteRapido}>
              <div className="form-group">
                <label>Tipo de documento</label>
                <select
                  name="tipo_documento"
                  value={clienteForm.tipo_documento}
                  onChange={handleClienteChange}
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
                  value={clienteForm.numero_documento}
                  onChange={handleClienteChange}
                  placeholder="Ingrese documento"
                />
              </div>

              {clienteForm.tipo_documento === "RUC" ? (
                <div className="form-group">
                  <label>Razón social</label>
                  <input
                    type="text"
                    name="razon_social"
                    value={clienteForm.razon_social}
                    onChange={handleClienteChange}
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
                      value={clienteForm.nombres}
                      onChange={handleClienteChange}
                      placeholder="Nombres"
                    />
                  </div>

                  <div className="form-group">
                    <label>Apellidos</label>
                    <input
                      type="text"
                      name="apellidos"
                      value={clienteForm.apellidos}
                      onChange={handleClienteChange}
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
                  value={clienteForm.correo}
                  onChange={handleClienteChange}
                  placeholder="cliente@email.com"
                />
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="text"
                  name="telefono"
                  value={clienteForm.telefono}
                  onChange={handleClienteChange}
                  placeholder="999999999"
                />
              </div>

              <div className="form-group">
                <label>Dirección</label>
                <textarea
                  name="direccion"
                  value={clienteForm.direccion}
                  onChange={handleClienteChange}
                  placeholder="Dirección del cliente"
                />
              </div>

              <div className="drawer-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cerrarPanelCliente}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={guardandoCliente}
                >
                  {guardandoCliente ? "Guardando..." : "Crear cliente"}
                </button>
              </div>
            </form>
          </aside>
        </>
      )}

      {detallePanelOpen && ventaDetalle && (
        <>
          <div className="drawer-overlay" onClick={cerrarDetalleVenta} />

          <aside className="drawer-panel drawer-wide">
            <div className="drawer-header">
              <div>
                <h2>Detalle de venta #{ventaDetalle.id_venta}</h2>
                <p>Información completa de la venta registrada.</p>
              </div>

              <button className="drawer-close" onClick={cerrarDetalleVenta}>
                ×
              </button>
            </div>

            <div className="sale-detail-content">
              <div className="detail-grid">
                <DetailItem label="Fecha" value={ventaDetalle.fecha_venta || "-"} />
                <DetailItem
                  label="Cliente"
                  value={
                    ventaDetalle.razon_social ||
                    ventaDetalle.cliente_nombre ||
                    `${ventaDetalle.nombres || ""} ${ventaDetalle.apellidos || ""}`.trim() ||
                    "Cliente no registrado"
                  }
                />
                <DetailItem
                  label="Documento"
                  value={`${ventaDetalle.tipo_documento || "-"} ${
                    ventaDetalle.numero_documento || ""
                  }`}
                />
                <DetailItem label="Origen" value={ventaDetalle.origen_venta || "-"} />
                <DetailItem label="Método de pago" value={ventaDetalle.metodo_pago || "-"} />
                <DetailItem label="Estado" value={ventaDetalle.estado_venta || "-"} />
              </div>

              <h3>Ítems vendidos</h3>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Producto / Ítem</th>
                      <th>SKU</th>
                      <th>Cant.</th>
                      <th>Precio</th>
                      <th>Desc.</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(ventaDetalle.detalles || ventaDetalle.detalle || []).map(
                      (item, index) => (
                        <tr key={item.id_detalle_venta || index}>
                          <td>{item.tipo_item || "producto"}</td>
                          <td>
                            {item.nombre_item ||
                              item.descripcion_item ||
                              item.nombre_producto ||
                              item.nombre_combo ||
                              item.descripcion ||
                              "Producto"}
                          </td>
                          <td>{item.sku || "-"}</td>
                          <td>{item.cantidad}</td>
                          <td>S/ {Number(item.precio_unitario || 0).toFixed(2)}</td>
                          <td>S/ {Number(item.descuento || 0).toFixed(2)}</td>
                          <td>
                            S/{" "}
                            {Number(
                              item.subtotal ||
                                item.total ||
                                Number(item.precio_unitario || 0) *
                                  Number(item.cantidad || 0) -
                                  Number(item.descuento || 0)
                            ).toFixed(2)}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="detail-totals">
                <div>
                  <span>Subtotal</span>
                  <strong>S/ {Number(ventaDetalle.subtotal || 0).toFixed(2)}</strong>
                </div>

                <div>
                  <span>IGV</span>
                  <strong>S/ {Number(ventaDetalle.igv || 0).toFixed(2)}</strong>
                </div>

                <div>
                  <span>Descuento</span>
                  <strong>
                    S/ {Number(ventaDetalle.descuento_total || 0).toFixed(2)}
                  </strong>
                </div>

                <div className="detail-total-final">
                  <span>Total</span>
                  <strong>S/ {Number(ventaDetalle.total || 0).toFixed(2)}</strong>
                </div>
              </div>

              <div className="drawer-actions">
                <button
                  className="btn-secondary"
                  onClick={() => generarTicketVentaPDF(ventaDetalle)}
                >
                  Descargar ticket
                </button>

                {ventaDetalle.estado_venta === "completada" && (
                  <button
                    className="btn-primary"
                    onClick={() => irAFacturar(ventaDetalle.id_venta)}
                  >
                    Facturar
                  </button>
                )}
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
};

const DetailItem = ({ label, value }) => {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
};

export default Ventas;