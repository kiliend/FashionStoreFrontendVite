import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import {
  listarPedidos,
  obtenerPedido,
  actualizarEstadoPedido,
  asignarPedido
} from "../services/pedidos.service";

import { listarUsuarios } from "../services/usuarios.service";

import {
  listarRepartos,
  crearReparto,
  marcarSalidaReparto,
  marcarEntregaReparto,
  marcarRepartoFallido
} from "../services/repartos.service";

import {
  listarVehiculos,
  crearVehiculo,
  actualizarVehiculo,
  eliminarVehiculo
} from "../services/vehiculos.service";

const estadosPedido = [
  "pendiente",
  "validado_almacen",
  "en_preparacion",
  "preparado",
  "asignado_reparto",
  "en_ruta",
  "entregado",
  "rechazado",
  "cancelado"
];

const initialAsignacion = {
  id_usuario_almacen: "",
  id_usuario_despacho: "",
  id_usuario_reparto: "",
  observacion: ""
};

const initialReparto = {
  id_pedido: "",
  id_usuario_reparto: "",
  id_vehiculo: "",
  direccion_entrega: "",
  observaciones: ""
};

const initialVehiculo = {
  tipo_vehiculo: "moto",
  placa: "",
  marca: "",
  modelo: "",
  estado_vehiculo: "disponible"
};

