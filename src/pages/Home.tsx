import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { 
  Truck, 
  Package, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Check, 
  X, 
  Shield, 
  Zap, 
  BarChart3, 
  Lock, 
  Monitor, 
  FileSearch, 
  CreditCard, 
  ArrowRight,
  Star,
  Receipt,
  Headphones,
  Signal,
  CheckCircle2,
  Building2,
  Cpu,
  Sparkles,
  HelpCircle,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/useAuthStore';
import { ADMIN_EMAILS } from '../lib/constants';
import { cn } from '../lib/utils';
import { ChasquiLogo } from '../components/ChasquiLogo';

const SEGMENT_DETAILS = {
  comerciante: {
    badge: '📦 Comerciante / MYPE',
    title: 'Publica cargas ocasionales y mudanzas seguras',
    desc: 'Llega a cientos de transportistas certificados al instante. Paga de forma directa con custodia Chasqui y sigue tu carga en un mapa simple en tiempo real sin contratos.',
    ctaText: 'Publicar mi primera carga gratis',
    ctaLink: '/demos?type=comerciante',
    colorTheme: 'from-orange-550 to-amber-600',
    borderColor: 'hover:border-orange-500/55',
    focusGlow: 'shadow-orange-950/20',
    benefits: [
      'Sin costos de afiliación mensual',
      'Protección Escrow antiestafas de adelanto de fletes',
      'Ubicación satelital rápida enviada al destinatario',
      'Asistencia telefónica Chasqui de carga'
    ],
    demoSuggested: 'Probar Demo Comerciante / MYPE',
    demoLink: '/demos?type=comerciante',
    previewTitle: 'PORTAL CLIENTE RECOJO EN CAMINO',
    previewContent: (
      <div className="space-y-3 font-mono text-left">
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
          <p className="text-[10px] text-orange-400 font-bold">CARGA ID: DEMO-MYPE-421</p>
          <p className="text-xs text-white uppercase font-bold">Lince → Miraflores</p>
          <div className="flex justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/80 mt-1.5">
            <span>Estado: En camino</span>
            <span className="text-emerald-400 font-bold">Custodia: S/. 150</span>
          </div>
        </div>
      </div>
    )
  },
  transportista: {
    badge: '🚛 Transportista Independiente',
    title: 'Evita retornos vacíos y asegura el pago',
    desc: 'Bolsa de carga directa de pymes y comerciantes. Tarifas transparentes acordadas al instante sin intermediarios abusivos ni comisiones ocultas.',
    ctaText: 'Ver bolsa de fletes vigentes',
    ctaLink: '/demos?type=transportista',
    colorTheme: 'from-emerald-550 to-teal-600',
    borderColor: 'hover:border-emerald-500/55',
    focusGlow: 'shadow-emerald-950/20',
    benefits: [
      'Pago verificado en custodia liberado al entregar',
      'Radar nacional con fletes según ubicación',
      'Evita falsos furgones de regreso vacíos',
      'Historial digital de reputación positiva'
    ],
    demoSuggested: 'Probar Demo Conductor / Transportista',
    demoLink: '/demos?type=transportista',
    previewTitle: 'APP CONDUCTOR RADAR ACTIVADO',
    previewContent: (
      <div className="space-y-3 font-mono text-left">
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
          <div className="flex justify-between">
            <span className="text-[10px] text-emerald-400 font-bold">NUEVO FLETE DISPONIBLE</span>
            <span className="text-white font-bold">S/. 1,850</span>
          </div>
          <p className="text-xs text-slate-300 font-bold">Chimbote → Puerto de Callao (28 Ton)</p>
          <div className="text-[9px] text-slate-500 pt-2 border-t border-slate-800/80 flex justify-between">
            <span>Harina de Pescao</span>
            <span className="text-indigo-405 font-bold">Postular ahora</span>
          </div>
        </div>
      </div>
    )
  },
  exportadora: {
    badge: '🌎 Empresa Exportadora / Import',
    title: 'Control aduanero, cadena de frío e inteligencia artificial',
    desc: 'Unifica tu torre de control logística multiusuario. Monitorea sensores térmicos de frío IoT, geocercas portuarias (APM/DPW) y optimiza fletes con Copilot.',
    ctaText: 'Ver demo de frío & aduanas',
    ctaLink: '/demos?type=exportadora',
    colorTheme: 'from-indigo-550 to-blue-600',
    borderColor: 'hover:border-indigo-500/55',
    focusGlow: 'shadow-indigo-950/20',
    benefits: [
      'Actas de Trazabilidad digital SUNAT/SENASA',
      'Telemetría de termógrafo frío con alarma',
      'Copiloto de IA para simulación de desvíos',
      'Control de contenedores en puerto DP World'
    ],
    demoSuggested: 'Lanzar Sandbox Corporativo Agro',
    demoLink: '/demos?type=exportadora',
    previewTitle: 'TORRE DE CONTROL COLD-CHAIN INTEGRITY',
    previewContent: (
      <div className="space-y-3 font-mono text-left">
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1.5">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-indigo-400 font-bold">Contenedor APM-7729 (Palta Piura)</span>
            <span className="text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded font-black border border-emerald-900/30">-18.2 °C [Estable]</span>
          </div>
          <p className="text-[9px] text-slate-400 leading-tight">Geocerca portuaria: Ingreso detectado DPW de Callao</p>
        </div>
      </div>
    )
  },
  empresa_transporte: {
    badge: '🚚 Empresa de Transporte & Flotas',
    title: 'The ultimate suite to run large fleet operations',
    desc: 'Gestiona múltiples furgonetas, remolques y chóferes en un canal unificado de telemetría y geocercas. Control preventivo de seguros SOAT, combustibles y mantenimientos.',
    ctaText: 'Iniciar control digital de flotas',
    ctaLink: '/demos?type=empresa_transporte',
    colorTheme: 'from-purple-550 to-fuchsia-600',
    borderColor: 'hover:border-purple-500/55',
    focusGlow: 'shadow-purple-950/20',
    benefits: [
      'Choferes múltiples con asignaciones de placas',
      'Alertas automáticas críticas SOAT/MTC vencidos',
      'Consumos teóricos de combustibles diésel',
      'Despachos masivos con remisiones electrónicas'
    ],
    demoSuggested: 'Probar Consola de Flotas SaaS',
    demoLink: '/demos?type=empresa_transporte',
    previewTitle: 'SaaS FLEET OPERATIONAL MATRIX',
    previewContent: (
      <div className="space-y-3 font-mono text-left">
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1">
          <p className="text-xs text-white font-bold">Unidades operativas: 14 conectadas</p>
          <div className="flex justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-800">
            <span>Placa F1W-823 (Pedro R.)</span>
            <span className="text-emerald-400 font-bold">SOAT Vigente</span>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Placa A4P-941 (Carlos T.)</span>
            <span className="text-red-400 font-bold">ALERTA SOAT (2 días)</span>
          </div>
        </div>
      </div>
    )
  }
};

export const Home = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  // Interactive Identity Toggles
  const [activeSegment, setActiveSegment] = useState<'casual' | 'carrier' | 'saas'>('casual');
  const [selectedHomeSegment, setSelectedHomeSegment] = useState<'comerciante' | 'transportista' | 'exportadora' | 'empresa_transporte'>('comerciante');
  
  // Demo modals state
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoForm, setDemoForm] = useState({ name: '', company: '', phone: '', email: '', loadsPerMonth: '1-10' });
  const [demoSuccess, setDemoSuccess] = useState(false);

  // Available simulated loads ticker for carriers
  const [simulatedLoads, setSimulatedLoads] = useState([
    { id: 'c-084', origen: 'Chimbote (Planta Pesquera)', destino: 'Callao Terminal APM', producto: 'Harina de Pescado (Sacos)', peso: '28 Toneladas', precio: 1850, ofertas: 3, tiempoLimite: '14h left' },
    { id: 'c-091', origen: 'Paita (Terminal De Frío)', destino: 'Lima Ate HQ', producto: 'Arándano Orgánico (Refrigerado)', peso: '18 Toneladas', precio: 3200, ofertas: 5, tiempoLimite: '8h left' },
    { id: 'c-099', origen: 'Ica (Fundo Agrícola)', destino: 'Puerto Callao DP World', producto: 'Uva de Mesa (Pallets)', peso: '22 Toneladas', precio: 1400, ofertas: 2, tiempoLimite: '19h left' }
  ]);

  useEffect(() => {
    if (user) {
      const u = user as any;
      const isAdmin = ADMIN_EMAILS.includes(u.email.toLowerCase());
      if (u.tipoUsuario === 'admin' || isAdmin) {
        navigate('/admin');
      } else if (u.tipoUsuario === 'comerciante') {
        // Double check if account is RUC20 (Enterprise) to route to appropriate workspace
        if (u.tipoCuenta === 'ruc20' || u.organizationId) {
          navigate('/enterprise');
        } else {
          navigate('/merchant/dashboard');
        }
      } else if (u.tipoUsuario === 'transportista') {
        navigate('/carrier/dashboard');
      }
    }
  }, [user, navigate]);

  const handleDemoRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setDemoSuccess(true);
    setTimeout(() => {
      setDemoModalOpen(false);
      setDemoSuccess(false);
      setDemoForm({ name: '', company: '', phone: '', email: '', loadsPerMonth: '1-10' });
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-600 selection:text-white">
      
      {/* 🔮 1. HERO SECTION PREMIUM */}
      <section className="relative pt-20 pb-32 overflow-hidden border-b border-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
        <div className="absolute -top-40 left-1/3 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Infraestructura Logística Operativa SaaS</span>
          </div>

          <h1 className="text-4xl sm:text-7xl font-extrabold tracking-tight leading-none text-white max-w-5xl mx-auto uppercase">
            Una plataforma logística <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-purple-400 bg-clip-text text-transparent italic normal-case font-serif">para cada tipo de operación.</span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg font-medium max-w-3xl mx-auto leading-relaxed">
            Desde mudanzas residenciales ocasionales hasta infraestructuras de flotas multinacionales.
          </p>          {/* Interactive Profile Tab Selector */}
          <div className="max-w-4xl mx-auto pt-4 pb-2">
            <p className="text-[11px] font-black uppercase text-indigo-400 tracking-widest mb-3">
              ¿Qué tipo de operación realizas?
            </p>
            <div className="p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-1.5 shadow-2xl">
              <button
                type="button"
                onClick={() => setSelectedHomeSegment('comerciante')}
                className={cn(
                  "py-3 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all focus:outline-none",
                  selectedHomeSegment === 'comerciante' 
                    ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-slate-850"
                )}
              >
                📦 Comerciante / MYPE
              </button>
              <button
                type="button"
                onClick={() => setSelectedHomeSegment('transportista')}
                className={cn(
                  "py-3 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all focus:outline-none",
                  selectedHomeSegment === 'transportista' 
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-slate-850"
                )}
              >
                🚛 Transportista
              </button>
              <button
                type="button"
                onClick={() => setSelectedHomeSegment('exportadora')}
                className={cn(
                  "py-3 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all focus:outline-none",
                  selectedHomeSegment === 'exportadora' 
                    ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-slate-850"
                )}
              >
                🌎 Exportadora
              </button>
              <button
                type="button"
                onClick={() => setSelectedHomeSegment('empresa_transporte')}
                className={cn(
                  "py-3 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all focus:outline-none",
                  selectedHomeSegment === 'empresa_transporte' 
                    ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-slate-850"
                )}
              >
                🚚 Empresa de Flotas
              </button>
            </div>
          </div>

          {/* Dynamic Content Block reactive to active selector */}
          <div className="pt-8 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 text-left items-center">
            
            {/* Copywriting & Benefits */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-900 text-slate-300 border border-slate-800">
                  {SEGMENT_DETAILS[selectedHomeSegment].badge}
                </span>
                <AnimatePresence mode="wait">
                  <motion.h2 
                    key={selectedHomeSegment + '_title'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white uppercase leading-tight"
                  >
                    {SEGMENT_DETAILS[selectedHomeSegment].title}
                  </motion.h2>
                </AnimatePresence>
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={selectedHomeSegment + '_desc'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15, delay: 0.03 }}
                    className="text-slate-400 text-xs sm:text-sm font-medium leading-relaxed"
                  >
                    {SEGMENT_DETAILS[selectedHomeSegment].desc}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Dynamic Benefits Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {SEGMENT_DETAILS[selectedHomeSegment].benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-300 font-medium leading-relaxed">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Differentiated CTAs & Demo Suggestions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
                <Link to={SEGMENT_DETAILS[selectedHomeSegment].ctaLink} className="grow sm:grow-0">
                  <Button className={cn(
                    "w-full text-xs font-black uppercase tracking-widest px-6 py-4 h-auto rounded-xl shadow-xl transition-all hover:scale-[1.01] bg-gradient-to-r text-white",
                    SEGMENT_DETAILS[selectedHomeSegment].colorTheme
                  )}>
                    {SEGMENT_DETAILS[selectedHomeSegment].ctaText} →
                  </Button>
                </Link>
                <Link to={SEGMENT_DETAILS[selectedHomeSegment].demoLink} className="grow sm:grow-0">
                  <Button variant="outline" className="w-full border-slate-800 text-slate-300 hover:text-white bg-slate-900/50 py-4 h-auto font-black text-xs uppercase tracking-wider rounded-xl">
                    ⚡ {SEGMENT_DETAILS[selectedHomeSegment].demoSuggested}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Simulated Live Premium Dashboard Preview */}
            <div className="lg:col-span-5 bg-slate-900/95 border border-slate-850 p-1 rounded-2xl shadow-2xl relative overflow-hidden">
              {/* Window Controls Decorator */}
              <div className="bg-slate-950/80 px-4 py-2.5 border-b border-slate-850/80 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                </div>
                <span className="text-[10px] font-mono text-slate-500 font-extrabold tracking-widest uppercase">
                  {SEGMENT_DETAILS[selectedHomeSegment].previewTitle}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div className="p-5 bg-slate-950/40 min-h-[160px] flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedHomeSegment + '_preview'}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                  >
                    {SEGMENT_DETAILS[selectedHomeSegment].previewContent}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

          </div>

          {/* Operational Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-16 border-t border-slate-900/60 max-w-5xl mx-auto">
            <div className="text-left space-y-1">
              <p className="text-2xl sm:text-3xl font-black text-white">+1,200</p>
              <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Transportistas Validados MTC</p>
            </div>
            <div className="text-left space-y-1">
              <p className="text-2xl sm:text-3xl font-black text-white">99.7%</p>
              <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Cumplimiento en Destino</p>
            </div>
            <div className="text-left space-y-1">
              <p className="text-2xl sm:text-3xl font-black text-white">S/. 0</p>
              <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Costo de Afiliación Mypes</p>
            </div>
            <div className="text-left space-y-1">
              <p className="text-2xl sm:text-3xl font-black text-white">SHA-256</p>
              <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Custodia Digital Criptográfica</p>
            </div>
          </div>

        </div>
      </section>

      {/* 📦 2. INTERACTIVE SEGMENTED LOGISTICS TUNNEL */}
      <section className="py-24 border-b border-slate-900 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-14">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="text-indigo-400 text-xs font-black uppercase tracking-widest">Sistemas de Navegación Segmentada</div>
            <h2 className="text-3xl sm:text-4.5xl font-black uppercase tracking-tight text-white leading-none">
              Elige tu nivel operativo en Chasqui
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">
              Eliminamos el desorden. Unifique su flujo de trabajo logístico según su rol en la cadena de suministro.
            </p>
          </div>

          {/* Tab Selection Switches */}
          <div className="flex justify-center p-1.5 bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl mx-auto">
            <button 
              onClick={() => setActiveSegment('casual')}
              className={cn(
                "flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all",
                activeSegment === 'casual' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              )}
            >
              📦 Casual / Mudanza
            </button>
            <button 
              onClick={() => setActiveSegment('carrier')}
              className={cn(
                "flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all",
                activeSegment === 'carrier' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              )}
            >
              🚛 Transportista
            </button>
            <button 
              onClick={() => setActiveSegment('saas')}
              className={cn(
                "flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all",
                activeSegment === 'saas' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              )}
            >
              🏢 Corporativo SaaS
            </button>
          </div>

          {/* Dymanic Tab Presentation Container */}
          <AnimatePresence mode="wait">
            {activeSegment === 'casual' && (
              <motion.div 
                key="casual"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-slate-900/30 border border-slate-900 p-8 sm:p-12 rounded-[2.5rem]"
              >
                <div className="lg:col-span-5 space-y-6 text-left">
                  <div className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase rounded-full">
                    Sencillo & Transparente
                  </div>
                  <h3 className="text-2xl sm:text-3.5xl font-black text-white uppercase italic tracking-tight">
                    Para personas, pymes y mudanzas rápidas
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm font-medium leading-relaxed leading-snug">
                    ¿Necesita mover un lote de mercadería ocasional o coordinar una mudanza? Publique gratis en menos de 2 minutos. Reciba ofertas competidoras de transportistas y abone a través de billeteras móviles o transferencias bajo custodia garantizada.
                  </p>
                  
                  {/* Scope validation (Included vs Blocked) */}
                  <div className="space-y-3 pt-2 text-xs">
                    <p className="font-black text-slate-500 uppercase tracking-widest text-[9px]">Superpoderes del Plan</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <Check className="h-4.5 w-4.5 shrink-0" />
                        <span>Sello Chasqui y pago seguro en custodia digital</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <Check className="h-4.5 w-4.5 shrink-0" />
                        <span>Seguimiento satelital en mapa público para su cliente</span>
                      </div>
                      <div className="flex items-center gap-2 text-red-400 font-bold">
                        <X className="h-4.5 w-4.5 shrink-0 text-red-500" />
                        <span>Bloqueado: Gestión de múltiples camiones y equipos</span>
                      </div>
                      <div className="flex items-center gap-2 text-red-400 font-bold">
                        <X className="h-4.5 w-4.5 shrink-0 text-red-500" />
                        <span>Bloqueado: Telemetría de temperatura fría IoT e IA Copilot</span>
                      </div>
                    </div>
                  </div>

                  <Link to="/publicar-carga" className="inline-block pt-4">
                    <Button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest px-8 h-12 rounded-xl">
                      Publicar Carga Gratis
                    </Button>
                  </Link>
                </div>

                <div className="lg:col-span-7 bg-slate-950 border border-slate-900 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                    <span className="text-[10px] uppercase font-mono text-slate-500">MOCKUP PREVIEW // PORTAL MYPES / PERSONAS</span>
                    <span className="text-[9px] text-emerald-400 font-black tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">ACTIVO</span>
                  </div>
                  <div className="space-y-3 text-left">
                    <div className="p-4 bg-slate-900 border border-slate-850 rounded-2xl space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">COD: CRG-821</p>
                          <h4 className="text-xs font-bold text-slate-200">Mudanza Local Surco → La Molina</h4>
                        </div>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-sky-550/10 text-sky-400 rounded">EN CAMINO</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Chofer asignado: Ernesto Silva (Calificación: ★ 4.9)</p>
                      <div className="pt-2 border-t border-slate-800/50 flex justify-between items-center text-[10px] font-mono text-slate-500">
                        <span>Pago Custodia: S/. 350.00</span>
                        <span>Ubicación: Av. Javier Prado Km 8</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSegment === 'carrier' && (
              <motion.div 
                key="carrier"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-slate-900/30 border border-slate-900 p-8 sm:p-12 rounded-[2.5rem]"
              >
                <div className="lg:col-span-5 space-y-6 text-left">
                  <div className="inline-block px-3 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[9px] font-black uppercase rounded-full">
                    Aumente su Rentabilidad
                  </div>
                  <h3 className="text-2xl sm:text-3.5xl font-black text-white uppercase italic tracking-tight">
                    Para conductores y dueños de camiones
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm font-medium leading-relaxed leading-snug">
                    ¿Cansado de volver vacío o depender de comisionistas informales? Chasqui le ofrece acceso directo a cargas de pymes y grandes agroexportadoras verificadas. Obtenga pagos inmediatos tras confirmar la entrega digitalmente y construya su reputación operativa.
                  </p>

                  {/* Scope validation (Included vs Blocked) */}
                  <div className="space-y-3 pt-2 text-xs">
                    <p className="font-black text-slate-500 uppercase tracking-widest text-[9px]">Superpoderes del Plan</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <Check className="h-4.5 w-4.5 shrink-0" />
                        <span>Tablero de cargas con alertas de cercanía (Radar)</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <Check className="h-4.5 w-4.5 shrink-0" />
                        <span>Garantía de cobro directo mediante Yape, Plin o Banco</span>
                      </div>
                      <div className="flex items-center gap-2 text-red-400 font-bold">
                        <X className="h-4.5 w-4.5 shrink-0 text-red-500" />
                        <span>Bloqueado: Administración de sedes de almacenamiento</span>
                      </div>
                      <div className="flex items-center gap-2 text-red-400 font-bold">
                        <X className="h-4.5 w-4.5 shrink-0 text-red-500" />
                        <span>Bloqueado: Certificación compliance regulada por SENASA</span>
                      </div>
                    </div>
                  </div>

                  <Link to="/register?role=transportista" className="inline-block pt-4">
                    <Button className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-black uppercase tracking-widest px-8 h-12 rounded-xl">
                      Registrarme como Transportista
                    </Button>
                  </Link>
                </div>

                <div className="lg:col-span-7 bg-slate-950 border border-slate-900 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                    <span className="text-[10px] uppercase font-mono text-slate-500">MOCKUP PREVIEW // RADAR DEL CHOFER</span>
                    <span className="text-[9px] text-sky-400 font-black tracking-widest bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 uppercase">RADAR CONECTADO</span>
                  </div>
                  <div className="space-y-3 text-left">
                    <div className="p-4 bg-slate-900 border border-slate-850 rounded-2xl space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] text-sky-400 font-mono">DISTANCIA: A 12 KM DE TU UBICACIÓN</p>
                          <h4 className="text-xs font-bold text-slate-200">22 Ton de Espárrago Verde (Fundo Agrícola Ica)</h4>
                        </div>
                        <span className="text-xs font-black text-emerald-400">S/. 1,400</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-3 border-t border-slate-800">
                        <span>Vehículo: Plataforma / Seco</span>
                        <span>Destino: Puerto Callao DP World</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSegment === 'saas' && (
              <motion.div 
                key="saas"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-slate-900/30 border border-slate-900 p-8 sm:p-12 rounded-[2.5rem]"
              >
                <div className="lg:col-span-5 space-y-6 text-left">
                  <div className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-black uppercase rounded-full">
                    SaaS de Control Corporativo
                  </div>
                  <h3 className="text-2xl sm:text-3.5xl font-black text-white uppercase italic tracking-tight">
                    Infraestructura Digital Enterprise
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm font-medium leading-relaxed leading-snug">
                    ¿Coordina despachos de exportación o administra flotas comerciales? Chasqui Enterprise unifica su torre de control. Evalúe telemetría IoT de frío, geofencing automático, comparta accesos multiusuario RBAC y aproveche Inteligencia Artificial para optimizar fletes y cubicaje de camiones.
                  </p>

                  {/* Scope validation (Included vs Blocked) */}
                  <div className="space-y-3 pt-2 text-xs">
                    <p className="font-black text-slate-500 uppercase tracking-widest text-[9px]">Superpoderes del Plan</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <Check className="h-4.5 w-4.5 shrink-0" />
                        <span>SaaS Multi-sede, despachos masivos, monitor de flotas</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <Check className="h-4.5 w-4.5 shrink-0" />
                        <span>Telemetría de Termógrafos Fríos e Inteligencia de cadena de custodia</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <Check className="h-4.5 w-4.5 shrink-0" />
                        <span>Actas de trazabilidad descargables en PDF listas para SUNAT / SENASA</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <Check className="h-4.5 w-4.5 shrink-0" />
                        <span>Copiloto de IA Gemini para simulación inteligente de rutas</span>
                      </div>
                    </div>
                  </div>

                  <Link to="/enterprise?demo=true" className="inline-block pt-4">
                    <Button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest px-8 h-12 rounded-xl">
                      Lanzar Workspace Corporativo
                    </Button>
                  </Link>
                </div>

                <div className="lg:col-span-7 bg-slate-950 border border-slate-900 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                    <span className="text-[10px] uppercase font-mono text-slate-500">MOCKUP PREVIEW // TORRE DE CONTROL SAAS</span>
                    <span className="text-[9px] text-indigo-400 font-black tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase">CONTROL TOWER</span>
                  </div>
                  <div className="space-y-3 text-left font-mono text-[11px]">
                    <div className="p-3.5 bg-slate-900 border border-slate-850 rounded-2xl space-y-2">
                      <div className="flex justify-between text-indigo-300 font-black text-xs">
                        <span>🛰️ MONITOREO EMBARQUES (5 DIRECTOS)</span>
                        <span>SNC ON</span>
                      </div>
                      <div className="space-y-1.5 text-slate-400">
                        <div className="flex justify-between">
                          <span>📍 Placa F2W-894 (Paita → Callao)</span>
                          <span className="text-emerald-400 font-bold">-18.2 °C [OK]</span>
                        </div>
                        <div className="flex justify-between">
                          <span>📍 Placa A7H-921 (Ica → Callao)</span>
                          <span className="text-emerald-400 font-bold">Seco [OK]</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </section>

      {/* 🚛 3. CARRIER SPECIFIC BOARD TICKER & RADAR */}
      <section id="carrier-pitch" className="py-24 border-b border-slate-900 bg-slate-950 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 space-y-6 text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-400 text-[10px] font-black uppercase tracking-widest">
                <Truck className="h-3.5 w-3.5" />
                <span>Bolsa Operativa Chasqui</span>
              </div>
              <h2 className="text-3xl sm:text-4.5xl font-black text-white italic uppercase tracking-tight leading-none">
                Evita viajes vacíos y aumenta tus tarifas
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm font-medium leading-relaxed">
                Nuestros transportistas no pierden horas negociando tarifas en paraderos informales. Recibe ofertas de fletes con las tarifas más competitivas del sector directo en tu terminal. Registra tu licencia, tarjeta de propiedad y SOAT para ganar el Sello de Transportista Certificado.
              </p>

              <div className="space-y-4 text-xs font-bold text-slate-300 pt-2">
                <div className="flex items-start gap-3">
                  <div className="p-1 px-1.5 bg-sky-500/10 text-sky-400 rounded-lg text-[10px] font-black">1</div>
                  <p className="leading-tight">Cero comisiones abusivas: El precio ofertado se liquida sin descuentos ocultos.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1 px-1.5 bg-sky-500/10 text-sky-400 rounded-lg text-[10px] font-black">2</div>
                  <p className="leading-tight">Garantía de Pago Seguro: Chasqui custodia el dinero del comerciante para asegurar tu pago.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1 px-1.5 bg-sky-500/10 text-sky-400 rounded-lg text-[10px] font-black">3</div>
                  <p className="leading-tight">Soporte Técnico Operativo: Asistencia vial en carretera 24/7 en Panamericana Norte y Sur.</p>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <Link to="/register?role=transportista">
                  <Button className="w-full sm:w-auto h-12 px-8 bg-sky-650 hover:bg-sky-600 text-white text-xs font-black uppercase tracking-widest rounded-xl">
                    Registrarme como Transportista
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" className="w-full sm:w-auto h-12 px-8 border-slate-800 text-slate-350 hover:text-white bg-transparent hover:bg-slate-900 rounded-xl">
                    Ver Tablero de Cargas
                  </Button>
                </Link>
              </div>
            </div>

            {/* Simulated Live loads board */}
            <div className="lg:col-span-7 bg-slate-900/40 border border-slate-900 p-6 sm:p-8 rounded-[2rem] space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-905">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black tracking-widest uppercase text-slate-400">CARGAS DISPONIBLES EN TIEMPO REAL</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">CONECTADO AL CORREDOR MTC</span>
              </div>

              <div className="space-y-4">
                {simulatedLoads.map((load) => (
                  <div key={load.id} className="p-5 bg-slate-950 border border-slate-850 hover:border-sky-500/20 rounded-2xl transition-all text-left space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono text-indigo-400">{load.id.toUpperCase()}</span>
                        <h4 className="text-xs font-black text-white uppercase">{load.origen} → {load.destino}</h4>
                      </div>
                      <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded">S/. {load.precio}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-900">
                      <div>REQUERIDO: <span className="text-slate-300 font-bold">{load.producto} ({load.peso})</span></div>
                      <div className="text-right">OFERTAS ACTIVAS: <span className="text-indigo-400 font-bold">{load.ofertas} postores</span></div>
                    </div>
                  </div>
                ))}
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 🏢 4. ENTERPRISE SAAS PRESENTATION SECTION */}
      <section id="enterprise-pitch" className="py-24 border-b border-slate-900 bg-slate-950 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-indigo-650/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
          
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
              <Building2 className="h-3.5 w-3.5" />
              <span>Chasqui Enterprise OS // Software Logístico</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-none italic">
              Acelere y organice su operación a escala corporativa
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">
              Gestione despachos, asigne transportistas, visualice cadenas de custodia fría y asigne accesos restrictivos a monitoristas, despachadores y auditores bajo un estándar militar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Feature 1 */}
            <div className="p-8 bg-slate-900/50 border border-slate-850 rounded-3xl hover:border-indigo-500/15 transition-all text-left space-y-4">
              <div className="h-12 w-12 bg-indigo-600/10 text-indigo-400 rounded-2xl flex items-center justify-center">
                <Monitor className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-black uppercase text-white tracking-wider">Torre de Control Integrada</h4>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                Supervise de forma simultánea toda su flota externa en un único mapa de geofencing. Detecte alertas tempranas de detención o pérdida de señal.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 bg-slate-900/50 border border-slate-850 rounded-3xl hover:border-indigo-500/15 transition-all text-left space-y-4">
              <div className="h-12 w-12 bg-indigo-600/10 text-indigo-400 rounded-2xl flex items-center justify-center">
                <Cpu className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-black uppercase text-white tracking-wider">Telemetría IoT Cold-Chain</h4>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                Control estricto de termografía de frío. Registre variables IoT térmicas y envíe de manera automática alarmas en caso de que ocurra una desviación.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 bg-slate-900/50 border border-slate-850 rounded-3xl hover:border-indigo-500/15 transition-all text-left space-y-4">
              <div className="h-12 w-12 bg-indigo-600/10 text-indigo-400 rounded-2xl flex items-center justify-center">
                <Sparkles className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-black uppercase text-white tracking-wider">Planificación con IA Gemini</h4>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                Consulte a nuestro asistente logístico para optimizar volumetrías, predecir costos de combustible y sugerir alternativas de desvío ante cierres viales.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 bg-slate-900/50 border border-slate-850 rounded-3xl hover:border-indigo-500/15 transition-all text-left space-y-4">
              <div className="h-12 w-12 bg-indigo-600/10 text-indigo-400 rounded-2xl flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-black uppercase text-white tracking-wider">Actas Digitales Compliance</h4>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                Sellar digitalmente cada entrega con registros de geocercas SUNAT/SENASA. Descargue reportes en formato PDF auditables y listos de inmediato.
              </p>
            </div>

          </div>

          {/* DUAL ACTION BUTTON PANEL */}
          <div className="p-10 bg-gradient-to-r from-slate-900 to-indigo-950/30 border border-indigo-500/10 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 text-left max-w-5xl mx-auto">
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tight">¿Listo para modernizar tu logística?</h3>
              <p className="text-slate-400 text-xs max-w-xl font-medium">
                Póngase al mando del centro de control satelital. Experimente el Sandbox corporativo al instante con datos reales de simulación o solicite una consultoría adaptada para grandes flotas.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 shrink-0">
              <button
                onClick={() => {
                  localStorage.setItem('chasqui_demo_active', 'true');
                  window.location.href = '/enterprise?demo=true';
                }}
                className="h-14 px-8 bg-indigo-605 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center gap-2"
              >
                <span>🚀 Probar Demo Interactivo</span>
                <span className="text-[9px] bg-slate-950/30 px-1 py-0.5 rounded border border-indigo-455/30">Instante</span>
              </button>

              <button
                onClick={() => setDemoModalOpen(true)}
                className="h-14 px-8 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-xl border border-slate-800 transition-all"
              >
                Solicitar Demo Personalizado
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 🔮 5. SUBSCRIPTION PLANS (PRICING) */}
      <section id="planes" className="py-24 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="text-indigo-400 text-xs font-black uppercase tracking-widest">Suscripciones SaaS Transparentes</div>
            <h2 className="text-3xl sm:text-4.5xl font-black uppercase tracking-tight text-white leading-none">
              Nuestros Planes de Operación
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">
              Elija la estructura tarifaria adecuada para el volumen logístico de su negocio.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* Free Plan */}
            <div className="p-8 bg-slate-900 bg-opacity-40 border border-slate-900 rounded-3xl flex flex-col justify-between text-left space-y-8 relative hover:border-slate-800 transition-all">
              <div className="space-y-4">
                <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Mypes / Particulares</span>
                <h3 className="text-xl font-black text-white italic">FREE</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">S/. 0</span>
                  <span className="text-xs text-slate-500 font-bold">/ de por vida</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                  Adecuado para personas particulares y pequeños establecimientos agrícolas que necesitan fletes o mudanzas eventuales.
                </p>
              </div>

              <div className="space-y-3 font-medium text-xs text-slate-300 pt-4 border-t border-slate-900/60">
                <div className="flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                  <span>Publicación de hasta 5 cargas al mes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                  <span>Visualización en mapa del transportista</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <X className="h-4.5 w-4.5 text-slate-700 shrink-0" />
                  <span>No incluye: Telemetría fría IoT o IA</span>
                </div>
              </div>

              <Link to="/register?role=comerciante">
                <button className="w-full h-12 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all">
                  Comenzar gratis
                </button>
              </Link>
            </div>

            {/* Business Plan */}
            <div className="p-8 bg-slate-900 border-2 border-indigo-500/20 rounded-3xl flex flex-col justify-between text-left space-y-8 relative hover:border-indigo-500/30 transition-all shadow-xl shadow-indigo-650/5">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-widest">
                MÁS RECOMENDADO
              </div>
              
              <div className="space-y-4">
                <span className="text-[9px] uppercase font-black text-indigo-400 tracking-wider">Agroexportadoras & Operadores</span>
                <h3 className="text-xl font-black text-white italic">BUSINESS PORTAL</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">S/. 499</span>
                  <span className="text-xs text-slate-500 font-bold">/ mes facturado</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                  Alineado a las necesidades de empresas exportadoras que coordinan despachos recurrentes, monitoreo frío y control de fletes.
                </p>
              </div>

              <div className="space-y-3 font-medium text-xs text-slate-300 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                  <span>Publicación y despachos masivos ilimitados</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                  <span>Lectura de termógrafos de frío & alertas instantáneas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                  <span>Bolsa de transportistas certificados MTC</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                  <span>Análisis de telemetría y reportes PDF auditables</span>
                </div>
              </div>

              <button
                onClick={() => {
                  localStorage.setItem('chasqui_demo_active', 'true');
                  window.location.href = '/enterprise?demo=true';
                }}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-600/20"
              >
                Probar Demo e Instanciar
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="p-8 bg-slate-900 bg-opacity-40 border border-slate-900 rounded-3xl flex flex-col justify-between text-left space-y-8 relative hover:border-slate-800 transition-all">
              <div className="space-y-4">
                <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Grandes Organizaciones</span>
                <h3 className="text-xl font-black text-white italic">ENTERPRISE OS</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">Consulte</span>
                  <span className="text-xs text-slate-500 font-bold">/ cotización a medida</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                  SaaS de control unificado y adaptado para grandes flotas transnacionales que demandan integraciones API de aduana / SAP.
                </p>
              </div>

              <div className="space-y-3 font-medium text-xs text-slate-300 pt-4 border-t border-slate-900/60">
                <div className="flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                  <span>Todo el plan Business con accesos prioritarios</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                  <span>Soporte dedicado al cliente vía WhatsApp & teléfono</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                  <span>IA Copilot Gemini ILIMITADA integrada para cubicajes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                  <span>SLA del 99.9% de uptime garantizado</span>
                </div>
              </div>

              <button
                onClick={() => setDemoModalOpen(true)}
                className="w-full h-12 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
              >
                Hablar con ventas
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* 🚀 FORM CONVERSION MODAL FOR HIGH-TOUCH LEADS */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full space-y-6 relative text-left shadow-2xl">
            <button 
              onClick={() => setDemoModalOpen(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white font-bold"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="space-y-2">
              <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-black block">Demostración Corporativa</span>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Solicitar Demo Chasqui SaaS</h3>
              <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                Complete el formulario y un especialista corporativo lo contactará en menos de 2 horas hábiles.
              </p>
            </div>

            {demoSuccess ? (
              <div className="p-8 bg-indigo-950/50 border border-indigo-500/20 rounded-2xl text-center space-y-4">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-sm font-bold text-white">¡Solicitud recibida con éxito!</h4>
                <p className="text-xs text-slate-400 font-medium">Hemos reservado su turno. Nos pondremos en comunicación muy pronto.</p>
              </div>
            ) : (
              <form onSubmit={handleDemoRequest} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase block">Nombre Completo</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Roberto Benavides" 
                    required 
                    value={demoForm.name}
                    onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase block">Empresa / Razón Social</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Agromás SAC" 
                    required 
                    value={demoForm.company}
                    onChange={(e) => setDemoForm({ ...demoForm, company: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase block">Teléfono / WhatsApp</label>
                    <input 
                      type="tel" 
                      placeholder="+51 900..." 
                      required 
                      value={demoForm.phone}
                      onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase block">Cargas Mensuales</label>
                    <select 
                      value={demoForm.loadsPerMonth}
                      onChange={(e) => setDemoForm({ ...demoForm, loadsPerMonth: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-medium"
                    >
                      <option value="1-10">1 a 10 cargas</option>
                      <option value="11-50">11 a 50 cargas</option>
                      <option value="51+">Más de 50 cargas</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase block">Correo Corporativo</label>
                  <input 
                    type="email" 
                    placeholder="contacto@compania.com" 
                    required 
                    value={demoForm.email}
                    onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                >
                  Enviar Solicitud
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
