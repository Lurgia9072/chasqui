export type UserRole = 'comerciante' | 'transportista' | 'admin';
export type AccountType = 'natural' | 'ruc10' | 'ruc20';
export type VerificationStatus = 'pendiente' | 'verificado' | 'rechazado';
export type CargoStatus = 'disponible' | 'en_negociacion' | 'asignado' | 'completado';
export type OfferStatus = 'pendiente' | 'aceptada' | 'rechazada';
export type TripStatus = 'en_camino_a_recojo' | 'recojo_completado' | 'en_camino_a_destino' | 'completado' | 'cancelado';

export interface User {
  uid: string;
  nombre: string;
  tipoUsuario: UserRole;
  tipoCuenta?: AccountType;
  documento: string;
  telefono: string;
  email: string;
  verificado: VerificationStatus;
  rating: number;
  zonasOperacion?: string[];
  vehiculo?: {
    tipo: string;
    placa: string;
    capacidad: string;
  };
  documentosUrls?: {
    dni: string;
    licencia: string;
    tarjetaPropiedad: string;
  };
  createdAt: number;
}

export interface Cargo {
  id: string;
  comercianteId: string;
  comercianteNombre: string;
  origen: string;
  destino: string;
  tipoCarga: string;
  peso: number;
  descripcion: string;
  precioPropuesto: number;
  estado: CargoStatus;
  createdAt: number;
}

export interface Offer {
  id: string;
  cargoId: string;
  transportistaId: string;
  transportistaNombre: string;
  transportistaRating: number;
  precioOfertado: number;
  estado: OfferStatus;
  createdAt: number;
}

export interface Trip {
  id: string;
  cargoId: string;
  comercianteId: string;
  transportistaId: string;
  origen: string;
  destino: string;
  precioFinal: number;
  comision: number;
  estado: TripStatus;
  seguimiento?: {
    lat: number;
    lng: number;
    updatedAt: number;
  };
  tiempoEstimado?: string;
  fechaRecojo?: string;
  horaRecojo?: string;
  transportistaNombre?: string;
  vehiculo?: {
    tipo: string;
    placa: string;
  };
  createdAt: number;
}

export interface Notification {
  id: string;
  userId: string;
  titulo: string;
  mensaje: string;
  tipo: 'oferta_nueva' | 'oferta_aceptada' | 'oferta_rechazada' | 'viaje_actualizado';
  leido: boolean;
  link?: string;
  createdAt: number;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}
