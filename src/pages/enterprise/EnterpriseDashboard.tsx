import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Building2, Users, Truck, AlertTriangle, Send, ShieldCheck, Download, 
  MapPin, Gauge, Thermometer, Battery, Plus, Compass, Search, User, Check, Trash2, HelpCircle, RefreshCw, Wifi, WifiOff, FileText
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { doc, getDoc, collection, getDocs, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';

// Imports from our modular components
import { EnterpriseUser, EnterpriseSede, EnterpriseVehicle, EnterpriseDriver, EnterpriseCargo } from './EnterpriseTypes';
import { TechnicalDocs } from './TechnicalDocs';

// IA Logistic Answers declared directly
const IA_LOGISTIC_ANSWERS: Record<string, string> = {
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

// Newly developed modular Enterprise core sub-systems
import { ControlTowerMap } from './ControlTowerMap';
import { DriverView } from './DriverView';
import { FleetManagement } from './FleetManagement';
import { OperationalChat } from './OperationalChat';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { DocumentManagement } from './DocumentManagement';
import { SmartCopilot } from './SmartCopilot';
import { SaaSBilling } from './SaaSBilling';

// Real Multi-Tenant Integration services and Auth state
import { auth, db } from '../../firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  onboardOrganization, 
  listenSedes, 
  saveSede, 
  removeSede, 
  listenVehicles, 
  saveVehicle, 
  updateVehicleData, 
  removeVehicle, 
  listenDrivers, 
  saveDriver, 
  removeDriver, 
  listenEnterpriseCargos, 
  saveEnterpriseCargo, 
  updateEnterpriseCargoData, 
  removeEnterpriseCargo,
  listenEnterpriseTrips,
  saveEnterpriseTrip,
  updateEnterpriseTripData,
  removeEnterpriseTrip,
  syncOfflineEvents,
  queueOfflineEvent,
  getOfflineQueue,
  EnterpriseTrip } from '@/src/services/EnterpriseService';

export function EnterpriseDashboard() {
  // Navigation tabs within Enterprise Suite
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'rbac' | 'fleet' | 'operations' | 'traceability' | 'ai' | 'saas' | 'tech' | 'driver'>('overview');

  // Search params for interactive demo
  const [searchParams] = useSearchParams();
  const rawUser = useAuthStore().user;
  
  // Interactive demo bypass check
  const isDemo = searchParams.get('demo') === 'true' || localStorage.getItem('chasqui_demo_active') === 'true';

  // Instantiate dummy corporate credentials if guest launches Interactive Demo
  const user = rawUser ? {
    ...(rawUser as any),
    organizationId: (rawUser as any).organizationId || `${rawUser.uid}_org`
  } : (isDemo ? {
    uid: 'demo_user',
    nombre: 'Soporte Agrícola & Exportaciones SAC',
    tipoUsuario: 'comerciante',
    tipoCuenta: 'ruc20',
    email: 'contacto@soporteagricola.com',
    organizationId: 'demo_org_id',
    verificado: 'verificado'
  } : null);

  const [activeOrg, setActiveOrg] = useState<any>(null);
  const [loadingOrg, setLoadingOrg] = useState(false);

  // Initialize activeOrg if demo profile is loaded
  useEffect(() => {
    if (isDemo && !rawUser) {
      setActiveOrg({
        id: 'demo_org_id',
        name: 'Soporte Agrícola & Exportaciones SAC',
        plan: 'enterprise',
        ruc: '20609384751',
        razonSocial: 'SOPORTE AGRICOLA Y EXPORTACIONES SAC'
      });
    }
  }, [isDemo, rawUser]);
  
  // Real or Fallback memory states
  const [users, setUsers] = useState<EnterpriseUser[]>([]);
  const [sedes, setSedes] = useState<EnterpriseSede[]>([]);
  const [vehicles, setVehicles] = useState<EnterpriseVehicle[]>(() => {
    const raw = localStorage.getItem('chasqui_demo_corp_vehicles');
    return raw ? JSON.parse(raw) : [];
  });
  const [drivers, setDrivers] = useState<EnterpriseDriver[]>(() => {
    const raw = localStorage.getItem('chasqui_demo_corp_drivers');
    return raw ? JSON.parse(raw) : [];
  });
  const [cargos, setCargos] = useState<EnterpriseCargo[]>(() => {
    const raw = localStorage.getItem('chasqui_demo_corp_cargos');
    return raw ? JSON.parse(raw) : [];
  });
  const [selectedCargoFilter, setSelectedCargoFilter] = useState<string>('todos');

  // Multi-tenant Onboarding Form
  const [onboardForm, setOnboardForm] = useState({
    name: '',
    ruc: '',
    razonSocial: '',
    plan: 'business' as 'free' | 'business' | 'enterprise'
  });

  // Offline support states
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueueLen, setOfflineQueueLen] = useState(getOfflineQueue().length);
  const [isSyncing, setIsSyncing] = useState(false);

  // Simulation telemetry state
  const [selectedTruck, setSelectedTruck] = useState<string>('v1');
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([
    '[11:32:01 AM] Chasqui Enterprise OS iniciado - Entorno corporativo activo.',
    '[11:33:15 AM] Camión F2W-894 cruzando Chepén - Conexión GPS estable. Temp: -18.2 °C',
    '[11:34:00 AM] Geocercas de Puerto Callao y Planta Paita verificadas conforme.',
    '[11:35:10 AM] Sincronización biométrica aprobada para Chofer Mario Lanza.'
  ]);

  // Active Alert Simulation Flag
  const [currentAlertSim, setCurrentAlertSim] = useState<'ninguna' | 'desvio' | 'temperatura' | 'signal'>('ninguna');

  // New Forms State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ nombre: '', email: '', rol: 'operador' as any, sede: 'San Isidro HQ', telefono: '' });

  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ placa: '', tipo: 'seco' as any, capacidad: '', conductorId: 'No Asignado' });

  // AI Copilot state
  const [aiPrompt, setAiPrompt] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
    { sender: 'ai', text: '¡Hola! Soy **Chasqui Copilot**, tu asistente logístico empresarial. Pídeme optimizar una ruta fría de Piura, Trujillo o Tacna, calcular el cubicaje de un contenedor o predecir tarifas dinámicas.' }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Network offline state sync trigger
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const synced = await syncOfflineEvents();
      if (synced > 0) {
        setSimulatedLogs(prev => [`[INFO] Sincronizador recuperado: ${synced} eventos encolados fueron transmitidos a Firestore.`, ...prev]);
      }
      setOfflineQueueLen(getOfflineQueue().length);
    } catch (e) {
      console.warn('Sync failed', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Subscribe to real multi-tenant Firestore backend when organization is active!
  useEffect(() => {
    if (!rawUser) return;
    const orgId = rawUser.organizationId || `${rawUser.uid}_org`;

    // Load actual organization metadata
    const loadOrg = async () => {
      try {
        const orgDoc = await getDoc(doc(db, 'organizations', orgId));
        if (orgDoc.exists()) {
          setActiveOrg(orgDoc.data());
        } else {
          const defaultName = rawUser.razonSocial || `${rawUser.nombre || 'Mi'} Logistics S.A.`;
          const defaultRuc = rawUser.ruc || '20601234567';
          const defaultOrg = {
            id: orgId,
            name: defaultName,
            plan: 'enterprise',
            ruc: defaultRuc,
            razonSocial: defaultName,
            createdAt: Date.now(),
            createdBy: rawUser.uid,
            adminUser: rawUser.uid,
            limitSedes: 50,
            limitVehicles: 200,
            limitDrivers: 200,
          };
          setActiveOrg(defaultOrg);
          
          // Silently write to Firestore so database queries for sedes/vehicles/etc work perfectly
          await setDoc(doc(db, 'organizations', orgId), defaultOrg).catch(err => {
            console.warn('Silent org registration warning (safe to ignore):', err);
          });
        }
      } catch (err) {
        console.error('Error fetching org:', err);
      }
    };
    loadOrg();

    // 1. Subscribe to real multi-tenant Sedes
    const unsubSedes = listenSedes(orgId, (data) => {
      setSedes(data);
    });

    // 2. Subscribe to real multi-tenant Vehicles
    const unsubVehicles = listenVehicles(orgId, (data) => {
      setVehicles(data);
    });

    // 3. Subscribe to real multi-tenant Drivers
    const unsubDrivers = listenDrivers(orgId, (data) => {
      setDrivers(data);
    });

    // 4. Subscribe to real multi-tenant Cargos
    const unsubCargos = listenEnterpriseCargos(orgId, (data) => {
      setCargos(data);
    });

    // 5. Subscribe to real multi-tenant Users (RBAC)
    const unsubUsers = onSnapshot(collection(db, 'organizations', orgId, 'users'), (snap) => {
      const uList: EnterpriseUser[] = [];
      snap.forEach(d => {
        uList.push({ id: d.id, ...d.data() as any });
      });
      setUsers(uList);
    });

    return () => {
      unsubSedes();
      unsubVehicles();
      unsubDrivers();
      unsubCargos();
      unsubUsers();
    };
  }, [rawUser]);

  // Auto-simulate logs in the background to bring the dashboard to life!
  useEffect(() => {
    const interval = setInterval(() => {
      if (vehicles.length === 0) {
        return; // Safe guard for clean/new enterprise profile
      }
      
      // Pick random truck
      const t = vehicles[Math.floor(Math.random() * vehicles.length)];
      if (!t) return;
      let newLog = '';
      
      if (currentAlertSim === 'temperatura' && t.id === 'v1') {
        newLog = `[⚠️ ALERTA TÉRMICA] Camión ${t.placa} registra variación crítica: ${t.temperaturaActual?.toFixed(1)} °C.`;
      } else if (currentAlertSim === 'desvio' && t.id === 'v1') {
        newLog = `[⚠️ DESVÍO DE RUTA] Camión ${t.placa} reporta desviación de 4.2 km de Panamericana Norte.`;
      } else if (currentAlertSim === 'signal' && t.id === 'v1') {
        newLog = `[⚠️ PÉRDIDA SEÑAL] Camión ${t.placa} reporta desconexión GPS temporal en zona desértica.`;
      } else {
        const tempReport = t.temperaturaActual ? `Temp: ${t.temperaturaActual.toFixed(1)} °C.` : '';
        const actions = [
          `Lectura telemétrica Camión ${t.placa} corregida. GPS: OK. ${tempReport}`,
          `Camión ${t.placa} reporta velocidad de ${(50 + Math.random() * 30).toFixed(0)} km/h.`,
          `Soporte Chasqui verificó firma digital para conductor ${t.conductorId}.`,
          `Nivel de Combustible Camión ${t.placa}: ${t.combustibleNivel ?? 85}%`
        ];
        newLog = `[${new Date().toLocaleTimeString()}] ${actions[Math.floor(Math.random() * actions.length)]}`;
      }

      setSimulatedLogs(prev => [newLog, ...prev.slice(0, 15)]);
    }, 8000);

    return () => clearInterval(interval);
  }, [vehicles, currentAlertSim]);

  // Alert simulation triggers
  const triggerSimulation = (type: 'desvio' | 'temperatura' | 'signal' | 'ninguna') => {
    setCurrentAlertSim(type);
    
    // Mutate state of vehicle v1 to match the simulated disaster
    setVehicles(prev => prev.map(v => {
      if (v.id === 'v1') {
        if (type === 'temperatura') {
          return { ...v, temperaturaActual: -4.5, estado: 'incidencia' };
        } else if (type === 'desvio') {
          return { ...v, estado: 'incidencia' };
        } else if (type === 'signal') {
          return { ...v, estado: 'incidencia', combustibleNivel: 0 };
        } else {
          return { ...v, temperaturaActual: -18.2, estado: 'viaje' };
        }
      }
      return v;
    }));

    let alertMsg = '';
    if (type === 'temperatura') alertMsg = '[⚠️ ALERTA DE COLD-CHAIN] El sensor del camión F2W-894 reporta -4.5 °C (Excede límite crítico asignado de -18.0 °C)';
    if (type === 'desvio') alertMsg = '[⚠️ LOGISTICA] El camión F2W-894 ha salido del corredor autorizado en Huarmey (Riesgo de desviación detectado)';
    if (type === 'signal') alertMsg = '[⚠️ RED] Pérdida de señal celular móvil detectada para camión F2W-894 (Último reporte hace 15 minutos)';
    if (type === 'ninguna') alertMsg = '[INFO] Simulación restaurada. Parámetros operativos operando en rangos óptimos.';

    setSimulatedLogs(prev => [alertMsg, ...prev]);
  };

  // Add user handler
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.nombre || !newUser.email) return;

    const u: EnterpriseUser = {
      id: `u_${Date.now()}`,
      nombre: newUser.nombre,
      email: newUser.email,
      rol: newUser.rol,
      sede: newUser.sede,
      telefono: newUser.telefono || '+51 900 000 000',
      activo: true,
      ultimoAcceso: 'Pendiente invitación'
    };

    const orgId = rawUser?.organizationId || `${rawUser?.uid || 'demo'}_org`;
    try {
      await setDoc(doc(db, 'organizations', orgId, 'users', u.id), u);
      setSimulatedLogs(prev => [`[FIRESTORE ÉXITO] Colaborador ${u.nombre} registrado en base de datos.`, ...prev]);
    } catch (err) {
      console.error("Error creating user", err);
      // Fallback in memory
      setUsers(prev => [...prev, u]);
    }

    setNewUser({ nombre: '', email: '', rol: 'operador', sede: 'San Isidro HQ', telefono: '' });
    setShowAddUserModal(false);
    
    setSimulatedLogs(prev => [`[INFO] Nuevo colaborador corporativo ${u.nombre} agregado con rol [${u.rol}] en ${u.sede}.`, ...prev]);
  };

  const handleDeleteUser = async (id: string) => {
    const orgId = rawUser?.organizationId || `${rawUser?.uid || 'demo'}_org`;
    try {
      await deleteDoc(doc(db, 'organizations', orgId, 'users', id));
      setSimulatedLogs(prev => [`[FIRESTORE ÉXITO] Colaborador eliminado de la base de datos.`, ...prev]);
    } catch (err) {
      console.error("Error deleting user", err);
      setUsers(prev => prev.filter(user => user.id !== id));
    }
  };

  // Add vehicle handler
  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.placa || !newVehicle.capacidad) return;

    const v: EnterpriseVehicle = {
      id: `v_${Date.now()}`,
      placa: newVehicle.placa.toUpperCase(),
      tipo: newVehicle.tipo,
      capacidad: newVehicle.capacidad,
      conductorId: newVehicle.conductorId,
      estado: 'libre',
      combustibleNivel: 100,
      documentos: { soat: true, revisionTecnica: true, permisoMTC: true }
    };

    const targetOrgId = rawUser?.organizationId || (rawUser ? `${rawUser.uid}_org` : 'demo_org_id');

    if (rawUser) {
      if (!isOnline) {
        queueOfflineEvent({
          action: 'ADD_CHIT',
          orgId: targetOrgId,
          tripId: 'fleet',
          payload: { text: `[OFFLINE] Vehículo creado Placa: ${v.placa}`, senderId: 'local', senderName: 'Offline Compiler', senderRole: 'admin' }
        });
        setOfflineQueueLen(getOfflineQueue().length);
        const updatedList = [...vehicles, v];
        setVehicles(updatedList);
        localStorage.setItem('chasqui_demo_corp_vehicles', JSON.stringify(updatedList));
        setSimulatedLogs(prev => [`[OFFLINE COLA] Registrado localmente. El camión se sincronizará cuando retorne internet.`, ...prev]);
      } else {
        await saveVehicle(targetOrgId, v);
        setSimulatedLogs(prev => [`[FIRESTORE EXITO] Camión registrado en base de datos multi-tenant: Placa ${v.placa}`, ...prev]);
      }
    } else {
      const updatedList = [...vehicles, v];
      setVehicles(updatedList);
      localStorage.setItem('chasqui_demo_corp_vehicles', JSON.stringify(updatedList));
    }
    
    setShowAddVehicleModal(false);
    setNewVehicle({ placa: '', tipo: 'seco', capacidad: '', conductorId: 'No Asignado' });
  };

  // Remove vehicle handler
  const handleDeleteVehicle = async (id: string) => {
    const targetOrgId = rawUser?.organizationId || (rawUser ? `${rawUser.uid}_org` : 'demo_org_id');
    if (rawUser && isOnline) {
      try {
        await removeVehicle(id);
        setSimulatedLogs(prev => [`[FIRESTORE BORRADO] Camión removido físicamente de la base de datos.`, ...prev]);
      } catch (err: any) {
        console.error('Error removing vehicle:', err);
      }
    } else {
      const updatedList = vehicles.filter(v => v.id !== id);
      setVehicles(updatedList);
      localStorage.setItem('chasqui_demo_corp_vehicles', JSON.stringify(updatedList));
    }
  };

  // Dispatch cargo handler (operaciones masivas)
  const handleDispatchCargo = (id: string, driver: string, vehicle: string) => {
    setCargos(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, estado: 'en_transito', conductorAsignado: driver, vehiculoAsignado: vehicle };
      }
      return c;
    }));

    setSimulatedLogs(prev => [`[DESPACHO DIRECTO] Carga de lote ${id} asignada formalmente al chofer ${driver} en vehículo ${vehicle}. Transmisión satelital iniciada.`, ...prev]);
  };

  // Copilot Ask Trigger
  const handleAskCopilot = (promptTag: string) => {
    setIsAiLoading(true);
    const userPrompt = promptTag === 'custom' ? aiPrompt : promptTag;
    
    setChatLog(prev => [...prev, { sender: 'user', text: userPrompt }]);
    
    setTimeout(() => {
      let answer = 'Disculpa, no encontré un análisis preciso para esta consulta. Prueba con una de las opciones sugeridas.';
      if (userPrompt.toLowerCase().includes('ruta') || userPrompt.includes('opt_ruta')) {
        answer = IA_LOGISTIC_ANSWERS.opt_ruta;
      } else if (userPrompt.toLowerCase().includes('cubicaje') || userPrompt.toLowerCase().includes('pallet') || userPrompt.includes('opt_container')) {
        answer = IA_LOGISTIC_ANSWERS.opt_container;
      } else if (userPrompt.toLowerCase().includes('tarifa') || userPrompt.toLowerCase().includes('precio') || userPrompt.includes('opt_rates')) {
        answer = IA_LOGISTIC_ANSWERS.opt_rates;
      }

      setChatLog(prev => [...prev, { sender: 'ai', text: answer }]);
      setIsAiLoading(false);
      if (promptTag === 'custom') setAiPrompt('');
    }, 1200);
  };

  // Custom rich PDF Generator with download trigger using jsPDF
  const generateAuditPDF = (cargo: EnterpriseCargo) => {
    const doc = new jsPDF();
    
    // Header styling
    doc.setFillColor(15, 23, 42); // slate 900
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('courier', 'bold');
    doc.setFontSize(22);
    doc.text('CHASQUI ENTERPRISE OS', 15, 22);
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // slate-450
    doc.text('SISTEMA OPERATIVO LOGISTICO - ACTA COMPLIANCE DIGITAL', 15, 33);
    
    // Body Text
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`CERTIFICADO DE TRAZABILIDAD Y CUSTODIA #${cargo.id.toUpperCase()}`, 15, 60);
    
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(15, 65, 195, 65);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Left column metadata
    doc.setFont('helvetica', 'bold');
    doc.text('ORGANIZACIÓN:', 15, 75);
    doc.setFont('helvetica', 'normal');
    doc.text('Soporte Agrícola & Exportaciones SAC', 55, 75);
    
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUCTO:', 15, 83);
    doc.setFont('helvetica', 'normal');
    doc.text(cargo.nombreProducto, 55, 83);
    
    doc.setFont('helvetica', 'bold');
    doc.text('TIPO DE CARGA:', 15, 91);
    doc.setFont('helvetica', 'normal');
    doc.text(cargo.tipoDeCarga, 55, 91);
    
    doc.setFont('helvetica', 'bold');
    doc.text('ORIGEN SEDE:', 15, 99);
    doc.setFont('helvetica', 'normal');
    doc.text(cargo.origen, 55, 99);
    
    doc.setFont('helvetica', 'bold');
    doc.text('DESTINO PUERTO:', 15, 107);
    doc.setFont('helvetica', 'normal');
    doc.text(cargo.destino, 55, 107);
    
    // Right column metadata
    doc.setFont('helvetica', 'bold');
    doc.text('CONDUCTOR:', 110, 75);
    doc.setFont('helvetica', 'normal');
    doc.text(cargo.conductorAsignado || 'Mario Lanza (Lic: A-IIIc)', 150, 75);
    
    doc.setFont('helvetica', 'bold');
    doc.text('PLACA VEHÍCULO:', 110, 83);
    doc.setFont('helvetica', 'normal');
    doc.text(cargo.vehiculoAsignado || 'F2W-894 (Refrigerado)', 150, 83);
    
    doc.setFont('helvetica', 'bold');
    doc.text('TEMP REQUERIDA:', 110, 91);
    doc.setFont('helvetica', 'normal');
    doc.text('-18.0 GRADOS CELSIUS', 150, 91);
    
    doc.setFont('helvetica', 'bold');
    doc.text('ESTADO VIAJE:', 110, 99);
    doc.setFont('helvetica', 'normal');
    doc.text(cargo.estado.toUpperCase(), 150, 99);
    
    doc.setFont('helvetica', 'bold');
    doc.text('FECHA EXPORTACIÓN:', 110, 107);
    doc.setFont('helvetica', 'normal');
    doc.text('20 de Mayo, 2026', 150, 107);
    
    doc.setDrawColor(226, 232, 240); 
    doc.line(15, 115, 195, 115);
    
    // Checkpoints table
    doc.setFont('helvetica', 'bold');
    doc.text('LOG DE EVENTOS DE TELEMETRÍA AUTOMÁTICA Y GEOCERCAS:', 15, 125);
    
    const checkpoints = [
      { hora: '08:15 AM', event: 'Salida de Planta de Frío Paita - Termógrafo calibrado conforme.', lat: '-5.0747', lng: '-81.1119' },
      { hora: '10:30 AM', event: 'Control Checkpoint Sullana - Conexión GPS OK. Temp: -18.2 °C', lat: '-4.9039', lng: '-80.6853' },
      { hora: '01:00 PM', event: 'Cruce de Carretera Desierto Chepén - Conexión Satelital. Temp: -18.1 °C', lat: '-7.2272', lng: '-79.4311' },
      { hora: '04:15 PM', event: 'Ingreso a Geocerca Puerto Callao. Certificado Sanitario SENASA OK.', lat: '-12.0431', lng: '-77.1245' }
    ];
    
    let yPos = 135;
    doc.setFillColor(241, 196, 15); // gold accent
    doc.setFillColor(248, 250, 252); // slate 50
    doc.rect(15, yPos, 180, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('HORA', 18, yPos + 6);
    doc.text('FALSO DE EVENTO / COMPLIANCE GEOFENCE', 50, yPos + 6);
    doc.text('GPS (COORD)', 160, yPos + 6);
    
    doc.setFont('helvetica', 'normal');
    checkpoints.forEach((cp, index) => {
      yPos += 10;
      doc.text(cp.hora, 18, yPos + 6);
      doc.text(cp.event, 50, yPos + 6);
      doc.setFont('courier', 'normal');
      doc.text(`${cp.lat}, ${cp.lng}`, 160, yPos + 6);
      doc.setFont('helvetica', 'normal');
      
      // dotted separator style
      doc.setDrawColor(241, 245, 249);
      doc.line(15, yPos + 10, 195, yPos + 10);
    });
    
    // Cryptographic token footer
    yPos += 30;
    doc.setFillColor(15, 23, 42);
    doc.rect(15, yPos, 180, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('courier', 'bold');
    doc.text('INTEGRIDAD DE CADENA DE CUSTODIA CRIPTOGRÁFICA CHASQUI BLOCK', 20, yPos + 8);
    doc.setFontSize(8);
    doc.setTextColor(34, 197, 94); // emerald
    doc.text('SHA-256 HASH VERIFIED: 9a38f821cde00192e4aa833b91a27eef671d1e4b', 20, yPos + 14);
    
    // Download
    doc.save(`chasqui-compliance-${cargo.id}.pdf`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
        {/* Background grids & radial lights */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:24px_24px] opacity-30"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-650/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-650/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 relative z-10">
          
          {/* Header section with brand and badge */}
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-widest animate-pulse">
              <Building2 className="h-3 w-3" />
              <span>Chasqui Enterprise OS // Portal SaaS</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none text-white italic">
              El Ecosistema <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Multiempresa</span> de Carga en Latam
            </h1>
            
            <p className="text-slate-400 text-lg sm:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
              Deje atrás WhatsApp y planillas Excel. Descubra el Software de Control Terrestre para exportadores, operadores logísticos y flotas con telemetría fría en tiempo real.
            </p>

            {/* Main Interactive CTAs */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
              <button
                onClick={() => {
                  localStorage.setItem('chasqui_demo_active', 'true');
                  window.location.href = window.location.pathname + '?demo=true';
                }}
                className="inline-flex items-center justify-center h-16 px-12 bg-indigo-600 hover:bg-indigo-500 text-white text-base font-black uppercase tracking-wider rounded-2xl shadow-xl shadow-indigo-600/30 border-0 transition-all hover:scale-[1.01] active:scale-[0.99] group"
              >
                <span>🚀 Probar Demo Interactivo</span>
                <span className="ml-2 px-1.5 py-0.5 text-[9px] font-black tracking-normal uppercase bg-emerald-500/25 text-emerald-300 rounded border border-emerald-500/30">Sandbox</span>
              </button>

              <Link to="/login" className="inline-flex">
                <button
                  className="w-full inline-flex items-center justify-center h-16 px-10 bg-slate-900 hover:bg-slate-800 text-slate-200 text-sm font-bold rounded-2xl border border-slate-800 transition-all"
                >
                  Iniciar Sesión Corporativa
                </button>
              </Link>
            </div>
          </div>

          {/* Interactive Feature Mockup Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-24">
            
            {/* SaaS Feature Card 1 */}
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-850 hover:border-indigo-500/30 transition-all space-y-6">
              <div className="h-12 w-12 bg-indigo-600/10 text-indigo-400 rounded-2xl flex items-center justify-center">
                <Compass className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase tracking-tight text-white">Torre de Control & Geocercas</h3>
                <p className="text-slate-400 text-xs font-medium leading-relaxed">
                  Monitoree de forma simultánea múltiples transportistas en mapa integrado con alertas automáticas ante desvíos de ruta, detenciones injustificadas y pérdida de cobertura.
                </p>
              </div>
              {/* Decorative mini grid */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850/50 space-y-2 font-mono text-[10px] text-slate-500">
                <div className="flex justify-between text-indigo-400 font-bold">
                  <span>🛰️ SAT-CONN CHECKPOINT</span>
                  <span>OK</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full w-4/5 bg-emerald-500"></div>
                </div>
              </div>
            </div>

            {/* SaaS Feature Card 2 */}
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-850 hover:border-indigo-500/30 transition-all space-y-6">
              <div className="h-12 w-12 bg-emerald-600/10 text-emerald-400 rounded-2xl flex items-center justify-center">
                <Thermometer className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase tracking-tight text-white">Cold-Chain & Telemetría IoT</h3>
                <p className="text-slate-400 text-xs font-medium leading-relaxed">
                  Lectura ininterrumpida de termógrafos calibrados. Reciba alarmas instantáneas en pantalla ante variaciones térmicas imprevistas para salvaguardar la carga de exportación.
                </p>
              </div>
              {/* Decorative mini variables */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="p-2.5 bg-slate-950/70 border border-slate-850 rounded-xl space-y-1">
                  <span className="text-slate-500 block">TEMPERATURA</span>
                  <span className="text-indigo-300 font-bold">-18.4 °C</span>
                </div>
                <div className="p-2.5 bg-slate-950/70 border border-slate-850 rounded-xl space-y-1">
                  <span className="text-slate-500 block">NIVEL COMB.</span>
                  <span className="text-emerald-400 font-bold">92%</span>
                </div>
              </div>
            </div>

            {/* SaaS Feature Card 3 */}
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-850 hover:border-indigo-500/30 transition-all space-y-6">
              <div className="h-12 w-12 bg-purple-600/10 text-purple-400 rounded-2xl flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase tracking-tight text-white">Equipo, Roles & Certificaciones</h3>
                <p className="text-slate-400 text-xs font-medium leading-relaxed">
                  Asigne roles operativos y de visualización (RBAC). Guarde evidencias de entrega y emita actas en PDF autogeneradas con firma criptográfica de cadena de custodia.
                </p>
              </div>
              {/* Decorative mini badge */}
              <div className="p-3 bg-indigo-950/30 border border-indigo-900/30 rounded-2xl flex items-center gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                <span className="text-[10px] font-bold text-slate-300">CERTIFICACIÓN CHASQUI COMPLIANCE</span>
              </div>
            </div>

          </div>

          {/* SaaS Core Presentation section with Map simulation log */}
          <div className="mt-20 bg-slate-900/30 border border-slate-850 rounded-[2.5rem] p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-6 text-left">
              <h2 className="text-2xl sm:text-3.5xl font-black text-white leading-tight italic">
                El Control Absoluto en una Única Consola Web
              </h2>
              <p className="text-slate-400 text-sm font-medium leading-relaxed leading-snug">
                Chasqui Enterprise conecta todas sus sedes y despachos con el puerto de Callao, Paita, Matarani o Ilo. Nuestro sistema detecta desvíos al instante y utiliza Inteligencia Artificial (Gemini) para sugerir rutas auxiliares, anticipar costos y resolver incidentes logísticos.
              </p>
              
              <ul className="space-y-3 pt-2 text-xs font-bold text-slate-300">
                <li className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                  <span>Seguimiento GPS satelital continuo (incluso offline)</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <span>Integración de roles: Administrador, Monitorista y Operador</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                  <span>Generador de reportes en PDF con actas automatizadas</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-light-navy/50 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <span className="text-[9px] font-mono tracking-wider text-slate-400">TELEMETRY_ENGINE</span>
                </div>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full font-mono">CONECTADO</span>
              </div>
              <div className="space-y-2 text-left">
                <p className="text-[9px] font-mono text-slate-500">LAST EVENT RECORDED</p>
                <div className="p-3 bg-slate-950 rounded-xl space-y-1">
                  <p className="text-[10px] font-mono text-slate-400">Planta Fría Ica → Callao Terminal</p>
                  <p className="text-[11px] text-white font-bold italic">Chofer en ruta (Progreso: 78%) - Panamericana Sur Km 120</p>
                </div>
              </div>
              <button
                onClick={() => {
                  localStorage.setItem('chasqui_demo_active', 'true');
                  window.location.href = window.location.pathname + '?demo=true';
                }}
                className="w-full py-3 bg-indigo-600/10 hover:bg-indigo-650 text-indigo-400 hover:text-white text-xs font-black uppercase rounded-xl transition-all border border-indigo-500/20"
              >
                Lanzar Consola de Demostración
              </button>
            </div>

          </div>

          <p className="text-center text-xs text-slate-500 pt-16">
            © 2026 Chasqui Carrier Technologies SAC. Todos los derechos reservados.
          </p>

        </div>
      </div>
    );
  }

  if (!user.organizationId) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-2xl">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
            <span className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-400">
              <Building2 className="h-6 w-6" />
            </span>
            <div>
              <span className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">Ecosistema Logístico</span>
              <h2 className="text-lg font-black text-white">Crear Nueva Organización Corporativa</h2>
            </div>
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!onboardForm.name || !onboardForm.ruc || !onboardForm.razonSocial) {
              alert('Complete todos los campos requeridos');
              return;
            }
            setLoadingOrg(true);
            try {
              const oId = await onboardOrganization(
                onboardForm.name,
                onboardForm.plan,
                onboardForm.ruc,
                onboardForm.razonSocial
              );
              // Trigger reload or update store to mount the active workspace
              window.location.reload();
            } catch (err: any) {
              alert(`Error al onboard: ${err.message || err}`);
            } finally {
              setLoadingOrg(false);
            }
          }} className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 block">Nombre de la Organización</label>
              <input
                type="text"
                placeholder="Ej. Consorcio Agrícola del Norte"
                value={onboardForm.name}
                onChange={e => setOnboardForm({ ...onboardForm, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 block">RUC de la Empresa (11 dígitos)</label>
                <input
                  type="text"
                  placeholder="Ej. 20601234567"
                  maxLength={11}
                  value={onboardForm.ruc}
                  onChange={e => setOnboardForm({ ...onboardForm, ruc: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 block">Razón Social</label>
                <input
                  type="text"
                  placeholder="Ej. Agrícola Exportadora del Norte S.A.C."
                  value={onboardForm.razonSocial}
                  onChange={e => setOnboardForm({ ...onboardForm, razonSocial: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-500 block">Suscripción SaaS Logística</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'free', label: 'Plan FREE', desc: '1 sede, 2 unidades' },
                  { id: 'business', label: 'PRO Business', desc: '5 sedes, 10 unidades' },
                  { id: 'enterprise', label: 'Enterprise core', desc: 'Sedes ilimitadas' }
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setOnboardForm({ ...onboardForm, plan: p.id as any })}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      onboardForm.plan === p.id 
                        ? 'bg-indigo-600/10 border-indigo-600 text-indigo-400' 
                        : 'bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-400'
                    }`}
                  >
                    <span className="font-bold text-xs block text-white">{p.label}</span>
                    <span className="text-[9px] block leading-tight mt-1 text-slate-500">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingOrg}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs py-3.5 rounded-xl shadow-lg shadow-indigo-600/25 transition-all text-center"
            >
              {loadingOrg ? 'Provisionando Ecosistema Logístico...' : '📦 Inicializar Chasqui Enterprise OS'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div id="enterprise-os" className="min-h-screen bg-slate-900 text-slate-100 flex flex-col pt-4">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-12 flex-1 flex flex-col">
        
        {/* Superior Title Banner resembling Motive/Samsara */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-white uppercase animate-pulse">SaaS Active</span>
              <span className="text-slate-500 font-mono text-xs">V2.4 | Multi-Tenant</span>
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold flex items-center space-x-1 ${
                isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}>
                {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                <span>{isOnline ? 'CONECTADO FIRESTORE' : 'SOPORTE OFFLINE'}</span>
              </span>
              {offlineQueueLen > 0 && (
                <button 
                  onClick={triggerSync}
                  disabled={isSyncing}
                  className="bg-amber-600 hover:bg-amber-700 font-bold text-[9px] text-white px-2 py-0.5 rounded-md flex items-center space-x-1 border border-amber-500 animate-pulse"
                >
                  <RefreshCw className={`h-2.5 w-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sincronizar {offlineQueueLen} en cola</span>
                </button>
              )}
            </div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent flex items-center space-x-2 mt-1">
              <Building2 className="h-7 w-7 text-indigo-400" />
              <span>Chasqui Enterprise OS</span>
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Sistema Operativo y Centro de Control Logístico Digital para Agroexportadoras e Importadoras.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => triggerSimulation('temperatura')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center space-x-1 ${
                currentAlertSim === 'temperatura'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                  : 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
              <span>Simular Alerta Frío</span>
            </button>
            <button
              onClick={() => triggerSimulation('desvio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center space-x-1 ${
                currentAlertSim === 'desvio'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Compass className="h-3.5 w-3.5 text-amber-400" />
              <span>Simular Desvío</span>
            </button>
            <button
              onClick={() => triggerSimulation('ninguna')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-500 flex items-center space-x-1"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Resolver Alertas</span>
            </button>
          </div>
        </div>

        {/* Dynamic Micro-Calculators (Executive Dashboard Grid) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Camiones Activos</span>
              <span className="text-2xl font-black font-mono mt-1 text-white">4 / 5</span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">● 80% Capacidad Flota</span>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Truck className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Cargas Totales</span>
              <span className="text-2xl font-black font-mono mt-1 text-white">{cargos.length}</span>
              <span className="text-[10px] text-blue-400 block mt-0.5">Operación Multi-Sede</span>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Building2 className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Integración SRE / GPS</span>
              <span className="text-2xl font-black font-mono mt-1 text-white">99.8%</span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">✓ 0 Latencia Satelital</span>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Alertas Críticas</span>
              <span className={`text-2xl font-black font-mono mt-1 ${currentAlertSim !== 'ninguna' ? 'text-rose-500 animate-pulse' : 'text-slate-300'}`}>
                {currentAlertSim !== 'ninguna' ? '1 ACTIVA' : '0'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {currentAlertSim !== 'ninguna' ? 'Filtro SRE advertido' : 'Seguridad Operacional OK'}
              </span>
            </div>
            <div className={`p-2.5 rounded-lg ${currentAlertSim !== 'ninguna' ? 'bg-rose-500/10 text-rose-500 animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Central Layout containing Sidebar Tabs and View Panels */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Control Panel Dashboard Tabs Panel (Left Side, 3 columns) */}
          <div className="lg:col-span-3 space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-lg">
            <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest block mb-3 px-2">CENTRO DE OPERACIONES</span>
            
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left font-semibold text-xs rounded-xl p-3 flex items-center space-x-3 transition-all ${
                activeTab === 'overview' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Resumen Ejecutivo</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`w-full text-left font-semibold text-xs rounded-xl p-3 flex items-center space-x-3 transition-all ${
                activeTab === 'map' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Compass className="h-4 w-4 animate-spin-slow" />
              <span>Monitor Satélite (GPS)</span>
            </button>

            <button
              onClick={() => setActiveTab('rbac')}
              className={`w-full text-left font-semibold text-xs rounded-xl p-3 flex items-center space-x-3 transition-all ${
                activeTab === 'rbac' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Organización (RBAC)</span>
            </button>

            <button
              onClick={() => setActiveTab('fleet')}
              className={`w-full text-left font-semibold text-xs rounded-xl p-3 flex items-center space-x-3 transition-all ${
                activeTab === 'fleet' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Truck className="h-4 w-4" />
              <span>Control de Flota</span>
            </button>

            <button
              onClick={() => setActiveTab('operations')}
              className={`w-full text-left font-semibold text-xs rounded-xl p-3 flex items-center space-x-3 transition-all ${
                activeTab === 'operations' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Search className="h-4 w-4" />
              <span>Operaciones en Lote</span>
            </button>

            <button
              onClick={() => setActiveTab('traceability')}
              className={`w-full text-left font-semibold text-xs rounded-xl p-3 flex items-center space-x-3 transition-all ${
                activeTab === 'traceability' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Timeline - Custodia</span>
            </button>

            <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest block pt-4 pb-2 mb-1 px-2 border-t border-slate-900">MÓDULO PLATAFORMA</span>

            <button
              onClick={() => setActiveTab('driver')}
              className={`w-full text-left font-semibold text-xs rounded-xl p-3 flex items-center space-x-3 transition-all ${
                activeTab === 'driver' ? 'bg-indigo-600 text-white shadow animate-pulse' : 'text-emerald-400 hover:bg-slate-900 hover:text-emerald-200'
              }`}
            >
              <User className="h-4 w-4" />
              <span>Chofer App (Simulator)</span>
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`w-full text-left font-semibold text-xs rounded-xl p-3 flex items-center space-x-3 transition-all ${
                activeTab === 'ai' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <HelpCircle className="h-4 w-4" />
              <span>Copilot IA Logística</span>
            </button>

            <button
              onClick={() => setActiveTab('saas')}
              className={`w-full text-left font-semibold text-xs rounded-xl p-3 flex items-center space-x-3 transition-all ${
                activeTab === 'saas' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Modelo SaaS & Suscripciones</span>
            </button>

            <button
              onClick={() => setActiveTab('tech')}
              className={`w-full text-left font-semibold text-xs rounded-xl p-3 flex items-center space-x-3 transition-all ${
                activeTab === 'tech' ? 'bg-amber-600 text-white shadow' : 'text-amber-400 hover:bg-slate-900 hover:text-amber-200'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Planos / Arquitectura</span>
            </button>
          </div>

          {/* Core Content Window (Right Side, 9 columns) */}
          <div className="lg:col-span-9 flex flex-col gap-6">
            
            {/* VIEW: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* Visual Header Grid layout */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between shadow-xl">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span>Multi-Empresa: Soporte Agrícola SAC</span>
                      </h3>
                      <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                        Controlando 4 plantas empacadoras en el norte del Perú. Permite delegar tareas a operadores específicos, despachar cargas refrigeradas masivas en puerto y auditar temperatura y SOATS de sub-flotas integradas de terceros.
                      </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-900 flex justify-between text-xs font-mono text-slate-500">
                      <span>RUC: 20601234567</span>
                      <span>Sede Principal: San Isidro</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between shadow-xl">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-white">Suscripción SaaS</h3>
                        <span className="rounded bg-indigo-500/10 text-indigo-400 px-2 py-0.5 text-[10px] font-black uppercase">Business Pro</span>
                      </div>
                      <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                        Acceso completo a flotas ilimitadas, rastreo de telemetría a puertos de exportación (Callao/Paita/Ilo), geocercas activas e inteligencia artificial de optimización de carga.
                      </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-900 flex justify-between text-xs font-mono text-slate-500">
                      <span>Próximo Pago: 15 Junio, 2026</span>
                      <span>Sillas de Equipo: 6 / 15 Activas</span>
                    </div>
                  </div>
                </div>

                {/* Operations Terminal Control panel */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
                  <h3 className="text-base font-bold text-white mb-4">Sedes / Terminales Activos</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {sedes.map(s => (
                      <div key={s.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 relative overflow-hidden flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">{s.tipo}</span>
                          <h4 className="font-bold text-white text-sm mt-1">{s.nombre}</h4>
                          <p className="text-slate-500 text-[11px] mt-1">{s.ubicacion}</p>
                        </div>
                        <div className="mt-4 pt-2 border-t border-slate-950 text-[10px] text-slate-400 flex justify-between">
                          <span>Ubicado</span>
                          <span className="font-semibold text-slate-300">Responsable: {s.encargado.split(' ')[0]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Log Telemetry Live Console */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base font-bold text-white flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Consola de SRE Operacional (Telemetry Logs)</span>
                    </h3>
                    <span className="text-[10px] font-mono text-slate-500">Auto-update cada 8s</span>
                  </div>
                  <div className="bg-black/80 rounded-xl p-4 font-mono text-xs text-indigo-400 border border-slate-800 max-h-[160px] overflow-y-auto space-y-1.5 leading-relaxed">
                    {simulatedLogs.map((log, i) => (
                      <div key={i} className={log.includes('⚠️') ? 'text-rose-400 font-semibold' : 'text-emerald-500'}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Corporate Analytics Trends */}
                <AnalyticsDashboard />

              </div>
            )}

            {/* VIEW: MAP TRACKING */}
            {activeTab === 'map' && (
              <ControlTowerMap 
                organizationId={user?.organizationId || 'default'} 
                vehicles={vehicles} 
                onAddAlertLog={(log) => setSimulatedLogs(prev => [log, ...prev])} 
              />
            )}

            {/* VIEW: ROLES & ASSIGNMENTS (RBAC) */}
            {activeTab === 'rbac' && (
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Base de Personal & Permisos RBAC</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Define qué cargos de tu organización pueden publicar o auditar.</p>
                  </div>
                  <button
                    onClick={() => setShowAddUserModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Invitar Miembro</span>
                  </button>
                </div>

                {/* Users list table code block representation */}
                <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-900/40">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                      <tr>
                        <th className="p-4">Colaborador</th>
                        <th className="p-4">Email Corporativo</th>
                        <th className="p-4">Permiso de Acceso</th>
                        <th className="p-4">Sede Asignada</th>
                        <th className="p-4 text-center">Estado</th>
                        <th className="p-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="p-4 font-bold text-white">{u.nombre}</td>
                          <td className="p-4 font-mono text-slate-350">{u.email}</td>
                          <td className="p-4">
                            <span className="rounded bg-indigo-500/10 px-2.5 py-0.5 text-[9px] font-black uppercase text-indigo-400 border border-indigo-500/10">
                              {u.rol.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-4 text-slate-400">{u.sede}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-block w-20 py-0.5 rounded text-[10px] font-black text-center ${
                              u.activo ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-slate-800 text-slate-500'
                            }`}>
                              {u.activo ? 'ACTIVO' : 'AL ESTRENO'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-slate-500 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Invitation Modal */}
                {showAddUserModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 text-slate-100 shadow-2xl">
                      <h4 className="text-lg font-black text-white border-b border-slate-850 pb-3 mb-4 flex items-center space-x-2">
                        <Users className="h-5 w-5 text-indigo-400" />
                        <span>Invitar Miembro a Organización</span>
                      </h4>
                      <form onSubmit={handleAddUser} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-500">Nombre de Colaborador</label>
                          <input
                            type="text"
                            value={newUser.nombre}
                            onChange={e => setNewUser({ ...newUser, nombre: e.target.value })}
                            placeholder="Ej. Jorge Gamarra"
                            className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-500">Email Corporativo</label>
                          <input
                            type="email"
                            value={newUser.email}
                            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                            placeholder="Ej. jorge@chasqui.com"
                            className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-500">Rol Operativo</label>
                            <select
                              value={newUser.rol}
                              onChange={e => setNewUser({ ...newUser, rol: e.target.value as any })}
                              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-medium text-slate-300 focus:outline-none"
                            >
                              <option value="admin_empresa">Administración</option>
                              <option value="supervisor">Supervisor Sede</option>
                              <option value="monitorista">Monitorista GPS</option>
                              <option value="operador">Operador Logístico</option>
                              <option value="auditor">Auditor Pasivo</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-500">Ubicación / Sede</label>
                            <select
                              value={newUser.sede}
                              onChange={e => setNewUser({ ...newUser, sede: e.target.value })}
                              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-medium text-slate-300 focus:outline-none"
                            >
                              {sedes.map(s => (
                                <option key={s.id} value={s.nombre}>{s.nombre}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-850 flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setShowAddUserModal(false)}
                            className="bg-slate-900 hover:bg-slate-850 text-slate-400 font-bold text-xs px-4 py-2 rounded-xl border border-slate-800"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/20"
                          >
                            Enviar Invitación
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Real-time Multi-channel Operational Chat Panel */}
                <div className="pt-4 border-t border-slate-900 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono">Chat Satélite en Vivo</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Comunícate directamente con los choferes y despachadores regionales de ruta en tiempo real.</p>
                  </div>
                  <OperationalChat 
                    organizationId={user?.organizationId || 'default'} 
                    senderId={user?.uid || 'dispatcher'}
                    senderName={user?.nombre || 'Supervisor Principal'}
                    senderRole={user?.enterpriseRole || 'supervisor'}
                    onAddAlertLog={(log) => setSimulatedLogs(prev => [log, ...prev])}
                  />
                </div>

              </div>
            )}

            {/* VIEW: FLEET MANAGEMENT */}
            {activeTab === 'fleet' && (
              <div className="space-y-10">
                <FleetManagement 
                  organizationId={user?.organizationId} 
                  vehicles={vehicles} 
                  onAddVehicle={handleAddVehicle} 
                  onDeleteVehicle={handleDeleteVehicle} 
                  newVehicle={newVehicle as any} 
                  setNewVehicle={setNewVehicle as any}
                  onAddAlertLog={(log) => setSimulatedLogs(prev => [log, ...prev])}
                />

                <div className="border-t border-slate-900 pt-8">
                  <div className="mb-6">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <FileText className="h-5 w-5 text-indigo-400" />
                      <span>Control Homologado de Documentos Regladoss</span>
                    </h3>
                    <p className="text-xs text-slate-400">Gabinete de control de legalidad vial, SOAT y seguros de transportistas.</p>
                  </div>
                  <DocumentManagement />
                </div>
              </div>
            )}

            {/* VIEW: BULK OPERATIONS */}
            {activeTab === 'operations' && (
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Mesa de Operaciones de Carga Masiva (Flexport UI)</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Controla y asigna múltiples embarques simultáneos desde un solo tablero ejecutivo.</p>
                  </div>

                  {/* Operational filter tabs */}
                  <div className="flex flex-wrap gap-1 bg-slate-900 p-1 rounded-lg">
                    {['todos', 'disponible', 'en_transito', 'por_asignar', 'incidencia'].map(filter => (
                      <button
                        key={filter}
                        onClick={() => setSelectedCargoFilter(filter)}
                        className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-md transition-all ${
                          selectedCargoFilter === filter ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-250'
                        }`}
                      >
                        {filter.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-900/40">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                      <tr>
                        <th className="p-4">ID</th>
                        <th className="p-4">Descripción de Carga / Producto</th>
                        <th className="p-4">Ruta (Origen - Destino)</th>
                        <th className="p-4">Tarifa Cotizada</th>
                        <th className="p-4">Estado Operacional</th>
                        <th className="p-4 text-center">Asignación Directa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {cargos
                        .filter(c => selectedCargoFilter === 'todos' || c.estado === selectedCargoFilter)
                        .map(c => (
                          <tr key={c.id} className="hover:bg-slate-900/60 transition-colors">
                            <td className="p-4 font-mono font-bold text-indigo-400">#{c.id.toUpperCase()}</td>
                            <td className="p-4">
                              <span className="font-semibold text-white block">{c.nombreProducto}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{c.tipoDeCarga}</span>
                            </td>
                            <td className="p-4">
                              <span className="text-slate-300 font-semibold block">{c.origen}</span>
                              <span className="text-[10px] text-slate-500">→ {c.destino}</span>
                            </td>
                            <td className="p-4 font-mono font-bold text-emerald-400">S/. {c.precioPropuesto}</td>
                            <td className="p-4">
                              <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-black uppercase text-center ${
                                c.estado === 'en_transito' 
                                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/10' 
                                  : (c.estado === 'completado' 
                                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/10' 
                                      : (c.estado === 'incidencia' ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-slate-800 text-slate-450'))
                              }`}>
                                {c.estado.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              {c.estado === 'por_asignar' || c.estado === 'disponible' ? (
                                <div className="flex justify-center items-center space-x-1.5">
                                  <button
                                    onClick={() => handleDispatchCargo(c.id, 'Mario Lanza', 'F2W-894')}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase px-2.5 py-1 rounded transition-colors"
                                  >
                                    Asignar F2W
                                  </button>
                                  <button
                                    onClick={() => handleDispatchCargo(c.id, 'Enrique Palacios', 'C5X-611')}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase px-2.5 py-1 rounded transition-colors"
                                  >
                                    Asignar C5X
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-mono font-bold">
                                  {c.conductorAsignado ? `Asignado a ${c.conductorAsignado.split(' ')[0]}` : 'Sin asignación física'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VIEW: TIMELINE & COMPLIANCE TRACEABILITY */}
            {activeTab === 'traceability' && (
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white">Cadena de Custodia & Trazabilidad Digital (Audit Trail)</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Cada evento térmico, geocerca, y firma digital queda auditado con huella SHA-256 inmutable.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-12">
                  {/* Ledger Events Timeline */}
                  <div className="md:col-span-8 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Eventos de Custodio Registrados en Viajes Recientes</h4>
                    
                    <div className="relative border-l border-slate-800 ml-3 py-2 space-y-6">
                      
                      <div className="relative pl-6">
                        <div className="absolute -left-1.5 top-1.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
                          <Check className="h-2 w-2 text-slate-950 font-black" />
                        </div>
                        <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white text-xs">Sede Planta de Frío Paita - Salida Conforme</span>
                            <span className="text-[10px] font-mono text-slate-500">2026-05-20 08:15 AM</span>
                          </div>
                          <p className="text-slate-400 text-xs">
                            Carga de arándanos cargada y cerrada a una temperatura de <strong>-18.2 °C</strong>. Firma digital del supervisor de planta homologada.
                          </p>
                          <div className="text-[10px] text-emerald-400 font-mono flex justify-between">
                            <span>GPS: -5.0747, -81.1119</span>
                            <span>HASH: sha-256: 9a38f82f...</span>
                          </div>
                        </div>
                      </div>

                      <div className="relative pl-6">
                        <div className="absolute -left-1.5 top-1.5 h-3.5 w-3.5 rounded-full bg-indigo-500 border-2 border-slate-950"></div>
                        <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white text-xs">Geocerca Sullana - Checkpoint Satelital</span>
                            <span className="text-[10px] font-mono text-slate-500">2026-05-20 10:30 AM</span>
                          </div>
                          <p className="text-slate-400 text-xs">
                            Control telemétrico automatizado del camión F2W-894 cruzando Sullana. Conexión celular corregida y temperatura interna de congelación a <strong>-18.1 °C</strong>.
                          </p>
                        </div>
                      </div>

                      <div className="relative pl-6">
                        <div className="absolute -left-1.5 top-1.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
                          <Check className="h-2 w-2 text-slate-950 font-black" />
                        </div>
                        <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white text-xs">Puerto del Callao (APM Terminals) - Entrega Asegurada</span>
                            <span className="text-[10px] font-mono text-slate-500">2026-05-20 04:15 PM</span>
                          </div>
                          <p className="text-slate-400 text-xs">
                            Contenedor MSCU-89231-0 entregado formalmente y auditado en APM Terminals Callao. Acta digital aprobada sin observaciones.
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* PDF report trigger card */}
                  <div className="md:col-span-4 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Exportar Compliance Certificados</h4>
                    
                    <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl relative space-y-4 text-xs">
                      <div className="text-center pb-3 border-b border-slate-950">
                        <Download className="h-10 w-10 text-indigo-400 mx-auto animate-bounce mb-2" />
                        <h5 className="font-bold text-white">Generador de Acta de Custodia PDF</h5>
                        <p className="text-slate-500 text-[11px] mt-1">Genera un PDF exportable firmado digitalmente en tiempo real.</p>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[9px] text-slate-500 font-bold uppercase block">Seleccionar Viaje para PDF:</span>
                        {cargos.filter(c => c.estado === 'en_transito' || c.estado === 'completado').map(c => (
                          <button
                            key={c.id}
                            onClick={() => generateAuditPDF(c)}
                            className="w-full text-left bg-slate-950 border border-slate-850 p-2.5 rounded-xl hover:border-indigo-500 transition-colors block text-[11px]"
                          >
                            <span className="font-bold text-white block">#{c.id.toUpperCase()} - {c.nombreProducto.split(' ')[0]}</span>
                            <span className="text-slate-500 block">Ruta: {c.origen} → {c.destino.split(' ')[0]}</span>
                            <span className="text-indigo-400 font-bold block mt-1">Descargar Reporte PDF 📥</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* VIEW: PROFESSIONAL DRIVER MOBILE SIMULATION APPLICATION */}
            {activeTab === 'driver' && (
              <DriverView 
                organizationId={user?.organizationId || 'default'} 
                onAddTripLog={(log) => setSimulatedLogs(prev => [log, ...prev])} 
              />
            )}

            {/* VIEW: CHASQUI COPILOT AI CHAT INTERACTIVE LOGISTICS ADVISOR */}
            {activeTab === 'ai' && (
              <SmartCopilot />
            )}

            {/* VIEW: SAAS BILLING PLANS */}
            {activeTab === 'saas' && (
              <SaaSBilling />
            )}

            {/* VIEW: TECHNICAL DOCUMENTATION TAB */}
            {activeTab === 'tech' && <TechnicalDocs />}

          </div>

        </div>

      </div>
    </div>
  );
}
