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
  tipoDeCarga: string;
  nombreProducto: string;
  origen: string;
  destino: string;
  precioPropuesto: number;
  estado: 'disponible' | 'en_transito' | 'por_asignar' | 'completado' | 'incidencia';
  conductorAsignado?: string;
  vehiculoAsignado?: string;
  fechaEntregaLimite: string;
  temperaturaActual?: number;
}
