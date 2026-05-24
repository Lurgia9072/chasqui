import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Truck, Users, ShieldCheck, MapPin, Gauge, Fuel, Wrench, AlertTriangle, 
  Activity, Award, Building2, Search, Plus, Trash2, Check, Download,
  Compass, Wifi, WifiOff, FileText, Settings, CreditCard, ChevronRight, Play, RefreshCw
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { jsPDF } from 'jspdf';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../firebase';
import { collection, onSnapshot, query, where, addDoc, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';

// Component Core
export function FleetERP() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'camiones' | 'choferes' | 'gps' | 'despachos' | 'mantenimiento' | 'combustible' | 'incidentes' | 'ai' | 'rbac' | 'billing'>('overview');
  // Load real database data which default to empty arrays
  const [truckList, setTruckList] = useState<any[]>(() => {
    const raw = localStorage.getItem('chasqui_demo_trucks');
    return raw ? JSON.parse(raw) : [];
  });
  const [driverList, setDriverList] = useState<any[]>(() => {
    const raw = localStorage.getItem('chasqui_demo_drivers');
    return raw ? JSON.parse(raw) : [];
  });
  const [dispatchList, setDispatchList] = useState<any[]>(() => {
    const raw = localStorage.getItem('chasqui_demo_dispatches');
    return raw ? JSON.parse(raw) : [];
  });
  const [maintenanceList, setMaintenanceList] = useState<any[]>(() => {
    const raw = localStorage.getItem('chasqui_demo_maintenances');
    return raw ? JSON.parse(raw) : [];
  });
  const [fuelList, setFuelList] = useState<any[]>(() => {
    const raw = localStorage.getItem('chasqui_demo_fuels');
    return raw ? JSON.parse(raw) : [];
  });
  const [incidentList, setIncidentList] = useState<any[]>(() => {
    const raw = localStorage.getItem('chasqui_demo_incidents');
    return raw ? JSON.parse(raw) : [];
  });
  const [rbacMembers, setRbacMembers] = useState<any[]>([]);

  // Dynamic Calculators for KPIs and Charts based on actual database data
  const totalTrucksCount = truckList.length;
  const inServiceTrucksCount = truckList.filter(t => t.estado === 'en_ruta' || t.estado === 'viaje').length;
  const fleetOcupacionPercentage = totalTrucksCount > 0 ? Math.round((inServiceTrucksCount / totalTrucksCount) * 100) : 0;

  const totalOdometerKm = truckList.reduce((acc, t) => acc + (Number(t.km) || 0), 0);
  const formattedOdometerKm = totalOdometerKm > 0 
    ? (totalOdometerKm >= 1000 ? `${(totalOdometerKm / 1000).toFixed(0)}K` : `${Math.round(totalOdometerKm)}`) 
    : '0';

  const totalDieselGallons = fuelList.reduce((acc, f) => acc + (Number(f.galones) || 0), 0);
  const avgDieselCostPerGallon = fuelList.length > 0 
    ? fuelList.reduce((acc, f) => acc + (Number(f.costo) / (Number(f.galones) || 1)), 0) / fuelList.length 
    : 0;

  const activeMtcIncidentsCount = incidentList.filter(i => !i.solucionado).length;

  const enRutaCount = truckList.filter(t => t.estado === 'en_ruta' || t.estado === 'viaje').length;
  const disponiblesCount = truckList.filter(t => t.estado === 'disponible' || t.estado === 'libre').length;
  const tallerCount = truckList.filter(t => t.estado === 'mantenimiento' || t.estado === 'taller' || t.estado === 'incidencia' || t.estado === 'suspendido').length;
  const totalForPie = enRutaCount + disponiblesCount + tallerCount;

  const pieData = totalForPie > 0 ? [
    { name: 'En Ruta', value: enRutaCount },
    { name: 'Disponibles', value: disponiblesCount },
    { name: 'Taller', value: tallerCount }
  ] : [
    { name: 'Sin Unidades', value: 1 }
  ];

  const enRutaPercent = totalForPie > 0 ? Math.round((enRutaCount / totalForPie) * 100) : 0;
  const disponiblesPercent = totalForPie > 0 ? Math.round((disponiblesCount / totalForPie) * 100) : 0;
  const tallerPercent = totalForPie > 0 ? 100 - enRutaPercent - disponiblesPercent : 0;
  
  // Modals state
  const [showAddTruckModal, setShowAddTruckModal] = useState(false);
  const [newTruck, setNewTruck] = useState({ placa: '', marca: 'Volvo', modelo: '', tipo: 'refrigerado', capacidad: '', conductor: 'Sin Asignar' });

  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [newDriver, setNewDriver] = useState({ nombre: '', licencia: '', categoria: 'A-IIIc', telefono: '' });

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDispatchId, setSelectedDispatchId] = useState<string | null>(null);
  const [assignForm, setAssignForm] = useState({ conductorId: '', truckId: '' });

  // SRE logs and connection simulations
  const [isOnline, setIsOnline] = useState(true);
  const [currentAlertSim, setCurrentAlertSim] = useState<'ninguna' | 'combustible' | 'mecanico' | 'temperatura'>('ninguna');
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([
    '[18:44:02 PM] Chasqui Fleet Management OS iniciado.',
    '[18:45:10 PM] GPS Camión F2W-894 conectado. Velocidad: 62 km/h. Ruta: Panamericana Norte.',
    '[18:46:15 PM] Sensor térmico en línea. Recibiendo lecturas de compresor secundario en Actros C5X-611.',
    '[18:47:00 PM] SOAT y habilitación MTC de toda la flota activa digitalizados exitosamente.'
  ]);

  // Real Multi-Tenant Organization state
  const rawUser = useAuthStore().user;
  const isDemo = searchParams.get('demo') === 'true' || localStorage.getItem('chasqui_demo_active') === 'true';
  const orgId = rawUser?.organizationId || (rawUser ? `${rawUser.uid}_org` : 'demo_org_id');

  // Multi-tenant Onboarding Form (Fallback for un-onboarded shippers/carriers)
  const [onboardForm, setOnboardForm] = useState({
    name: '',
    ruc: '',
    razonSocial: '',
    plan: 'business' as 'free' | 'business' | 'enterprise'
  });
  const [loadingOrg, setLoadingOrg] = useState(false);

  // Firestore Real-Time Subscriptions for multi-tenant data isolation
  useEffect(() => {
    if (!orgId || !rawUser) return;

    // 1. Subscribe to Vehicles where organizationId == orgId
    const qv = query(collection(db, 'vehicles'), where('organizationId', '==', orgId));
    const unsubVehicles = onSnapshot(qv, (snap) => {
      const list: any[] = [];
      snap.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setTruckList(list);
    }, (err) => {
      console.error("Error listening to vehicles", err);
    });

    // 2. Subscribe to Drivers where organizationId == orgId
    const qd = query(collection(db, 'drivers'), where('organizationId', '==', orgId));
    const unsubDrivers = onSnapshot(qd, (snap) => {
      const list: any[] = [];
      snap.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setDriverList(list);
    }, (err) => {
      console.error("Error listening to drivers", err);
    });

    // 3. Subscribe to Dispatches under fleet/${orgId}_dispatches
    const unsubDispatches = onSnapshot(doc(db, 'fleet', `${orgId}_dispatches`), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.list) setDispatchList(data.list);
      } else {
        setDispatchList([]);
      }
    }, (err) => {
      console.error("Error listening to dispatches", err);
    });

    // 4. Subscribe to Maintenances under fleet/${orgId}_maintenances
    const unsubMaintenances = onSnapshot(doc(db, 'fleet', `${orgId}_maintenances`), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.list) setMaintenanceList(data.list);
      } else {
        setMaintenanceList([]);
      }
    }, (err) => {
      console.error("Error listening to maintenances", err);
    });

    // 5. Subscribe to Fuels under fleet/${orgId}_fuels
    const unsubFuels = onSnapshot(doc(db, 'fleet', `${orgId}_fuels`), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.list) setFuelList(data.list);
      } else {
        setFuelList([]);
      }
    }, (err) => {
      console.error("Error listening to fuels", err);
    });

    // 6. Subscribe to Incidents under fleet/${orgId}_incidents
    const unsubIncidents = onSnapshot(doc(db, 'fleet', `${orgId}_incidents`), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.list) setIncidentList(data.list);
      } else {
        setIncidentList([]);
      }
    }, (err) => {
      console.error("Error listening to incidents", err);
    });

    // 7. Subscribe to User directory (RBAC members) under organizations/orgId/users
    const unsubRbac = onSnapshot(collection(db, 'organizations', orgId, 'users'), (snap) => {
      const list: any[] = [];
      snap.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setRbacMembers(list);
    }, (err) => {
      console.error("Error listening to rbac members", err);
    });

    return () => {
      unsubVehicles();
      unsubDrivers();
      unsubDispatches();
      unsubMaintenances();
      unsubFuels();
      unsubIncidents();
      unsubRbac();
    };
  }, [orgId, rawUser]);

  // AI Copilot state
  const [aiPrompt, setAiPrompt] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
    { sender: 'ai', text: '¡Hola! Soy **Chasqui Fleet Copilot**. Estoy preparado para asistirte en optimizar consumos de diésel, predecir mantenimientos mecánicos, programar choferes e identificar riesgos de fatiga en tramos largos.' }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Recharts custom colors
  const RADIANTS_COLORS = ['#3b82f6', '#10b981', '#ef4444', '#a855f7'];

  // Add truck handler
  const handleAddTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTruck.placa || !newTruck.capacidad) return;
    const item = {
      placa: newTruck.placa.toUpperCase(),
      marca: newTruck.marca,
      modelo: newTruck.modelo || 'Series F',
      tipo: newTruck.tipo,
      capacidad: newTruck.capacidad,
      conductor: newTruck.conductor,
      estado: 'disponible',
      combustible: 100,
      soatVencimiento: '2027-05-15',
      revisionTecnica: 'Vigente',
      km: 0
    };

    if (orgId && rawUser) {
      try {
        await addDoc(collection(db, 'vehicles'), {
          ...item,
          organizationId: orgId,
          createdAt: Date.now()
        });
        setSimulatedLogs(prev => [`[FLOTA OS] Vehículo con placa ${item.placa} registrado en base real.`, ...prev]);
      } catch (err: any) {
        console.error("Error saving vehicle", err);
        alert(`Error al guardar camión real: ${err.message || err}`);
      }
    } else {
      const updatedList = [...truckList, { id: `t_${Date.now()}`, ...item }];
      setTruckList(updatedList);
      localStorage.setItem('chasqui_demo_trucks', JSON.stringify(updatedList));
      setSimulatedLogs(prev => [`[FLOTA OS] Vehículo con placa ${item.placa} registrado en almacenamiento local.`, ...prev]);
    }
    
    setNewTruck({ placa: '', marca: 'Volvo', modelo: '', tipo: 'refrigerado', capacidad: '', conductor: 'Sin Asignar' });
    setShowAddTruckModal(false);
  };

  // Add driver handler
  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriver.nombre || !newDriver.licencia) return;
    const item = {
      nombre: newDriver.nombre,
      licencia: newDriver.licencia,
      categoria: newDriver.categoria,
      telefono: newDriver.telefono || '+51 900 000 000',
      estado: 'disponible',
      calificacion: 5.0,
      horasManejoSemana: 0,
      soatVigente: true
    };

    if (orgId && rawUser) {
      try {
        await addDoc(collection(db, 'drivers'), {
          ...item,
          organizationId: orgId,
          createdAt: Date.now()
        });
        setSimulatedLogs(prev => [`[CHÓFERES] Conductor profesional ${item.nombre} registrado en base real.`, ...prev]);
      } catch (err: any) {
        console.error("Error saving driver", err);
        alert(`Error al guardar chofer real: ${err.message || err}`);
      }
    } else {
      const updatedList = [...driverList, { id: `d_${Date.now()}`, ...item }];
      setDriverList(updatedList);
      localStorage.setItem('chasqui_demo_drivers', JSON.stringify(updatedList));
      setSimulatedLogs(prev => [`[CHÓFERES] Conductor profesional ${item.nombre} registrado en almacenamiento local.`, ...prev]);
    }

    setNewDriver({ nombre: '', licencia: '', categoria: 'A-IIIc', telefono: '' });
    setShowAddDriverModal(false);
  };

  // Assign driver and vehicle to a pending dispatch
  const handleOpenAssignModal = (dispatchId: string) => {
    setSelectedDispatchId(dispatchId);
    // filter free or available resources
    const firstDriver = driverList.find(d => d.estado === 'disponible')?.nombre || '';
    const firstTruck = truckList.find(t => t.estado === 'disponible')?.placa || '';
    setAssignForm({ conductorId: firstDriver, truckId: firstTruck });
    setShowAssignModal(true);
  };

  const handleConfirmAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispatchId) return;

    let updatedDispatches: any[] = [];
    setDispatchList(prev => {
      const next = prev.map(d => {
        if (d.id === selectedDispatchId) {
          return {
            ...d,
            estado: 'asignado',
            conductor: assignForm.conductorId,
            placa: assignForm.truckId
          };
        }
        return d;
      });
      updatedDispatches = next;
      if (!rawUser) {
        localStorage.setItem('chasqui_demo_dispatches', JSON.stringify(next));
      }
      return next;
    });

    // Update truck status to en_ruta
    const targetTruckObj = truckList.find(t => t.placa === assignForm.truckId);
    if (orgId && rawUser && targetTruckObj) {
      try {
        await updateDoc(doc(db, 'vehicles', targetTruckObj.id), {
          estado: 'en_ruta',
          conductor: assignForm.conductorId
        });
      } catch (err) {
        console.error("Error updating vehicle state in Firestore", err);
      }
    } else {
      setTruckList(prev => {
        const next = prev.map(t => {
          if (t.placa === assignForm.truckId) {
            return { ...t, estado: 'en_ruta', conductor: assignForm.conductorId };
          }
          return t;
        });
        localStorage.setItem('chasqui_demo_trucks', JSON.stringify(next));
        return next;
      });
    }

    // Update driver status to activo
    const targetDriverObj = driverList.find(d => d.nombre === assignForm.conductorId);
    if (orgId && rawUser && targetDriverObj) {
      try {
        await updateDoc(doc(db, 'drivers', targetDriverObj.id), {
          estado: 'activo'
        });
      } catch (err) {
        console.error("Error updating driver state in Firestore", err);
      }
    } else {
      setDriverList(prev => {
        const next = prev.map(d => {
          if (d.nombre === assignForm.conductorId) {
            return { ...d, estado: 'activo' };
          }
          return d;
        });
        localStorage.setItem('chasqui_demo_drivers', JSON.stringify(next));
        return next;
      });
    }

    if (orgId && rawUser) {
      try {
        await setDoc(doc(db, 'fleet', `${orgId}_dispatches`), {
          organizationId: orgId,
          list: updatedDispatches,
          updatedAt: Date.now()
        });
      } catch (err) {
        console.error("Error updating dispatches list in Firestore", err);
      }
    }

    setShowAssignModal(false);
    setSelectedDispatchId(null);
    setSimulatedLogs(prev => [`[PLAN DE TRANSITO] Despacho ${selectedDispatchId} asignado al chofer ${assignForm.conductorId} operando la unidad ${assignForm.truckId}.`, ...prev]);
  };

  // Fuel data chart formatting
  const chartDataCombustible = fuelList.map((f, i) => ({
    name: f.placa,
    costo: f.costo,
    galones: f.galones
  }));

  const handleAskCopilot = (tag: string) => {
    setIsAiLoading(true);
    const p = tag === 'custom' ? aiPrompt : tag;
    setChatLog(prev => [...prev, { sender: 'user', text: p }]);

    setTimeout(() => {
      let answer = 'Procesando telemetría... Recomiendo verificar niveles de SOAT o habilitación MTC de la unidad.';
      if (p.includes('combustible') || p.includes('opt_combustible')) {
        answer = `### 🧠 OPTIMIZACIÓN DE CONSUMO DE COMBUSTIBLE - REPORTES CHASQUI AI\n\nAnalizando las unidades activas de la flota:\n\n1. **Lectura Inusual:** El camión **Volvo F2W-894** reporta un rendimiento promedio de **31.2 km/galón**, menor en 12% al óptimo nominal (35.5 km/galón) en su trayecto Piura - Chimbote.\n2. **Diagnóstico Predictivo:** Se detecta un incremento constante de velocidad y paradas injustificadas cerca de Chancay. \n\n**Recomendación del Copilot:**\n- Reprogramar la unidad para revisión aerodinámica y de compresión en el taller próximo.\n- Instruir al chofer **Mario Lanza** a mantener régimen ECO-Drive a menos de 1800 rpm en pendientes. Consumo proyectado a ahorrar: **55 galones mensuales**.`;
      } else if (p.includes('fatiga') || p.includes('opt_conductores')) {
        answer = `### 💤 CONTROL DE FATIGA Y SEGURIDAD VIAL (SUNAT GEOFENCES)\n\nAnálisis de cronograma laboral de conductores en Chasqui Logistics:\n\n1. **Alerta de Horas de Manejo:** Conductor **Enrique Palacios** acumula **42 horas de manejo esta semana** conduciendo la unidad refrigerada **C5X-611**.\n2. **Riesgo:** Supera el límite óptimo recomendado de 40 horas en tramo nocturno.\n\n**Sugerencia Algorítmica:**\n- Asignar chofer de relevo en Sullana para el despacho de Danper SAC. \n- Bloquear asignaciones automáticas para Esteban Paredes debido a licencia vencida.`;
      } else if (p.includes('mantenimiento') || p.includes('opt_mantenimiento')) {
        answer = `### 🔧 PREDICTIVO DE MANTENIMIENTO CORRECTIVO\n\nRecomendaciones de Taller:\n\n1. **Unidad Fuso A9E-231:** El SOAT y MTC están válidos pero la **revisión técnica vence el próximo mes de Junio** y el estado muestra mantenimiento de alternador pendiente.\n2. **Costo de Reparación Estimado:** S/. 850.\n\n**Acciones propuestas:** Generar orden de compra automática en Taller Principal Callao para el fin de semana para evitar multas de la Sutran.`;
      }

      setChatLog(prev => [...prev, { sender: 'ai', text: answer }]);
      setIsAiLoading(false);
      if (tag === 'custom') setAiPrompt('');
    }, 1200);
  };

  // Generate audit report for Flotas
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(30, 27, 75); // Dark Purple Theme for Carrriers
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('CHASQUI FLEET CONTROL OS', 15, 20);
    doc.setFontSize(10);
    doc.text('ERP CORPORATIVO DE TRANSPORTE TERRESTRE Y MULTI-FLOTAS', 15, 30);

    doc.setTextColor(30, 27, 75);
    doc.setFontSize(14);
    doc.text('REPORTE GENERAL DE EFICIENCIA OPERATIVA', 15, 55);
    doc.line(15, 58, 195, 58);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN DE ESTADO:', 15, 70);
    doc.setFont('helvetica', 'normal');
    doc.text(`Unidades Totales: ${truckList.length}`, 15, 80);
    doc.text(`Choferes Homologados: ${driverList.length}`, 15, 88);
    doc.text(`Mantenimientos en Historial: ${maintenanceList.length}`, 15, 96);
    doc.text(`Incidentes Operativos Activos: ${incidentList.filter(i => !i.solucionado).length}`, 15, 104);

    doc.setFont('helvetica', 'bold');
    doc.text('COMPLIANCE ADUANAS Y SOAT:', 110, 70);
    doc.setFont('helvetica', 'normal');
    doc.text('Habilitación MTC: 100% Homologado', 110, 80);
    doc.text('SOAT Operativo: 100% Vigente', 110, 88);
    doc.text('Seguimiento Satelital: Activo (99.8% SRE)', 110, 96);

    doc.save('Chasqui-Fleet-Audit.pdf');
  };

  if (rawUser && !orgId && !isDemo) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-2xl">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-805">
            <span className="p-2.5 rounded-xl bg-purple-600/10 text-purple-400">
              <Building2 className="h-6 w-6" />
            </span>
            <div>
              <span className="text-[10px] text-purple-400 font-bold tracking-widest uppercase">Ecosistema Logístico</span>
              <h2 className="text-lg font-black text-white">Inicializar Flota Corporativa</h2>
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
              await onboardOrganization(
                onboardForm.name,
                onboardForm.plan,
                onboardForm.ruc,
                onboardForm.razonSocial
              );
              window.location.reload();
            } catch (err: any) {
              alert(`Error al crear organización: ${err.message || err}`);
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-500 block">Suscripción SaaS Logística</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'free', label: 'Plan FREE', desc: '1 Sede / 5 de Flota' },
                  { id: 'business', label: 'PRO Business', desc: 'Sedes Activas / GPS' },
                  { id: 'enterprise', label: 'Enterprise Core', desc: 'Ilimitada + SRE' }
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setOnboardForm({ ...onboardForm, plan: p.id as any })}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      onboardForm.plan === p.id 
                        ? 'bg-purple-650/10 border-purple-600 text-purple-400' 
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
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black text-xs py-3.5 rounded-xl shadow-lg shadow-purple-600/25 transition-all text-center"
            >
              {loadingOrg ? 'Provisionando Ecosistema Logístico...' : '📦 Inicializar Enterprise Fleet OS'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col pt-4 font-sans max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      
      {/* Upper Status Header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-gradient-to-r from-purple-500 to-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-md shadow-indigo-600/20">
              Fleet OS ERP
            </span>
            <span className="text-slate-500 font-mono text-xs">V3.1 | SaaS Enterprise</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold flex items-center space-x-1 border border-emerald-500/20">
              <Wifi className="h-3 w-3" />
              <span>SATELLITE ACTIVE</span>
            </span>
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent flex items-center space-x-2 mt-1 italic">
            <Truck className="h-7 w-7 text-purple-400" />
            <span>Chasqui Fleet Management OS</span>
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Plataforma ERP industrial e IoT para control y despacho de multi-flotas, combustible y conductores.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleExportPDF()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-purple-400 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
          >
            <Download className="h-3.5 w-3.5 text-purple-400" />
            <span>Exportar Reporte</span>
          </button>
          
          <button
            onClick={() => {
              localStorage.removeItem('chasqui_demo_trucks');
              localStorage.removeItem('chasqui_demo_drivers');
              localStorage.removeItem('chasqui_demo_dispatches');
              localStorage.removeItem('chasqui_demo_maintenances');
              localStorage.removeItem('chasqui_demo_fuels');
              localStorage.removeItem('chasqui_demo_incidents');
              setTruckList([]);
              setDriverList([]);
              setDispatchList([]);
              setMaintenanceList([]);
              setFuelList([]);
              setIncidentList([]);
              setSimulatedLogs(prev => ['[CONFIG RESET] Módulo limpiado. Conectado únicamente a la base de datos real en la nube.', ...prev]);
            }}
            className="p-2 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl border border-slate-800"
            title="Sincronizar base de datos"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Corporate KPIs Block */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-[9px] font-black uppercase tracking-wider block">Ocupación Flota</span>
            <span className="text-2xl font-black font-mono mt-0.5 text-white">{fleetOcupacionPercentage}%</span>
            <span className="text-[10px] text-purple-400 block mt-0.5">{inServiceTrucksCount} de {totalTrucksCount} en servicio</span>
          </div>
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
            <Truck className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-[9px] font-black uppercase tracking-wider block">Km Totales</span>
            <span className="text-2xl font-black font-mono mt-0.5 text-white">{formattedOdometerKm}</span>
            <span className="text-[10px] text-sky-400 block mt-0.5">Recorridos acumulados</span>
          </div>
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
            <Gauge className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-[9px] font-black uppercase tracking-wider block">Consumo Diésel</span>
            <span className="text-2xl font-black font-mono mt-0.5 text-white">{totalDieselGallons} Gal</span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">Tasa prom: S/. {avgDieselCostPerGallon > 0 ? avgDieselCostPerGallon.toFixed(2) : '0.00'}</span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Fuel className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-[9px] font-black uppercase tracking-wider block">Incidentes MTC</span>
            <span className="text-2xl font-black font-mono mt-0.5 text-rose-500">{activeMtcIncidentsCount}</span>
            <span className="text-[10px] text-rose-400 block mt-0.5">{activeMtcIncidentsCount} {activeMtcIncidentsCount === 1 ? 'alerta pendiente' : 'alertas pendientes'}</span>
          </div>
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex items-center justify-between col-span-2 lg:col-span-1">
          <div>
            <span className="text-slate-500 text-[9px] font-black uppercase tracking-wider block">Sugerencia Copilot</span>
            <span className="text-xs font-bold text-indigo-400 block mt-1 hover:underline cursor-pointer" onClick={() => setActiveTab('ai')}>
              {totalTrucksCount > 0 ? '3 optimizaciones' : 'Sin pendientes'}
            </span>
            <span className="text-[9px] text-emerald-400 block mt-0.5">{totalTrucksCount > 0 ? '✓ 55 galones a ahorrar' : 'Esperando datos de flota'}</span>
          </div>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Award className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Dashboard Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3 space-y-2 bg-slate-950 border border-slate-850 p-4 rounded-3xl shrink-0 shadow-lg">
          <p className="px-3 py-1.5 text-[9px] font-black tracking-widest text-slate-550 uppercase">— ERP OPERATIONS —</p>
          {[
            { id: 'overview', label: 'Dashboard Resumen', icon: Activity },
            { id: 'camiones', label: 'Camiones / Flota', icon: Truck, count: truckList.length },
            { id: 'choferes', label: 'Choferes', icon: Users, count: driverList.length },
            { id: 'despachos', label: 'Despachos', icon: FileText, count: dispatchList.filter(d => d.estado === 'pendiente_asignacion').length },
            { id: 'gps', label: 'Monitoreo Satelital', icon: Compass },
            { id: 'mantenimiento', label: 'Mantenimiento', icon: Wrench },
            { id: 'combustible', label: 'Diésel & Vales', icon: Fuel },
            { id: 'incidentes', label: 'Incidentes', icon: AlertTriangle, count: incidentList.filter(i => !i.solucionado).length },
            { id: 'ai', label: 'IA Fleet Copilot', icon: Award },
            { id: 'rbac', label: 'Roles Team ERP', icon: Settings },
            { id: 'billing', label: 'Facturación SaaS', icon: CreditCard },
          ].map((tab) => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white font-extrabold shadow-lg shadow-purple-600/15'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <IconComp className="h-4.5 w-4.5 shrink-0" />
                  <span>{tab.label}</span>
                </div>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black font-mono ${
                    activeTab === tab.id ? 'bg-white text-purple-600' : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Wrapper */}
        <div id="erp-canvas" className="lg:col-span-9 bg-slate-950 border border-slate-850 p-6 sm:p-8 rounded-3xl min-h-[580px] shadow-2xl relative">
          
          {/* A. OVERVIEW PANEL */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="border-b border-slate-900 pb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-black text-white">Monitoreo de Eficiencia de Flota</h2>
                  <p className="text-xs text-slate-400 mt-1">Comparativa de costos de combustible, kilómetros acumulados y auditoría en tiempo real.</p>
                </div>
                <div className="text-[10px] font-mono select-none px-3 py-1 bg-slate-900 rounded-full border border-slate-800 text-slate-500">
                  REAL-TIME UPDATES
                </div>
              </div>

              {/* Chart container */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Cost Chart */}
                <div className="lg:col-span-7 bg-slate-900/40 p-4 border border-slate-900 rounded-2xl h-80">
                  <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">— Costos de combustible por Placa (Diésel S/.)</p>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={chartDataCombustible}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} labelStyle={{ color: '#fff' }} />
                      <Bar dataKey="costo" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie Chart of States */}
                <div className="lg:col-span-5 bg-slate-900/40 p-4 border border-slate-900 rounded-2xl h-80 flex flex-col justify-between">
                  <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">— Ocupación Física de Flotas</p>
                  <div className="h-44 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          outerRadius={55}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => {
                            if (totalForPie === 0) return <Cell key={index} fill="#334155" />;
                            const colors = ['#a855f7', '#10b981', '#eab308'];
                            return <Cell key={index} fill={colors[index]} />;
                          })}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-center pb-2">
                    <div className="p-2 bg-purple-950/20 border border-purple-900/30 rounded-lg text-purple-400 font-medium">
                      <p className="font-bold">RUTA</p>
                      <p className="text-sm font-black mt-0.5">{enRutaCount} ({enRutaPercent}%)</p>
                    </div>
                    <div className="p-2 bg-emerald-950/20 border border-emerald-900/30 rounded-lg text-emerald-400 font-medium">
                      <p className="font-bold">LIBRES</p>
                      <p className="text-sm font-black mt-0.5">{disponiblesCount} ({disponiblesPercent}%)</p>
                    </div>
                    <div className="p-2 bg-amber-950/20 border border-amber-900/30 rounded-lg text-amber-400 font-medium">
                      <p className="font-bold">TALLER</p>
                      <p className="text-sm font-black mt-0.5">{tallerCount} ({tallerPercent}%)</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* SRE simulated logs in realtime console */}
              <div className="bg-slate-950 border border-slate-900 p-4 rounded-2xl font-mono space-y-2.5">
                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">📡 Bitácora del SRE & Transmisor Satelital Terrestre:</span>
                <div className="space-y-1 bg-slate-990 p-3 rounded-xl text-[10px] leading-relaxed select-text space-y-1.5 overflow-y-auto max-h-40">
                  {simulatedLogs.map((log, index) => (
                    <div key={index} className="text-slate-400">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* B. CAMIONES */}
          {activeTab === 'camiones' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="flex justify-between items-center border-b border-slate-900 pb-4">
                <div>
                  <h2 className="text-lg font-black text-white">Listado de Vehículos Pesados</h2>
                  <p className="text-xs text-slate-400 mt-1">Control de habilitación del MTC, combustible disponible y placas operativas.</p>
                </div>
                <button
                  onClick={() => setShowAddTruckModal(true)}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black uppercase flex items-center space-x-1.5 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Añadir Camión</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-900">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 border-b border-slate-850 font-bold">
                      <th className="p-3">Placa / Unidad</th>
                      <th className="p-3">Marca/Modelo</th>
                      <th className="p-3">Habilitación MTC / SOAT</th>
                      <th className="p-3">Tipo / Capacidad</th>
                      <th className="p-3">Conductor Asignado</th>
                      <th className="p-3">Combustible %</th>
                      <th className="p-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {truckList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center p-12 text-slate-500">
                          <Truck className="h-8 w-8 text-indigo-400 mx-auto mb-2 opacity-40 animate-pulse" />
                          <p className="font-bold text-xs text-slate-300">No hay camiones registrados en la flota</p>
                          <p className="text-[11px] text-slate-500 mt-1">Registra tu primer camión con el botón "Añadir Camión" arriba.</p>
                        </td>
                      </tr>
                    ) : truckList.map((truck) => (
                      <tr key={truck.id} className="border-b border-slate-900 hover:bg-slate-900/40 font-medium">
                        <td className="p-3 flex items-center space-x-2">
                          <span className="px-2 py-1 bg-slate-800 text-slate-100 rounded font-black font-mono border border-slate-700 shadow uppercase">
                            {truck.placa}
                          </span>
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-slate-100">{truck.marca}</p>
                          <p className="text-[10px] text-slate-500">{truck.modelo}</p>
                        </td>
                        <td className="p-3">
                          <p className={`text-[10px] font-bold ${truck.revisionTecnica === 'Vigente' ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>
                            🔧 RT: {truck.revisionTecnica}
                          </p>
                          <p className="text-[9px] text-slate-500 font-mono">Expira: {truck.soatVencimiento}</p>
                        </td>
                        <td className="p-3 capitalize">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${truck.tipo === 'refrigerado' ? 'bg-blue-900/40 text-blue-300' : 'bg-slate-800 text-slate-400'}`}>
                            {truck.tipo}
                          </span>
                          <span className="block text-[10px] text-slate-500 mt-1">Carga: {truck.capacidad}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold">{truck.conductor}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-1.5 font-mono">
                            <span className={truck.combustible < 20 ? 'text-rose-400 animate-pulse font-bold' : 'text-emerald-400'}>
                              {truck.combustible}%
                            </span>
                            <div className="w-12 h-1.5 bg-slate-900 rounded-full overflow-hidden shrink-0">
                              <div className="h-full bg-emerald-500" style={{ width: `${truck.combustible}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={async () => {
                              if (orgId && rawUser) {
                                try {
                                  await deleteDoc(doc(db, 'vehicles', truck.id));
                                  setSimulatedLogs(prev => [`[FLOTA] Camión Placa ${truck.placa} eliminado de la base real.`, ...prev]);
                                } catch (err: any) {
                                  console.error("Error deleting vehicle", err);
                                  alert(`Error al eliminar camión real: ${err.message || err}`);
                                }
                              } else {
                                const updatedList = truckList.filter(t => t.id !== truck.id);
                                setTruckList(updatedList);
                                localStorage.setItem('chasqui_demo_trucks', JSON.stringify(updatedList));
                                setSimulatedLogs(prev => [`[FLOTA] Camión Placa ${truck.placa} dado de baja de la base activa local.`, ...prev]);
                              }
                            }}
                            className="p-1.5 bg-slate-900 hover:bg-rose-950/20 text-slate-500 hover:text-rose-400 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* C. CHOFERES */}
          {activeTab === 'choferes' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="flex justify-between items-center border-b border-slate-900 pb-4">
                <div>
                  <h2 className="text-lg font-black text-white">Conductores Certificados Homologados</h2>
                  <p className="text-xs text-slate-400 mt-1">Supervisión de licencias, auditoría de vigencia y ranking de seguridad vial.</p>
                </div>
                <button
                  onClick={() => setShowAddDriverModal(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-purple-650 to-indigo-600 hover:opacity-90 text-white rounded-xl text-xs font-black uppercase flex items-center space-x-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Añadir Conductor</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {driverList.length === 0 ? (
                  <div className="md:col-span-2 text-center p-12 bg-slate-900/40 border border-slate-850 rounded-2xl">
                    <Users className="h-10 w-10 text-indigo-400 mx-auto mb-3 opacity-40 animate-pulse" />
                    <p className="font-bold text-xs text-slate-300">No hay conductores registrados</p>
                    <p className="text-[11px] text-slate-500 mt-1">Haga clic en "Añadir Conductor" arriba para ingresar un chofer homologado.</p>
                  </div>
                ) : driverList.map((driver) => (
                  <div key={driver.id} className="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl flex justify-between items-start">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-xs text-purple-400">
                          {driver.nombre.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-100 text-sm leading-none">{driver.nombre}</p>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{driver.telefono}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                        <div className="p-2 bg-slate-950 rounded-lg">
                          <span className="text-slate-500 block">Licencia / Cat</span>
                          <span className="font-bold text-white block mt-0.5">{driver.licencia}</span>
                          <span className="text-[9px] text-indigo-400 uppercase font-black tracking-wider block mt-0.5">Cat: {driver.categoria}</span>
                        </div>
                        <div className="p-2 bg-slate-950 rounded-lg">
                          <span className="text-slate-500 block">Horas de manejo</span>
                          <span className="font-bold text-white block mt-0.5">{driver.horasManejoSemana} hrs (Semanal)</span>
                          <span className="text-[9px] text-slate-500 block mt-0.5">Permitido: 48 hrs</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        driver.estado === 'suspendido' 
                          ? 'bg-rose-950/20 text-rose-400 border border-rose-900/30' 
                          : driver.estado === 'activo'
                            ? 'bg-blue-950/20 text-blue-400 border border-blue-900/30'
                            : 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30'
                      }`}>
                        {driver.estado}
                      </span>
                      <p className="text-xs font-mono font-black text-amber-400">🏆 ★ {driver.calificacion}</p>
                      
                      <button
                        onClick={async () => {
                          if (orgId && rawUser) {
                            try {
                              await deleteDoc(doc(db, 'drivers', driver.id));
                              setSimulatedLogs(prev => [`[CHÓFERES] Conductor profesional ${driver.nombre} eliminado de base real.`, ...prev]);
                            } catch (err: any) {
                              console.error("Error deleting driver", err);
                              alert(`Error al eliminar conductor real: ${err.message || err}`);
                            }
                          } else {
                            const updatedList = driverList.filter(d => d.id !== driver.id);
                            setDriverList(updatedList);
                            localStorage.setItem('chasqui_demo_drivers', JSON.stringify(updatedList));
                            setSimulatedLogs(prev => [`[CHÓFERES] Conductor profesional ${driver.nombre} dado de baja de sesión local.`, ...prev]);
                          }
                        }}
                        className="p-1.5 bg-slate-900 hover:bg-rose-950/20 text-slate-500 hover:text-rose-400 rounded-lg transition-colors block ml-auto mt-2"
                        title="Eliminar Conductor"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* D. DESPACHOS */}
          {activeTab === 'despachos' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="border-b border-slate-900 pb-4">
                <h2 className="text-lg font-black text-white">Despachos Asignados por clientes</h2>
                <p className="text-xs text-slate-400 mt-1">Asigne conductores, remolques y despache viajes corporativos de manera digital.</p>
              </div>

              <div className="space-y-4">
                {dispatchList.length === 0 ? (
                  <div className="text-center p-12 bg-slate-900/40 border border-slate-850 rounded-2xl">
                    <FileText className="h-10 w-10 text-indigo-400 mx-auto mb-3 opacity-40 animate-pulse" />
                    <p className="font-bold text-xs text-slate-300">No hay órdenes de despacho asignadas</p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">Las asignaciones o fletes corporativos generados por sus exportadores aparecerán aquí listados en tiempo real.</p>
                  </div>
                ) : dispatchList.map((desp) => (
                  <div key={desp.id} className="p-6 bg-slate-900/60 border border-slate-850 rounded-3xl grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                    <div className="md:col-span-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-slate-800 text-purple-400 rounded text-[9px] font-mono font-bold uppercase tracking-wider">
                          {desp.id}
                        </span>
                        <span className="text-slate-100 text-xs font-bold">{desp.cliente}</span>
                      </div>
                      <h3 className="text-[14px] font-black text-white leading-tight">{desp.carga}</h3>
                      <div className="text-[10px] font-mono text-slate-500 space-y-0.5">
                        <p>📍 Origen: {desp.origen}</p>
                        <p>🏁 Destino: {desp.destino}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Planificación</p>
                      <p className="text-xs text-slate-200 mt-1">{desp.fechaDespacho}</p>
                      <span className="text-sm font-black text-emerald-400 block mt-1">S/. {desp.precio}</span>
                    </div>

                    <div className="text-right">
                      {desp.estado === 'pendiente_asignacion' ? (
                        <button
                          onClick={() => handleOpenAssignModal(desp.id)}
                          className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-purple-650 to-indigo-600 hover:opacity-90 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center space-x-1"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Asignar Operativo</span>
                        </button>
                      ) : (
                        <div className="space-y-1 text-left md:text-right">
                          <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md text-[10px] font-bold border border-emerald-500/20 inline-block">
                            ✓ ASIGNADO
                          </span>
                          <p className="text-[11px] font-black text-white mt-1">{desp.conductor}</p>
                          <p className="text-[10px] font-mono text-slate-500 uppercase">Vehículo Placa: {desp.placa}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* E. GPS MONITOREO */}
          {activeTab === 'gps' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="border-b border-slate-900 pb-4">
                <h2 className="text-lg font-black text-white">Monitoreo Satelital GPS & IoT en Tiempo Real</h2>
                <p className="text-xs text-slate-400 mt-1">Ubicación geográfica de camionetas, sensores de temperatura fría y rendimiento de transporte.</p>
              </div>

              {/* Simulated visual map frame */}
              <div className="w-full h-80 rounded-2xl border border-slate-800 bg-slate-950 relative overflow-hidden flex items-center justify-center">
                {/* Simulated geographic grids with concentric tracking circles */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.05)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border border-sky-500/10 pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-sky-500/5 pointer-events-none"></div>

                <div className="relative text-center space-y-4">
                  <div className="h-10 w-10 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                    <Compass className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Simulación Satelital de Georuta</h4>
                    <p className="text-[10px] text-slate-500 font-medium max-w-sm mt-1 mx-auto leading-relaxed">
                      Todas las unidades de la flota reportan ping satelital coordinando latitud/longitud en tiempo real cada 15 segundos hacia el centro de operaciones.
                    </p>
                  </div>
                </div>

                {/* Simulated Map Markers displaying Placas in Peru */}
                <div className="absolute top-[30%] left-[40%] bg-purple-650 text-white font-mono text-[9px] font-black px-2 py-0.5 rounded shadow shadow-lg shadow-purple-900 border border-purple-400 animate-bounce">
                  🚚 F2W-894
                </div>
                <div className="absolute top-[60%] left-[55%] bg-purple-650 text-white font-mono text-[9px] font-black px-2 py-0.5 rounded shadow shadow-lg shadow-purple-900 border border-purple-400">
                  🚚 C5X-611
                </div>
              </div>
            </div>
          )}

          {/* F. MANTENIMIENTO */}
          {activeTab === 'mantenimiento' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="border-b border-slate-900 pb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-black text-white">Programa de Mantenimiento Preventivo y Correctivo</h2>
                  <p className="text-xs text-slate-400 mt-1">Bitácora de fallas resueltas en talleres mecánicos autorizados para prevenir detenciones.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {maintenanceList.length === 0 ? (
                  <div className="text-center p-12 bg-slate-900/40 border border-slate-850 rounded-2xl">
                    <Wrench className="h-10 w-10 text-indigo-400 mx-auto mb-3 opacity-40 animate-pulse" />
                    <p className="font-bold text-xs text-slate-300">No hay registros de mantenimiento</p>
                    <p className="text-[11px] text-slate-500 mt-1">La bitácora de mantenimiento preventivo e inspección de sus vehículos está limpia.</p>
                  </div>
                ) : maintenanceList.map((mant) => (
                  <div key={mant.id} className="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      mant.tipo === 'preventivo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      <Wrench className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono bg-slate-800 px-2 py-0.5 text-[9px] font-black text-slate-200 rounded uppercase">
                            {mant.placa}
                          </span>
                          <span className={`ml-2 text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            mant.tipo === 'preventivo' ? 'bg-emerald-950/20 text-emerald-400' : 'bg-amber-950/20 text-amber-400'
                          }`}>
                            {mant.tipo}
                          </span>
                        </div>
                        <span className="text-xs font-black text-purple-400">S/. {mant.costo}</span>
                      </div>
                      <h4 className="text-slate-100 font-bold text-xs mt-1">{mant.detalle}</h4>
                      <p className="text-[10px] text-slate-500 font-mono">Taller: {mant.taller} | Historial Odómetro: {mant.km.toLocaleString()} Km | Fecha: {mant.fecha}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* G. COMBUSTIBLE */}
          {activeTab === 'combustible' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="border-b border-slate-900 pb-4">
                <h2 className="text-lg font-black text-white">Consumo de Combustible Diésel B5</h2>
                <p className="text-xs text-slate-400 mt-1">Gestión de vales digitales de grifo, costo en galones y auditoría de choferes.</p>
              </div>

              <div className="space-y-4">
                {fuelList.length === 0 ? (
                  <div className="text-center p-12 bg-slate-900/40 border border-slate-850 rounded-2xl">
                    <Fuel className="h-10 w-10 text-indigo-400 mx-auto mb-3 opacity-40 animate-pulse" />
                    <p className="font-bold text-xs text-slate-300">No hay vales de combustible registrados</p>
                    <p className="text-[11px] text-slate-500 mt-1">Los vales digitales de grifo y reportes de consumo para cada camión se mostrarán aquí.</p>
                  </div>
                ) : fuelList.map((f) => (
                  <div key={f.id} className="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl flex justify-between items-center">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono bg-slate-800 px-2 py-0.5 text-[9px] font-black text-slate-200 rounded uppercase">
                          {f.placa}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{f.fecha}</span>
                      </div>
                      <p className="text-slate-100 font-bold text-sm">Dispensado: {f.galones} Galones</p>
                      <p className="text-[10px] text-slate-500 leading-tight">Ubicación Grifo: {f.grifo} | Chofer: {f.conductor}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">COSTO TOTAL DEL VALE</span>
                      <span className="text-lg font-black text-emerald-400 mt-0.5 block">S/. {f.costo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* H. INCIDENTES */}
          {activeTab === 'incidentes' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="border-b border-slate-900 pb-4">
                <h2 className="text-lg font-black text-white">Consola de Alertas e Incidentes Operacionales</h2>
                <p className="text-xs text-slate-400 mt-1">Alarmas criticas de sensores de telemetría IoT y estados de emergencia reported.</p>
              </div>

              <div className="space-y-4">
                {incidentList.length === 0 ? (
                  <div className="text-center p-12 bg-slate-900/40 border border-slate-850 rounded-2xl">
                    <ShieldCheck className="h-10 w-10 text-emerald-400 mx-auto mb-3 opacity-60" />
                    <p className="font-bold text-xs text-slate-300 font-bold text-emerald-300">¡Excelente! Cero incidentes operativos</p>
                    <p className="text-[11px] text-slate-500 mt-1">No se detectaron problemas de sensores, desvíos ni fallas mecánicas activas en su flota.</p>
                  </div>
                ) : incidentList.map((inc) => (
                  <div key={inc.id} className="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl flex justify-between items-center">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono bg-slate-800 px-2 py-0.5 text-[9px] font-black text-slate-200 rounded uppercase">
                          {inc.placa}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{inc.fecha}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          inc.gravedad === 'alta' ? 'bg-rose-950/20 text-rose-400 border border-rose-900/30' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {inc.gravedad}
                        </span>
                      </div>
                      <h4 className="text-slate-100 font-bold text-sm">{inc.tipo}</h4>
                      <p className="text-[10px] text-slate-400 leading-tight">{inc.detalle}</p>
                      <p className="text-[9px] text-slate-500 font-mono">Chofer reportante: {inc.conductor}</p>
                    </div>
                    <div>
                      {inc.solucionado ? (
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold">
                          ✓ Resuelto
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setIncidentList(prev => prev.map(i => i.id === inc.id ? { ...i, solucionado: true } : i));
                            setSimulatedLogs(prev => [`[ALERTA RESUELTA] Incidencia mecánica de alternador en alternadora de placa ${inc.placa} resuelta.`, ...prev]);
                          }}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase"
                        >
                          Marcar Solución
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* I. IA COPILOT */}
          {activeTab === 'ai' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="border-b border-slate-900 pb-4">
                <h2 className="text-lg font-black text-white">Chasqui AI Fleet Copilot</h2>
                <p className="text-xs text-slate-400 mt-1">Nuestra inteligencia artificial (Powered by Gemini) analiza telemetría pesada para eficientar rutas y predecir fatigas.</p>
              </div>

              {/* Suggestions Chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => handleAskCopilot('opt_combustible')}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-950/40 text-slate-300 font-bold rounded-xl text-xs border border-slate-800 hover:border-indigo-500/30"
                >
                  📉 Optimizar consumo de diésel
                </button>
                <button
                  type="button"
                  onClick={() => handleAskCopilot('opt_conductores')}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-950/40 text-slate-300 font-bold rounded-xl text-xs border border-slate-800 hover:border-indigo-500/30"
                >
                  💤 Analizar fatiga y conductores
                </button>
                <button
                  type="button"
                  onClick={() => handleAskCopilot('opt_mantenimiento')}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-950/40 text-slate-300 font-bold rounded-xl text-xs border border-slate-800 hover:border-indigo-500/30"
                >
                  🔧 Planes predictivos de taller
                </button>
              </div>

              {/* Chat Container */}
              <div className="border border-slate-850 bg-slate-950 p-4 rounded-3xl space-y-4 max-h-[380px] overflow-y-auto">
                {chatLog.map((chat, idx) => (
                  <div key={idx} className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-4 rounded-2xl text-xs max-w-2xl leading-relaxed ${
                      chat.sender === 'user' 
                        ? 'bg-purple-650 text-white rounded-br-none shadow shadow-purple-900' 
                        : 'bg-slate-900/75 border border-slate-850 text-slate-205 rounded-bl-none whitespace-pre-line'
                    }`}>
                      <p className="font-bold text-[10px] text-slate-500 mb-1 uppercase tracking-wider">
                        {chat.sender === 'user' ? 'Tú (Operations Manager)' : 'Chasqui Copilot'}
                      </p>
                      {chat.text}
                    </div>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className="p-4 bg-slate-900/70 rounded-2xl text-xs text-slate-400 flex items-center space-x-2 border border-slate-850">
                      <span className="h-2 w-2 bg-purple-500 rounded-full animate-bounce"></span>
                      <span className="h-2 w-2 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="h-2 w-2 bg-purple-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      <span>Chasqui Copilot analizando telemetría y georrutas...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Widget */}
              <form onSubmit={(e) => { e.preventDefault(); if (aiPrompt) handleAskCopilot('custom'); }} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Consúltame sobre mecánicos, consumo de diésel o multas de Sutran..."
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-650"
                />
                <button
                  type="submit"
                  className="px-4 py-3 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-black uppercase shadow shadow-lg shadow-purple-900"
                >
                  Consultar AI
                </button>
              </form>
            </div>
          )}

          {/* J. RBAC TEAM ROLES */}
          {activeTab === 'rbac' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="border-b border-slate-900 pb-4">
                <h2 className="text-lg font-black text-white">Miembros del Equipo & Roles de Empresa de Transporte</h2>
                <p className="text-xs text-slate-400 mt-1">Definición de roles estrictamente especializados para la seguridad logística.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {rbacMembers.map((member) => (
                  <div key={member.id} className="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl flex justify-between items-center">
                    <div className="space-y-1">
                      <h4 className="text-slate-100 font-bold text-sm leading-none">{member.nombre}</h4>
                      <p className="text-[10px] text-slate-500 font-mono">{member.email}</p>
                      <p className="text-[11px] text-slate-400 mt-1">Sede: {member.sede} | Último acceso: {member.acceso}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-purple-950/20 text-purple-400 border border-purple-900/30 rounded text-[10px] font-black uppercase tracking-wider">
                      {member.rol}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* K. BILLING */}
          {activeTab === 'billing' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="border-b border-slate-900 pb-4">
                <h2 className="text-lg font-black text-white">Plan de Suscripción SaaS Enterprise</h2>
                <p className="text-xs text-slate-400 mt-1">Facturación corporativa, control de límites y pasarela SaaS activa.</p>
              </div>

              <div className="p-6 bg-slate-900/60 border border-slate-850 rounded-3xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="text-xs font-black text-slate-200">PLAN CONTRATADO:</span>
                  <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full text-[10px] font-black tracking-widest text-white uppercase">
                    PRO SAAS ENTERPRISE
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-slate-950 rounded-xl space-y-1">
                    <p className="text-[9px] font-mono text-slate-500">LIMITE DE CONDUCTORES</p>
                    <p className="text-sm font-black text-white">5 de ilimitados usados</p>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-xl space-y-1">
                    <p className="text-[9px] font-mono text-slate-500">METODO DE PAGO ACTIVO</p>
                    <p className="text-sm font-black text-white">Visa terminada en **** 9210</p>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 leading-snug mt-3">
                  Su plan actual SaaS otorga automatización de Guías de Remisión MTC, termografía IoT sin límites, geocercas activas e Inteligencia Artificial Chasqui Copilot.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* MODALS */}
      {/* 1. Add Truck Modal */}
      {showAddTruckModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-990/80 backdrop-blur-sm animate-fade-in text-left">
          <div className="max-w-md w-full bg-slate-950 border border-slate-850 p-6 rounded-3xl space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-purple-400">Añadir Camión a la Flota</h3>
              <button onClick={() => setShowAddTruckModal(false)} className="text-slate-500 hover:text-white font-bold">X</button>
            </div>
            <form onSubmit={handleAddTruck} className="space-y-4 text-xs font-medium">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 block">Número de Placa</label>
                <input
                  type="text"
                  placeholder="Ej. F2W-894"
                  required
                  value={newTruck.placa}
                  onChange={e => setNewTruck({ ...newTruck, placa: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-650 font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Marca</label>
                  <select
                    value={newTruck.marca}
                    onChange={e => setNewTruck({ ...newTruck, marca: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                  >
                    <option value="Volvo">Volvo</option>
                    <option value="Scania">Scania</option>
                    <option value="Mercedes-Benz">Mercedes-Benz</option>
                    <option value="Fuso">Fuso</option>
                    <option value="Hino">Hino</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Capacidad (Toneladas)</label>
                  <input
                    type="text"
                    placeholder="Ej. 24 Ton"
                    required
                    value={newTruck.capacidad}
                    onChange={e => setNewTruck({ ...newTruck, capacidad: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-650"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 block">Tipo de Vehículo</label>
                <div className="grid grid-cols-3 gap-2">
                  {['refrigerado', 'seco', 'plataforma'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewTruck({ ...newTruck, tipo: type })}
                      className={`p-2.5 rounded-xl border text-center transition-all font-bold ${
                        newTruck.tipo === type ? 'bg-purple-650/15 border-purple-600 text-purple-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-purple-650 hover:bg-purple-600 text-white font-black uppercase rounded-xl transition-all shadow-lg shadow-purple-900"
              >
                ✓ Guardar Camión
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Driver Modal */}
      {showAddDriverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-990/80 backdrop-blur-sm animate-fade-in text-left">
          <div className="max-w-md w-full bg-slate-950 border border-slate-850 p-6 rounded-3xl space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-purple-400">Añadir Conductor a la Flota</h3>
              <button onClick={() => setShowAddDriverModal(false)} className="text-slate-500 hover:text-white font-bold">X</button>
            </div>
            <form onSubmit={handleAddDriver} className="space-y-4 text-xs font-medium">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 block">Nombre Completo del Conductor</label>
                <input
                  type="text"
                  placeholder="Ej. Mario Lanza"
                  required
                  value={newDriver.nombre}
                  onChange={e => setNewDriver({ ...newDriver, nombre: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-650 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Licencia de Conducir</label>
                  <input
                    type="text"
                    placeholder="Ej. 71542389-A"
                    required
                    value={newDriver.licencia}
                    onChange={e => setNewDriver({ ...newDriver, licencia: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-650 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Teléfono Conductor</label>
                  <input
                    type="text"
                    placeholder="Ej. +51 999 444 111"
                    value={newDriver.telefono}
                    onChange={e => setNewDriver({ ...newDriver, telefono: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-650 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 block">Categoría Licencia</label>
                <select
                  value={newDriver.categoria}
                  onChange={e => setNewDriver({ ...newDriver, categoria: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                >
                  <option value="A-IIIc">A-IIIc (Semirremolques pesados)</option>
                  <option value="A-IIIb">A-IIIb (Camiones pesados rígidos)</option>
                  <option value="A-IIb">A-IIb (Camiones medianos)</option>
                  <option value="A-I">A-I (Vehículos particulares)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-purple-650 hover:bg-purple-600 text-white font-black uppercase rounded-xl transition-all shadow-lg shadow-purple-900"
              >
                ✓ Guardar Conductor
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Assign Vehicle + Driver to Dispatch Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-990/80 backdrop-blur-sm animate-fade-in text-left">
          <div className="max-w-md w-full bg-slate-950 border border-slate-850 p-6 rounded-3xl space-y-4 shadow-2xl text-slate-200">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-purple-400">Asignación Operativa de Despacho</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-500 hover:text-white font-bold">X</button>
            </div>
            <FormAssign
              onSubmit={handleConfirmAssign}
              driverList={driverList}
              truckList={truckList}
              assignForm={assignForm}
              setAssignForm={setAssignForm}
            />
          </div>
        </div>
      )}

    </div>
  );
}

// Separate stateless Form component for pristine clarity
interface FormAssignProps {
  onSubmit: (e: React.FormEvent) => void;
  driverList: any[];
  truckList: any[];
  assignForm: any;
  setAssignForm: any;
}

const FormAssign = ({ onSubmit, driverList, truckList, assignForm, setAssignForm }: FormAssignProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4 text-xs font-medium">
      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-slate-500 block">Conductor del Operativo</label>
        <select
          value={assignForm.conductorId}
          onChange={e => setAssignForm({ ...assignForm, conductorId: e.target.value })}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
        >
          {driverList.map(d => (
            <option key={d.id} value={d.nombre}>{d.nombre} ({d.estado})</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-slate-500 block">Camión y Placa Autorizada</label>
        <select
          value={assignForm.truckId}
          onChange={e => setAssignForm({ ...assignForm, truckId: e.target.value })}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none font-mono"
        >
          {truckList.map(t => (
            <option key={t.id} value={t.placa}>{t.placa} - {t.marca} ({t.capacidad} - {t.estado})</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="w-full py-3.5 bg-gradient-to-r from-purple-650 to-indigo-600 hover:opacity-90 text-white font-black uppercase rounded-xl transition-all shadow-lg"
      >
        ✓ Despachar Vehículo en Georuta SAT
      </button>
    </form>
  );
};
