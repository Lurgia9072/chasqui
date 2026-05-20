import { EnterpriseCargo, EnterpriseDriver, EnterpriseSede, EnterpriseUser, EnterpriseVehicle } from "./EnterpriseTypes";

export const INITIAL_USERS: EnterpriseUser[] = [
  { id: 'u1', nombre: 'Eduardo Valdivia', email: 'e.valdivia@chasquimulti.com', rol: 'admin_empresa', sede: 'San Isidro HQ', telefono: '+51 987 654 321', activo: true, ultimoAcceso: 'Hace 5 min' },
  { id: 'u2', nombre: 'Lurgia Alida Yupa', email: 'lurgia18yuar@gmail.com', rol: 'supervisor', sede: 'Planta Fría Paita', telefono: '+51 998 877 665', activo: true, ultimoAcceso: 'Hoy, 08:30 AM' },
  { id: 'u3', nombre: 'Carlos Mendoza', email: 'c.mendoza@chasquimulti.com', rol: 'monitorista', sede: 'San Isidro HQ', telefono: '+51 912 345 678', activo: true, ultimoAcceso: 'En línea' },
  { id: 'u4', nombre: 'Gisela Pinedo', email: 'g.pinedo@chasquimulti.com', rol: 'operador', sede: 'Almacén Lurín', telefono: '+51 945 612 378', activo: true, ultimoAcceso: 'Ayer, 18:20' },
  { id: 'u5', nombre: 'Ricardo Rojas', email: 'r.rojas@chasquimulti.com', rol: 'auditor', sede: 'San Isidro HQ', telefono: '+51 963 852 741', activo: false, ultimoAcceso: 'Hace 3 días' },
  { id: 'u6', nombre: 'Mario Lanza', email: 'mario.lanza@driver.com', rol: 'chofer', sede: 'Ruta Nacional', telefono: '+51 999 444 111', activo: true, ultimoAcceso: 'En viaje' },
];

export const INITIAL_SEDES: EnterpriseSede[] = [
  { id: 's1', nombre: 'San Isidro HQ', ubicacion: 'Av. Juan de Arona 450, Lima', tipo: 'oficina', encargado: 'Eduardo Valdivia' },
  { id: 's2', nombre: 'Planta Fría Paita', ubicacion: 'Zona Industrial Lote B-4, Piura', tipo: 'planta', encargado: 'Lurgia Alida Yupa' },
  { id: 's3', nombre: 'Almacén Lurín', ubicacion: 'Km 36 Panamericana Sur, Lima', tipo: 'almacen', encargado: 'Gisela Pinedo' },
  { id: 's4', nombre: 'Puerto del Callao (APM Terminals)', ubicacion: 'Av. Contralmirante Raygada 111, Callao', tipo: 'puerto', encargado: 'Enlace Aduanero' },
];

export const INITIAL_VEHICLES: EnterpriseVehicle[] = [
  { id: 'v1', placa: 'F2W-894', tipo: 'refrigerado', capacidad: '24 Ton', conductorId: 'Mario Lanza', estado: 'viaje', temperaturaSet: -18, temperaturaActual: -18.2, combustibleNivel: 74, documentos: { soat: true, revisionTecnica: true, permisoMTC: true } },
  { id: 'v2', placa: 'B7T-452', tipo: 'seco', capacidad: '12 Ton', conductorId: 'Raúl Quispe', estado: 'libre', combustibleNivel: 45, documentos: { soat: true, revisionTecnica: true, permisoMTC: true } },
  { id: 'v3', placa: 'C5X-611', tipo: 'refrigerado', capacidad: '28 Ton', conductorId: 'Enrique Palacios', estado: 'viaje', temperaturaSet: -20, temperaturaActual: -19.5, combustibleNivel: 82, documentos: { soat: true, revisionTecnica: true, permisoMTC: true } },
  { id: 'v4', placa: 'A9E-231', tipo: 'plataforma', capacidad: '30 Ton', conductorId: 'No Asignado', estado: 'mantenimiento', combustibleNivel: 15, documentos: { soat: true, revisionTecnica: false, permisoMTC: true } },
  { id: 'v5', placa: 'D3V-742', tipo: 'cortina', capacidad: '15 Ton', conductorId: 'Juan Huamán', estado: 'incidencia', combustibleNivel: 50, documentos: { soat: true, revisionTecnica: true, permisoMTC: true } },
];

