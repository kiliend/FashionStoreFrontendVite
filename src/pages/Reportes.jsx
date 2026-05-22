import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  obtenerResumenGerencial,
  obtenerReporteVentas,
  obtenerReporteInventario,
  obtenerReporteCompras,
  obtenerProductosMasVendidos
} from "../services/reportes.service";

const initialFiltros = {
  fecha_inicio: "",
  fecha_fin: "",
  estado_venta: "",
  metodo_pago: "",
  origen_venta: "",
  alerta_stock: "",
  estado_variante: "",
  estado_orden: "",
  estado_factura: ""
};

const columnasReporte = {
  resumen: [],
  ventas: [
    { key: "id_venta", label: "ID" },
    { key: "fecha_venta", label: "Fecha" },
    { key: "cliente", label: "Cliente" },
    { key: "origen_venta", label: "Origen" },
    { key: "metodo_pago", label: "Pago" },
    { key: "subtotal", label: "Subtotal" },
    { key: "igv", label: "IGV" },
    { key: "descuento_total", label: "Descuento" },
    { key: "total", label: "Total" },
    { key: "estado_venta", label: "Estado" },
    { key: "vendedor", label: "Vendedor" }
  ],
  inventario: [
    { key: "id_variante", label: "ID" },
    { key: "nombre_producto", label: "Producto" },
    { key: "nombre_categoria", label: "Categoría" },
    { key: "nombre_color", label: "Color" },
    { key: "nombre_talla", label: "Talla" },
    { key: "sku", label: "SKU" },
    { key: "stock_actual", label: "Stock actual" },
    { key: "stock_minimo", label: "Stock mínimo" },
    { key: "estado_variante", label: "Estado" },
    { key: "alerta_stock", label: "Alerta" }
  ],
  compras: [
    { key: "id_orden_compra", label: "ID" },
    { key: "fecha_orden", label: "Fecha" },
    { key: "proveedor", label: "Proveedor" },
    { key: "ruc", label: "RUC" },
    { key: "total", label: "Total" },
    { key: "estado_orden", label: "Estado orden" },
    { key: "estado_factura", label: "Estado factura" },
    { key: "fecha_pago", label: "Fecha pago" },
    { key: "usuario_registro", label: "Registrado por" },
    { key: "usuario_pago", label: "Pagado por" }
  ],
  productos: [
    { key: "id_producto", label: "ID" },
    { key: "nombre_producto", label: "Producto" },
    { key: "nombre_categoria", label: "Categoría" },
    { key: "cantidad_vendida", label: "Cantidad vendida" },
    { key: "total_vendido", label: "Total vendido" }
  ]
};

