export type UserRole = 'comerciante' | 'transportista' | 'admin';
export type AccountType = 'natural' | 'ruc10' | 'ruc20';
export type VerificationStatus = 'pendiente' | 'verificado' | 'rechazado';
export type CargoStatus = 'disponible' | 'en_negociacion' | 'asignado' | 'completado';
export type OfferStatus = 'pendiente' | 'aceptada' | 'rechazada';
export type TripStatus = 'pendiente_pago' | 'pago_en_revision' | 'pago_rechazado' | 'en_camino_a_recojo' | 'recojo_completado' | 'en_camino_a_destino' | 'entregado_pendiente_confirmacion' | 'completado' | 'cancelado';

export interface Location {
  lat: number;
  lng: number;
  updatedAt?: number;
}

export interface Checkpoint {
  id: string;
  estado: TripStatus;
  timestamp: number;
  location: Location;
  mensaje: string;
  evidenciaUrl?: string;
  automatico: boolean;
}

export interface User {
  uid: string;
  nombre: string;
  tipoUsuario: UserRole;
  tipoCuenta?: AccountType;
  documento: string;
  telefono: string;
  email: string;
  photoUrl?: string;
  verificado: VerificationStatus;
  rating: number;
  totalRatings: number;
  sumRatings: number;
  completedTrips: number;
  indiceConfiabilidad: number; // 0-100 index
  metricasLogistica?: {
    puntualidad: number;
    entregasExitosas: number;
    tasaCancelacion: number;
  };
  // Campos Empresa Exportadora
  ruc?: string;
  razonSocial?: string;
  sector?: 'alimentos_procesados' | 'agroindustrial' | 'metalmecanica' | 'confecciones' | 'otro';
  puertoPrincipal?: 'callao' | 'paita' | 'matarani' | 'ilo' | 'otro';
  agenteAduana?: string;
  
  zonasOperacion?: string[];
  currentLocation?: Location;
  vehiculo?: {
    tipo: 'refrigerado' | 'seco' | 'isotermico' | 'plataforma' | 'grua' | string;
    placa: string;
    capacidad: string;
    sensorTemperatura?: boolean;
  };
  documentosUrls?: {
    dni: string;
    licencia?: string;
    tarjetaPropiedad?: string;
    soat?: string;
  };
  datosBancarios?: {
    banco: string;
    tipoCuenta: string;
    numeroCuenta: string;
    cci?: string;
    titular: string;
  };
  createdAt: number;
}

export interface Cargo {
  id: string;
  comercianteId: string;
  comercianteNombre: string;
  origen: string;
  destino: string;
  origenCoords?: Location;
  destinoCoords?: Location;
  tipoCarga: string;
  categoria: 'general' | 'perecible' | 'fragil' | 'peligrosa';
  
  // Datos Producto Exportable
  nombreProducto?: string;
  lote?: string;
  certificacion?: 'organico' | 'globalgap' | 'fair_trade' | 'sin_certificacion';
  partidaArancelaria?: string;

  // Condiciones de Transporte
  temperaturaRequerida?: 'ambiente' | 'refrigerado' | 'congelado' | 'controlado' | string;
  tipoVehiculoRequerido?: 'refrigerado' | 'seco' | 'isotermico' | 'indiferente';
  condicionSanitaria?: boolean; // Vehículo con limpieza previa certificada

  // Datos de Exportación
  guiaRemision?: string;
  puertoDestino?: string;
  fechaHoraLimitePuerto?: number;
  numeroContenedor?: string;

  cuidadoEspecial?: string;
  peso: string;
  capacidadRequerida: string;
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
  indiceConfiabilidad?: number;
  precioOfertado: number;
  tiempoRecojoEstimado?: string;
  estado: OfferStatus;
  createdAt: number;
}

export interface Trip {
  id: string;
  cargoId: string;
  tipoCarga?: string;
  categoria?: string;
  temperaturaActual?: string;
  cuidadoEspecial?: string;
  comercianteId: string;
  comercianteNombre?: string;
  transportistaId: string;
  transportistaNombre?: string;
  origen: string;
  destino: string;
  precioFinal: number;
  comision: number;
  estado: TripStatus;
  seguimiento?: Location;
  checkpoints: Checkpoint[];
  
  // Trazabilidad Específica
  fechaHoraLimitePuerto?: number;
  nombreProducto?: string;
  lote?: string;
  guiaRemision?: string;
  temperaturaRequerida?: string;

  alertas?: {
    desvioRuta: boolean;
    retrasoCritico: boolean;
    paradaNoAutorizada: boolean;
    perdidaSignal: boolean;
    riesgoLlegadaTardia?: boolean;
  };
  evidencia?: {
    recojoUrl?: string;
    recojoTimestamp?: number;
    recojoLocation?: Location;
    recojoEstado?: 'conforme' | 'con_observaciones';
    recojoObservaciones?: string;
    recojoTemperatura?: number;
    entregaUrl?: string;
    entregaTimestamp?: number;
    entregaLocation?: Location;
    entregaEstado?: 'conforme' | 'con_observaciones' | 'dañada';
    entregaTemperatura?: number;
  };
  tiempoEstimado?: string;
  distanciaRestante?: string;
  fechaRecojo?: string;
  horaRecojo?: string;
  recojoRealAt?: number;
  entregaRealAt?: number;
  lastTempUpdateAt?: number;
  vehiculo?: {
    tipo: string;
    placa: string;
  };
  pagoInfo?: {
    referencia?: string;
    comprobanteUrl?: string;
    fechaPago?: number;
    verificadoPor?: string;
    verificadoAt?: number;
    motivoRechazo?: string | null;
    rechazadoPor?: string;
    rechazadoAt?: number;
    fileName?: string;
  };
  payoutInfo?: {
    estado: 'pendiente' | 'pagado';
    referencia?: string;
    comprobanteUrl?: string;
    pagadoAt?: number;
    montoPagado?: number;
  };
  ratingTransportista?: number;
  comentarioTransportista?: string;
  ratingComerciante?: number;
  comentarioComerciante?: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderPhotoUrl?: string;
  text?: string;
  audioUrl?: string;
  type: 'text' | 'audio';
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

export interface Review {
  id: string;
  tripId: string;
  reviewerId: string;
  reviewerNombre: string;
  reviewerPhotoUrl?: string;
  targetUserId: string;
  rating: number;
  comentario: string;
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