export const INITIAL_DRIVERS: EnterpriseDriver[] = [
  { id: 'd1', nombre: 'Mario Lanza', licencia: '71542389-A', categoria: 'A-IIIc', telefono: '+51 999 444 111', estado: 'viajando', calificacion: 4.8, ultimoViaje: 'Paita - Callao (Activo)' },
  { id: 'd2', nombre: 'Raúl Quispe', licencia: '42516390-B', categoria: 'A-IIIb', telefono: '+51 988 333 222', estado: 'libre', calificacion: 4.9, ultimoViaje: 'Lima - Trujillo hace 2 horas' },
  { id: 'd3', nombre: 'Enrique Palacios', licencia: '10293847-C', categoria: 'A-IIIc', telefono: '+51 911 222 333', estado: 'viajando', calificacion: 4.7, ultimoViaje: 'Lurín - Matarani (Activo)' },
  { id: 'd4', nombre: 'Juan Huamán', licencia: '48596012-A', categoria: 'A-IIb', telefono: '+51 955 444 777', estado: 'libre', calificacion: 4.5, ultimoViaje: 'Lima interna hace 1 día' },
  { id: 'd5', nombre: 'Esteban Paredes', licencia: '33445566-B', categoria: 'A-IIIa (VENCIDA)', telefono: '+51 977 111 555', estado: 'licencia_vencida', calificacion: 4.2, ultimoViaje: 'Trujillo - Chiclayo hace 1 semana' },
];

export const INITIAL_CARGOS: EnterpriseCargo[] = [
  { id: 'c1', tipoDeCarga: 'Agroindustrial (Arándanos Cold)', nombreProducto: 'Arándanos Premium (Finca Sol)', origen: 'Planta Fría Paita', destino: 'Puerto del Callao (APM)', precioPropuesto: 3400, estado: 'en_transito', conductorAsignado: 'Mario Lanza', vehiculoAsignado: 'F2W-894', fechaEntregaLimite: '2026-05-21 14:00', temperaturaActual: -18.2 },
  { id: 'c2', tipoDeCarga: 'Textil de Exportación', nombreProducto: 'Hilos de Algodón Pima', origen: 'Almacén Lurín', destino: 'Puerto del Callao (DP World)', precioPropuesto: 1200, estado: 'por_asignar', fechaEntregaLimite: '2026-05-23 09:00' },
  { id: 'c3', tipoDeCarga: 'Conservas de Pescado', nombreProducto: 'Conserva de Anchoveta (40 Pallets)', origen: 'Planta Chimbote', destino: 'Puerto del Callao (Termales)', precioPropuesto: 2800, estado: 'disponible', fechaEntregaLimite: '2026-05-24 18:00' },
  { id: 'c4', tipoDeCarga: 'Metales / Bobinas', nombreProducto: 'Bobinas de Acero Zincado', origen: 'Almacén Sider', destino: 'Taller San Juan de Lurigancho', precioPropuesto: 950, estado: 'completado', conductorAsignado: 'Juan Huamán', vehiculoAsignado: 'B7T-452', fechaEntregaLimite: '2026-05-19 12:00' },
  { id: 'c5', tipoDeCarga: 'Agroindustrial (Mangos Orgánicos)', nombreProducto: 'Mangos Kent de Exportación', origen: 'Planta Fría Paita', destino: 'Complejo Lurín', precioPropuesto: 3900, estado: 'incidencia', conductorAsignado: 'Enrique Palacios', vehiculoAsignado: 'C5X-611', fechaEntregaLimite: '2026-05-20 22:00', temperaturaActual: -12.4 },
];

