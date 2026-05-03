export const ADMIN_EMAILS = [
  'vvendiya@gmail.com'
];

export const TRIP_STATUS_LABELS: Record<string, { label: string; desc: string }> = {
  pendiente_pago: { 
    label: 'Pendiente de Pago', 
    desc: 'El exportador debe confirmar el pago del flete' 
  },
  pago_en_revision: { 
    label: 'Pago en Revisión', 
    desc: 'Verificando transferencia bancaria' 
  },
  pago_rechazado: { 
    label: 'Pago Rechazado', 
    desc: 'El pago ha sido invalidado' 
  },
  en_camino_a_recojo: { 
    label: 'En Camino al Punto de Carga', 
    desc: 'El vehículo se dirige a la planta del exportador' 
  },
  recojo_completado: { 
    label: 'Carga Embarcada en Vehículo', 
    desc: 'Mercadería cargada y sellada en el transporte' 
  },
  en_camino_a_destino: { 
    label: 'En Tránsito', 
    desc: 'Carga viajando hacia el puerto de destino' 
  },
  entregado_pendiente_confirmacion: { 
    label: 'Entregado en Puerto', 
    desc: 'Carga ingresada a zona portuaria' 
  },
  completado: { 
    label: 'Viaje Finalizado', 
    desc: 'Recepción confirmada y auditoría cerrada' 
  },
  cancelado: { 
    label: 'Cancelado', 
    desc: 'El servicio ha sido anulado' 
  }
};
