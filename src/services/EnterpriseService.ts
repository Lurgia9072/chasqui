import { 
  collection, doc, setDoc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, 
  onSnapshot, query, where, orderBy, limit, serverTimestamp, increment 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError } from '../firebase';
import { OperationType } from '../types';
import { 
  EnterpriseUser, EnterpriseSede, EnterpriseVehicle, EnterpriseDriver, EnterpriseCargo 
} from '../pages/enterprise/EnterpriseTypes';

export interface EnterpriseTrip {
  id: string;
  organizationId: string;
  cargoId: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehiclePlaca: string;
  origen: string;
  destino: string;
  estado: 'pendiente' | 'en_transito' | 'por_asignar' | 'completado' | 'incidencia';
  temperaturaActual?: number;
  temperaturaSet?: number;
  combustibleNivel: number;
  gpsCoordinates: { lat: number; lng: number };
  alertas: {
    desvioRuta: boolean;
    retrasoCritico: boolean;
    paradaNoAutorizada: boolean;
    perdidaSignal: boolean;
  };
  checkpoints: {
    id: string;
    mensaje: string;
    timestamp: number;
    automatico: boolean;
    lat: number;
    lng: number;
  }[];
  createdAt: any;
  updatedAt: any;
}

export interface EnterpriseChatMessage {
  id: string;
  organizationId: string;
  tripId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text?: string;
  photoUrl?: string;
  location?: { lat: number; lng: number };
  audioUrl?: string;
  createdAt: number;
}

// -------------------------------------------------------------
// Offline Sync Queue Helper
// -------------------------------------------------------------
const OFFLINE_QUEUE_KEY = 'chasqui_enterprise_sync_queue';

export interface OfflineEvent {
  id: string;
  action: 'GPS_UPDATE' | 'CHECKIN' | 'INCIDENT_REPORT' | 'UPLOAD_PHOTO' | 'ADD_CHIT';
  orgId: string;
  tripId: string;
  payload: any;
  timestamp: number;
}

export const getOfflineQueue = (): OfflineEvent[] => {
  const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
};

export const saveOfflineQueue = (queue: OfflineEvent[]) => {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
};

export const queueOfflineEvent = (event: Omit<OfflineEvent, 'id' | 'timestamp'>) => {
  const queue = getOfflineQueue();
  const fullEvent: OfflineEvent = {
    ...event,
    id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now()
  };
  queue.push(fullEvent);
  saveOfflineQueue(queue);
  console.log('[Offline Engine] Event queued locally:', fullEvent);
};

// Sync queue to Firebase when network returns
export const syncOfflineEvents = async (): Promise<number> => {
  const queue = getOfflineQueue();
  if (queue.length === 0) return 0;

  console.log(`[Offline Sync] Synchronizing ${queue.length} events back to Firestore...`);
  let syncedCount = 0;

  for (const item of queue) {
    try {
      if (item.action === 'GPS_UPDATE') {
        // Update trip locations
        const tripRef = doc(db, 'enterpriseTrips', item.payload.tripId);
        await updateDoc(tripRef, {
          'gpsCoordinates': item.payload.coords,
          'temperaturaActual': item.payload.temp,
          'combustibleNivel': item.payload.fuel,
          'updatedAt': serverTimestamp()
        });
      } else if (item.action === 'CHECKIN') {
        const tripRef = doc(db, 'enterpriseTrips', item.payload.tripId);
        const tripSnap = await getDoc(tripRef);
        if (tripSnap.exists()) {
          const tData = tripSnap.data();
          const list = tData.checkpoints || [];
          list.push({
            id: `cp_${Date.now()}`,
            mensaje: item.payload.mensaje,
            timestamp: item.timestamp,
            automatico: false,
            lat: item.payload.lat,
            lng: item.payload.lng
          });
          await updateDoc(tripRef, { checkpoints: list, updatedAt: serverTimestamp() });
        }
      } else if (item.action === 'INCIDENT_REPORT') {
        // Create an alert log or update state to INCIDENCE
        const tripRef = doc(db, 'enterpriseTrips', item.payload.tripId);
        await updateDoc(tripRef, {
          estado: 'incidencia',
          'alertas.desvioRuta': item.payload.isDesvio || false,
          'alertas.retrasoCritico': item.payload.isRetraso || false,
          'alertas.paradaNoAutorizada': item.payload.isParada || false,
          updatedAt: serverTimestamp()
        });
        
        // Add Chat message as system log
        await addDoc(collection(db, 'enterpriseChats'), {
          organizationId: item.orgId,
          tripId: item.payload.tripId,
          senderId: 'SYSTEM_AI',
          senderName: 'SISTEMA ALERTAS',
          senderRole: 'supervisor',
          text: `[REPORTE INCIDENCIA] Chofer reportó: ${item.payload.detalles}`,
          createdAt: item.timestamp
        });
      } else if (item.action === 'ADD_CHIT') {
        await addDoc(collection(db, 'enterpriseChats'), {
          organizationId: item.orgId,
          tripId: item.tripId,
          senderId: item.payload.senderId,
          senderName: item.payload.senderName,
          senderRole: item.payload.senderRole,
          text: item.payload.text || '',
          photoUrl: item.payload.photoUrl || null,
          location: item.payload.location || null,
          createdAt: item.timestamp
        });
      }
      syncedCount++;
    } catch (err) {
      console.warn('[Offline Sync] Failed to sync item:', item, err);
      // Wait to retry later
      break;
    }
  }

  // Slice successfully synced events
  const remaining = getOfflineQueue().slice(syncedCount);
  saveOfflineQueue(remaining);
  return syncedCount;
};