export const FIRESTORE_SCHEMA = `
// ===============================================================
// CHASQUI ENTERPRISE FIRESTORE ARCHITECTURE PROPOSAL
// ===============================================================

// Collection: organizations
// Document ID: orgId
{
  id: "org_alpha_logistics",
  nombre: "Soporte Agrícola & Exportaciones SAC",
  ruc: "20601234567",
  tipo: "empresa_exportadora", // exportadora, importadora, transportista, operador
  plan: "business", // free, business, enterprise
  subscriptionId: "sub_1Hh28j7y6...",
  created_at: 1716164283000,
  logoUrl: "https://...",
  limites: {
    usuariosMaximum: 15,
    vehiculosMaximum: 50,
    geocercasActive: 10
  }
}

// Sub-Collection: organizations/{orgId}/users (RBAC Context)
{
  uid: "NGqglTlg7CO1ZKKfojUhghgxGOI2",
  nombre: "Eduardo Valdivia",
  email: "e.valdivia@chasquimulti.com",
  telelefono: "+51 987 654 321",
  rol: "supervisor", // admin_empresa, supervisor, monitorista, operador, auditor, chofer
  sedeId: "sede_paita_01",
  fechaAgregado: 1716164283000,
  verificado: true
}

// Sub-Collection: organizations/{orgId}/sedes
{
  id: "sede_paita_01",
  nombre: "Planta de Frío - Paita",
  direccion: "Zona Industrial Lote B-4, Piura",
  coords: { lat: -5.0747, lng: -81.1119 },
  tipo: "planta", // planta, almacen, oficina, puerto
  responsable: "Lurgia Alida Yupa"
}

// Sub-Collection: organizations/{orgId}/vehicles (Fleet Module)
{
  id: "veh_f2w894",
  placa: "F2W-894",
  tipo: "refrigerado", // refrigerado, seco, cortina, plataforma
  capacidad: "24 Ton",
  conductorId: "d_mario_lanza",
  disponibilidad: "viaje", // libre, viaje, mantenimiento, incidencia
  sensorTemperatura: true,
  telefonoGPS: "+51 999 444 111",
  documentos: {
    soatVencimiento: 1782019200000,
    revisionTecnicaVencimiento: 1766275200000,
    permisoMTC: "MTC-N-92318"
  }
}

// Collection: cargas (Enriched Enterprise Fields)
{
  id: "cargo_ent_101",
  comercianteId: "org_alpha_logistics", // Se vincula al Org ID en lugar de un usuario natural
  comercianteNombre: "Soporte Agrícola & Exportaciones",
  tipoDeCarga: "Agroindustrial (Cold-Chain)",
  origen: "Planta Fría Paita",
  destino: "Puerto del Callao (APM Terminals)",
  precioPropuesto: 3400,
  estado: "en_transito", // disponible, en_negociacion, asignado, completado
  
  // Trazabilidad Empresarial
  lote: "LOTE-2026-ARAN05",
  partidaArancelaria: "0810.40.00.00",
  puertoDestino: "Rotterdam, NL",
  numeroContenedor: "MSCU-89231-0",
  temperaturaRequerida: "-18.0 °C",
  certificacion: "GlobalG.A.P. / SENASA",
  eudr: "EUDR-COMPLIANT-9023",
  guiaRemision: "001-098273",
  fechaHoraLimitePuerto: 1782242400000,
  
  // Asignaciones
  vehiculoAsignado: "F2W-894",
  choferAsignadoId: "d_mario_lanza",
  choferNombre: "Mario Lanza",
  coordinadores: ["u_lurgia_yupa", "u_carlos_mendoza"]
}
`;

export const SECURITY_RULES = `
// ===============================================================
// FIRESTORE RULES FOR CHASQUI ENTERPRISE RBAC & MILTI-TENANCY
// ===============================================================

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: Is the user authenticated?
    function isAuth() {
      return request.auth != null;
    }

    // Helper: Retrieve the user's role and organization document from membership
    function getUserRole(orgId) {
      return get(/databases/$(database)/documents/organizations/$(orgId)/users/$(request.auth.uid)).data.rol;
    }

    // Helper: Check if user belongs to this specific organization
    function isMember(orgId) {
      return isAuth() && exists(/databases/$(database)/documents/organizations/$(orgId)/users/$(request.auth.uid));
    }

    // Organization Rules
    match /organizations/{orgId} {
      allow read: if isMember(orgId);
      allow create: if isAuth(); // Permite crear una nueva organización (SaaS setup)
      allow update: if isMember(orgId) && getUserRole(orgId) == 'admin_empresa';
      allow delete: if false; // Solo superadmin cloud

      // Sub-collection: Users & Team assignment (RBAC)
      match /users/{teamUserId} {
        allow read: if isMember(orgId);
        // Solo administradores y supervisores pueden editar miembros
        allow write: if isMember(orgId) && (getUserRole(orgId) == 'admin_empresa' || getUserRole(orgId) == 'supervisor');
      }

      // Sub-collection: Fleet Vehicles
      match /vehicles/{vehicleId} {
        allow read: if isMember(orgId);
        allow write: if isMember(orgId) && (getUserRole(orgId) == 'admin_empresa' || getUserRole(orgId) == 'supervisor');
      }

      // Sub-collection: Sedes
      match /sedes/{sedeId} {
        allow read: if isMember(orgId);
        allow write: if isMember(orgId) && getUserRole(orgId) == 'admin_empresa';
      }
    }

    // Enriched Cargas Rules (Enterprise Multi-Tenant Check)
    match /cargas/{cargoId} {
      // Si el comercianteId es una organización, valida pertenencia y rol
      allow read: if isAuth() && (
        resource.data.comercianteId == request.auth.uid || 
        isMember(resource.data.comercianteId) ||
        resource.data.estado == 'disponible' // visible para transportistas
      );
      
      allow create: if isAuth() && (
        request.resource.data.comercianteId == request.auth.uid ||
        (
          isMember(request.resource.data.comercianteId) && 
          getUserRole(request.resource.data.comercianteId) in ['admin_empresa', 'supervisor', 'operador']
        )
      );

      allow update: if isAuth() && (
        resource.data.comercianteId == request.auth.uid ||
        (
          isMember(resource.data.comercianteId) && 
          getUserRole(resource.data.comercianteId) in ['admin_empresa', 'supervisor', 'operador', 'monitorista']
        )
      );
    }
  }
}
`;

