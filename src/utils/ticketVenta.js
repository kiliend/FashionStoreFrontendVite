import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const obtenerNombreCliente = (venta) => {
  if (venta.razon_social) return venta.razon_social;

  return `${venta.nombres || ""} ${venta.apellidos || ""}`.trim() || "Cliente no registrado";
};

export const generarTicketVentaPDF = (venta) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, 200]
  });

  const detalles = venta.detalles || venta.detalle || [];

  doc.setFontSize(12);
  doc.text("FASHIONSTORE", 40, 10, { align: "center" });

  doc.setFontSize(8);
  doc.text("Ticket de compra", 40, 16, { align: "center" });
  doc.text(`Venta: #${venta.id_venta}`, 5, 24);
  doc.text(`Fecha: ${venta.fecha_venta || "-"}`, 5, 29);
  doc.text(`Cliente: ${obtenerNombreCliente(venta)}`, 5, 34);
  doc.text(`Documento: ${venta.tipo_documento || "-"} ${venta.numero_documento || ""}`, 5, 39);
  doc.text(`Pago: ${venta.metodo_pago || "-"}`, 5, 44);
  doc.text(`Origen: ${venta.origen_venta || "-"}`, 5, 49);

  autoTable(doc, {
    startY: 55,
    theme: "plain",
    styles: {
      fontSize: 7,
      cellPadding: 1
    },
    head: [["Producto", "Cant.", "Total"]],
    body: detalles.map((item) => [
      item.nombre_producto ||
        item.descripcion ||
        `${item.sku || "Producto"}`,
      item.cantidad,
      `S/ ${Number(item.subtotal || item.total || 0).toFixed(2)}`
    ]),
    margin: {
      left: 5,
      right: 5
    }
  });

  const finalY = doc.lastAutoTable.finalY + 6;

  doc.setFontSize(8);
  doc.text(`Subtotal: S/ ${Number(venta.subtotal || 0).toFixed(2)}`, 5, finalY);
  doc.text(`IGV: S/ ${Number(venta.igv || 0).toFixed(2)}`, 5, finalY + 5);
  doc.text(
    `Descuento: S/ ${Number(venta.descuento_total || 0).toFixed(2)}`,
    5,
    finalY + 10
  );

  doc.setFontSize(10);
  doc.text(`TOTAL: S/ ${Number(venta.total || 0).toFixed(2)}`, 5, finalY + 17);

  doc.setFontSize(7);
  doc.text("Gracias por su compra", 40, finalY + 28, { align: "center" });

  doc.save(`ticket-venta-${venta.id_venta}.pdf`);
};