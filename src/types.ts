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
  
  // Camilla de Campos de Onboarding Avanzados (SaaS Multiempresa / Multi-flota)
  organizationId?: string;
  organizationType?: 'casual' | 'independent_driver' | 'shipper_company' | 'transport_company';
  role?: 'admin' | 'logistics_manager' | 'dispatcher' | 'monitor' | 'auditor' | 'driver';
  nombreComercial?: string;
  tamanioEmpresa?: string;
  coberturaNacional?: string;
  anosOperacion?: number;
  cantidadVehiculos?: number;
  cantidadChoferes?: number;
  usaFrio?: boolean;
  usaAduanas?: boolean;
  frecuenciaDespachos?: string;
  cantidadUsuarios?: number;
  cantidadSedes?: number;
  gerenteOperaciones?: string;
  supervisorGps?: string;
  responsableDespacho?: string;
  monitoristas?: number;
  cargoResponsable?: string;
  nombreResponsable?: string;
  
  // Datos específicos de Conductor Independiente
  licenciaNumero?: string;
  licenciaCategoria?: string;
  licenciaVencimiento?: string;
  vehiculoMarca?: string;
  vehiculoModelo?: string;
  vehiculoAno?: string;
  rutasFrecuentes?: string;
  disponibilidad?: string;
  tipoCargaAceptada?: string;
  
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
  metodoPago?: 'bank' | 'yape' | 'plin';
  datosPago?: {
    banco?: string;
    numeroCuenta?: string;
    cci?: string;
    titular?: string;
    celular?: string;
    fotoUrl?: string;
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
  tipoDeCarga: string;
  tipoCarga?: string; // Mantener para compatibilidad
  categoria?: string; // Mantener para compatibilidad
  peso?: number; // Mantener para compatibilidad
  capacidadRequerida?: string; // Mantener para compatibilidad
  tipoVehiculoRequerido?: string; // Mantener para compatibilidad
  
  vehiculo: {
    tipo: string;
    otroTipo?: string;
    caracteristicas: string[];
    capacidad: {
      peso?: string;
      volumen?: string;
      pallets?: string;
      dimensiones?: string;
    };
  };

  nombreProducto: string;
  horario?: string;
  descripcion: string;
  precioPropuesto: number;
  estado: CargoStatus;
  createdAt: number;
  
  sectorProducto?: string;
  rucExportador?: string;
  // Campos Avanzados / Exportación
  lote?: string;
  partidaArancelaria?: string;
  puertoDestino?: string;
  numeroContenedor?: string;
  temperaturaRequerida?: string;
  certificacion?: string;
  eudr?: string;
  guiaRemision?: string;
  fechaHoraLimitePuerto?: number;
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
  comercianteEmail?: string;
  transportistaId: string;
  transportistaNombre?: string;
  transportistaEmail?: string;
  origen: string;
  destino: string;
  precioFinal: number;
  comision: number;
  estado: TripStatus;
  seguimiento?: Location;
  checkpoints?: Checkpoint[];
  
  // Trazabilidad Específica
  fechaHoraLimitePuerto?: number;
  nombreProducto?: string;
  puertoDestino?: string;
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
  llegadaAntesLimite?: boolean;
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