// -------------------------------------------------------------
// Real Enterprise SaaS & Multi-tenant Firestore Functions
// -------------------------------------------------------------

// Onboard user into an Organization (Create or join)
export async function onboardOrganization(
  orgName: string, 
  plan: 'free' | 'business' | 'enterprise', 
  ruc: string,
  razonSocial: string
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario no autenticado para crear organización');

  const orgId = `${user.uid}_org`;
  const pathOrg = `organizations/${orgId}`;

  try {
    // 1. Write the organization details to Firestore
    await setDoc(doc(db, 'organizations', orgId), {
      id: orgId,
      name: orgName,
      plan,
      ruc,
      razonSocial,
      createdAt: Date.now(),
      createdBy: user.uid,
      adminUser: user.uid,
      limitSedes: plan === 'free' ? 1 : plan === 'business' ? 5 : 50,
      limitVehicles: plan === 'free' ? 2 : plan === 'business' ? 10 : 200,
      limitDrivers: plan === 'free' ? 2 : plan === 'business' ? 10 : 200,
    });

    // 2. Put admin settings to the current user's profile
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      organizationId: orgId,
      enterpriseRole: 'admin_empresa',
      razonSocial,
      ruc
    });

    return orgId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathOrg);
    throw error;
  }
}

// Stream Sedes for the current Organization
export function listenSedes(orgId: string, onUpdate: (sedes: EnterpriseSede[]) => void) {
  const q = query(collection(db, 'sedes'), where('organizationId', '==', orgId));
  return onSnapshot(q, (snapshot) => {
    const list: EnterpriseSede[] = [];
    snapshot.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() } as any);
    });
    onUpdate(list);
  }, error => {
    handleFirestoreError(error, OperationType.LIST, `sedes (org: ${orgId})`);
  });
}

// Add Sede
export async function saveSede(orgId: string, data: Omit<EnterpriseSede, 'id'>) {
  const path = 'sedes';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...data,
      organizationId: orgId,
      createdAt: Date.now()
    });
    return docRef.id;
  } catch (err) {
    return handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// Delete Sede
export async function removeSede(sedeId: string) {
  const path = `sedes/${sedeId}`;
  try {
    await deleteDoc(doc(db, 'sedes', sedeId));
  } catch (err) {
    return handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Listen Vehicles (Telematic tracking)
export function listenVehicles(orgId: string, onUpdate: (vehicles: EnterpriseVehicle[]) => void) {
  const q = query(collection(db, 'vehicles'), where('organizationId', '==', orgId));
  return onSnapshot(q, (snapshot) => {
    const list: EnterpriseVehicle[] = [];
    snapshot.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() } as any);
    });
    onUpdate(list);
  }, error => {
    handleFirestoreError(error, OperationType.LIST, `vehicles (org: ${orgId})`);
  });
}

