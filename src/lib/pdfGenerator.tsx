import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Trip, Cargo, User } from '../types';
import { format as dateFnsFormat } from 'date-fns';
import { es } from 'date-fns/locale';

export const generateAuditReport = (trip: Trip, cargo: Cargo, merchant: User, carrier: User) => {
  const doc = new jsPDF();
  const primaryColor = [37, 99, 235]; // #2563eb

  // --- Header ---
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE DE TRAZABILIDAD AUDITABLE', 15, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`ID de Viaje: ${trip.id}`, 15, 30);
  doc.text(`Fecha de Emisión: ${dateFnsFormat(new Date(), "PPpp", { locale: es })}`, 150, 30);

  // --- Info Sections ---
  let y = 50;

  const sectionTitle = (title: string, topY: number) => {
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 15, topY);
    doc.setDrawColor(200, 200, 200);
    doc.line(15, topY + 2, 195, topY + 2);
    return topY + 10;
  };

  // 1. Datos del Viaje
  y = sectionTitle('DATOS DE LA OPERACIÓN', y);
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Tipo de Carga:', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${cargo.tipoCarga} (${cargo.categoria})`, 45, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Peso:', 105, y);
  doc.setFont('helvetica', 'normal');
  doc.text(cargo.peso, 120, y);
  
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Origen:', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text(cargo.origen, 45, y);
  
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Destino:', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text(cargo.destino, 45, y);
  
  if (cargo.temperaturaRequerida) {
    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Temp. Requerida:', 15, y);
    doc.setFont('helvetica', 'normal');
    doc.text(cargo.temperaturaRequerida, 45, y);
  }

  // 2. Participantes
  y += 15;
  y = sectionTitle('ACTORES INVOLUCRADOS', y);
  
  // Comerciante
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'bold');
  doc.text('Comerciante (Generador):', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${merchant.nombre} - DNI/RUC: ${merchant.documento}`, 15, y + 5);
  
  // Transportista
  doc.setFont('helvetica', 'bold');
  doc.text('Transportista (Operador):', 105, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${carrier.nombre} - Placa: ${carrier.vehiculo?.placa}`, 105, y + 5);
  doc.text(`Licencia: ${carrier.documentosUrls?.licencia ? 'Verificada' : 'Pendiente'}`, 105, y + 10);
  
  y += 20;

  // 3. Trazabilidad de Eventos (Checkpoints)
  y = sectionTitle('HISTORIAL DE EVENTOS (AUDITORÍA DIGITAL)', y);
  
  const tableRows = trip.checkpoints?.sort((a,b) => b.timestamp - a.timestamp).map(cp => [
    dateFnsFormat(cp.timestamp, 'dd/MM HH:mm', { locale: es }),
    cp.estado.replace(/_/g, ' ').toUpperCase(),
    cp.mensaje + (cp.evidenciaUrl ? ' (Con evidencia)' : ''),
    `${cp.location.lat.toFixed(4)}, ${cp.location.lng.toFixed(4)}`,
    cp.automatico ? 'SISTEMA' : 'MANUAL'
  ]) || [];

  autoTable(doc, {
    startY: y,
    head: [['Fecha/Hora', 'Evento', 'Descripción', 'Coordenadas', 'Origen']],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: primaryColor as any, textColor: 255 },
    styles: { fontSize: 8 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 15;

  // 4. Evidencia Digital
  y = sectionTitle('EVIDENCIA DIGITAL DE ENTREGA', finalY);
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Este documento certifica que el transporte se realizó bajo los estándares de trazabilidad auditables.', 15, y);
  doc.text('Las coordenadas y marcas de tiempo han sido generadas automáticamente por el sistema GPS.', 15, y + 5);
  
  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`TransportaYa Logística - Reporte de Cumplimiento Logístico - Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
  }

  doc.save(`audit_report_${trip.id}.pdf`);
};
