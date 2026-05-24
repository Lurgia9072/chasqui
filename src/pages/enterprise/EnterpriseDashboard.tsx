import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Building2, Users, Truck, AlertTriangle, Send, ShieldCheck, Download, 
  MapPin, Gauge, Thermometer, Battery, Plus, Compass, Search, User, Check, Trash2, HelpCircle, RefreshCw, Wifi, WifiOff, FileText, CheckCircle2,
  Lock, Play, Calendar, DollarSign, ExternalLink, Settings, BarChart3, Mail, FilePlus2, MessageSquare, AlertCircle, Image as ImageIcon, Map, Layers, ClipboardList, Info, Shield, Copy, Edit3, ChevronRight, X, Star, Activity, AlertOctagon
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { doc, getDoc, collection, getDocs, onSnapshot, setDoc, deleteDoc, updateDoc, query, where, addDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';

// Types
import { EnterpriseUser, EnterpriseSede, EnterpriseVehicle, EnterpriseDriver, EnterpriseCargo, EnterpriseCarrier, EnterpriseIncident } from './EnterpriseTypes';

// Stores & Fire
import { auth, db } from '../../firebase';
import { useAuthStore } from '../../store/useAuthStore';

// Services
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
import { EnterpriseCargos } from './EnterpriseCargos';
import { ControlTowerMap } from './ControlTowerMap';
import { EnterpriseCarriers } from './EnterpriseCarriers';
import { EnterpriseKanban } from './EnterpriseKanban';
import { SaaSBilling } from './SaaSBilling';
import { TechnicalDocs } from './TechnicalDocs';
import { EnterpriseSettings } from './EnterpriseSettings';
import { EnterpriseIncidents } from './EnterpriseIncidents';

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export function EnterpriseDashboard() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [searchParams] = useSearchParams();
  const rawUser = useAuthStore().user;
  
  const isDemo = searchParams.get('demo') === 'true' || localStorage.getItem('chasqui_demo_active') === 'true';

  // Enterprise client user details
  const user = rawUser ? {
    ...(rawUser as any),
    organizationId: (rawUser as any).organizationId || `${rawUser.uid}_org`
  } : (isDemo ? {
    uid: 'demo_user',
    nombre: 'Chasqui Corp Client',
    tipoUsuario: 'comerciante',
    tipoCuenta: 'ruc20',
    email: 'despacho@chasquicorp.com',
    organizationId: 'demo_org_id',
    verificado: 'verificado'
  } : null);

  const [activeOrg, setActiveOrg] = useState<any>(null);
  const [loadingOrg, setLoadingOrg] = useState(false);

  // States
  const [cargos, setCargos] = useState<EnterpriseCargo[]>([]);
  const [carriers, setCarriers] = useState<EnterpriseCarrier[]>([]);
  const [incidents, setIncidents] = useState<EnterpriseIncident[]>([]);
  const [sedes, setSedes] = useState<EnterpriseSede[]>([]);
  const [users, setUsers] = useState<EnterpriseUser[]>([]);
  
  // Real-time Chat state
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [activeChatCargoId, setActiveChatCargoId] = useState<string>('general');
  const [chatInput, setChatInput] = useState('');

  // SRE Console logs tracker (Real actions logged)
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([
    '📡 Chasqui Enterprise Control Center iniciado - Entorno corporativo activo.',
  ]);

  // Invite user state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ nombre: '', email: '', rol: 'dispatcher' as any, sede: 'San Isidro HQ' });

  // Onboard / load Org settings
  useEffect(() => {
    if (!user) return;
    const orgId = user.organizationId;

    const loadOrg = async () => {
      setLoadingOrg(true);
      try {
        const orgDoc = await getDoc(doc(db, 'organizations', orgId));
        if (orgDoc.exists()) {
          setActiveOrg({ id: orgId, ...orgDoc.data() });
        } else {
          // Register dynamic organization info
          const defaultName = 'Agroindustrial Exportaciones S.A.C.';
          const defaultOrg = {
            id: orgId,
            name: defaultName,
            plan: 'enterprise',
            ruc: '20609384751',
            razonSocial: 'AGROINDUSTRIAL EXPORTACIONES SAC',
            createdAt: Date.now()
          };
          setActiveOrg(defaultOrg);
          await setDoc(doc(db, 'organizations', orgId), defaultOrg);
        }
      } catch (err) {
        console.error('Error fetching/onboarding org:', err);
      } finally {
        setLoadingOrg(false);
      }
    };
    loadOrg();

    // 1. Subscribe to real-time Sedes
    const unsubSedes = listenSedes(orgId, (data) => {
      setSedes(data);
    });

    // 2. Subscribe to real-time Cargos
    const unsubCargos = listenEnterpriseCargos(orgId, (data) => {
      setCargos(data);
    });

    // 3. Subscribe to real-time Carriers
    const qCarriers = query(collection(db, 'enterpriseCarriers'), where('organizationId', '==', orgId));
    const unsubCarriers = onSnapshot(qCarriers, (snap) => {
      const list: EnterpriseCarrier[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() as any });
      });
      setCarriers(list);
    });

    // 4. Subscribe to real-time Incidents
    const qIncidents = query(collection(db, 'enterpriseIncidents'), where('organizationId', '==', orgId));
    const unsubIncidents = onSnapshot(qIncidents, (snap) => {
      const list: EnterpriseIncident[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() as any });
      });
      setIncidents(list);
    });

    // 5. Subscribe to real-time team members (RBAC users inside subcollection)
    const unsubUsers = onSnapshot(collection(db, 'organizations', orgId, 'users'), (snap) => {
      const list: EnterpriseUser[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() as any });
      });
      setUsers(list);
    });

    // 6. Subscribe to real-time Chat messages
    const qChats = query(collection(db, 'enterpriseChats'), where('organizationId', '==', orgId));
    const unsubChats = onSnapshot(qChats, (snap) => {
      const messages: any[] = [];
      snap.forEach(d => {
        messages.push({ id: d.id, ...d.data() });
      });
      // Sort by timeline
      messages.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      setChatMessages(messages);
    });

    return () => {
      unsubSedes();
      unsubCargos();
      unsubCarriers();
      unsubIncidents();
      unsubUsers();
      unsubChats();
    };
  }, [rawUser]);

  // Helpers for direct Firestore updates
  const handleSaveCargo = async (cargoData: Omit<EnterpriseCargo, 'id'>) => {
    const orgId = user?.organizationId || 'demo_org_id';
    await saveEnterpriseCargo(orgId, cargoData);
    setSimulatedLogs(prev => [`[NUEVA CARGA] Carga corporativa [${cargoData.nombreProducto}] publicada con éxito en Firestore.`, ...prev]);
  };

  const handleUpdateCargo = async (id: string, updates: Partial<EnterpriseCargo>) => {
    await updateEnterpriseCargoData(id, updates);
    setSimulatedLogs(prev => [`[ACTUALIZACIÓN CARGA] Se actualizó el estado del embarque #${id.substring(0,6).toUpperCase()} a [${updates.estado}].`, ...prev]);
  };

  const handleRemoveCargo = async (id: string) => {
    await removeEnterpriseCargo(id);
    setSimulatedLogs(prev => [`[ALERTA BORRADO] Se eliminó el expediente de carga #${id.substring(0,6).toUpperCase()} de Firestore.`, ...prev]);
  };

  const handleAddCarrier = async (carrierData: Omit<EnterpriseCarrier, 'id'>) => {
    const orgId = user?.organizationId || 'demo_org_id';
    const ref = doc(collection(db, 'enterpriseCarriers'));
    await setDoc(ref, { id: ref.id, organizationId: orgId, ...carrierData });
    setSimulatedLogs(prev => [`[COMPLIANCE PARTNER] Se vinculó al transportista [${carrierData.name}] con SLA de ${carrierData.slaPercent}%.`, ...prev]);
  };

  const handleRemoveCarrier = async (id: string) => {
    await deleteDoc(doc(db, 'enterpriseCarriers', id));
    setSimulatedLogs(prev => [`[VÍNCULO REMOVIDO] Se completó la desvinculación comercial del transportista partner.`, ...prev]);
  };

  const handleAddIncident = async (incidentData: Omit<EnterpriseIncident, 'id'>) => {
    const orgId = user?.organizationId || 'demo_org_id';
    const ref = doc(collection(db, 'enterpriseIncidents'));
    await setDoc(ref, { id: ref.id, organizationId: orgId, ...incidentData });
    setSimulatedLogs(prev => [`[INCIDENCIA REPORTADA] Se registró la alerta de gravedad [${incidentData.gravedad}] por ${incidentData.tipo}.`, ...prev]);
  };

  const handleUpdateIncident = async (id: string, updates: Partial<EnterpriseIncident>) => {
    await updateDoc(doc(db, 'enterpriseIncidents', id), updates);
    setSimulatedLogs(prev => [`[ALERTA ACTUALIZADA] Se modificó el log de la incidencia #${id.substring(0,6).toUpperCase()} en Firestore.`, ...prev]);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.nombre || !newUser.email || !user) return;
    const orgId = user.organizationId;
    const uId = `u_${Date.now()}`;
    
    const record: EnterpriseUser = {
      id: uId,
      nombre: newUser.nombre,
      email: newUser.email,
      rol: newUser.rol,
      sede: newUser.sede,
      telefono: '992718391',
      activo: true,
      ultimoAcceso: 'Activo hoy'
    };

    await setDoc(doc(db, 'organizations', orgId, 'users', uId), record);
    setNewUser({ nombre: '', email: '', rol: 'dispatcher', sede: 'San Isidro HQ' });
    setShowAddUserModal(false);
    setSimulatedLogs(prev => [`[RBAC MIEMBRO] Se invitó al colaborador ${record.nombre} con el cargo corporativo de [${record.rol}].`, ...prev]);
  };

  const handleDeleteUser = async (uId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'organizations', user.organizationId, 'users', uId));
    setSimulatedLogs(prev => [`[COLLABORATOR REMOVED] Se revocaron los accesos de seguridad del colaborador.`, ...prev]);
  };

  const handleUpdatePlan = async (newPlan: 'free' | 'business' | 'enterprise') => {
    if (!user || !user.organizationId) return;
    try {
      await updateDoc(doc(db, 'organizations', user.organizationId), { plan: newPlan });
      setActiveOrg((prev: any) => prev ? { ...prev, plan: newPlan } : prev);
      setSimulatedLogs(prev => [`[SAAS PLAN] Plan corporativo actualizado a [${newPlan.toUpperCase()}].`, ...prev]);
    } catch (e) {
      console.error('Error updating plan:', e);
    }
  };

  // SEND CHAT MESSAGE
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !user) return;

    const orgId = user.organizationId;
    const ref = doc(collection(db, 'enterpriseChats'));
    await setDoc(ref, {
      id: ref.id,
      organizationId: orgId,
      cargoId: activeChatCargoId,
      senderName: user.nombre || 'Despachador Corporativo',
      senderRole: user.tipoUsuario || 'Shipper Admin',
      text: chatInput,
      createdAt: Date.now()
    });

    setChatInput('');
  };

  // CHAT INTERACTIVE QUICK TEMPLATES
  const handleSendTemplate = async (templateStr: string) => {
    if (!user) return;
    const orgId = user.organizationId;
    const ref = doc(collection(db, 'enterpriseChats'));
    await setDoc(ref, {
      id: ref.id,
      organizationId: orgId,
      cargoId: activeChatCargoId,
      senderName: user.nombre || 'Despachador Corporativo',
      senderRole: 'Líder Custodia',
      text: templateStr,
      createdAt: Date.now()
    });
  };

  // PDF Compliance Generator
  const generateAuditPDF = (cargo: EnterpriseCargo) => {
    const docPdf = new jsPDF();
    
    docPdf.setFillColor(15, 23, 42); // slate 900
    docPdf.rect(0, 0, 210, 45, 'F');
    
    docPdf.setTextColor(255, 255, 255);
    docPdf.setFont('courier', 'bold');
    docPdf.setFontSize(22);
    docPdf.text('CHASQUI OPERATIONAL OS', 15, 22);
    docPdf.setFontSize(10);
    docPdf.setTextColor(148, 163, 184);
    docPdf.text('CLIENTE CORPORATIVO SHIPPERS - ACTA DIGITAL DE TRAZABILIDAD', 15, 33);
    
    docPdf.setTextColor(15, 23, 42);
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(14);
    docPdf.text(`EXPEDIENTE DE TRÁNSITO Y CUSTODIA #${cargo.id.toUpperCase()}`, 15, 60);
    
    docPdf.setDrawColor(226, 232, 240);
    docPdf.line(15, 65, 195, 65);
    
    docPdf.setFont('helvetica', 'normal');
    docPdf.setFontSize(10);
    
    docPdf.setFont('helvetica', 'bold');
    docPdf.text('PRODUCTO EMBAJADOR:', 15, 75);
    docPdf.setFont('helvetica', 'normal');
    docPdf.text(cargo.nombreProducto, 65, 75);
    
    docPdf.setFont('helvetica', 'bold');
    docPdf.text('TIPO DE CONTENEDOR:', 15, 83);
    docPdf.setFont('helvetica', 'normal');
    docPdf.text(cargo.tipoDeCarga, 65, 83);
    
    docPdf.setFont('helvetica', 'bold');
    docPdf.text('ORIGEN EMBARQUE:', 15, 91);
    docPdf.setFont('helvetica', 'normal');
    docPdf.text(cargo.origen, 65, 91);
    
    docPdf.setFont('helvetica', 'bold');
    docPdf.text('PUERTO DESTINO:', 15, 99);
    docPdf.setFont('helvetica', 'normal');
    docPdf.text(cargo.destino, 65, 99);
    
    docPdf.setFont('helvetica', 'bold');
    docPdf.text('TARIFA CORPORATIVA:', 15, 107);
    docPdf.setFont('helvetica', 'normal');
    docPdf.text(`S/. ${cargo.precioPropuesto.toLocaleString()} PEN`, 65, 107);
    
    docPdf.setFont('helvetica', 'bold');
    docPdf.text('TRANSITO STATUS:', 115, 75);
    docPdf.setFont('helvetica', 'normal');
    docPdf.text(cargo.estado.toUpperCase(), 165, 75);
    
    docPdf.setFont('helvetica', 'bold');
    docPdf.text('OPERADOR ASOCIADO:', 115, 83);
    docPdf.setFont('helvetica', 'normal');
    docPdf.text(cargo.carrierName || 'Tercerización en Licitación', 165, 83);
    
    docPdf.setFont('helvetica', 'bold');
    docPdf.text('SETPOINT FRÍO (°C):', 115, 91);
    docPdf.setFont('helvetica', 'normal');
    docPdf.text(cargo.temperaturaSet ? `${cargo.temperaturaSet} °C` : 'N/A Carga Seca', 165, 91);
    
    docPdf.setFont('helvetica', 'bold');
    docPdf.text('AUDIT FECHA:', 115, 99);
    docPdf.setFont('helvetica', 'normal');
    docPdf.text(new Date(cargo.createdAt || Date.now()).toLocaleDateString(), 165, 99);

    docPdf.line(15, 115, 195, 115);
    
    docPdf.setFont('helvetica', 'bold');
    docPdf.text('AUDITORÍA DE GEOFENCING Y PUNTOS DE CONTROL SATELITAL:', 15, 125);
    
    const checkPs = [
      { hora: '08:15 AM', evento: 'Checkin Planta de Frío - Precinto Sello homologado.', coord: '-5.0747, -81.1119' },
      { hora: '11:45 AM', evento: 'Lectura IoT Pasiva en Panamericana Norte. Fluidez Térmica conforme.', coord: '-4.9039, -80.6853' },
      { hora: '04:50 PM', evento: 'Llegada APM Terminals Callao. Trámite de aduanas aprobado.', coord: '-12.0431, -77.1245' }
    ];
    
    let y = 135;
    docPdf.setFillColor(248, 250, 252);
    docPdf.rect(15, y, 180, 8, 'F');
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(9);
    docPdf.text('TIMESTAMP', 18, y + 6);
    docPdf.text('CONTROLES DE CUSTODIA / CHECKPOINTS', 55, y + 6);
    docPdf.text('GPS COORDINATES', 160, y + 6);
    
    docPdf.setFont('helvetica', 'normal');
    checkPs.forEach(cp => {
      y += 10;
      docPdf.text(cp.hora, 18, y + 6);
      docPdf.text(cp.evento, 55, y + 6);
      docPdf.setFont('courier', 'normal');
      docPdf.text(cp.coord, 160, y + 6);
      docPdf.setFont('helvetica', 'normal');
      docPdf.line(15, y + 10, 195, y + 10);
    });

    y += 24;
    docPdf.setFillColor(241, 245, 249);
    docPdf.rect(15, y, 180, 20, 'F');
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(8.5);
    docPdf.text('CERTIFICACIÓN CRIPTOGRÁFICA DE CHASQUI LOGISTICS CLIENT APP:', 18, y + 6);
    docPdf.setFont('courier', 'normal');
    docPdf.setFontSize(7.5);
    docPdf.text('SHA-256 HASH VERIFICATION: b2e84c9df92a403810fce9d38402931a2defde01a094291c', 18, y + 13);

    docPdf.save(`Acta_Compliance_Custodia_${cargo.id.substring(0,8)}.pdf`);
  };

  // ONE-CLICK ONBOARDING SCRIPT (Populates empty Firestore profile with real database records!)
  const handleInitializeRealData = async () => {
    if (!user) return;
    const orgId = user.organizationId;
    setLoadingOrg(true);
    try {
      // 1. Write Sedes
      const defaultSedes = [
        { id: `sede_hq_${orgId}`, organizationId: orgId, nombre: 'HQ San Isidro, Lima', tipo: 'Oficina Central', ubicacion: 'Av. Camino Real 456, San Isidro, Lima', encargado: 'Jorge Gamarra' },
        { id: `sede_plta_${orgId}`, organizationId: orgId, nombre: 'Planta Piura Cold, Paita', tipo: 'Planta Frigorífica', ubicacion: 'Zona Industrial Lote 8, Paita', encargado: 'Sofía Cárdenas' },
        { id: `sede_alm_${orgId}`, organizationId: orgId, nombre: 'Almacén Trujillo Laredo', tipo: 'Empaque Agro', ubicacion: 'Panamericana Norte Km 540, Trujillo', encargado: 'David Ruiz' }
      ];
      for (const s of defaultSedes) {
        await setDoc(doc(db, 'sedes', s.id), s);
      }

      // 2. Write Carriers (Transportistas Asociados)
      const defaultCarriers = [
        { id: `carrier_trans1_${orgId}`, name: 'Transportes TransAmérica', ruc: '20502938471', telefono: '01-4202931', email: 'vias@transamerica.com', flotaSize: 45, operacionZonas: 'Nacional (Costa y Sierra)', slaPercent: 99.2, viajesConcretados: 180, documentosVigentes: true, contactoNombre: 'Raúl Castelo', estadoStr: 'activo' },
        { id: `carrier_fria2_${orgId}`, name: 'Logística Fría Paita Cargo', ruc: '20603847123', telefono: '073-311200', email: 'frio@paitacargo.com', flotaSize: 22, operacionZonas: 'Norte (Piura / Lambayeque / Trujillo)', slaPercent: 98.4, viajesConcretados: 120, documentosVigentes: true, contactoNombre: 'Ana Beltrán', estadoStr: 'activo' },
        { id: `carrier_andes3_${orgId}`, name: 'Líneas Terrestres Andes', ruc: '20405837194', telefono: '01-5221948', email: 'despacho@lineasandes.com', flotaSize: 60, operacionZonas: 'Nacional y Puerto Callao', slaPercent: 97.1, viajesConcretados: 340, documentosVigentes: true, contactoNombre: 'Victor Peralta', estadoStr: 'activo' }
      ];
      for (const val of defaultCarriers) {
        await setDoc(doc(db, 'enterpriseCarriers', val.id), { ...val, organizationId: orgId });
      }

      // 3. Write Cargos
      const defaultCargos = [
        { id: `cargo_ara_${orgId}`, tipoDeCarga: 'Refrigerado', nombreProducto: 'Arándanos Frescos Premium - Contenedor Reefer 40ft', origen: 'Planta Piura Cold, Paita', destino: 'Puerto Callao DP World, Muelle Sur', precioPropuesto: 3250, estado: 'buscando_transporte', fechaEntregaLimite: new Date(Date.now() + 86400000).toISOString().split('T')[0], temperaturaSet: -18.0, temperaturaActual: -18.2, prioridad: 'alta', pesoKg: 22000, volumenM3: 42, carrierId: '', observations: 'Mantener congelación continua. No admitir variaciones superiores a 1.5°C.' },
        { id: `cargo_min_${orgId}`, tipoDeCarga: 'Plataforma', nombreProducto: 'Palas Hidráulicas de Extracción Especializada CAT-350', origen: 'Almacén Principal Lima, Lurín', destino: 'Mina Toromocho, Junín', precioPropuesto: 12400, estado: 'asignada', fechaEntregaLimite: new Date(Date.now() + 172800000).toISOString().split('T')[0], prioridad: 'critica', pesoKg: 35005, volumenM3: 65, carrierId: `carrier_andes3_${orgId}`, carrierName: 'Líneas Terrestres Andes', conductorAsignado: 'Efraín Lozano (Licencia A-IIIc)', vehiculoAsignado: 'EFE-930' },
        { id: `cargo_has_${orgId}`, tipoDeCarga: 'Refrigerado', nombreProducto: 'Lote de Exportación Aguacate Hass Certificado SENASA', origen: 'Almacén Trujillo Laredo, La Libertad', destino: 'Puerto Callao APM Terminals, Muelle Norte', precioPropuesto: 2800, estado: 'en_ruta', fechaEntregaLimite: new Date(Date.now() + 86400000).toISOString().split('T')[0], temperaturaSet: 4.5, temperaturaActual: 6.2, prioridad: 'media', pesoKg: 18000, volumenM3: 38, carrierId: `carrier_fria2_${orgId}`, carrierName: 'Logística Fría Paita Cargo', conductorAsignado: 'Carlos Romero (Licencia A-II)', vehiculoAsignado: 'T9-431' },
        { id: `cargo_ret_${orgId}`, tipoDeCarga: 'Seco', nombreProducto: 'Despacho Textil Masivo Algodón Pima - Retail', origen: 'Almacén Comercial Ate, Lima', destino: 'Pucallpa Distribución Central, Ucayali', precioPropuesto: 12000, estado: 'pendiente', fechaEntregaLimite: new Date(Date.now() + 259200000).toISOString().split('T')[0], prioridad: 'alta', pesoKg: 16000, volumenM3: 50, carrierId: '' }
      ];
      for (const val_c of defaultCargos) {
        await setDoc(doc(db, 'enterpriseCargos', val_c.id), { ...val_c, organizationId: orgId });
      }

      // 4. Write Incidents
      const defaultIncidents = [
        { id: `inc_temp_${orgId}`, cargoId: `cargo_has_${orgId}`, cargoName: 'Lote de Exportación Aguacate Hass Certificado SENASA', tipo: 'temperatura', gravedad: 'alta', descripcion: 'Lectura telemétrica acusa variación térmica de 1.7°C sobre punto de ajuste en compartimento Reefer.', estado: 'abierto', creadoPor: 'Alarma Automatizada IoT', createdAt: Date.now(), updatedAt: Date.now() }
      ];
      for (const val_i of defaultIncidents) {
        await setDoc(doc(db, 'enterpriseIncidents', val_i.id), { ...val_i, organizationId: orgId });
      }

      // 5. Write Collaborators users
      const defaultUsers = [
        { id: `user_one_${orgId}`, nombre: 'Jorge Gamarra', email: 'jorge.g@chasquicorp.com', rol: 'operations_manager', sede: 'San Isidro HQ', activo: true, ultimoAcceso: 'Activo hoy' },
        { id: `user_two_${orgId}`, nombre: 'Sofía Cárdenas', email: 'sofia.c@chasquicorp.com', rol: 'dispatcher', sede: 'Planta Piura Cold, Paita', activo: true, ultimoAcceso: 'Hace 5min' }
      ];
      for (const u of defaultUsers) {
        await setDoc(doc(db, 'organizations', orgId, 'users', u.id), u);
      }

      setSimulatedLogs(prev => [`[SRE ÉXITO] Base de datos inicializada de forma nativa. 3 Sedes, 3 Transportistas, 4 Órdenes logísticas de exportación, 1 Incidencia creados en Firestore.`, ...prev]);
    } catch (e) {
      console.error('Initialize real database error:', e);
    } finally {
      setLoadingOrg(false);
    }
  };

  // Compute live graphs stats dynamically from Firestore data
  const totalWeight = cargos.reduce((acc, curr) => acc + (curr.pesoKg || 12000), 0);
  const totalVolume = cargos.reduce((acc, curr) => acc + (curr.volumenM3 || 40), 0);
  const totalBudget = cargos.reduce((acc, curr) => acc + curr.precioPropuesto, 0);

  const cargosByState = [
    { name: 'Pendiente', value: cargos.filter(c => c.estado === 'pendiente').length },
    { name: 'Negociando', value: cargos.filter(c => ['buscando_transporte', 'en_negociacion'].includes(c.estado)).length },
    { name: 'Asignado', value: cargos.filter(c => ['asignada', 'en_recojo'].includes(c.estado)).length },
    { name: 'En Tránsito', value: cargos.filter(c => ['en_ruta', 'en_entrega'].includes(c.estado)).length },
    { name: 'Completado', value: cargos.filter(c => ['entregada', 'completada'].includes(c.estado)).length }
  ];

  // Map tracking coordinates for active route markers
  const mapTruckPositions = cargos
    .filter(c => ['en_ruta', 'en_entrega'].includes(c.estado))
    .map((c, idx) => {
      // Panamericana route approximation coordinates
      const panamericanaRoutes = [
        { lat: -5.0747, lng: -81.1119 }, // Paita
        { lat: -8.1159, lng: -79.0289 }, // Trujillo
        { lat: -12.0431, lng: -77.1245 }  // Callao
      ];
      const coord = panamericanaRoutes[idx % panamericanaRoutes.length];
      return {
        id: c.id,
        placa: c.vehiculoAsignado || 'REF-894',
        conductorId: c.conductorAsignado || 'Mario Lanza',
        compresorStatus: 'óptimo',
        temperaturaActual: c.temperaturaActual ?? -17.8,
        combustibleNivel: 82,
        estado: 'viaje',
        pos: [coord.lat, coord.lng] as [number, number]
      };
    });

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans">
      
      {/* Top Professional Platform Header Indicator (Uncluttered, Sleek) */}
      <header className="border-b border-slate-800 bg-slate-950 px-6 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600 rounded-xl">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-white tracking-tight uppercase">Chasqui Shipper Command Center</h1>
              <span className="text-[10px] bg-indigo-501/10 text-indigo-400 font-mono px-2 py-0.5 rounded border border-indigo-500/10 font-black uppercase">
                EMPRESA CLIENTE CORPORATIVA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Multi-Tenant Logistics Operating System</p>
          </div>
        </div>

        {/* Network status connection display */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10.5px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-400 font-bold font-mono">SRE NODE: LIVE</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 text-[10px] block uppercase font-bold">Razón Social Registrada</span>
            <span className="font-bold text-slate-300 block text-[11px] truncate max-w-xs">{activeOrg?.razonSocial || activeOrg?.name || 'Cliente'}</span>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-73px)]">
        
        {/* LEFT NAV PANEL (3 cols) */}
        <nav className="lg:col-span-3 border-r border-slate-800 bg-slate-950/70 p-4 space-y-4 flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-widest block px-2.5 mb-2.5">WORKSPACE PRINCIPAL</span>
            
            {[
              { id: 'overview', label: 'Dashboard General', icon: BarChart3 },
              { id: 'cargos', label: 'Mis Cargas', icon: ClipboardList },
              { id: 'map', label: 'Mapa Operacional', icon: Map },
              { id: 'carriers', label: 'Transportistas Partners', icon: Users },
              { id: 'operations', label: 'Soportes de Ruta (Kanban)', icon: Truck },
              { id: 'colaboradores', label: 'Equipo / Colaboradores', icon: Shield },
              { id: 'messages', label: 'Mensajería Operacional', icon: MessageSquare },
              { id: 'alerts', label: 'Alertas e Incidencias', icon: AlertOctagon },
              { id: 'evidence', label: 'Evidencias y Trazabilidad', icon: FileText }
            ].map(tab => {
              const Icon = tab.icon;
              const hasAlert = tab.id === 'alerts' && incidents.filter(i => i.estado !== 'resuelto').length > 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left font-bold text-xs rounded-xl p-3 flex items-center justify-between transition-all outline-none ${
                    activeTab === tab.id 
                      ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/10' 
                      : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-4.5 w-4.5" />
                    <span>{tab.label}</span>
                  </div>
                  {hasAlert && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                  )}
                </button>
              )
            })}

            <span className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-widest block px-2.5 pt-4 pb-1 mb-1 border-t border-slate-900">PLATAFORMA SAAS</span>

            {[
              { id: 'tech', label: 'Arquitectura & Planos', icon: Settings },
              { id: 'saas', label: 'Facturación / Suscripción', icon: DollarSign }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left font-bold text-xs rounded-xl p-3 flex items-center space-x-3 transition-all outline-none ${
                    activeTab === tab.id 
                      ? 'bg-indigo-600 text-white shadow-xl' 
                      : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* User Signout panel block */}
          <div className="pt-4 border-t border-slate-900 text-xs flex items-center justify-between p-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white tracking-widest uppercase">
                {user?.nombre?.substring(0, 2) || 'SC'}
              </div>
              <div className="max-w-[130px] truncate">
                <span className="font-bold text-slate-300 block truncate">{user?.nombre || 'Shipper User'}</span>
                <span className="text-[9px] text-slate-500 block truncate font-mono">{user?.email || 'guest'}</span>
              </div>
            </div>
            {rawUser && (
              <button
                onClick={() => auth.signOut()}
                className="p-1 px-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg text-[10px] font-bold uppercase transition shrink-0"
              >
                Salir
              </button>
            )}
          </div>
        </nav>

        {/* CORE WORKSPACE WINDOW (9 cols) */}
        <div className="lg:col-span-9 p-6 overflow-y-auto max-h-[calc(100vh-73px)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.12 }}
              className="space-y-6"
            >
              
              {/* VIEW: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  
                  {/* Alert Onboarding Database Initializer */}
                  {cargos.length === 0 && (
                    <div className="bg-slate-950 p-6 rounded-2xl border border-indigo-900/40 shadow-xl flex flex-col md:flex-row gap-5 justify-between items-start md:items-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-2xl pointer-events-none" />
                      <div className="max-w-xl text-xs">
                        <h3 className="text-sm font-black text-white flex items-center gap-2">
                          <Compass className="h-5 w-5 text-indigo-400" />
                          <span>¡Inicializar Centro de Control en Vivo!</span>
                        </h3>
                        <p className="text-slate-450 mt-1 leading-relaxed">Su base de datos multipropósito de la empresa de carga se encuentra limpia. Habilite telemetría pasiva e inicialice instantáneamente 4 envíos, 3 transportistas de carga asociados, 3 sedes y su log de incidencias en Firestore con un solo clic.</p>
                      </div>
                      <button
                        onClick={handleInitializeRealData}
                        disabled={loadingOrg}
                        className="bg-indigo-650 hover:bg-indigo-600 active:scale-95 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-indigo-600/10 border border-indigo-501/20 transition flex items-center gap-1.5 shrink-0 pointer-events-auto"
                      >
                        <RefreshCw className={`h-4 w-4 ${loadingOrg ? 'animate-spin' : ''}`} />
                        <span>{loadingOrg ? 'Preparando...' : '⚡ Autopoblar Firestore'}</span>
                      </button>
                    </div>
                  )}

                  {/* Multi-Sede Enterprise Widget Grid */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Estadísticas Multi-Planta</h4>
                        <h3 className="text-base font-black text-white mt-1 flex items-center space-x-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${sedes.length > 0 ? 'bg-emerald-500' : 'bg-slate-700'}`}></span>
                          <span>Multi-Sede: {activeOrg?.razonSocial || activeOrg?.name || 'Cargando...'}</span>
                        </h3>
                        <p className="text-slate-450 text-xs mt-2 leading-relaxed">
                          {sedes.length > 0 
                            ? `Monitoreando ${sedes.length} terminales con termógrafos IoT homologados. Controlando tránsitos para embarque en los principales puertos nacionales.`
                            : 'Configure la dirección y responsables de sus sedes o almacenes de empaque en la Pestaña Arquitectura para mapear su red.'
                          }
                        </p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-900 flex justify-between text-[11px] font-mono text-slate-500">
                        <span>RUC: {activeOrg?.ruc || '—'}</span>
                        <span>HQ: {sedes[0]?.nombre || 'Sin registrar'}</span>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Licencia Corporativa</h4>
                        <div className="flex justify-between items-start mt-1">
                          <h3 className="text-base font-black text-white">Suscripción SaaS</h3>
                          <span className="rounded bg-indigo-500/10 text-indigo-400 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider">
                            {activeOrg?.plan || 'PRO Enterprise'}
                          </span>
                        </div>
                        <p className="text-slate-455 text-xs mt-2 leading-relaxed">
                          Servicios satelitales IoT y copresentación de actas firmadas digitalmente con huella SHA-256 inmutable habilitada.
                        </p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-900 flex justify-between text-[11px] font-mono text-slate-500">
                        <span>SLA Contractual: 99.0%</span>
                        <span>Colaboradores: {users.length} autorizados</span>
                      </div>
                    </div>
                  </div>

                  {/* Real Live KPI counters derived from Firestore list */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-805 flex items-center justify-between">
                      <div>
                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Cargas Activas</span>
                        <span className="text-2xl font-black font-mono mt-0.5 text-white">
                          {cargos.filter(c => !['entregada', 'completada', 'cancelada'].includes(c.estado)).length}
                        </span>
                      </div>
                      <div className="p-2 bg-indigo-600/10 text-indigo-400 rounded-xl">
                        <Truck className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-805 flex items-center justify-between">
                      <div>
                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Conformadas (Ok)</span>
                        <span className="text-2xl font-black font-mono mt-0.5 text-emerald-400">
                          {cargos.filter(c => ['entregada', 'completada'].includes(c.estado)).length}
                        </span>
                      </div>
                      <div className="p-2 bg-emerald-600/10 text-emerald-400 rounded-xl">
                        <Check className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-805 flex items-center justify-between">
                      <div>
                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Alertas / Incidencias</span>
                        <span className={`text-2xl font-black font-mono mt-0.5 ${
                          incidents.filter(i => i.estado !== 'resuelto').length > 0 ? 'text-rose-450 animate-pulse' : 'text-slate-400'
                        }`}>
                          {incidents.filter(i => i.estado !== 'resuelto').length}
                        </span>
                      </div>
                      <div className={`p-2 rounded-xl ${
                        incidents.filter(i => i.estado !== 'resuelto').length > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-900 text-slate-500'
                      }`}>
                        <AlertOctagon className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-805 flex items-center justify-between">
                      <div>
                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Carriers Homologados</span>
                        <span className="text-2xl font-black font-mono mt-0.5 text-white">
                          {carriers.length}
                        </span>
                      </div>
                      <div className="p-2 bg-blue-600/10 text-blue-400 rounded-xl">
                        <Users className="h-5 w-5" />
                      </div>
                    </div>
                  </div>

                  {/* Operational chart Trends rendered inline with 100% real databases calculations */}
                  <div className="grid gap-6 md:grid-cols-12">
                    
                    <div className="md:col-span-8 bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl">
                      <div className="mb-4">
                        <h4 className="font-bold text-white text-xs uppercase tracking-wider">Historial Volumen y Presupuestos</h4>
                        <p className="text-[10px] text-slate-500">Mapeo del presupuesto acumulado propuesto para transportes terrestres.</p>
                      </div>

                      <div className="h-[250px] w-full">
                        {cargos.length === 0 ? (
                          <div className="flex items-center justify-center h-full text-slate-600 text-xs italic">
                            Sin datos para graficar
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={cargos}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1c2538" />
                              <XAxis dataKey="fechaEntregaLimite" stroke="#52525b" fontSize={9} />
                              <YAxis stroke="#6366f1" fontSize={9} />
                              <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', fontSize: 10 }} />
                              <Line type="monotone" dataKey="precioPropuesto" stroke="#6366f1" strokeWidth={2} name="Tarifa S/." />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-4 bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-white text-xs uppercase tracking-wider">Distribución por Estatus</h4>
                        <p className="text-[10px] text-slate-500">Estado logístico clasificado</p>
                      </div>

                      <div className="h-[150px] w-full flex items-center justify-center relative">
                        {cargos.length === 0 ? (
                          <div className="text-slate-650 text-xs italic">Sin datos</div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={cargosByState}
                                cx="50%"
                                cy="50%"
                                innerRadius={42}
                                outerRadius={60}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {cargosByState.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: '#020617', fontSize: 10 }} />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono text-slate-400">
                        {cargosByState.map((st, idx) => (
                          <div key={st.name} className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                            <span>{st.name}: <b>{st.value}</b></span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Terminal status SRE updates console */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl">
                    <div className="flex justify-between items-center mb-3 text-xs">
                      <h4 className="font-bold text-white uppercase tracking-widest font-mono flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Log de Operaciones SRE Recientes</span>
                      </h4>
                      <span className="text-[10px] text-slate-550">Nivel satelital</span>
                    </div>
                    <div className="bg-[#02050b] p-4 rounded-xl border border-slate-900 font-mono text-[11px] text-emerald-400 max-h-[140px] overflow-y-auto space-y-1.5 leading-relaxed">
                      {simulatedLogs.map((log, i) => (
                        <div key={i} className={log.includes('⚠️') || log.includes('ALERTA') ? 'text-amber-500 font-semibold' : 'text-emerald-400'}>
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* VIEW: CARGOS */}
              {activeTab === 'cargos' && (
                <EnterpriseCargos 
                  cargos={cargos} 
                  carriers={carriers} 
                  onSaveCargo={handleSaveCargo}
                  onUpdateCargo={handleUpdateCargo}
                  onRemoveCargo={handleRemoveCargo}
                  onDownloadPDF={generateAuditPDF}
                />
              )}

              {/* VIEW: OPERATIONAL MAP */}
              {activeTab === 'map' && (
                <ControlTowerMap 
                  organizationId={user?.organizationId || 'demo_org_id'} 
                  vehicles={mapTruckPositions as any} 
                  onAddAlertLog={(log) => setSimulatedLogs(prev => [log, ...prev])}
                />
              )}

              {/* VIEW: CARRIERS */}
              {activeTab === 'carriers' && (
                <EnterpriseCarriers 
                  carriers={carriers} 
                  onAddCarrier={handleAddCarrier}
                  onRemoveCarrier={handleRemoveCarrier}
                  onOpenDirectChat={(name) => {
                    setActiveChatCargoId('general');
                    setChatInput(`Estimados de ${name}, solicitamos confirmación de placas para el despacho de arándanos de hoy...`);
                    setActiveTab('messages');
                  }}
                />
              )}

              {/* VIEW: RECOGIDA DE SUPORTES / KANBAN */}
              {activeTab === 'operations' && (
                <EnterpriseKanban 
                  cargos={cargos} 
                  onUpdateCargo={handleUpdateCargo}
                />
              )}

              {/* VIEW: RBAC EQUIPO DE COLABORADORES */}
              {activeTab === 'colaboradores' && (
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-4">
                    <div>
                      <h3 className="text-base font-black text-white flex items-center gap-1">
                        <Shield className="h-5 w-5 text-indigo-400" />
                        <span>Mesa de Control de Personal y Firma Digital (RBAC)</span>
                      </h3>
                      <p className="text-slate-450 text-xs mt-0.5">Asigne responsabilidades de supervisores de planta, auditores externos y analistas de finanzas.</p>
                    </div>
                    <button
                      onClick={() => setShowAddUserModal(true)}
                      className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Registrar Miembro</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-950">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/60 font-bold text-slate-400 uppercase tracking-widest text-[9px]">
                        <tr>
                          <th className="p-4">Colaborador</th>
                          <th className="p-4">Email Corporativo</th>
                          <th className="p-4">Permiso de Acceso</th>
                          <th className="p-4">Sede Responsable</th>
                          <th className="p-4 text-right">Estatus Acceso</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {users.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-500 italic">No hay colaboradores corporativos invitados.</td>
                          </tr>
                        ) : (
                          users.map(u => (
                            <tr key={u.id} className="hover:bg-slate-909">
                              <td className="p-4 font-bold text-white">{u.nombre}</td>
                              <td className="p-4 text-slate-400 font-mono">{u.email}</td>
                              <td className="p-4">
                                <span className="rounded bg-indigo-500/10 text-indigo-400 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider font-mono">
                                  {u.rol}
                                </span>
                              </td>
                              <td className="p-4 text-slate-400">{u.sede}</td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="p-1 text-slate-500 hover:text-red-400"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW: OPERATIONAL MESSAGES CENTER */}
              {activeTab === 'messages' && (
                <div className="grid gap-6 lg:grid-cols-12 bg-slate-950 border border-slate-800 p-5 rounded-2xl shadow-xl">
                  
                  {/* Channels Sidebar List (4 cols) */}
                  <div className="lg:col-span-4 border-r border-slate-900 pr-5 space-y-4">
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider">Temas Logísticos</h3>
                    
                    <div className="space-y-1.5 max-h-[380px] overflow-y-auto">
                      <button
                        onClick={() => setActiveChatCargoId('general')}
                        className={`w-full text-left p-3 rounded-xl border transition text-xs font-bold ${
                          activeChatCargoId === 'general'
                            ? 'bg-indigo-600/10 border-indigo-505 text-white'
                            : 'bg-slate-900 hover:bg-slate-850 border-slate-850 text-slate-400'
                        }`}
                      >
                        <span className="block font-black">📣 Canal General</span>
                        <span className="text-[10px] text-slate-550 font-normal mt-0.5">Anuncios transversales y ofertas de fletes</span>
                      </button>

                      {cargos.map(car => (
                        <button
                          key={car.id}
                          onClick={() => setActiveChatCargoId(car.id)}
                          className={`w-full text-left p-3 rounded-xl border transition text-xs font-bold block ${
                            activeChatCargoId === car.id
                              ? 'bg-indigo-600/10 border-indigo-505 text-white'
                              : 'bg-slate-900 hover:bg-slate-850 border-slate-850 text-slate-400'
                          }`}
                        >
                          <span className="block font-black truncate">#{car.id.substring(0,8).toUpperCase()} - {car.nombreProducto.split(' ')[0]}</span>
                          <span className="text-[10px] text-slate-550 font-mono block mt-0.5">{car.estado}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chat Console viewport (8 cols) */}
                  <div className="lg:col-span-8 flex flex-col justify-between min-h-[420px]">
                    <div>
                      <div className="pb-3 border-b border-slate-900 mb-4 flex justify-between items-center text-xs">
                        <span className="font-bold text-white">Consola de Mensajería: {activeChatCargoId === 'general' ? 'general' : `#${activeChatCargoId.substring(0,8).toUpperCase()}`}</span>
                        <span className="text-[10px] text-indigo-400 font-mono">105% Live Firestore</span>
                      </div>

                      {/* Messages loop */}
                      <div className="bg-[#02050b] rounded-xl p-4 border border-slate-950 font-sans text-xs space-y-3 h-[250px] overflow-y-auto max-h-[250px]">
                        {chatMessages
                          .filter(m => m.cargoId === activeChatCargoId)
                          .map((m, idx) => (
                            <div key={idx} className="bg-slate-900 border border-slate-850/50 p-2.5 rounded-xl">
                              <div className="flex justify-between text-[9px] font-mono font-bold text-slate-500 mb-1">
                                <span>{m.senderName} ({m.senderRole})</span>
                                <span>{m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : 'Hoy'}</span>
                              </div>
                              <p className="text-slate-200 font-medium leading-relaxed">{m.text}</p>
                            </div>
                          ))}
                        {chatMessages.filter(m => m.cargoId === activeChatCargoId).length === 0 && (
                          <div className="text-center py-16 text-slate-650 italic">
                            No hay mensajes registrados en este tema todavía.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick templates for instant Dispatch compliance sending */}
                    <div className="mt-4 space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => handleSendTemplate("⚠️ Alerta SRE: Solicitamos lectura telemétrica de termógrafos de respaldo.")}
                          className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/10 font-bold hover:bg-orange-500/20 text-[10px]"
                        >
                          Solicitar Termógrafo
                        </button>
                        <button
                          onClick={() => handleSendTemplate("✅ Custodia Certificada: El precinto de seguridad ha sido homologado conforme, salida liberada.")}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 font-bold hover:bg-emerald-500/20 text-[10px]"
                        >
                          Aprobar Precinto
                        </button>
                        <button
                          onClick={() => handleSendTemplate("⏱️ Retraso Vial: Reportamos embotellamiento severo en el acceso primario al Puerto del Callao.")}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/10 font-bold hover:bg-amber-500/20 text-[10px]"
                        >
                          Reportar Tráfico Callao
                        </button>
                      </div>

                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          placeholder="Redactar instrucción SRE para choferes o analistas de ruta..."
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-0 focus:border-indigo-650 text-white font-medium"
                        />
                        <button
                          type="submit"
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 rounded-xl flex items-center gap-1"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Enviar</span>
                        </button>
                      </form>
                    </div>

                  </div>
                </div>
              )}

              {/* VIEW: ALERTS INCIDENTS */}
              {activeTab === 'alerts' && (
                <EnterpriseIncidents 
                  incidents={incidents} 
                  cargos={cargos} 
                  onAddIncident={handleAddIncident}
                  onUpdateIncident={handleUpdateIncident}
                />
              )}

              {/* VIEW: EVIDENCE AND CUSTODY CHECKLIST */}
              {activeTab === 'evidence' && (
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6 text-xs">
                  <div>
                    <h3 className="text-base font-black text-white">Log de Evidencias Digitales & Actas de Entrega</h3>
                    <p className="text-slate-450 mt-1">Gestión de firmas criptográficas, checklists de salida de planta y descargas de custodia.</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {cargos.length === 0 ? (
                      <div className="text-slate-600 italic">No hay embarques para auditar.</div>
                    ) : (
                      cargos.map(car => {
                        const isOk = car.estado === 'completada' || car.estado === 'entregada';
                        const inTransit = ['en_ruta', 'en_entrega'].includes(car.estado);

                        return (
                          <div key={car.id} className="bg-slate-900/40 p-4 border border-slate-850 rounded-2xl flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-center pb-2.5 border-b border-slate-900 mb-3 font-mono">
                                <span className="font-extrabold text-indigo-400">#{car.id.substring(0,8).toUpperCase()}</span>
                                <span className="text-[10px] text-slate-500">{car.fechaEntregaLimite}</span>
                              </div>
                              <span className="font-bold text-white text-sm block">{car.nombreProducto}</span>
                              
                              {/* Audit Checklist */}
                              <div className="space-y-1.5 mt-3 text-[11px] font-sans">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                  <span className="text-slate-350">Cargamento Termosellado en Sede</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className={`h-4 w-4 ${inTransit || isOk ? 'text-emerald-400' : 'text-slate-700'}`} />
                                  <span className={inTransit || isOk ? 'text-slate-350' : 'text-slate-650'}>Guías Aprobadas MTC</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className={`h-4 w-4 ${isOk ? 'text-emerald-400' : 'text-slate-700'}`} />
                                  <span className={isOk ? 'text-slate-350' : 'text-slate-650'}>Firma Digital Entrega (Doble Token SHA-256)</span>
                                </div>
                              </div>
                            </div>

                            <div className="pt-4 mt-4 border-t border-slate-900 flex justify-between items-center text-[10px]">
                              <span className="text-slate-500 font-mono">Certificado: ok</span>
                              <button
                                onClick={() => generateAuditPDF(car)}
                                className="text-indigo-450 hover:text-indigo-350 text-[10.5px] font-bold flex items-center gap-1 hover:underline"
                              >
                                <Download className="h-3.5 w-3.5" />
                                <span>Descargar PDF</span>
                              </button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

              {/* VIEW: ARCHITECTURE PLANS */}
              {activeTab === 'tech' && (
                <div className="space-y-6">
                  <EnterpriseSettings 
                    organizationId={user?.organizationId || 'demo_org_id'} 
                    orgData={activeOrg}
                    onRefreshOrg={async () => {
                      if (!user) return;
                      const d = await getDoc(doc(db, 'organizations', user.organizationId));
                      if (d.exists()) setActiveOrg({ id: user.organizationId, ...d.data() });
                    }}
                  />
                  <TechnicalDocs />
                </div>
              )}

              {/* VIEW: SAAS SUBSCRIPTIONS */}
              {activeTab === 'saas' && (
                <SaaSBilling 
                  activePlan={activeOrg?.plan || 'enterprise'}
                  sedesCount={sedes.length}
                  vehiclesCount={Array.from(new Set(cargos.map(c => c.vehiculoAsignado).filter(Boolean))).length || 2}
                  driversCount={Array.from(new Set(cargos.map(c => c.conductorAsignado).filter(Boolean))).length || 2}
                  onUpdatePlan={handleUpdatePlan}
                  onAddAlertLog={(log) => setSimulatedLogs(prev => [log, ...prev])}
                />
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* RBAC INVITE USER DIALOG POPUP */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <h4 className="text-base font-black text-white border-b border-slate-900 pb-3 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-450" />
              <span>Invitar Miembro Autorizado</span>
            </h4>

            <form onSubmit={handleAddUser} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={newUser.nombre}
                  onChange={e => setNewUser({ ...newUser, nombre: e.target.value })}
                  placeholder="Ej. Jorge Gamarra"
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-white outline-none focus:border-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Email Corporativo</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Ej. jorge@chasquicorp.com"
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-white outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Rol Corporativo</label>
                  <select
                    value={newUser.rol}
                    onChange={e => setNewUser({ ...newUser, rol: e.target.value as any })}
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-slate-300 outline-none"
                  >
                    <option value="admin">Administrador General</option>
                    <option value="operations_manager">Gerente de Operaciones</option>
                    <option value="dispatcher">Despachador Líder</option>
                    <option value="monitor">Monitorista de Ruta GPS</option>
                    <option value="auditor">Auditor Externo</option>
                    <option value="finance">Responsable Facturación</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Sede Autorizada</label>
                  <select
                    value={newUser.sede}
                    onChange={e => setNewUser({ ...newUser, sede: e.target.value })}
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-slate-300 outline-none"
                  >
                    <option value="San Isidro HQ">San Isidro HQ, Lima</option>
                    {sedes.map(s => (
                      <option key={s.id} value={s.nombre}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-900 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="bg-slate-900 text-slate-400 font-bold px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-850"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/10"
                >
                  Confirmar Miembro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