export const REACT_NATIVE_COMPONENT = `
// ===============================================================
// REACT NATIVE MOBILE: DRIVER TRACKING & COMPLIANCE TELEMETRY
// ===============================================================
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Switch, Alert, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebaseConfig';

interface DriverAppTrackerProps {
  tripId: string;
  vehiclePlate: string;
}

export default function DriverAppTracker({ tripId, vehiclePlate }: DriverAppTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [lastCoords, setLastCoords] = useState<{lat: number, lng: number} | null>(null);
  const [tempSensed, setTempSensed] = useState<number>(-18.2);

  useEffect(() => {
    let locationSubscription: ExpoSubscription | null = null;

    async function startUpdates() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso Requerido', 'Chasqui Enterprise necesita ubicación para trazabilidad.');
        setIsTracking(false);
        return;
      }

      // Iniciar suscripción de geolocalización de alta precisión
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 15000, // Cada 15 segundos
          distanceInterval: 10, // O cada 10 metros
        },
        async (location) => {
          const { latitude, longitude, speed } = location.coords;
          setLastCoords({ lat: latitude, lng: longitude });

          // Reportar periódicamente a Firestore
          const tripRef = doc(db, 'trips', tripId);
          await updateDoc(tripRef, {
            seguimiento: {
              lat: latitude,
              lng: longitude,
              updatedAt: Date.now(),
              velocidad: speed || 0
            },
            // Registrar checkpoint auditable en lote de historial
            checkpoints: arrayUnion({
              id: \`chk_\${Date.now()}\`,
              estado: 'en_camino_a_destino',
              timestamp: Date.now(),
              location: { lat: latitude, lng: longitude },
              mensaje: \`Reporte de Telemetría GPS: Velocidad \${(speed || 0).toFixed(1)} km/h. Temp: \${tempSensed}°C\`,
              automatico: true
            })
          });
        }
      );
    }

    if (isTracking) {
      startUpdates();
    } else {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    }

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isTracking, tripId]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Chasqui Telemetría Móvil {vehiclePlate}</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Transmisión GPS Activa:</Text>
        <Switch value={isTracking} onValueChange={setIsTracking} />
      </View>
      
      {lastCoords && (
        <View style={styles.coordsPanel}>
          <Text style={styles.coords}>LAT: {lastCoords.lat.toFixed(6)}</Text>
          <Text style={styles.coords}>LNG: {lastCoords.lng.toFixed(6)}</Text>
          <Text style={styles.temp}>Sensor Temperatura: {tempSensed.toFixed(1)} °C</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, backgroundColor: '#0f172a', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#3b82f6' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc', marginBottom: 12, fontFamily: 'monospace' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  label: { color: '#94a3b8', fontSize: 13 },
  coordsPanel: { marginTop: 12, padding: 8, backgroundColor: '#1e293b', borderRadius: 8 },
  coords: { color: '#10b981', fontFamily: 'monospace', fontSize: 12 },
  temp: { color: '#3b82f6', fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold', marginTop: 4 }
});
`;