const Reportes = () => {
  const [activeTab, setActiveTab] = useState("resumen");
  const [filtros, setFiltros] = useState(initialFiltros);

  const [resumen, setResumen] = useState(null);
  const [datos, setDatos] = useState([]);

  const [loading, setLoading] = useState(false);
  const [pagina, setPagina] = useState(1);

  const REGISTROS_POR_PAGINA = 15;

  const tituloReporte = {
    resumen: "Resumen gerencial",
    ventas: "Reporte de ventas",
    inventario: "Reporte de inventario",
    compras: "Reporte de compras",
    productos: "Productos más vendidos"
  };

  const columnasActuales = columnasReporte[activeTab] || [];

  const datosPaginados = useMemo(() => {
    return datos.slice(
      (pagina - 1) * REGISTROS_POR_PAGINA,
      pagina * REGISTROS_POR_PAGINA
    );
  }, [datos, pagina]);

  const totalPaginas = Math.ceil(datos.length / REGISTROS_POR_PAGINA);

  const limpiarFiltros = () => {
    setFiltros(initialFiltros);
    setPagina(1);
  };

  const handleFiltroChange = (event) => {
    setFiltros({
      ...filtros,
      [event.target.name]: event.target.value
    });
  };

  const validarFechas = () => {
    const requiereFechas = ["resumen", "ventas", "compras", "productos"].includes(
      activeTab
    );

    if (!requiereFechas) return true;

    if (!filtros.fecha_inicio || !filtros.fecha_fin) {
      Swal.fire(
        "Validación",
        "Seleccione fecha de inicio y fecha fin para este reporte.",
        "warning"
      );
      return false;
    }

    if (filtros.fecha_inicio > filtros.fecha_fin) {
      Swal.fire(
        "Validación",
        "La fecha de inicio no puede ser mayor que la fecha fin.",
        "warning"
      );
      return false;
    }

    return true;
  };

  const cargarReporte = async () => {
    if (!validarFechas()) return;

    try {
      setLoading(true);
      setPagina(1);

      let response;

      if (activeTab === "resumen") {
        response = await obtenerResumenGerencial(filtros);

        if (response.ok) {
          setResumen(response.data);
          setDatos(response.data.ventas || []);
        }

        return;
      }

      if (activeTab === "ventas") {
        response = await obtenerReporteVentas(filtros);
      }

      if (activeTab === "inventario") {
        response = await obtenerReporteInventario(filtros);
      }

      if (activeTab === "compras") {
        response = await obtenerReporteCompras(filtros);
      }

      if (activeTab === "productos") {
        response = await obtenerProductosMasVendidos(filtros);
      }

      if (response?.ok) {
        setDatos(response.data || []);
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo cargar el reporte.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hoy = new Date().toISOString().slice(0, 10);
    const primerDiaMes = new Date();
    primerDiaMes.setDate(1);

    setFiltros((prev) => ({
      ...prev,
      fecha_inicio: primerDiaMes.toISOString().slice(0, 10),
      fecha_fin: hoy
    }));
  }, []);

  useEffect(() => {
    setDatos([]);
    setResumen(null);
    setPagina(1);
  }, [activeTab]);

  const formatearValor = (value) => {
    if (value === null || value === undefined || value === "") return "-";

    if (!Number.isNaN(Number(value)) && String(value).includes(".")) {
      return Number(value).toFixed(2);
    }

    return value;
  };

  const nombreArchivo = () => {
    const fecha = new Date().toISOString().slice(0, 10);
    return `${tituloReporte[activeTab].replaceAll(" ", "_")}_${fecha}`;
  };

  const obtenerDataExportable = () => {
    if (activeTab === "resumen" && resumen) {
      return {
        indicadores: resumen.indicadores,
        ventas: resumen.ventas || [],
        compras: resumen.compras || [],
        inventario: resumen.inventario || [],
        productos_mas_vendidos: resumen.productos_mas_vendidos || []
      };
    }

    return datos;
  };

  const exportarExcel = () => {
    const workbook = XLSX.utils.book_new();

    if (activeTab === "resumen" && resumen) {
      const indicadores = Object.entries(resumen.indicadores || {}).map(
        ([key, value]) => ({
          indicador: key,
          valor: value
        })
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(indicadores),
        "Indicadores"
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(resumen.ventas || []),
        "Ventas"
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(resumen.compras || []),
        "Compras"
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(resumen.inventario || []),
        "Inventario"
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(resumen.productos_mas_vendidos || []),
        "Más vendidos"
      );
    } else {
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(datos),
        tituloReporte[activeTab].slice(0, 30)
      );
    }

    XLSX.writeFile(workbook, `${nombreArchivo()}.xlsx`);
  };

  const exportarCSV = () => {
    if (activeTab === "resumen") {
      const data = resumen?.ventas || [];

      if (data.length === 0) {
        Swal.fire("Sin datos", "No hay datos para exportar.", "info");
        return;
      }

      descargarCSV(data, `${nombreArchivo()}_ventas.csv`);
      return;
    }

    if (datos.length === 0) {
      Swal.fire("Sin datos", "No hay datos para exportar.", "info");
      return;
    }

    descargarCSV(datos, `${nombreArchivo()}.csv`);
  };

  const descargarCSV = (data, filename) => {
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header] ?? "";
            return `"${String(value).replaceAll('"', '""')}"`;
          })
          .join(",")
      )
    ];

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  };

  const exportarPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4"
    });

    const fechaGeneracion = new Date().toLocaleString();

    doc.setFontSize(16);
    doc.text("FashionStore - Reporte Gerencial", 40, 40);

    doc.setFontSize(11);
    doc.text(tituloReporte[activeTab], 40, 60);
    doc.text(`Generado: ${fechaGeneracion}`, 40, 78);

    if (activeTab === "resumen" && resumen) {
      const indicadores = resumen.indicadores || {};

      autoTable(doc, {
        startY: 100,
        head: [["Indicador", "Valor"]],
        body: Object.entries(indicadores).map(([key, value]) => [key, value]),
        theme: "grid"
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 25,
        head: [["ID Venta", "Fecha", "Cliente", "Total", "Estado"]],
        body: (resumen.ventas || []).slice(0, 30).map((item) => [
          item.id_venta,
          item.fecha_venta,
          item.cliente,
          `S/ ${Number(item.total || 0).toFixed(2)}`,
          item.estado_venta
        ]),
        theme: "grid"
      });

      doc.save(`${nombreArchivo()}.pdf`);
      return;
    }

    if (datos.length === 0) {
      Swal.fire("Sin datos", "No hay datos para exportar.", "info");
      return;
    }

    autoTable(doc, {
      startY: 105,
      head: [columnasActuales.map((col) => col.label)],
      body: datos.map((row) =>
        columnasActuales.map((col) => formatearValor(row[col.key]))
      ),
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 4
      },
      headStyles: {
        fillColor: [31, 41, 55]
      }
    });

    doc.save(`${nombreArchivo()}.pdf`);
  };

  return (
    <div className="reportes-page">
      <div className="page-header">
        <div>
          <h1>Reportes gerenciales</h1>
          <p>
            Consulta, filtra y exporta información comercial, operativa e
            inventario.
          </p>
        </div>

        <button className="btn-secondary" onClick={cargarReporte}>
          Actualizar
        </button>
      </div>

      <div className="catalog-tabs">
        <button
          className={activeTab === "resumen" ? "active" : ""}
          onClick={() => setActiveTab("resumen")}
        >
          Resumen
        </button>

        <button
          className={activeTab === "ventas" ? "active" : ""}
          onClick={() => setActiveTab("ventas")}
        >
          Ventas
        </button>

        <button
          className={activeTab === "inventario" ? "active" : ""}
          onClick={() => setActiveTab("inventario")}
        >
          Inventario
        </button>

        <button
          className={activeTab === "compras" ? "active" : ""}
          onClick={() => setActiveTab("compras")}
        >
          Compras
        </button>

        <button
          className={activeTab === "productos" ? "active" : ""}
          onClick={() => setActiveTab("productos")}
        >
          Más vendidos
        </button>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Filtros</h2>
            <p>Configure los parámetros del reporte seleccionado.</p>
          </div>

          <div className="table-actions">
            <button className="btn-secondary" onClick={limpiarFiltros}>
              Limpiar
            </button>

            <button className="btn-primary" onClick={cargarReporte}>
              Generar reporte
            </button>
          </div>
        </div>

        <div className="venta-form-grid">
          {activeTab !== "inventario" && (
            <>
              <div className="form-group">
                <label>Fecha inicio</label>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={filtros.fecha_inicio}
                  onChange={handleFiltroChange}
                />
              </div>

              <div className="form-group">
                <label>Fecha fin</label>
                <input
                  type="date"
                  name="fecha_fin"
                  value={filtros.fecha_fin}
                  onChange={handleFiltroChange}
                />
              </div>
            </>
          )}

          {(activeTab === "ventas" || activeTab === "resumen") && (
            <>
              <div className="form-group">
                <label>Estado venta</label>
                <select
                  name="estado_venta"
                  value={filtros.estado_venta}
                  onChange={handleFiltroChange}
                >
                  <option value="">Todos</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="completada">Completada</option>
                  <option value="anulada">Anulada</option>
                </select>
              </div>

              <div className="form-group">
                <label>Método pago</label>
                <select
                  name="metodo_pago"
                  value={filtros.metodo_pago}
                  onChange={handleFiltroChange}
                >
                  <option value="">Todos</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="yape">Yape</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="solicitud_online">Solicitud online</option>
                </select>
              </div>

              <div className="form-group">
                <label>Origen venta</label>
                <select
                  name="origen_venta"
                  value={filtros.origen_venta}
                  onChange={handleFiltroChange}
                >
                  <option value="">Todos</option>
                  <option value="presencial">Presencial</option>
                  <option value="ecommerce">Ecommerce</option>
                </select>
              </div>
            </>
          )}

          {activeTab === "inventario" && (
            <>
              <div className="form-group">
                <label>Alerta stock</label>
                <select
                  name="alerta_stock"
                  value={filtros.alerta_stock}
                  onChange={handleFiltroChange}
                >
                  <option value="">Todos</option>
                  <option value="stock_bajo">Stock bajo</option>
                  <option value="stock_correcto">Stock correcto</option>
                </select>
              </div>

              <div className="form-group">
                <label>Estado variante</label>
                <select
                  name="estado_variante"
                  value={filtros.estado_variante}
                  onChange={handleFiltroChange}
                >
                  <option value="">Todos</option>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
            </>
          )}

          {activeTab === "compras" && (
            <>
              <div className="form-group">
                <label>Estado orden</label>
                <select
                  name="estado_orden"
                  value={filtros.estado_orden}
                  onChange={handleFiltroChange}
                >
                  <option value="">Todos</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="recibida">Recibida</option>
                  <option value="anulada">Anulada</option>
                </select>
              </div>

              <div className="form-group">
                <label>Estado factura</label>
                <select
                  name="estado_factura"
                  value={filtros.estado_factura}
                  onChange={handleFiltroChange}
                >
                  <option value="">Todos</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="pagada">Pagada</option>
                </select>
              </div>
            </>
          )}
        </div>
      </section>

      {activeTab === "resumen" && resumen && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Indicadores gerenciales</h2>
              <p>Resumen ejecutivo del periodo seleccionado.</p>
            </div>
          </div>

          <div className="dashboard-grid">
            <KpiCard
              title="Total ventas"
              value={`S/ ${Number(resumen.indicadores?.total_ventas || 0).toFixed(2)}`}
            />
            <KpiCard
              title="Total compras"
              value={`S/ ${Number(resumen.indicadores?.total_compras || 0).toFixed(2)}`}
            />
            <KpiCard
              title="Utilidad referencial"
              value={`S/ ${Number(
                resumen.indicadores?.utilidad_referencial || 0
              ).toFixed(2)}`}
            />
            <KpiCard
              title="Ventas completadas"
              value={resumen.indicadores?.ventas_completadas || 0}
            />
            <KpiCard
              title="Ventas pendientes"
              value={resumen.indicadores?.ventas_pendientes || 0}
            />
            <KpiCard
              title="Stock bajo"
              value={resumen.indicadores?.productos_stock_bajo || 0}
            />
          </div>
        </section>
      )}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>{tituloReporte[activeTab]}</h2>
            <p>
              {activeTab === "resumen"
                ? `${datos.length} ventas incluidas en el resumen`
                : `${datos.length} registros encontrados`}
            </p>
          </div>

          <div className="table-actions">
            <button className="btn-secondary" onClick={exportarCSV}>
              CSV
            </button>

            <button className="btn-secondary" onClick={exportarExcel}>
              Excel
            </button>

            <button className="btn-primary" onClick={exportarPDF}>
              PDF
            </button>
          </div>
        </div>

        {loading ? (
          <p>Cargando reporte...</p>
        ) : activeTab === "resumen" && !resumen ? (
          <p>Genere un reporte para visualizar el resumen gerencial.</p>
        ) : datos.length > 0 ? (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    {(activeTab === "resumen"
                      ? columnasReporte.ventas
                      : columnasActuales
                    ).map((col) => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {datosPaginados.map((row, index) => (
                    <tr key={row.id_venta || row.id_variante || row.id_producto || index}>
                      {(activeTab === "resumen"
                        ? columnasReporte.ventas
                        : columnasActuales
                      ).map((col) => (
                        <td key={col.key}>{formatearValor(row[col.key])}</td>
                      ))}
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
          <p>No hay datos para mostrar.</p>
        )}
      </section>
    </div>
  );
};

const KpiCard = ({ title, value }) => {
  return (
    <div className="stat-card">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
};

export default Reportes;