// Add Vehicle
export async function saveVehicle(orgId: string, data: Omit<EnterpriseVehicle, 'id'>) {
  const path = 'vehicles';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...data,
      organizationId: orgId,
      createdAt: Date.now()
    });
    return docRef.id;
  } catch (err) {
    return handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// Update Vehicle Status
export async function updateVehicleData(vehicleId: string, updates: Partial<EnterpriseVehicle>) {
  const path = `vehicles/${vehicleId}`;
  try {
    await updateDoc(doc(db, 'vehicles', vehicleId), updates);
  } catch (err) {
    return handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Delete Vehicle
export async function removeVehicle(vehicleId: string) {
  const path = `vehicles/${vehicleId}`;
  try {
    await deleteDoc(doc(db, 'vehicles', vehicleId));
  } catch (err) {
    return handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Listen Drivers
export function listenDrivers(orgId: string, onUpdate: (drivers: EnterpriseDriver[]) => void) {
  const q = query(collection(db, 'drivers'), where('organizationId', '==', orgId));
  return onSnapshot(q, (snapshot) => {
    const list: EnterpriseDriver[] = [];
    snapshot.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() } as any);
    });
    onUpdate(list);
  }, error => {
    handleFirestoreError(error, OperationType.LIST, `drivers (org: ${orgId})`);
  });
}

// Add Driver
export async function saveDriver(orgId: string, data: Omit<EnterpriseDriver, 'id'>) {
  const path = 'drivers';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...data,
      organizationId: orgId,
      createdAt: Date.now()
    });
    return docRef.id;
  } catch (err) {
    return handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// Delete Driver
export async function removeDriver(driverId: string) {
  const path = `drivers/${driverId}`;
  try {
    await deleteDoc(doc(db, 'drivers', driverId));
  } catch (err) {
    return handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Listen Cargo items
export function listenEnterpriseCargos(orgId: string, onUpdate: (cargos: EnterpriseCargo[]) => void) {
  const q = query(collection(db, 'enterpriseCargos'), where('organizationId', '==', orgId));
  return onSnapshot(q, (snapshot) => {
    const list: EnterpriseCargo[] = [];
    snapshot.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() } as any);
    });
    onUpdate(list);
  }, error => {
    handleFirestoreError(error, OperationType.LIST, `enterpriseCargos (org: ${orgId})`);
  });
}

// Save Enterprise Cargo
export async function saveEnterpriseCargo(orgId: string, data: Omit<EnterpriseCargo, 'id'>) {
  const path = 'enterpriseCargos';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...data,
      organizationId: orgId,
      createdAt: Date.now()
    });
    return docRef.id;
  } catch (err) {
    return handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// Update Cargo
export async function updateEnterpriseCargoData(cargoId: string, updates: Partial<EnterpriseCargo>) {
  const path = `enterpriseCargos/${cargoId}`;
  try {
    await updateDoc(doc(db, 'enterpriseCargos', cargoId), updates);
  } catch (err) {
    return handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Delete Cargo
export async function removeEnterpriseCargo(cargoId: string) {
  const path = `enterpriseCargos/${cargoId}`;
  try {
    await deleteDoc(doc(db, 'enterpriseCargos', cargoId));
  } catch (err) {
    return handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Listen to Active Organization Trips
export function listenEnterpriseTrips(orgId: string, onUpdate: (trips: EnterpriseTrip[]) => void) {
  const q = query(collection(db, 'enterpriseTrips'), where('organizationId', '==', orgId));
  return onSnapshot(q, (snapshot) => {
    const list: EnterpriseTrip[] = [];
    snapshot.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() } as any);
    });
    onUpdate(list);
  }, error => {
    handleFirestoreError(error, OperationType.LIST, `enterpriseTrips (org: ${orgId})`);
  });
}

// Add Enterprise Trip
export async function saveEnterpriseTrip(orgId: string, data: Omit<EnterpriseTrip, 'id' | 'createdAt' | 'updatedAt'>) {
  const path = 'enterpriseTrips';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...data,
      organizationId: orgId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    return docRef.id;
  } catch (err) {
    return handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// Update Enterprise Trip Telemetry
export async function updateEnterpriseTripData(tripId: string, updates: Partial<EnterpriseTrip>) {
  const path = `enterpriseTrips/${tripId}`;
  try {
    await updateDoc(doc(db, 'enterpriseTrips', tripId), {
      ...updates,
      updatedAt: Date.now()
    });
  } catch (err) {
    return handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Delete Trip
export async function removeEnterpriseTrip(tripId: string) {
  const path = `enterpriseTrips/${tripId}`;
  try {
    await deleteDoc(doc(db, 'enterpriseTrips', tripId));
  } catch (err) {
    return handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Listen to Operational Chat Messages
export function listenOperationalChat(tripId: string, onUpdate: (messages: EnterpriseChatMessage[]) => void) {
  const q = query(
    collection(db, 'enterpriseChats'), 
    where('tripId', '==', tripId),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const list: EnterpriseChatMessage[] = [];
    snapshot.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() } as any);
    });
    onUpdate(list);
  }, error => {
    handleFirestoreError(error, OperationType.LIST, `enterpriseChats (trip: ${tripId})`);
  });
}

// Save Operational Chat Message
export async function saveOperationalChatMessage(
  orgId: string, 
  tripId: string, 
  data: { senderId: string; senderName: string; senderRole: string; text?: string; photoUrl?: string; location?: { lat: number; lng: number } }
) {
  const path = 'enterpriseChats';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...data,
      organizationId: orgId,
      tripId,
      createdAt: Date.now()
    });
    return docRef.id;
  } catch (err) {
    return handleFirestoreError(err, OperationType.CREATE, path);
  }
}
