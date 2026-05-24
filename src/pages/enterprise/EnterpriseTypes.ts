export type EnterpriseRole = 'admin_empresa' | 'supervisor' | 'monitorista' | 'operador' | 'auditor' | 'chofer';

export interface EnterpriseUser {
  id: string;
  nombre: string;
  email: string;
  rol: EnterpriseRole;
  sede: string;
  telefono: string;
  activo: boolean;
  ultimoAcceso: string;
}

export interface EnterpriseSede {
  id: string;
  nombre: string;
  ubicacion: string;
  tipo: 'planta' | 'almacen' | 'oficina' | 'puerto';
  encargado: string;
}

export interface EnterpriseVehicle {
  id: string;
  placa: string;
  tipo: 'refrigerado' | 'seco' | 'cortina' | 'plataforma';
  capacidad: string;
  conductorId: string;
  estado: 'libre' | 'viaje' | 'mantenimiento' | 'incidencia';
  temperaturaSet?: number;
  temperaturaActual?: number;
  combustibleNivel: number; // porcentaje%
  documentos: {
    soat: boolean;
    revisionTecnica: boolean;
    permisoMTC: boolean;
  };
}

export interface EnterpriseDriver {
  id: string;
  nombre: string;
  licencia: string;
  categoria: string;
  telefono: string;
  estado: 'activo' | 'viajando' | 'licencia_vencida' | 'libre';
  calificacion: number;
  ultimoViaje: string;
}

export interface EnterpriseCargo {
  id: string;
  tipoDeCarga: string; // 'refrigerado' | 'seco' | etc.
  nombreProducto: string;
  origen: string;
  destino: string;
  precioPropuesto: number;
  estado: 'pendiente' | 'buscando_transporte' | 'en_negociacion' | 'asignada' | 'en_recojo' | 'en_ruta' | 'en_entrega' | 'entregada' | 'completada' | 'rechazada' | 'cancelada';
  conductorAsignado?: string;
  vehiculoAsignado?: string;
  fechaEntregaLimite: string;
  temperaturaSet?: number;
  temperaturaActual?: number;
  prioridad?: 'baja' | 'media' | 'alta' | 'critica';
  carrierId?: string;
  carrierName?: string;
  pesoKg?: number;
  volumenM3?: number;
  observaciones?: string;
  createdAt?: number;
  incidents?: string[]; // IDs or messages
  checkpoints?: { id: string; mensaje: string; timestamp: number; lat: number; lng: number }[];
  evidencias?: { id: string; url: string; tipo: string; fecha: number; autor: string }[];
}

export interface EnterpriseCarrier {
  id: string;
  name: string;
  ruc: string;
  telefono: string;
  email: string;
  flotaSize: number;
  operacionZonas: string;
  slaPercent: number; // e.g. 98.4
  viajesConcretados: number;
  documentosVigentes: boolean;
  contactoNombre: string;
  estadoStr: 'activo' | 'suspendido' | 'auditoria';
}

export interface EnterpriseIncident {
  id: string;
  cargoId: string;
  cargoName: string;
  tipo: 'retraso' | 'desvio' | 'temperatura' | 'parada_sospechosa' | 'falla_mecanica' | 'accidente' | 'otra';
  gravedad: 'baja' | 'media' | 'alta' | 'critica';
  descripcion: string;
  estado: 'abierto' | 'bajo_analisis' | 'escalado' | 'resuelto';
  creadoPor: string;
  createdAt: number;
  updatedAt: number;
  solucion?: string;
}

