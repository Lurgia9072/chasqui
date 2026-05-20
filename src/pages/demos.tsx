import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Package, Truck, Building2, ShieldCheck, ArrowRight, Check, X,
  Plus, Edit, Trash2, MapPin, Map, Navigation, Shield, DollarSign,
  AlertTriangle, CheckCircle2, List, FileText, User, Compass, HelpCircle,
  TrendingUp, Thermometer, Database, Award, ClipboardCheck, Play, ArrowLeft, Fuel, Activity, Clock
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { motion, AnimatePresence } from 'motion/react';

// Demos Specific Types
type DemoType = 'comerciante' | 'transportista' | 'exportadora' | 'empresa_transporte';

export const Demos = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialType = (searchParams.get('type') as DemoType) || 'comerciante';
  const [activeDemo, setActiveDemo] = useState<DemoType>(initialType);

  // Sync state with URL params
  useEffect(() => {
    const typeFromUrl = searchParams.get('type') as DemoType;
    if (typeFromUrl && typeFromUrl !== activeDemo) {
      setActiveDemo(typeFromUrl);
    }
  }, [searchParams]);

  const handleSwitchDemo = (type: DemoType) => {
    setActiveDemo(type);
    setSearchParams({ type });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-600 selection:text-white font-sans">
      {/* Dynamic Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-950/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-950/15 rounded-full blur-[130px]"></div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        {/* Hub Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-505/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
            — CHASQUI SANDBOX REVOLUTION —
          </span>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-none">
            Demos de Simulación <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-purple-400 bg-clip-text text-transparent italic normal-case font-serif">por Industria</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium">
            Prueba cómo interactúa cada perfil logístico adaptado específicamente a su nivel operativo sin mezclar interfaces.
          </p>
        </div>

        {/* Outer Grid Selector */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-5xl mx-auto mb-10">
          <button
            onClick={() => handleSwitchDemo('comerciante')}
            className={`p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-28 group ${
              activeDemo === 'comerciante' 
                ? 'border-orange-500/50 bg-orange-950/10 shadow-lg shadow-orange-500/5 text-white' 
                : 'border-slate-900 bg-slate-900/40 hover:border-slate-800 text-slate-400'
            }`}
          >
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${
              activeDemo === 'comerciante' ? 'bg-orange-500 text-white' : 'bg-slate-900 text-slate-500'
            }`}>
              <Package className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider">📦 Comerciante / MYPE</h3>
              <p className="text-[10px] text-slate-500 font-medium">Carga casual & Mudanza</p>
            </div>
          </button>

          <button
            onClick={() => handleSwitchDemo('transportista')}
            className={`p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-28 group ${
              activeDemo === 'transportista' 
                ? 'border-emerald-500/50 bg-emerald-950/10 shadow-lg shadow-emerald-500/5 text-white' 
                : 'border-slate-900 bg-slate-900/40 hover:border-slate-800 text-slate-400'
            }`}
          >
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${
              activeDemo === 'transportista' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-slate-500'
            }`}>
              <Truck className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider">🚛 Transportista</h3>
              <p className="text-[10px] text-slate-500 font-medium">Bolsa de fletes directa</p>
            </div>
          </button>

          <button
            onClick={() => handleSwitchDemo('exportadora')}
            className={`p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-28 group ${
              activeDemo === 'exportadora' 
                ? 'border-indigo-500/50 bg-indigo-950/10 shadow-lg shadow-indigo-500/5 text-white' 
                : 'border-slate-900 bg-slate-900/40 hover:border-slate-800 text-slate-400'
            }`}
          >
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${
              activeDemo === 'exportadora' ? 'bg-indigo-500 text-white' : 'bg-slate-900 text-slate-500'
            }`}>
              <Building2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider">🌎 Exportadora / Import</h3>
              <p className="text-[10px] text-slate-500 font-medium">SaaS frío & IA aduanas</p>
            </div>
          </button>

          <button
            onClick={() => handleSwitchDemo('empresa_transporte')}
            className={`p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-28 group ${
              activeDemo === 'empresa_transporte' 
                ? 'border-purple-500/50 bg-purple-950/10 shadow-lg shadow-purple-500/5 text-white' 
                : 'border-slate-900 bg-slate-900/40 hover:border-slate-800 text-slate-400'
            }`}
          >
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${
              activeDemo === 'empresa_transporte' ? 'bg-purple-500 text-white' : 'bg-slate-900 text-slate-500'
            }`}>
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider">🚚 Empresa Flotas</h3>
              <p className="text-[10px] text-slate-500 font-medium">Multiunidad & Mantenimiento</p>
            </div>
          </button>
        </div>

        {/* Active Demo Canvas */}
        <div className="bg-slate-900/60 border border-slate-900 rounded-[2rem] p-6 lg:p-10 relative overflow-hidden min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeDemo === 'comerciante' && <DemoComerciante key="comerciante" />}
            {activeDemo === 'transportista' && <DemoTransportista key="transportista" />}
            {activeDemo === 'exportadora' && <DemoExportadora key="exportadora" />}
            {activeDemo === 'empresa_transporte' && <DemoEmpresaTransporte key="empresa_transporte" />}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

