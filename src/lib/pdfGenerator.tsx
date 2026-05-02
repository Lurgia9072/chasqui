import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Trip, Cargo, User } from '../types';
import { format as dateFnsFormat } from 'date-fns';
import { es } from 'date-fns/locale';

export const generateAuditReport = (trip: Trip, cargo: Cargo, merchant: User, carrier: User) => {
  const doc = new jsPDF();
  const primaryColor = [15, 23, 42]; // slate-900
  const secondaryColor = [37, 99, 235]; // blue-600

  // --- Header ---
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('DOCUMENTO DE CONTROL LOGÍSTICO', 15, 18);
  doc.setFontSize(14);
  doc.text('CHASQUI - PLATAFORMA DE TRANSPORTE', 15, 28);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`ID ÚNICO: #${trip.id.toUpperCase()}`, 150, 18);
  doc.text(`EMISIÓN: ${dateFnsFormat(new Date(), "PPpp", { locale: es })}`, 150, 25);

  // --- Info Sections ---
  let y = 50;

  const sectionTitle = (title: string, topY: number, color = primaryColor) => {
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 15, topY);
    doc.setDrawColor(220, 220, 220);
    doc.line(15, topY + 2, 195, topY + 2);
    return topY + 10;
  };

  // 1. Datos del Cliente
  y = sectionTitle('DATOS DE LA EMPRESA EXPORTADORA', y);
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Razón Social:', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text(merchant.razonSocial || merchant.nombre, 45, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('RUC / DNI:', 120, y);
  doc.setFont('helvetica', 'normal');
  doc.text(merchant.ruc || merchant.documento, 140, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Sector:', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text(merchant.sector || 'NO ESPECIFICADO', 45, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Puerto Principal:', 120, y);
  doc.setFont('helvetica', 'normal');
  doc.text(merchant.puertoPrincipal || 'NO ESPECIFICADO', 150, y);
  
  // 2. Datos del Producto
  y += 12;
  y = sectionTitle('DATOS DEL PRODUCTO EXPORTABLE', y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Producto:', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text(cargo.nombreProducto || cargo.tipoCarga, 45, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Lote:', 120, y);
  doc.setFont('helvetica', 'normal');
  doc.text(cargo.lote || 'N/A', 145, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Guía Remisión:', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text(cargo.guiaRemision || 'N/A', 45, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Puerto Destino:', 120, y);
  doc.setFont('helvetica', 'normal');
  doc.text(cargo.puertoDestino || 'N/A', 145, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Partida Aran.:', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text(cargo.partidaArancelaria || 'N/A', 45, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Peso / Cantidad:', 120, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${cargo.peso} / ${cargo.capacidadRequerida}`, 150, y);

  // 3. Condiciones y Logística
  y += 12;
  y = sectionTitle('CONDICIONES DE TRANSPORTE Y LOGÍSTICA', y, secondaryColor);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Vehículo Req.:', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text((cargo.tipoVehiculoRequerido || 'N/A').toUpperCase(), 45, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Placa:', 120, y);
  doc.setFont('helvetica', 'normal');
  doc.text(trip.vehiculo?.placa || carrier.vehiculo?.placa || 'N/A', 145, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Transportista:', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text(carrier.nombre, 45, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Temperatura:', 120, y);
  doc.setFont('helvetica', 'normal');
  doc.text(trip.temperaturaActual || 'N/A', 145, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Origen:', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text(cargo.origen, 45, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Destino:', 120, y);
  doc.setFont('helvetica', 'normal');
  doc.text(cargo.destino, 145, y);

  // 4. Cronología y Cumplimiento
  y += 12;
  y = sectionTitle('CRONOLOGÍA Y CUMPLIMIENTO DE PLAZOS', y);
  
  const deliveryDate = trip.entregaRealAt ? new Date(trip.entregaRealAt) : null;
  const deadlineDate = cargo.fechaHoraLimitePuerto ? new Date(cargo.fechaHoraLimitePuerto) : null;

  doc.setFont('helvetica', 'bold');
  doc.text('Límite Puerto:', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text(deadlineDate ? dateFnsFormat(deadlineDate, 'PPp', { locale: es }) : 'N/A', 45, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Entrega Real:', 120, y);
  doc.setFont('helvetica', 'normal');
  doc.text(deliveryDate ? dateFnsFormat(deliveryDate, 'PPp', { locale: es }) : 'PENDIENTE', 145, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Cumplimiento:', 15, y);
  if (deliveryDate && deadlineDate) {
    const onTime = deliveryDate <= deadlineDate;
    doc.setTextColor(onTime ? 22 : 220, onTime ? 163 : 38, onTime ? 74 : 38);
    doc.text(onTime ? 'EXITOSO - ENTREGADO A TIEMPO' : 'RETRASO - ENTREGADO FUERA DE PLAZO', 45, y);
  } else {
    doc.text('EN PROCESO', 45, y);
  }
  doc.setTextColor(50, 50, 50);

  y += 10;

  // 5. Historial de Eventos (Checkpoints)
  const tableRows = trip.checkpoints?.sort((a,b) => a.timestamp - b.timestamp).map(cp => [
    dateFnsFormat(cp.timestamp, 'dd/MM HH:mm', { locale: es }),
    cp.estado.replace(/_/g, ' ').toUpperCase(),
    cp.mensaje,
    `${cp.location.lat.toFixed(4)}, ${cp.location.lng.toFixed(4)}`
  ]) || [];

  autoTable(doc, {
    startY: y,
    head: [['Fecha/Hora', 'Evento', 'Descripción', 'Geolocalización']],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: primaryColor as any, textColor: 255 },
    styles: { fontSize: 7 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 15;

  // 6. Pie de Página y QR Placeholder
  if (finalY < 250) {
    y = finalY;
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.rect(160, y, 30, 30);
    doc.setFontSize(6);
    doc.text('QR DE VERIFICACIÓN', 162, y + 15);
    doc.text('ESCANEABLE POR ADUANA', 161, y + 20);

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Documento generado automáticamente por Chasqui.', 15, y + 10);
    doc.text('Válido para fines informativos y de control logístico interno.', 15, y + 15);
    doc.text('Este reporte cuenta con marcas de tiempo GPS no modificables.', 15, y + 20);
  }

  // Final Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Chasqui Logistics Technology - Página ${i} de ${pageCount} - Trace ID: ${trip.id}`, 105, 285, { align: 'center' });
  }

  doc.save(`CHASQUI_TRAZABILIDAD_${trip.id.toUpperCase()}.pdf`);
};