const Pedidos = () => {
  const [activeTab, setActiveTab] = useState("pedidos");

  const [pedidos, setPedidos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [repartos, setRepartos] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);

  const [pedidoDetalle, setPedidoDetalle] = useState(null);
  const [detallePanelOpen, setDetallePanelOpen] = useState(false);

  const [estadoPanelOpen, setEstadoPanelOpen] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState("");

  const [asignacionPanelOpen, setAsignacionPanelOpen] = useState(false);
  const [asignacionForm, setAsignacionForm] = useState(initialAsignacion);

  const [repartoPanelOpen, setRepartoPanelOpen] = useState(false);
  const [pedidoParaReparto, setPedidoParaReparto] = useState(null);
  const [repartoForm, setRepartoForm] = useState(initialReparto);

  const [vehiculoPanelOpen, setVehiculoPanelOpen] = useState(false);
  const [vehiculoForm, setVehiculoForm] = useState(initialVehiculo);
  const [editVehiculoId, setEditVehiculoId] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroEntrega, setFiltroEntrega] = useState("");

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const REGISTROS_POR_PAGINA = 15;
  const [paginaPedidos, setPaginaPedidos] = useState(1);
  const [paginaRepartos, setPaginaRepartos] = useState(1);
  const [paginaVehiculos, setPaginaVehiculos] = useState(1);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [pedidosRes, usuariosRes, repartosRes, vehiculosRes] =
        await Promise.all([
          listarPedidos(),
          listarUsuarios(),
          listarRepartos(),
          listarVehiculos()
        ]);

      if (pedidosRes.ok) setPedidos(pedidosRes.data || []);
      if (usuariosRes.ok) setUsuarios(usuariosRes.data || []);
      if (repartosRes.ok) setRepartos(repartosRes.data || []);
      if (vehiculosRes.ok) setVehiculos(vehiculosRes.data || []);
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo cargar el módulo de pedidos",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const normalizarTexto = (texto) => {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const normalizarEstado = (estado) => {
    return String(estado || "").toLowerCase();
  };

  const nombreClientePedido = (pedido) => {
    return (
      pedido.razon_social ||
      pedido.cliente_nombre ||
      `${pedido.nombres || ""} ${pedido.apellidos || ""}`.trim() ||
      "Cliente no registrado"
    );
  };

  const nombreClienteReparto = (reparto) => {
    return (
      reparto.razon_social ||
      reparto.cliente_nombre ||
      `${reparto.nombres || ""} ${reparto.apellidos || ""}`.trim() ||
      "Cliente no registrado"
    );
  };

  const usuariosPorRol = (rol) => {
    return usuarios.filter((usuario) => {
      const rolUsuario = normalizarTexto(usuario.nombre_rol || usuario.rol);

      return (
        rolUsuario === rol &&
        String(usuario.estado_usuario || "").toLowerCase() === "activo"
      );
    });
  };

  const vehiculosDisponibles = useMemo(() => {
    return vehiculos.filter(
      (vehiculo) => vehiculo.estado_vehiculo === "disponible"
    );
  }, [vehiculos]);

  const pedidosFiltrados = useMemo(() => {
    const texto = normalizarTexto(busqueda);

    return pedidos
      .filter((pedido) => {
        if (!filtroEstado) return true;
        return pedido.estado_pedido === filtroEstado;
      })
      .filter((pedido) => {
        if (!filtroEntrega) return true;
        return pedido.tipo_entrega === filtroEntrega;
      })
      .filter((pedido) => {
        if (!texto) return true;

        return (
          normalizarTexto(pedido.id_pedido).includes(texto) ||
          normalizarTexto(pedido.id_venta).includes(texto) ||
          normalizarTexto(nombreClientePedido(pedido)).includes(texto) ||
          normalizarTexto(pedido.tipo_entrega).includes(texto) ||
          normalizarTexto(pedido.estado_pedido).includes(texto) ||
          normalizarTexto(pedido.usuario_almacen).includes(texto) ||
          normalizarTexto(pedido.usuario_despacho).includes(texto) ||
          normalizarTexto(pedido.usuario_reparto).includes(texto)
        );
      });
  }, [pedidos, busqueda, filtroEstado, filtroEntrega]);

  const repartosFiltrados = useMemo(() => {
    const texto = normalizarTexto(busqueda);

    return repartos.filter((reparto) => {
      if (!texto) return true;

      return (
        normalizarTexto(reparto.id_reparto).includes(texto) ||
        normalizarTexto(reparto.id_pedido).includes(texto) ||
        normalizarTexto(nombreClienteReparto(reparto)).includes(texto) ||
        normalizarTexto(reparto.repartidor || reparto.usuario_reparto).includes(texto) ||
        normalizarTexto(reparto.placa).includes(texto) ||
        normalizarTexto(reparto.estado_reparto).includes(texto)
      );
    });
  }, [repartos, busqueda]);

  const vehiculosFiltrados = useMemo(() => {
    const texto = normalizarTexto(busqueda);

    return vehiculos.filter((vehiculo) => {
      if (!texto) return true;

      return (
        normalizarTexto(vehiculo.id_vehiculo).includes(texto) ||
        normalizarTexto(vehiculo.tipo_vehiculo).includes(texto) ||
        normalizarTexto(vehiculo.placa).includes(texto) ||
        normalizarTexto(vehiculo.marca).includes(texto) ||
        normalizarTexto(vehiculo.modelo).includes(texto) ||
        normalizarTexto(vehiculo.estado_vehiculo).includes(texto)
      );
    });
  }, [vehiculos, busqueda]);

  const totalPaginasPedidos = Math.ceil(
    pedidosFiltrados.length / REGISTROS_POR_PAGINA
  );

  const pedidosPaginados = pedidosFiltrados.slice(
    (paginaPedidos - 1) * REGISTROS_POR_PAGINA,
    paginaPedidos * REGISTROS_POR_PAGINA
  );

  const totalPaginasRepartos = Math.ceil(
    repartosFiltrados.length / REGISTROS_POR_PAGINA
  );

  const repartosPaginados = repartosFiltrados.slice(
    (paginaRepartos - 1) * REGISTROS_POR_PAGINA,
    paginaRepartos * REGISTROS_POR_PAGINA
  );

  const totalPaginasVehiculos = Math.ceil(
    vehiculosFiltrados.length / REGISTROS_POR_PAGINA
  );

  const vehiculosPaginados = vehiculosFiltrados.slice(
    (paginaVehiculos - 1) * REGISTROS_POR_PAGINA,
    paginaVehiculos * REGISTROS_POR_PAGINA
  );

  const claseEstadoPedido = (estado) => {
    const estadoNormalizado = normalizarEstado(estado);

    if (estadoNormalizado === "entregado") return "status-badge status-active";

    if (
      estadoNormalizado === "cancelado" ||
      estadoNormalizado === "rechazado"
    ) {
      return "status-badge status-inactive";
    }

    if (
      estadoNormalizado === "pendiente" ||
      estadoNormalizado === "en_preparacion"
    ) {
      return "status-badge status-warning";
    }

    return "status-badge";
  };

  const claseEstadoReparto = (estado) => {
    const estadoNormalizado = normalizarEstado(estado);

    if (estadoNormalizado === "entregado") return "status-badge status-active";
    if (estadoNormalizado === "fallido") return "status-badge status-inactive";
    if (estadoNormalizado === "en_ruta") return "status-badge";

    return "status-badge status-warning";
  };

  const claseEstadoVehiculo = (estado) => {
    if (estado === "disponible") return "status-badge status-active";
    if (estado === "en_ruta") return "status-badge";
    if (estado === "mantenimiento") return "status-badge status-warning";
    return "status-badge status-inactive";
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroEstado("");
    setFiltroEntrega("");
    setPaginaPedidos(1);
    setPaginaRepartos(1);
    setPaginaVehiculos(1);
  };

  const verPedido = async (id_pedido) => {
    try {
      const response = await obtenerPedido(id_pedido);

      if (response.ok) {
        setPedidoDetalle(response.data);
        setDetallePanelOpen(true);
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo obtener el pedido",
        "error"
      );
    }
  };

  const cerrarDetalle = () => {
    setPedidoDetalle(null);
    setDetallePanelOpen(false);
  };

  const abrirCambioEstado = (pedido) => {
    setPedidoSeleccionado(pedido);
    setNuevoEstado(pedido.estado_pedido || "pendiente");
    setEstadoPanelOpen(true);
  };

  const cerrarCambioEstado = () => {
    setPedidoSeleccionado(null);
    setNuevoEstado("");
    setEstadoPanelOpen(false);
  };

  const guardarEstado = async (event) => {
    event.preventDefault();

    if (!pedidoSeleccionado) return;

    if (!nuevoEstado) {
      Swal.fire("Validación", "Seleccione un estado", "warning");
      return;
    }

    const confirmacion = await Swal.fire({
      title: "¿Actualizar estado?",
      text: `El pedido cambiará a: ${nuevoEstado}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, actualizar",
      cancelButtonText: "Cancelar"
    });

    if (!confirmacion.isConfirmed) return;

    try {
      setGuardando(true);

      const response = await actualizarEstadoPedido(
        pedidoSeleccionado.id_pedido,
        { estado_pedido: nuevoEstado }
      );

      if (response.ok) {
        Swal.fire("Actualizado", "Estado del pedido actualizado", "success");
        cerrarCambioEstado();
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo actualizar el pedido",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  const abrirAsignacion = (pedido) => {
    setPedidoSeleccionado(pedido);

    setAsignacionForm({
      id_usuario_almacen: pedido.id_usuario_almacen || "",
      id_usuario_despacho: pedido.id_usuario_despacho || "",
      id_usuario_reparto: pedido.id_usuario_reparto || "",
      observacion: ""
    });

    setAsignacionPanelOpen(true);
  };

  const cerrarAsignacion = () => {
    setPedidoSeleccionado(null);
    setAsignacionForm(initialAsignacion);
    setAsignacionPanelOpen(false);
  };

  const handleAsignacionChange = (event) => {
    setAsignacionForm({
      ...asignacionForm,
      [event.target.name]: event.target.value
    });
  };

  const guardarAsignacion = async (event) => {
    event.preventDefault();

    if (!pedidoSeleccionado) return;

    const asignaciones = [];

    if (asignacionForm.id_usuario_almacen) {
      asignaciones.push({
        id_usuario: Number(asignacionForm.id_usuario_almacen),
        rol_operativo: "almacen"
      });
    }

    if (asignacionForm.id_usuario_despacho) {
      asignaciones.push({
        id_usuario: Number(asignacionForm.id_usuario_despacho),
        rol_operativo: "despacho"
      });
    }

    if (asignacionForm.id_usuario_reparto) {
      asignaciones.push({
        id_usuario: Number(asignacionForm.id_usuario_reparto),
        rol_operativo: "reparto"
      });
    }

    if (asignaciones.length === 0) {
      Swal.fire(
        "Validación",
        "Seleccione al menos un responsable para asignar.",
        "warning"
      );
      return;
    }

    try {
      setGuardando(true);

      for (const item of asignaciones) {
        await asignarPedido(pedidoSeleccionado.id_pedido, {
          id_usuario: item.id_usuario,
          rol_operativo: item.rol_operativo,
          observacion: asignacionForm.observacion.trim() || null
        });
      }

      Swal.fire("Asignado", "Responsables asignados correctamente", "success");
      cerrarAsignacion();
      cargarDatos();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo asignar el pedido",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  const abrirCrearReparto = (pedido) => {
    setPedidoParaReparto(pedido);

    setRepartoForm({
      id_pedido: pedido.id_pedido,
      id_usuario_reparto: pedido.id_usuario_reparto || "",
      id_vehiculo: "",
      direccion_entrega: pedido.direccion_entrega || "",
      observaciones: ""
    });

    setRepartoPanelOpen(true);
  };

  const cerrarCrearReparto = () => {
    setPedidoParaReparto(null);
    setRepartoForm(initialReparto);
    setRepartoPanelOpen(false);
  };

  const handleRepartoChange = (event) => {
    setRepartoForm({
      ...repartoForm,
      [event.target.name]: event.target.value
    });
  };

  const guardarReparto = async (event) => {
    event.preventDefault();

    if (!repartoForm.id_pedido) {
      Swal.fire("Validación", "No hay pedido seleccionado", "warning");
      return;
    }

    if (!repartoForm.id_usuario_reparto) {
      Swal.fire("Validación", "Seleccione un repartidor", "warning");
      return;
    }

    if (!repartoForm.id_vehiculo) {
      Swal.fire("Validación", "Seleccione un vehículo", "warning");
      return;
    }

    if (!repartoForm.direccion_entrega.trim()) {
      Swal.fire("Validación", "Ingrese la dirección de entrega", "warning");
      return;
    }

    const payload = {
      id_pedido: Number(repartoForm.id_pedido),

      // Enviamos ambos nombres para compatibilidad con el backend
      id_usuario_reparto: Number(repartoForm.id_usuario_reparto),
      id_repartidor: Number(repartoForm.id_usuario_reparto),

      id_vehiculo: Number(repartoForm.id_vehiculo),
      direccion_entrega: repartoForm.direccion_entrega.trim(),
      observaciones: repartoForm.observaciones.trim() || null,
      estado_reparto: "pendiente"
    };

    try {
      setGuardando(true);

      const response = await crearReparto(payload);

      if (response.ok) {
        Swal.fire("Reparto creado", "El pedido fue asignado a reparto", "success");
        cerrarCrearReparto();
        cargarDatos();
        setActiveTab("repartos");
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo crear el reparto",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  const confirmarSalidaReparto = async (id_reparto) => {
    const confirmacion = await Swal.fire({
      title: "¿Marcar salida a ruta?",
      text: "El reparto cambiará a estado en ruta.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Cancelar"
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const response = await marcarSalidaReparto(id_reparto);

      if (response.ok) {
        Swal.fire("En ruta", "El reparto salió a ruta correctamente", "success");
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo marcar salida",
        "error"
      );
    }
  };

  const confirmarEntregaReparto = async (id_reparto) => {
    const confirmacion = await Swal.fire({
      title: "¿Confirmar entrega?",
      text: "El reparto será marcado como entregado.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, entregar",
      cancelButtonText: "Cancelar"
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const response = await marcarEntregaReparto(id_reparto);

      if (response.ok) {
        Swal.fire("Entregado", "El pedido fue entregado correctamente", "success");
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo marcar entrega",
        "error"
      );
    }
  };

  const confirmarRepartoFallido = async (id_reparto) => {
    const { value: motivo } = await Swal.fire({
      title: "Motivo de reparto fallido",
      input: "textarea",
      inputPlaceholder: "Ej. Cliente ausente, dirección incorrecta...",
      showCancelButton: true,
      confirmButtonText: "Registrar fallido",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => {
        if (!value) return "Debe ingresar un motivo";
        return null;
      }
    });

    if (!motivo) return;

    try {
      const response = await marcarRepartoFallido(id_reparto, {
        motivo_fallido: motivo
      });

      if (response.ok) {
        Swal.fire("Registrado", "El reparto fue marcado como fallido", "success");
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo marcar como fallido",
        "error"
      );
    }
  };

  const abrirCrearVehiculo = () => {
    setEditVehiculoId(null);
    setVehiculoForm(initialVehiculo);
    setVehiculoPanelOpen(true);
  };

  const abrirEditarVehiculo = (vehiculo) => {
    setEditVehiculoId(vehiculo.id_vehiculo);

    setVehiculoForm({
      tipo_vehiculo: vehiculo.tipo_vehiculo || "moto",
      placa: vehiculo.placa || "",
      marca: vehiculo.marca || "",
      modelo: vehiculo.modelo || "",
      estado_vehiculo: vehiculo.estado_vehiculo || "disponible"
    });

    setVehiculoPanelOpen(true);
  };

  const cerrarVehiculoPanel = () => {
    setEditVehiculoId(null);
    setVehiculoForm(initialVehiculo);
    setVehiculoPanelOpen(false);
  };

  const handleVehiculoChange = (event) => {
    setVehiculoForm({
      ...vehiculoForm,
      [event.target.name]: event.target.value
    });
  };

  const validarVehiculo = () => {
    if (!vehiculoForm.tipo_vehiculo) {
      Swal.fire("Validación", "Seleccione el tipo de vehículo", "warning");
      return false;
    }

    if (!vehiculoForm.placa.trim()) {
      Swal.fire("Validación", "Ingrese la placa del vehículo", "warning");
      return false;
    }

    return true;
  };

  const guardarVehiculo = async (event) => {
    event.preventDefault();

    if (!validarVehiculo()) return;

    const payload = {
      tipo_vehiculo: vehiculoForm.tipo_vehiculo,
      placa: vehiculoForm.placa.trim().toUpperCase(),
      marca: vehiculoForm.marca.trim() || null,
      modelo: vehiculoForm.modelo.trim() || null,
      estado_vehiculo: vehiculoForm.estado_vehiculo
    };

    try {
      setGuardando(true);

      const response = editVehiculoId
        ? await actualizarVehiculo(editVehiculoId, payload)
        : await crearVehiculo(payload);

      if (response.ok) {
        Swal.fire(
          editVehiculoId ? "Vehículo actualizado" : "Vehículo registrado",
          "La información del vehículo fue guardada correctamente",
          "success"
        );

        cerrarVehiculoPanel();
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo guardar el vehículo",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminarVehiculo = async (id_vehiculo) => {
    const confirmacion = await Swal.fire({
      title: "¿Eliminar vehículo?",
      text: "El vehículo será eliminado lógicamente del sistema.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const response = await eliminarVehiculo(id_vehiculo);

      if (response.ok) {
        Swal.fire("Eliminado", "El vehículo fue eliminado correctamente", "success");
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo eliminar el vehículo",
        "error"
      );
    }
  };

  if (loading) {
    return <p>Cargando pedidos...</p>;
  }

  return (
    <div className="pedidos-page">
      <div className="page-header">
        <div>
          <h1>Pedidos</h1>
          <p>Gestión operativa de pedidos, almacén, despacho, reparto y vehículos.</p>
        </div>

        <button className="btn-secondary" onClick={cargarDatos}>
          Actualizar
        </button>
      </div>

      <div className="catalog-tabs">
        <button
          className={activeTab === "pedidos" ? "active" : ""}
          onClick={() => setActiveTab("pedidos")}
        >
          Pedidos
        </button>

        <button
          className={activeTab === "repartos" ? "active" : ""}
          onClick={() => setActiveTab("repartos")}
        >
          Repartos
        </button>

        <button
          className={activeTab === "vehiculos" ? "active" : ""}
          onClick={() => setActiveTab("vehiculos")}
        >
          Vehículos
        </button>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Filtros</h2>
            <p>Busque pedidos, repartos o vehículos por cliente, estado, placa o responsable.</p>
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
                setPaginaPedidos(1);
                setPaginaRepartos(1);
                setPaginaVehiculos(1);
              }}
              placeholder="Cliente, pedido, venta, placa, responsable o estado"
            />
          </div>

          {activeTab === "pedidos" && (
            <>
              <div className="form-group">
                <label>Estado pedido</label>
                <select
                  value={filtroEstado}
                  onChange={(e) => {
                    setFiltroEstado(e.target.value);
                    setPaginaPedidos(1);
                  }}
                >
                  <option value="">Todos</option>
                  {estadosPedido.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tipo entrega</label>
                <select
                  value={filtroEntrega}
                  onChange={(e) => {
                    setFiltroEntrega(e.target.value);
                    setPaginaPedidos(1);
                  }}
                >
                  <option value="">Todos</option>
                  <option value="recojo_tienda">Recojo en tienda</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>
            </>
          )}
        </div>
      </section>

      {activeTab === "pedidos" && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Pedidos registrados</h2>
              <p>{pedidosFiltrados.length} pedidos encontrados</p>
            </div>
          </div>

          {pedidosFiltrados.length > 0 ? (
            <>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Venta</th>
                      <th>Cliente</th>
                      <th>Tipo entrega</th>
                      <th>Fecha</th>
                      <th>Almacén</th>
                      <th>Despacho</th>
                      <th>Reparto</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pedidosPaginados.map((pedido) => {
                      const estadoPedido = normalizarEstado(pedido.estado_pedido);

                      return (
                        <tr key={pedido.id_pedido}>
                          <td>#{pedido.id_pedido}</td>
                          <td>#{pedido.id_venta}</td>
                          <td>{nombreClientePedido(pedido)}</td>
                          <td>{pedido.tipo_entrega || "-"}</td>
                          <td>{pedido.fecha_pedido || "-"}</td>
                          <td>{pedido.usuario_almacen || "-"}</td>
                          <td>{pedido.usuario_despacho || "-"}</td>
                          <td>{pedido.usuario_reparto || "-"}</td>
                          <td>
                            <span className={claseEstadoPedido(pedido.estado_pedido)}>
                              {pedido.estado_pedido}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="btn-small"
                                onClick={() => verPedido(pedido.id_pedido)}
                              >
                                Ver
                              </button>

                              {!["entregado", "cancelado", "rechazado"].includes(
                                estadoPedido
                              ) && (
                                <button
                                  className="btn-small btn-warning"
                                  onClick={() => abrirCambioEstado(pedido)}
                                >
                                  Estado
                                </button>
                              )}

                              {!["entregado", "cancelado", "rechazado"].includes(
                                estadoPedido
                              ) && (
                                <button
                                  className="btn-small btn-success"
                                  onClick={() => abrirAsignacion(pedido)}
                                >
                                  Asignar
                                </button>
                              )}

                              {["preparado", "asignado_reparto"].includes(
                                estadoPedido
                              ) && (
                                <button
                                  className="btn-small btn-secondary-small"
                                  onClick={() => abrirCrearReparto(pedido)}
                                >
                                  Crear reparto
                                </button>
                              )}

                              {["entregado", "cancelado", "rechazado"].includes(
                                estadoPedido
                              ) && <small>Finalizado</small>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPaginasPedidos > 1 && (
                <Pagination
                  pagina={paginaPedidos}
                  totalPaginas={totalPaginasPedidos}
                  setPagina={setPaginaPedidos}
                />
              )}
            </>
          ) : (
            <p>No hay pedidos registrados.</p>
          )}
        </section>
      )}

      {activeTab === "repartos" && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Repartos registrados</h2>
              <p>{repartosFiltrados.length} repartos encontrados</p>
            </div>
          </div>

          {repartosFiltrados.length > 0 ? (
            <>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Pedido</th>
                      <th>Cliente</th>
                      <th>Repartidor</th>
                      <th>Vehículo</th>
                      <th>Dirección</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {repartosPaginados.map((reparto) => {
                      const estadoReparto = normalizarEstado(
                        reparto.estado_reparto
                      );

                      return (
                        <tr key={reparto.id_reparto}>
                          <td>#{reparto.id_reparto}</td>
                          <td>#{reparto.id_pedido}</td>
                          <td>{nombreClienteReparto(reparto)}</td>
                          <td>
                            {reparto.repartidor ||
                              reparto.usuario_reparto ||
                              "-"}
                          </td>
                          <td>
                            {reparto.placa
                              ? `${reparto.placa} ${
                                  reparto.tipo_vehiculo
                                    ? `(${reparto.tipo_vehiculo})`
                                    : ""
                                }`
                              : reparto.vehiculo || "-"}
                          </td>
                          <td>{reparto.direccion_entrega || "-"}</td>
                          <td>
                            <span className={claseEstadoReparto(estadoReparto)}>
                              {reparto.estado_reparto}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              {estadoReparto === "pendiente" && (
                                <button
                                  className="btn-small btn-warning"
                                  onClick={() =>
                                    confirmarSalidaReparto(reparto.id_reparto)
                                  }
                                >
                                  Salida
                                </button>
                              )}

                              {estadoReparto === "en_ruta" && (
                                <>
                                  <button
                                    className="btn-small btn-success"
                                    onClick={() =>
                                      confirmarEntregaReparto(reparto.id_reparto)
                                    }
                                  >
                                    Entregar
                                  </button>

                                  <button
                                    className="btn-small btn-danger"
                                    onClick={() =>
                                      confirmarRepartoFallido(reparto.id_reparto)
                                    }
                                  >
                                    Fallido
                                  </button>
                                </>
                              )}

                              {["entregado", "fallido"].includes(
                                estadoReparto
                              ) && <small>Finalizado</small>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPaginasRepartos > 1 && (
                <Pagination
                  pagina={paginaRepartos}
                  totalPaginas={totalPaginasRepartos}
                  setPagina={setPaginaRepartos}
                />
              )}
            </>
          ) : (
            <p>No hay repartos registrados.</p>
          )}
        </section>
      )}

      {activeTab === "vehiculos" && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Vehículos registrados</h2>
              <p>{vehiculosFiltrados.length} vehículos encontrados</p>
            </div>

            <button className="btn-primary" onClick={abrirCrearVehiculo}>
              + Nuevo vehículo
            </button>
          </div>

          {vehiculosFiltrados.length > 0 ? (
            <>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tipo</th>
                      <th>Placa</th>
                      <th>Marca</th>
                      <th>Modelo</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {vehiculosPaginados.map((vehiculo) => (
                      <tr key={vehiculo.id_vehiculo}>
                        <td>#{vehiculo.id_vehiculo}</td>
                        <td>{vehiculo.tipo_vehiculo}</td>
                        <td>
                          <strong>{vehiculo.placa}</strong>
                        </td>
                        <td>{vehiculo.marca || "-"}</td>
                        <td>{vehiculo.modelo || "-"}</td>
                        <td>
                          <span className={claseEstadoVehiculo(vehiculo.estado_vehiculo)}>
                            {vehiculo.estado_vehiculo}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="btn-small"
                              onClick={() => abrirEditarVehiculo(vehiculo)}
                            >
                              Editar
                            </button>

                            <button
                              className="btn-small btn-danger"
                              onClick={() =>
                                confirmarEliminarVehiculo(vehiculo.id_vehiculo)
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

              {totalPaginasVehiculos > 1 && (
                <Pagination
                  pagina={paginaVehiculos}
                  totalPaginas={totalPaginasVehiculos}
                  setPagina={setPaginaVehiculos}
                />
              )}
            </>
          ) : (
            <p>No hay vehículos registrados.</p>
          )}
        </section>
      )}

      {detallePanelOpen && pedidoDetalle && (
        <>
          <div className="drawer-overlay" onClick={cerrarDetalle} />

          <aside className="drawer-panel drawer-wide">
            <div className="drawer-header">
              <div>
                <h2>Detalle del pedido #{pedidoDetalle.id_pedido}</h2>
                <p>Información completa del pedido.</p>
              </div>

              <button className="drawer-close" onClick={cerrarDetalle}>
                ×
              </button>
            </div>

            <div className="sale-detail-content">
              <div className="detail-grid">
                <DetailItem label="Pedido" value={`#${pedidoDetalle.id_pedido}`} />
                <DetailItem label="Venta" value={`#${pedidoDetalle.id_venta}`} />
                <DetailItem
                  label="Cliente"
                  value={nombreClientePedido(pedidoDetalle)}
                />
                <DetailItem
                  label="Tipo entrega"
                  value={pedidoDetalle.tipo_entrega || "-"}
                />
                <DetailItem
                  label="Dirección"
                  value={pedidoDetalle.direccion_entrega || "-"}
                />
                <DetailItem
                  label="Referencia"
                  value={pedidoDetalle.referencia_entrega || "-"}
                />
                <DetailItem
                  label="Estado"
                  value={pedidoDetalle.estado_pedido || "-"}
                />
                <DetailItem
                  label="Fecha"
                  value={pedidoDetalle.fecha_pedido || "-"}
                />
              </div>

              <h3>Detalle de productos</h3>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Color</th>
                      <th>Talla</th>
                      <th>SKU</th>
                      <th>Solicitada</th>
                      <th>Preparada</th>
                      <th>Entregada</th>
                      <th>Estado</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(pedidoDetalle.detalles || []).length > 0 ? (
                      pedidoDetalle.detalles.map((item, index) => (
                        <tr key={item.id_pedido_detalle || index}>
                          <td>{item.nombre_producto || "Producto"}</td>
                          <td>{item.nombre_color || "-"}</td>
                          <td>{item.nombre_talla || "-"}</td>
                          <td>{item.sku || "-"}</td>
                          <td>{item.cantidad_solicitada || 0}</td>
                          <td>{item.cantidad_preparada || 0}</td>
                          <td>{item.cantidad_entregada || 0}</td>
                          <td>{item.estado_detalle || "-"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8">No hay detalle registrado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <h3>Asignaciones</h3>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Rol operativo</th>
                      <th>Asignación</th>
                      <th>Inicio</th>
                      <th>Fin</th>
                      <th>Estado</th>
                      <th>Observación</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(pedidoDetalle.asignaciones || []).length > 0 ? (
                      pedidoDetalle.asignaciones.map((item) => (
                        <tr key={item.id_asignacion}>
                          <td>{item.usuario}</td>
                          <td>{item.rol_operativo}</td>
                          <td>{item.fecha_asignacion || "-"}</td>
                          <td>{item.fecha_inicio || "-"}</td>
                          <td>{item.fecha_fin || "-"}</td>
                          <td>{item.estado_asignacion || "-"}</td>
                          <td>{item.observacion || "-"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7">No hay asignaciones registradas.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </aside>
        </>
      )}

      {estadoPanelOpen && pedidoSeleccionado && (
        <>
          <div className="drawer-overlay" onClick={cerrarCambioEstado} />

          <aside className="drawer-panel">
            <div className="drawer-header">
              <div>
                <h2>Cambiar estado</h2>
                <p>Pedido #{pedidoSeleccionado.id_pedido}</p>
              </div>

              <button className="drawer-close" onClick={cerrarCambioEstado}>
                ×
              </button>
            </div>

            <form className="drawer-form" onSubmit={guardarEstado}>
              <div className="form-group">
                <label>Nuevo estado</label>
                <select
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                >
                  {estadosPedido.map((estado) => (
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
                  onClick={cerrarCambioEstado}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={guardando}
                >
                  {guardando ? "Guardando..." : "Actualizar estado"}
                </button>
              </div>
            </form>
          </aside>
        </>
      )}

      {asignacionPanelOpen && pedidoSeleccionado && (
        <>
          <div className="drawer-overlay" onClick={cerrarAsignacion} />

          <aside className="drawer-panel">
            <div className="drawer-header">
              <div>
                <h2>Asignar responsables</h2>
                <p>Pedido #{pedidoSeleccionado.id_pedido}</p>
              </div>

              <button className="drawer-close" onClick={cerrarAsignacion}>
                ×
              </button>
            </div>

            <form className="drawer-form" onSubmit={guardarAsignacion}>
              <div className="form-group">
                <label>Responsable almacén</label>
                <select
                  name="id_usuario_almacen"
                  value={asignacionForm.id_usuario_almacen}
                  onChange={handleAsignacionChange}
                >
                  <option value="">No asignar</option>
                  {usuariosPorRol("almacen").map((usuario) => (
                    <option key={usuario.id_usuario} value={usuario.id_usuario}>
                      {usuario.usuario} - {usuario.nombres}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Responsable despacho</label>
                <select
                  name="id_usuario_despacho"
                  value={asignacionForm.id_usuario_despacho}
                  onChange={handleAsignacionChange}
                >
                  <option value="">No asignar</option>
                  {usuariosPorRol("despacho").map((usuario) => (
                    <option key={usuario.id_usuario} value={usuario.id_usuario}>
                      {usuario.usuario} - {usuario.nombres}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Responsable reparto</label>
                <select
                  name="id_usuario_reparto"
                  value={asignacionForm.id_usuario_reparto}
                  onChange={handleAsignacionChange}
                >
                  <option value="">No asignar</option>
                  {usuariosPorRol("reparto").map((usuario) => (
                    <option key={usuario.id_usuario} value={usuario.id_usuario}>
                      {usuario.usuario} - {usuario.nombres}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Observación</label>
                <textarea
                  name="observacion"
                  value={asignacionForm.observacion}
                  onChange={handleAsignacionChange}
                  placeholder="Observación de la asignación"
                />
              </div>

              <div className="drawer-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cerrarAsignacion}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={guardando}
                >
                  {guardando ? "Guardando..." : "Guardar asignación"}
                </button>
              </div>
            </form>
          </aside>
        </>
      )}

      {repartoPanelOpen && pedidoParaReparto && (
        <>
          <div className="drawer-overlay" onClick={cerrarCrearReparto} />

          <aside className="drawer-panel">
            <div className="drawer-header">
              <div>
                <h2>Crear reparto</h2>
                <p>Pedido #{pedidoParaReparto.id_pedido}</p>
              </div>

              <button className="drawer-close" onClick={cerrarCrearReparto}>
                ×
              </button>
            </div>

            <form className="drawer-form" onSubmit={guardarReparto}>
              <div className="form-group">
                <label>Repartidor</label>
                <select
                  name="id_usuario_reparto"
                  value={repartoForm.id_usuario_reparto}
                  onChange={handleRepartoChange}
                >
                  <option value="">Seleccione repartidor</option>
                  {usuariosPorRol("reparto").map((usuario) => (
                    <option key={usuario.id_usuario} value={usuario.id_usuario}>
                      {usuario.usuario} - {usuario.nombres}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Vehículo disponible</label>
                <select
                  name="id_vehiculo"
                  value={repartoForm.id_vehiculo}
                  onChange={handleRepartoChange}
                >
                  <option value="">Seleccione vehículo</option>
                  {vehiculosDisponibles.map((vehiculo) => (
                    <option
                      key={vehiculo.id_vehiculo}
                      value={vehiculo.id_vehiculo}
                    >
                      {vehiculo.placa} - {vehiculo.tipo_vehiculo}
                      {vehiculo.marca ? ` - ${vehiculo.marca}` : ""}
                      {vehiculo.modelo ? ` ${vehiculo.modelo}` : ""}
                    </option>
                  ))}
                </select>

                {vehiculosDisponibles.length === 0 && (
                  <small>No hay vehículos disponibles.</small>
                )}
              </div>

              <div className="form-group">
                <label>Dirección de entrega</label>
                <textarea
                  name="direccion_entrega"
                  value={repartoForm.direccion_entrega}
                  onChange={handleRepartoChange}
                  placeholder="Dirección de entrega"
                />
              </div>

              <div className="form-group">
                <label>Observaciones</label>
                <textarea
                  name="observaciones"
                  value={repartoForm.observaciones}
                  onChange={handleRepartoChange}
                  placeholder="Observaciones del reparto"
                />
              </div>

              <div className="drawer-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cerrarCrearReparto}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={guardando}
                >
                  {guardando ? "Guardando..." : "Crear reparto"}
                </button>
              </div>
            </form>
          </aside>
        </>
      )}

      {vehiculoPanelOpen && (
        <>
          <div className="drawer-overlay" onClick={cerrarVehiculoPanel} />

          <aside className="drawer-panel">
            <div className="drawer-header">
              <div>
                <h2>{editVehiculoId ? "Editar vehículo" : "Nuevo vehículo"}</h2>
                <p>
                  Registre los vehículos que serán utilizados para entregas y reparto.
                </p>
              </div>

              <button className="drawer-close" onClick={cerrarVehiculoPanel}>
                ×
              </button>
            </div>

            <form className="drawer-form" onSubmit={guardarVehiculo}>
              <div className="form-group">
                <label>Tipo de vehículo</label>
                <select
                  name="tipo_vehiculo"
                  value={vehiculoForm.tipo_vehiculo}
                  onChange={handleVehiculoChange}
                >
                  <option value="moto">Moto</option>
                  <option value="carro">Carro</option>
                </select>
              </div>

              <div className="form-group">
                <label>Placa</label>
                <input
                  type="text"
                  name="placa"
                  value={vehiculoForm.placa}
                  onChange={handleVehiculoChange}
                  placeholder="Ej. V1A-123"
                />
              </div>

              <div className="form-group">
                <label>Marca</label>
                <input
                  type="text"
                  name="marca"
                  value={vehiculoForm.marca}
                  onChange={handleVehiculoChange}
                  placeholder="Ej. Honda, Toyota"
                />
              </div>

              <div className="form-group">
                <label>Modelo</label>
                <input
                  type="text"
                  name="modelo"
                  value={vehiculoForm.modelo}
                  onChange={handleVehiculoChange}
                  placeholder="Ej. Wave, Yaris"
                />
              </div>

              <div className="form-group">
                <label>Estado</label>
                <select
                  name="estado_vehiculo"
                  value={vehiculoForm.estado_vehiculo}
                  onChange={handleVehiculoChange}
                >
                  <option value="disponible">Disponible</option>
                  <option value="en_ruta">En ruta</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>

              <div className="drawer-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cerrarVehiculoPanel}
                >
                  Cancelar
                </button>

                <button type="submit" className="btn-primary" disabled={guardando}>
                  {guardando
                    ? "Guardando..."
                    : editVehiculoId
                    ? "Guardar cambios"
                    : "Crear vehículo"}
                </button>
              </div>
            </form>
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

const Pagination = ({ pagina, totalPaginas, setPagina }) => {
  return (
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
  );
};

export default Pedidos;