/* ==========================================================================
   A. DEMO COMERCIANTE / MYPE
   ========================================================================== */
const DemoComerciante = () => {
  const [cargas, setCargas] = useState([
    { id: 'DEMO-101', origen: 'Santiago de Surco, Lima', destino: 'La Molina, Lima', desc: 'Mudanza residencial (Sofá, camas, cajas)', estado: 'Asignado', pago: 'S/. 350', custodia: 'Depositado en Custodia', chofer: 'Ernesto Silva' },
    { id: 'DEMO-102', origen: 'San Martín de Porres, Lima', destino: 'Chorrillos, Lima', desc: '20 sacos de papas nativas (MYPE)', estado: 'Creado', pago: 'S/. 180', custodia: 'Pendiente depósito', chofer: 'Sin asignar' }
  ]);
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [desc, setDesc] = useState('');
  const [pago, setPago] = useState('');
  const [simStep, setSimStep] = useState(1); // 1: Creado, 2: Asignado, 3: En Camino, 4: Entregado
  const [evidenceUploaded, setEvidenceUploaded] = useState(false);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origen || !destino) return;
    const newId = `DEMO-${Math.floor(Math.random() * 900) + 100}`;
    setCargas([{
      id: newId,
      origen,
      destino,
      desc: desc || 'Carga general ocasional',
      estado: 'Creado',
      pago: pago ? `S/. ${pago}` : 'S/. 150',
      custodia: 'Pendiente depósito',
      chofer: 'Sin asignar'
    }, ...cargas]);
    setOrigen('');
    setDestino('');
    setDesc('');
    setPago('');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8 text-left">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-6 border-b border-slate-800 pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-orange-950 text-orange-400 border border-orange-900 text-[9px] font-black uppercase tracking-widest mb-2">
            🌱 CLIENTE CASUAL / PORTAL MYPES
          </span>
          <h2 className="text-2xl font-black text-white uppercase italic">Módulo de Carga Ocasional & Mudanzas</h2>
          <p className="text-xs text-slate-400 max-w-xl font-medium">
            Sube lotes eventuales, fletes familiares o mudanzas y coordina de manera directa sin pagar suscripciones mensuales.
          </p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-orange-950/20 border border-orange-900/30 font-mono text-[10px] text-orange-400">
          🔓 SEGMENTO INDEPENDIENTE HABILITADO
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Input Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-slate-950 border border-slate-850 rounded-2xl space-y-4">
            <h3 className="text-xs font-black uppercase text-white tracking-widest">📦 Publicar Nueva Solicitud</h3>
            
            <form onSubmit={handlePublish} className="space-y-4 text-xs font-medium">
              <div className="space-y-1.5">
                <label className="text-slate-400">Dirección de Origen</label>
                <input 
                  type="text" 
                  value={origen} 
                  onChange={(e) => setOrigen(e.target.value)}
                  placeholder="Ej: Av. Primavera 123, Surco" 
                  className="w-full h-10 px-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400">Dirección de Destino</label>
                <input 
                  type="text" 
                  value={destino} 
                  onChange={(e) => setDestino(e.target.value)}
                  placeholder="Ej: Calle Las Piedras, La Molina" 
                  className="w-full h-10 px-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-400">Descripción / Items</label>
                  <input 
                    type="text" 
                    value={desc} 
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Ej: 3 camas, 1 refri" 
                    className="w-full h-10 px-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400">Oferta Inicial (S/.)</label>
                  <input 
                    type="number" 
                    value={pago} 
                    onChange={(e) => setPago(e.target.value)}
                    placeholder="Eg: 350" 
                    className="w-full h-10 px-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black text-[10px] uppercase tracking-wider py-3 rounded-xl shadow-lg shadow-orange-500/10">
                Publicar en Sandbox
              </Button>
            </form>
          </div>

          {/* Active Demeo Cargas list */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Tus Solicitudes en Tiempo Real</h4>
            <div className="space-y-3">
              {cargas.map((c) => (
                <div key={c.id} className="p-4 bg-slate-900/60 border border-slate-850 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-orange-400 font-black">{c.id}</span>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                        c.estado === 'Asignado' ? 'bg-sky-950 text-sky-450 border border-sky-900' : 'bg-slate-950 text-slate-500 border border-slate-850'
                      }`}>{c.estado}</span>
                    </div>
                    <p className="text-xs font-bold text-white truncate">{c.origen} → {c.destino}</p>
                    <p className="text-[10px] text-slate-400 truncate">{c.desc}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-emerald-400">{c.pago}</p>
                    <p className="text-[8px] font-bold text-slate-500">{c.custodia}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Simulation Walkthrough of Tracking & Escrow */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 bg-slate-950 border border-slate-850 rounded-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">🛰️ Simulador de Viaje y Custodia Segura</h3>
              <span className="text-[9px] bg-emerald-950/40 text-emerald-400 border border-emerald-900/35 px-2 py-0.5 rounded font-black uppercase tracking-wider">CUSTODIA ACTIVA</span>
            </div>

            {/* Travel Roadmap UI */}
            <div className="grid grid-cols-4 gap-2 relative">
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-800 z-0"></div>
              
              <button onClick={() => setSimStep(1)} className="z-10 flex flex-col items-center gap-1.5 text-center group">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border font-mono text-xs font-black transition-all ${
                  simStep >= 1 ? 'bg-orange-500 border-orange-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}>1</div>
                <span className="text-[9px] font-black uppercase tracking-wider">Publicado</span>
              </button>

              <button onClick={() => setSimStep(2)} className="z-10 flex flex-col items-center gap-1.5 text-center group">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border font-mono text-xs font-black transition-all ${
                  simStep >= 2 ? 'bg-orange-500 border-orange-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}>2</div>
                <span className="text-[9px] font-black uppercase tracking-wider">Asignado</span>
              </button>

              <button onClick={() => setSimStep(3)} className="z-10 flex flex-col items-center gap-1.5 text-center group">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border font-mono text-xs font-black transition-all ${
                  simStep >= 3 ? 'bg-orange-500 border-orange-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}>3</div>
                <span className="text-[9px] font-black uppercase tracking-wider">En Camino</span>
              </button>

              <button onClick={() => setSimStep(4)} className="z-10 flex flex-col items-center gap-1.5 text-center group">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border font-mono text-xs font-black transition-all ${
                  simStep >= 4 ? 'bg-orange-500 border-orange-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}>4</div>
                <span className="text-[9px] font-black uppercase tracking-wider">Entregado</span>
              </button>
            </div>

            {/* Interactive Demo Map/GPS simulated container */}
            <div className="p-4 bg-slate-900 rounded-2xl space-y-4">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></div>
                  <span>MONITOREO DE VIAJE ACTIVO // LIMA GPS v2.0</span>
                </div>
                <span>CONEXIÓN MOVISTAR 4G</span>
              </div>

              {/* Simulated Map Render */}
              <div className="relative h-44 rounded-xl overflow-hidden bg-slate-950 border border-slate-850 flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-35"></div>
                <div className="absolute top-1/2 left-1/4 w-2 h-2 rounded-full bg-orange-500"></div>
                <div className="absolute top-1/2 left-3/4 w-2 h-2 rounded-full bg-violet-500"></div>
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 120 88 Q 230 110 350 88" fill="none" stroke="#f97316" strokeWidth="2" strokeDasharray="4 4" />
                </svg>

                {/* Simulated GPS indicator overlay */}
                <div className="absolute bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2 max-w-xs left-1/2 transform -translate-x-1/2 bottom-3">
                  <Navigation className="h-4 w-4 text-orange-400 animate-pulse shrink-0" />
                  <div className="text-[10px] text-left">
                    <p className="font-bold text-white">Ernesto Silva (Placa C9W-893)</p>
                    <p className="text-slate-400 leading-tight">Camión cruzando Av. Angamos Este</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Escrow status display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-900 border border-slate-850 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <h4 className="font-black text-white uppercase tracking-wider text-[10px]">Custodia Digital de Pago</h4>
                </div>
                <p className="text-slate-400 text-[11px] font-medium leading-normal">
                  Chasqui retiene el flete de forma segura para garantizar que el comerciante reciba el servicio tal como se ofertó, y asegurar que el transportista cobre apenas entregue.
                </p>
                <div className="pt-2 flex items-center gap-1.5 font-mono text-[9px] text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                  <span>Depósito verificado de S/. 350.00</span>
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-850 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-orange-400" />
                  <h4 className="font-black text-white uppercase tracking-wider text-[10px]">Evidencias y Acta Digital</h4>
                </div>
                <p className="text-slate-400 text-[11px] font-medium leading-normal">
                  El chofer toma fotografías de la carga al cargar y descargar. Puedes ver las huellas digitales del descargo antes de autorizar el desembolso final del dinero.
                </p>
                <button 
                  onClick={() => setEvidenceUploaded(!evidenceUploaded)} 
                  className={`mt-2 flex items-center gap-1 text-[9px] px-2 py-1 rounded border transition-colors ${
                    evidenceUploaded 
                      ? 'bg-emerald-950 border-emerald-900 text-emerald-400' 
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-350'
                  }`}
                >
                  {evidenceUploaded ? '✓ Evidencias de entrega cargadas correctamente' : 'Simular carga de Foto/Firma de Recibo'}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

/* ==========================================================================
   B. DEMO TRANSPORTISTA INDEPENDIENTE
   ========================================================================== */
const DemoTransportista = () => {
  const [cargasDisponibles, setCargasDisponibles] = useState([
    { id: 'F-482', origen: 'Chimbote, Ancash', destino: 'Callao, APM Terminal', desc: 'Harina de pescado en sacos', peso: '28 Toneladas', precio: 1850 },
    { id: 'F-920', origen: 'Ica, Fundo San Juan', destino: 'San Borja, Lima', desc: 'Arándano fresco comercial', peso: '14 Toneladas', precio: 1200 },
    { id: 'F-134', origen: 'Lurín, Lima Norte', destino: 'San Luis, Lima', desc: 'Estructuras metálicas', peso: '8 Toneladas', precio: 950 }
  ]);
  const [acceptedFletes, setAcceptedFletes] = useState<any[]>([]);
  const [earningsState, setEarningsState] = useState(3800);

  const handlePostular = (flete: any) => {
    setAcceptedFletes([flete, ...acceptedFletes]);
    setCargasDisponibles(cargasDisponibles.filter(c => c.id !== flete.id));
    setEarningsState(earningsState + flete.precio);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8 text-left">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-6 border-b border-slate-800 pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900 text-[9px] font-black uppercase tracking-widest mb-2">
            🚛 CONDUCTORES / TRANSPORTISTAS INDEPENDIENTES
          </span>
          <h2 className="text-2xl font-black text-white uppercase italic">Radar de Carga para Transportista Certificado</h2>
          <p className="text-xs text-slate-400 max-w-xl font-medium">
            Accede de inmediato a fletes listados directamente por dueños de carga con la custodia de pago garantizada por Chasqui.
          </p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-emerald-950/20 border border-emerald-900/30 font-mono text-[10px] text-emerald-400">
          🛰️ GPS SATELLITE RADAR CONNECTED
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Earnings and accepted trips */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-slate-950 border border-slate-850 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Tu billetera de conductor</p>
            <h3 className="text-3xl font-black text-emerald-400">S/. {earningsState}</h3>
            <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-900/60 mt-3">Saldos asegurados bajo depósito garantizado</p>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Tus viajes aceptados ({acceptedFletes.length})</h4>
            {acceptedFletes.length === 0 ? (
              <div className="p-6 bg-slate-900/40 border border-slate-850 border-dashed rounded-xl text-center text-xs text-slate-500">
                Postula a cargas en el radar derecho para ver tu hoja de ruta aquí.
              </div>
            ) : (
              <div className="space-y-3">
                {acceptedFletes.map(f => (
                  <div key={f.id} className="p-4 bg-slate-950 border border-emerald-500/20 rounded-xl space-y-2">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-indigo-400 font-bold">{f.id}</span>
                      <span className="text-emerald-400 font-bold">PAGO PROTEGIDO</span>
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-white">{f.origen} → {f.destino}</p>
                      <p className="text-slate-400">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Load listings direct and board */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-6">
          <div className="p-6 bg-slate-950 border border-slate-850 rounded-2xl space-y-4">
            <h3 className="text-xs font-black uppercase text-white tracking-widest">🚛 Corredor de Fletes Nacionales (Ica - Lima - Chimbote)</h3>

            <div className="space-y-4">
              {cargasDisponibles.map(f => (
                <div key={f.id} className="p-5 bg-slate-900 border border-slate-850 hover:border-emerald-500/35 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all group">
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-emerald-400 font-black">{f.id}</span>
                      <span className="text-[9px] uppercase font-bold text-slate-500">{f.peso}</span>
                    </div>
                    <h4 className="text-xs font-black text-white">{f.origen} → {f.destino}</h4>
                    <p className="text-[11px] text-slate-400 font-semibold">{f.desc}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-800/60 pt-3 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <p className="text-xs font-black text-emerald-400">S/. {f.precio}</p>
                      <p className="text-[9px] font-bold text-slate-550 uppercase">Escrow Activo</p>
                    </div>
                    <button 
                      onClick={() => handlePostular(f)}
                      className="h-10 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest rounded-lg flex items-center gap-1.5 shadow shadow-emerald-600/10"
                    >
                      <span>Aceptar flete</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

/* ==========================================================================
   C. DEMO EXPORTADORA / IMPORTADORA
   ========================================================================== */
const DemoExportadora = () => {
  const [coldTelemetry, setColdTelemetry] = useState({ temp: -18.2, status: 'Conforme' });
  const [activeFeverAlert, setActiveFeverAlert] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [queryResponse, setQueryResponse] = useState<string | null>(null);

  // Simulated Copilot prompt action
  const handleCopilotQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    if (searchQuery.toLowerCase().includes('ruta') || searchQuery.toLowerCase().includes('camino')) {
      setQueryResponse('Chasqui Copilot ha evaluado 3 rutas. Se sugiere tomar el desvío por la variante de Pasamayo para fletar el camio con arándanos ya que la ruta convencional de la Panamericana presenta retención vehicular de 42 min.');
    } else if (searchQuery.toLowerCase().includes('frio') || searchQuery.toLowerCase().includes('temperatura')) {
      setQueryResponse('Bajo el monitoreo de telemetría, el camión F2W-894 presenta una oscilación térmica tolerable (de -18.1 a -18.5 °C). El sistema de enfriamiento ThermoKing opera con carga inteligente nominal de 85%.');
    } else {
      setQueryResponse('Chasqui IA copiloto logístico recomienda cubicaje tipo paletizado para 24 toneladas métricas optimizado para puertos de DP World Callao, con un ahorro proyectado de combustible de 8.2%');
    }
  };

  const triggerColdAlarm = () => {
    setActiveFeverAlert(true);
    setColdTelemetry({ temp: -8.4, status: 'ALERTA DE DESVIACIÓN' });
  };

  const resolveColdAlarm = () => {
    setActiveFeverAlert(false);
    setColdTelemetry({ temp: -18.4, status: 'Conforme' });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8 text-left">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-6 border-b border-slate-800 pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-900 text-[9px] font-black uppercase tracking-widest mb-2">
            🌎 IMPORTADORES - EXPORTADORES AGRO / MULTINACIONALES
          </span>
          <h2 className="text-2xl font-black text-white uppercase italic">SaaS Corporativo de Cadena de Frío e IA</h2>
          <p className="text-xs text-slate-400 max-w-xl font-medium">
            Supervise contenedores, telemetría térmica crítica IoT y asuma la seguridad aduanera automatizando actas de entrega.
          </p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-indigo-950/20 border border-indigo-900/30 font-mono text-[10px] text-indigo-400">
          🛰️ ENTERPRISE API / TRUCK TELEMETRY CONNECTED
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Cold chain and telemetry logs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-slate-950 border border-slate-850 rounded-2xl space-y-4">
            <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
              <Thermometer className="h-4.5 w-4.5 text-indigo-450" />
              <span>Sensado IoT en Tiempo Real (Piura - Callao)</span>
            </h3>

            {/* Cold chain card status */}
            <div className={`p-5 rounded-2xl border transition-all ${
              activeFeverAlert 
                ? 'bg-red-950/15 border-red-500/30' 
                : 'bg-slate-900 border-slate-850'
            }`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-[10px] font-mono text-indigo-400">SENSOR PLACA A9W-123</span>
                  <h4 className="text-sm font-bold text-white uppercase">Arándano exportación</h4>
                </div>
                <span className={`text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded border border-dashed ${
                  activeFeverAlert 
                    ? 'bg-red-950 text-red-400' 
                    : 'bg-emerald-950 text-emerald-400 border-emerald-900'
                }`}>{coldTelemetry.status}</span>
              </div>

              <div className="flex justify-between items-center text-xs font-mono pt-3 border-t border-slate-800">
                <div>TEMPERATURA SEÑAL: <span className={`text-sm font-black text-white`}>{coldTelemetry.temp} °C</span></div>
                <div>LÍMITE: <span className="text-slate-400">-15 a -22 °C</span></div>
              </div>
            </div>

            {/* Simulation alert button selectors */}
            <div className="flex gap-3">
              <button 
                onClick={triggerColdAlarm}
                className="flex-1 py-2.5 bg-red-950 hover:bg-red-900 text-red-400 border border-red-900/40 text-[9px] font-black uppercase tracking-wider rounded-xl"
              >
                🚨 Simular Desvío Térmico
              </button>
              <button 
                onClick={resolveColdAlarm}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[9px] font-black uppercase tracking-wider rounded-xl"
              >
                Reestablecer Sensor
              </button>
            </div>
          </div>

          {/* Active container list */}
          <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-2xl space-y-4">
            <h3 className="text-xs font-black uppercase text-white tracking-widest">💼 Monitoreo de Contenedores y Escrow Aduanero</h3>
            <div className="space-y-3 font-mono text-[10px] text-slate-400">
              <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-850">
                <span>📦 CNTR-89431 (APM Terminals Callao)</span>
                <span className="text-emerald-400 font-bold">Aprobado APM</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-850">
                <span>📦 CNTR-12844 (DP World Callao)</span>
                <span className="text-pink-400 font-bold">Verificando Puerto</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Logistics copilot prompt */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 bg-slate-950 border border-slate-850 rounded-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-900">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-1.5">
                <Compass className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>Chasqui AI Logistics Copilot</span>
              </h3>
              <span className="text-[9px] bg-indigo-950/40 text-indigo-400 border border-indigo-900/35 px-2 py-0.5 rounded font-black uppercase">GEMINI PRO RECON</span>
            </div>

            <p className="text-[11px] text-slate-400 font-medium">
              Interactúa con el asistente logístico de simulación para planificar rutas frías o cubicaje en contenedores.
            </p>

            <form onSubmit={handleCopilotQuery} className="space-y-3 text-xs">
              <textarea 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ej: ¿Cuál es el mejor desvío de ruta para fletar arándanos fríos desde Piura?"
                className="w-full h-20 p-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-505"
              />
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase">Respuestas basadas en datos reales MTC</span>
                <Button type="submit" className="bg-indigo-650 hover:bg-slate-900 text-white text-[10px] uppercase font-black tracking-wider px-5 py-2.5 h-auto">
                  Preguntar a Copilot
                </Button>
              </div>
            </form>

            {queryResponse && (
              <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-xl space-y-2 mt-4 text-xs">
                <div className="flex items-center gap-1.5 font-black text-indigo-400 text-[10px] uppercase">
                  <Database className="h-3.5 w-3.5" />
                  <span>RESPUESTA DE COPILOT IA</span>
                </div>
                <p className="text-slate-300 leading-relaxed leading-normal">{queryResponse}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
};

/* ==========================================================================
   D. DEMO EMPRESA DE TRANSPORTE / FLOTAS
   ========================================================================== */
const DemoEmpresaTransporte = () => {
  const [vehicles, setVehicles] = useState([
    { placa: 'F1W-823', chofer: 'Pedro Armas', tipo: 'Seco', combustible: '92% Eficiente', soat: 'SOAT Vigente', soatVence: 'Vence 24 Oct (Válido)' },
    { placa: 'C9R-482', chofer: 'Esteban Lugo', tipo: 'Refrigerado', combustible: '84% Eficiente', soat: 'SOAT Vigente', soatVence: 'Vence 12 Dic (Válido)' },
    { placa: 'A4P-941', chofer: 'Carlos Ramos', tipo: 'Furgón Mediano', combustible: '78% Eficiente', soat: 'ALERTA VENCIMIENTO', soatVence: 'Vence en 2 días' }
  ]);
  const [newPlaca, setNewPlaca] = useState('');
  const [newChofer, setNewChofer] = useState('');
  const [newTipo, setNewTipo] = useState('Seco');

  const addTruckSandbox = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaca || !newChofer) return;
    setVehicles([{
      placa: newPlaca.toUpperCase(),
      chofer: newChofer,
      tipo: newTipo,
      combustible: '100% Eficiente',
      soat: 'SOAT Vigente',
      soatVence: 'Vence 31 Dic (Válido)'
    }, ...vehicles]);
    setNewPlaca('');
    setNewChofer('');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8 text-left">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-6 border-b border-slate-800 pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-900 text-[9px] font-black uppercase tracking-widest mb-2">
            🚚 EMPRESAS MULTI-FLOTAS / ASIGNACIÓN MASIVA
          </span>
          <h2 className="text-2xl font-black text-white uppercase italic">SaaS de Control Unitario Multi-Choferes</h2>
          <p className="text-xs text-slate-400 max-w-xl font-medium">
            Toma el control absoluto de tus unidades operativas, conductores asignados, alertas preventivas del SOAT y productividad.
          </p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-purple-950/20 border border-purple-900/30 font-mono text-[10px] text-purple-400">
          🛰️ FLEET INTELLIGENCE CONSOLE ACTIVE
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Fleet management list */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 bg-slate-950 border border-slate-850 rounded-2xl space-y-4">
            <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-purple-400 shrink-0" />
              <span>Unidades de Flotas Activas</span>
            </h3>

            <div className="space-y-3 font-mono">
              {vehicles.map((v, idx) => (
                <div key={idx} className="p-4 bg-slate-900 border border-slate-850 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-1 text-left">
                    <p className="text-xs font-black text-white">{v.placa} ({v.tipo})</p>
                    <p className="text-[10px] text-slate-400">Chofer asignado: <span className="text-slate-250 font-bold">{v.chofer}</span></p>
                    <p className="text-[9px] text-slate-505">{v.soatVence}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase border flex items-center gap-1 mb-1.5 ${
                      v.soat.includes('ALERTA') 
                        ? 'bg-red-950 border-red-900 text-red-400' 
                        : 'bg-emerald-950 border-emerald-900 text-emerald-400'
                    }`}>
                      {v.soat.includes('ALERTA') && <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></div>}
                      {v.soat}
                    </span>
                    <span className="text-[9px] text-purple-400 font-black tracking-wider uppercase bg-purple-950/40 border border-purple-900/30 px-1.5 py-0.5 rounded shrink-0">{v.combustible}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Fleet CRUD form */}
        <div className="lg:col-span-5 space-y-6 text-xs">
          <div className="p-6 bg-slate-950 border border-slate-850 rounded-2xl space-y-4">
            <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-1">
              <Plus className="h-4.5 w-4.5 text-purple-400 shrink-0" />
              <span>Agregar Unidad al Corredor</span>
            </h3>

            <form onSubmit={addTruckSandbox} className="space-y-4 text-xs font-medium">
              <div className="space-y-1.5">
                <label className="text-slate-400">Placa del Camión</label>
                <input 
                  type="text" 
                  value={newPlaca} 
                  onChange={(e) => setNewPlaca(e.target.value)}
                  placeholder="Ej: A8C-123" 
                  className="w-full h-10 px-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400">Nombre del Chofer</label>
                <input 
                  type="text" 
                  value={newChofer} 
                  onChange={(e) => setNewChofer(e.target.value)}
                  placeholder="Ej: Marcelo Rojas" 
                  className="w-full h-10 px-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400">Tipo de Vehículo</label>
                <select 
                  value={newTipo} 
                  onChange={(e) => setNewTipo(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Seco">Seco / Furgón general</option>
                  <option value="Refrigerado">Refrigerado (Termos)</option>
                  <option value="Plataforma">Plataforma / Granel</option>
                </select>
              </div>

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] uppercase tracking-wider py-3 rounded-xl shadow-lg shadow-purple-500/10">
                Añadir Camión Sandbox
              </Button>
            </form>
          </div>
        </div>

      </div>
    </motion.div>
  );
};