export const IA_LOGISTIC_ANSWERS: Record<string, string> = {
  opt_ruta: `### 🧠 OPTIMIZACIÓN MULTI-SEDE: PLANTA PAITA A PUERTO DEL CALLAO

He analizado las variables operativas en tiempo real:

1. **Variables de Entrada:**
   - **Carga:** Arándanos Premium (Sensible al calor, requiere frío continuo a -18.0 °C).
   - **Ruta:** Panamericana Norte (Piura -> Lambayeque -> La Libertad -> Ancash -> Lima). 1,020 KM.
   - **Flota Disponible:** Camión F2W-894 (Refrigerado, SOAT y MTC Vigentes).
   - **Hora propuesta de salida:** 14:00 (Mayor radiación térmica en desierto de Sechura).

2. **Recomendaciones de Chasqui Copilot:**
   - **Horario Crítico de Desvío:** Retrasar la salida a las **17:30 PM**. Esto reduce el consumo de combustible del compresor térmico en un **14.5%** al cruzar el desierto de Sechura de noche.
   - **Parada de Seguridad No Autorizada (Geocerca Alerta):** El sistema ha configurado geocercas automáticas alrededor de Chimbote (Chimbote Norte Km 435) y Huarmey debido a reportes históricos de incidencias mecánicas. **Solo se permiten paradas autorizadas en Sullana, Trujillo (Planta Teruel) y Chancay**.
   - **Alerta por Pérdida de Cobertura:** Existe una zona de sombra de señal móvil satelital de 45 minutos entre el Km 310 y Km 290 de la Panamericana Norte. El sistema entrará en modo *Offline-Buffer Audit* y resincronizará al salir.

**Ruta Planificada Generada:**
- *Hito 1:* Salida Paita Planta Frío (17:30)
- *Hito 2:* Control Térmico Automático Termógrafo (21:45) -> Temp esperada: -18.5 °C.
- *Hito 3:* Parada Autorizada Trujillo Técnica (01:15 AM).
- *Hito 4:* Entrada APM Terminals Puerto Callao (09:45 AM). **Tiempo de entrega: 16h 15m (3h antes de límite de puerto).**`,

  opt_container: `### 📐 OPTIMIZADOR DE DISTRIBUCIÓN DE CARGA MASIVA (NAV-REFRIGERADO 40FT)

Cerrando cubicaje y estabilidad aerodinámica para Contenedor **MSCU-89231-0**:

1. **Análisis de Peso y Centro de Gravedad (Pallets):**
   - **Pallets Totales: 20 estándar.**
   - **Carga Útil:** 22,400 KG.
   - **Distribución Estructural:** No stackear más de 4 pallets en la fila final para evitar desequilibrio en el eje trasero del remolque (cumpliendo con la normativa MTC de pesos por eje).
   
2. **Optimización del Flujo de Aire (Cold Chain Uniformity):**
   - **T-Flow Clearance:** Mantener un espacio libre de **7.5 cm (3 pulgadas)** entre la parte superior de la carga y el techo del contenedor para el retorno de aire.
   - **Piso T-Floor:** Dejar el canal del piso extrusionado de aluminio limpio de cartones o envoltorios plásticos sueltos. Obstruir estos canales reduce la eficiencia de congelación en un **30% en los pallets delanteros**.
   - **Patrón de Estibado:** Usar estibado tipo *Alternated Block* para bloquear el movimiento lateral sin bloquear los canales de ventilación de aire vertical.

**Factor de Confiabilidad de Carga:** 98.4% (Apto para Inspección de Exportación SENASA)`,

  opt_rates: `### 🧮 PREDICTOR DE TARIFAS DINÁMICAS (CORRELACIÓN DE MERCADO COLD-CHAIN)

Tarifa Base Calculada para Ruta: **Paita -> Callao** (Carga Refrigerada de Alto Valor - Arándano)

1. **Cálculo de Variables de Costo:**
   - **Costo de Combustible Indexado (Diésel B5):** S/. 16.80/Galón. Consumo estimado de Piura a Lima: S/. 1,250.
   - **Amortiguación Refrigeración de Motor Autónomo (Compresor):** Consumo adicional de 1.8 Gal/Hr x 16 Horas = S/. 480.
   - **Peajes Nacionales (Ruta de Idas):** 11 peajes = S/. 192.50.
   - **Retorno Vacío Asegurado:** S/. 600 (Riesgo estimado en 23%).

2. **Elasticidad de Oferta Temporal:**
   - Demanda actual en Puerto Callao: **ALTA** (Congestión de descarga en muelles de frutas).
   - Disponibilidad local de camiones fríos certificados: **REDUCIDA (Clave de temporada agropecuaria)**.

**Precio Recomendado Sugerido:** **S/. 3,250.00**
- *Rango Mínimo (Negociable):* S/. 2,900.00 (Fidelización de transportista).
- *Tarifa de Cierre Rápido:* S/. 3,500.00.
*Este precio garantiza una tasa de aceptación de oferta del 87% en los primeros 15 minutos.*`
};