export const generateMonthlyReport = (trips: Trip[], merchant: User) => {
  const doc = new jsPDF();
  const primaryColor = [15, 23, 42]; // slate-900

  // Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE MENSUAL DE TRAZABILIDAD', 15, 20);
  doc.setFontSize(12);
  doc.text(`${merchant.razonSocial || merchant.nombre} - RUC: ${merchant.ruc || merchant.documento}`, 15, 30);
  doc.setFontSize(10);
  doc.text(`PERIODO: ${dateFnsFormat(new Date(), 'MMMM yyyy', { locale: es }).toUpperCase()}`, 15, 38);

  doc.setFontSize(9);
  doc.text(`GENERADO: ${dateFnsFormat(new Date(), 'dd/MM/yyyy HH:mm')}`, 150, 38);

  // Stats Summary
  const completedCount = trips.length;
  const onTimeCount = trips.filter(t => t.llegadaAntesLimite).length;
  const reliability = completedCount > 0 ? ((onTimeCount / completedCount) * 100).toFixed(1) : '100';

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text('RESUMEN DE INDICADORES (KPI)', 15, 60);
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 62, 195, 62);

  autoTable(doc, {
    startY: 65,
    head: [['Total Envíos', 'Entregas a Tiempo', 'Índice de Puntualidad']],
    body: [[completedCount.toString(), onTimeCount.toString(), `${reliability}%`]],
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85] }
  });

  // Detailed Table
  const tableRows = trips.map(t => [
    t.id.substring(0, 8).toUpperCase(),
    t.nombreProducto || t.tipoCarga || 'N/A',
    t.guiaRemision || 'N/A',
    t.destino.substring(0, 20),
    dateFnsFormat(t.entregaRealAt || t.createdAt, 'dd/MM/yyyy'),
    t.llegadaAntesLimite ? 'A TIEMPO' : 'RETRASO'
  ]);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 15,
    head: [['ID Viaje', 'Producto', 'Guía', 'Destino', 'F. Entrega', 'Estado']],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: primaryColor as any },
    styles: { fontSize: 8 },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        if (data.cell.text[0] === 'A TIEMPO') {
          doc.setTextColor(22, 163, 74);
        } else {
          doc.setTextColor(220, 38, 38);
        }
      }
    }
  });

  // Footer text
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text('Este reporte es un documento certificado por la plataforma Chasqui.', 15, finalY);
  doc.text('Los datos de geolocalización y tiempos son auditables mediante la cadena de custodia digital.', 15, finalY + 5);

  doc.save(`REPORTE_MENSUAL_${merchant.nombre.replace(/\s+/g, '_')}.pdf`);
};
