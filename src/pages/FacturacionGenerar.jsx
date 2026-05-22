import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import { obtenerVenta } from "../services/ventas.service";
import { generarComprobante } from "../services/comprobantes.service";

const FacturacionGenerar = () => {
  const { id_venta } = useParams();
  const navigate = useNavigate();

  const [venta, setVenta] = useState(null);
  const [comprobante, setComprobante] = useState(null);
  const [tipoComprobante, setTipoComprobante] = useState("03");
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);

  const cargarVenta = async () => {
    try {
      setLoading(true);

      const response = await obtenerVenta(id_venta);

      if (response.ok) {
        setVenta(response.data);

        if (response.data.tipo_documento === "RUC") {
          setTipoComprobante("01");
        } else {
          setTipoComprobante("03");
        }
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo cargar la venta",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarVenta();
  }, [id_venta]);

  const obtenerNombreCliente = () => {
    if (!venta) return "-";

    if (venta.razon_social) return venta.razon_social;

    return `${venta.nombres || ""} ${venta.apellidos || ""}`.trim() || "Cliente no registrado";
  };

  const validarFacturacion = () => {
    if (!venta) {
      Swal.fire("Validación", "No existe información de la venta", "warning");
      return false;
    }

    if (venta.estado_venta !== "completada") {
      Swal.fire(
        "Venta no completada",
        "Solo se puede facturar una venta completada",
        "warning"
      );
      return false;
    }

    if (tipoComprobante === "01") {
      if (venta.tipo_documento !== "RUC") {
        Swal.fire(
          "Factura no permitida",
          "Para emitir factura el cliente debe tener RUC",
          "warning"
        );
        return false;
      }

      if (!venta.numero_documento || venta.numero_documento.length !== 11) {
        Swal.fire(
          "RUC inválido",
          "El RUC del cliente debe tener 11 dígitos",
          "warning"
        );
        return false;
      }
    }

    return true;
  };

  const generar = async () => {
    if (!validarFacturacion()) return;

    const confirmacion = await Swal.fire({
      title: "¿Generar comprobante?",
      text:
        tipoComprobante === "01"
          ? "Se generará una factura electrónica interna."
          : "Se generará una boleta electrónica interna.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, generar",
      cancelButtonText: "Cancelar"
    });

    if (!confirmacion.isConfirmed) return;

    try {
      setGenerando(true);

      const response = await generarComprobante(id_venta, {
        tipo_comprobante: tipoComprobante
      });

      if (response.ok) {
        setComprobante(response.data);

        Swal.fire(
          "Comprobante generado",
          "El comprobante fue generado correctamente",
          "success"
        );
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo generar el comprobante",
        "error"
      );
    } finally {
      setGenerando(false);
    }
  };

  if (loading) {
    return <p>Cargando facturación...</p>;
  }

  if (!venta) {
    return (
      <section className="panel">
        <h2>Venta no encontrada</h2>
        <button className="btn-secondary" onClick={() => navigate("/ventas")}>
          Volver a ventas
        </button>
      </section>
    );
  }

  return (
    <div className="facturacion-page">
      <div className="page-header">
        <div>
          <h1>Facturación</h1>
          <p>Generación de comprobante para la venta #{id_venta}.</p>
        </div>

        <button className="btn-secondary" onClick={() => navigate("/ventas")}>
          Volver a ventas
        </button>
      </div>

      <div className="facturacion-layout">
        <section className="panel">
          <h2>Datos de la venta</h2>

          <div className="detail-grid">
            <DetailItem label="Venta" value={`#${venta.id_venta}`} />
            <DetailItem label="Fecha" value={venta.fecha_venta || "-"} />
            <DetailItem label="Cliente" value={obtenerNombreCliente()} />
            <DetailItem
              label="Documento"
              value={`${venta.tipo_documento || "-"} ${venta.numero_documento || ""}`}
            />
            <DetailItem label="Origen" value={venta.origen_venta || "-"} />
            <DetailItem label="Pago" value={venta.metodo_pago || "-"} />
            <DetailItem label="Estado" value={venta.estado_venta || "-"} />
            <DetailItem
              label="Total"
              value={`S/ ${Number(venta.total || 0).toFixed(2)}`}
            />
          </div>

          <h3>Productos de la venta</h3>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>SKU</th>
                  <th>Cant.</th>
                  <th>Precio</th>
                  <th>Desc.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>

              <tbody>
                {(venta.detalles || venta.detalle || []).map((item, index) => (
                  <tr key={item.id_detalle_venta || index}>
                    <td>{item.nombre_producto || item.descripcion || "Producto"}</td>
                    <td>{item.sku || "-"}</td>
                    <td>{item.cantidad}</td>
                    <td>S/ {Number(item.precio_unitario || 0).toFixed(2)}</td>
                    <td>S/ {Number(item.descuento || 0).toFixed(2)}</td>
                    <td>
                      S/{" "}
                      {Number(
                        item.subtotal ||
                          Number(item.precio_unitario || 0) *
                            Number(item.cantidad || 0) -
                            Number(item.descuento || 0)
                      ).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel facturacion-panel">
          <h2>Generar comprobante</h2>

          <div className="form-group">
            <label>Tipo de comprobante</label>
            <select
              value={tipoComprobante}
              onChange={(e) => setTipoComprobante(e.target.value)}
              disabled={Boolean(comprobante)}
            >
              <option value="03">Boleta electrónica</option>
              <option value="01">Factura electrónica</option>
            </select>
          </div>

          {tipoComprobante === "01" && venta.tipo_documento !== "RUC" && (
            <div className="warning-box">
              Para generar factura, el cliente debe tener RUC.
            </div>
          )}

          {venta.estado_venta !== "completada" && (
            <div className="warning-box">
              Esta venta no está completada. Primero debe completarse desde el
              módulo de ventas.
            </div>
          )}

          {!comprobante ? (
            <button
              className="btn-primary full-width"
              onClick={generar}
              disabled={generando || venta.estado_venta !== "completada"}
            >
              {generando ? "Generando..." : "Generar comprobante"}
            </button>
          ) : (
            <div className="comprobante-result">
              <h3>Comprobante generado</h3>

              <div className="detail-item">
                <span>Tipo</span>
                <strong>
                  {comprobante.tipo_comprobante === "01"
                    ? "Factura electrónica"
                    : "Boleta electrónica"}
                </strong>
              </div>

              <div className="detail-item">
                <span>Serie y correlativo</span>
                <strong>
                  {comprobante.serie}-{comprobante.correlativo}
                </strong>
              </div>

              <div className="detail-item">
                <span>Total</span>
                <strong>S/ {Number(comprobante.total || 0).toFixed(2)}</strong>
              </div>

              <div className="detail-item">
                <span>Estado SUNAT</span>
                <strong>{comprobante.estado_sunat}</strong>
              </div>

              <div className="detail-item">
                <span>XML</span>
                <strong>{comprobante.nombre_xml || "Pendiente"}</strong>
              </div>

              <div className="detail-item">
                <span>ZIP</span>
                <strong>{comprobante.nombre_zip || "Pendiente"}</strong>
              </div>

              <button
                className="btn-secondary full-width"
                onClick={() => navigate("/ventas")}
              >
                Volver a ventas
              </button>
            </div>
          )}
        </section>
      </div>
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

export default FacturacionGenerar;