import React, { useEffect } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuthStore } from '../store/useAuthStore';
import { ADMIN_EMAILS } from '../lib/constants';
import { cn } from '../lib/utils';
import { ChasquiLogo } from '../components/ChasquiLogo';

export const Home = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase());
      if (user.tipoUsuario === 'admin' || isAdmin) {
        navigate('/admin');
      } else if (user.tipoUsuario === 'comerciante') {
        navigate('/merchant/dashboard');
      } else if (user.tipoUsuario === 'transportista') {
        navigate('/carrier/dashboard');
      }
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
      {/* 🟢 HERO SECTION (PRIMER IMPACTO) */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:32px_32px] opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col items-center text-center space-y-10 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                <Shield className="h-3 w-3" />
                <span>Solución Logística B2B</span>
              </div>
              
              <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-slate-900 leading-[1.05]">
                Trazabilidad y control logístico para <span className="text-blue-600 italic">carga agroexportadora</span>
              </h1>
              
              <p className="mt-8 text-xl text-slate-500 max-w-3xl mx-auto font-medium leading-relaxed">
                Optimiza el transporte terrestre previo a la exportación con monitoreo en tiempo real, validación de actores y registro auditable de cada operación logística.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full"
            >
              <Link to="/register?role=comerciante" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-16 px-12 text-lg shadow-2xl shadow-blue-500/20 group rounded-2xl">
                  <Package className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Publicar Carga
                </Button>
              </Link>
              <Link to="/register?role=transportista" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-16 px-12 text-lg border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-900 transition-all rounded-2xl">
                  <Truck className="mr-3 h-5 w-5" />
                  Quiero Transportar
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full pt-16 border-t border-slate-100"
            >
              <HeroBadge icon={<Lock className="h-4 w-4" />} label="Custodia de pagos" />
              <HeroBadge icon={<MapPin className="h-4 w-4" />} label="GPS en tiempo real" />
              <HeroBadge icon={<CheckCircle2 className="h-4 w-4" />} label="Transportistas verificados" />
              <HeroBadge icon={<Receipt className="h-4 w-4" />} label="Reporte auditable" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* 🟡 PROPUESTA DE VALOR */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600 skew-x-12 translate-x-1/2 opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-4xl space-y-8">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-blue-400">Propuesta de Valor</h2>
            <h3 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight">
              Diseñado para cadenas logísticas de exportación
            </h3>
            <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-2xl">
              Chasqui permite a empresas agroexportadoras gestionar y monitorear el transporte terrestre de su carga desde origen (campo o almacén) hasta planta o punto de despacho, asegurando visibilidad, control operativo y trazabilidad en cada etapa.
            </p>
          </div>
        </div>
      </section>

      {/* 🔴 EL PROBLEMA */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-end">
            <div className="space-y-12">
              <div className="space-y-4">
                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-red-500">El Problema</h2>
                <h3 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  Falta de control y trazabilidad en el transporte terrestre.
                </h3>
              </div>
              <div className="space-y-1">
                <ProblemItem text="Baja visibilidad del estado real de la carga en tránsito" />
                <ProblemItem text="Procesos informales y descentralizados" />
                <ProblemItem text="Riesgo operativo por incumplimientos o incidentes" />
                <ProblemItem text="Falta de registro estructurado para auditoría" />
                <ProblemItem text="Dependencia de comunicación manual (llamadas)" />
              </div>
            </div>
            <div className="bg-slate-50 p-12 rounded-[3rem] border border-slate-100 flex flex-col justify-between aspect-square lg:aspect-auto h-full">
               <div className="space-y-6">
                 <div className="h-16 w-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                    <X className="h-8 w-8" />
                 </div>
                 <h4 className="text-2xl font-black text-slate-900">La informalidad cuesta caro.</h4>
                 <p className="text-slate-500 font-medium leading-relaxed">
                   En entornos de exportación, un error logístico no solo es dinero, es reputación internacional y pérdida de valor del producto.
                 </p>
               </div>
               <div className="pt-12 text-slate-400 font-black italic tracking-widest text-xs uppercase">Chasqui Control System v1.0</div>
            </div>
          </div>
        </div>
      </section>

      {/* 🟢 LA SOLUCIÓN */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-blue-600">La Solución</h2>
            <h3 className="text-4xl font-black text-slate-900 tracking-tight">Plataforma de trazabilidad logística en tiempo real</h3>
            <p className="text-slate-600 max-w-2xl mx-auto font-medium">Digitalizamos y centralizamos la gestión del transporte terrestre para un control absoluto.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SolutionCard 
              icon={<ShieldCheck className="h-6 w-6" />}
              title="Validación de actores"
              text="Verificación de identidad de conductores y documentación del vehículo (licencia, SOAT, permisos vigentes)."
            />
            <SolutionCard 
              icon={<MapPin className="h-6 w-6" />}
              title="Monitoreo GPS"
              text="Seguimiento continuo del transporte con visualización de ruta y estado operativo real."
            />
            <SolutionCard 
              icon={<Zap className="h-6 w-6" />}
              title="Alertas Inteligentes"
              text="Detección de desvíos, paradas no autorizadas, demoras y pérdida de señal automáticamente."
            />
            <SolutionCard 
              icon={<Signal className="h-6 w-6" />}
              title="Estado de conectividad"
              text="Monitoreo constante de la señal del transportista, especialmente en zonas de baja cobertura."
            />
            <SolutionCard 
              icon={<Lock className="h-6 w-6" />}
              title="Custodia de pagos"
              text="Sistema de liberación de pago condicionado a la confirmación de entrega exitosa."
            />
            <SolutionCard 
              icon={<Monitor className="h-6 w-6" />}
              title="Gestión centralizada"
              text="Visualización de toda tu flota, operaciones, viajes y reportes en una sola consola."
            />
          </div>
        </div>
      </section>

      {/* 🌱 CASO DE USO AGROEXPORTADOR */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative z-10 space-y-10">
              <div className="space-y-4">
                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-emerald-600">Enfoque Sectorial</h2>
                <h3 className="text-4xl font-black text-slate-900 tracking-tight italic">Caso de uso Agroexportador</h3>
              </div>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">
                Una empresa agroexportadora requiere trasladar productos desde <span className="font-bold text-slate-900 underline decoration-emerald-500 decoration-4 underline-offset-4">campo → planta → puerto.</span>
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <CheckItem text="Asigna transporte validado" />
                <CheckItem text="Monitorea el traslado en vivo" />
                <CheckItem text="Detecta incidencias operativas" />
                <CheckItem text="Registra evidencia (Fotos/GPS)" />
                <CheckItem text="Genera historial auditable" />
              </div>
              
              <div className="p-8 bg-emerald-900 text-white rounded-[2rem] shadow-xl shadow-emerald-900/20">
                <p className="text-xl font-bold leading-snug">
                  👉 Resultado: mayor control, reducción de riesgos y trazabilidad total del proceso.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <motion.div 
                 initial={{ rotate: 1 }}
                 whileInView={{ rotate: 0 }}
                 className="aspect-[4/5] bg-slate-900 rounded-[3rem] p-12 text-white flex flex-col justify-between border-8 border-slate-50 shadow-2xl"
              >
                <div className="space-y-8">
                  <div className="flex justify-between items-start">
                    <ChasquiLogo variant="white" size="sm" />
                    <div className="h-8 w-8 bg-white/10 rounded-full flex items-center justify-center">
                       <Zap className="h-4 w-4 text-emerald-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ruta de Carga</span>
                    <h4 className="text-3xl font-black">Ica → Callao</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                      <span className="text-sm font-bold">GPS: Señal Estable</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]"></div>
                      <span className="text-sm font-bold">Progreso: 85% del trayecto</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-3">
                   <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                     <span>Estado de Trazabilidad</span>
                     <span className="text-emerald-400">Completo</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full w-full bg-emerald-500"></div>
                   </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 🔄 FLUJO OPERATIVO */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-500">Flujo Operativo</h2>
            <h3 className="text-4xl font-black text-slate-900 tracking-tight">Gestión del transporte en 6 etapas</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 relative">
            <OperationalStep number="01" title="Registro de carga" text="Definición de origen, destino, condiciones y requerimientos técnicos." />
            <OperationalStep number="02" title="Asignación de transporte" text="Recepción y validación de ofertas de transportistas certificados." />
            <OperationalStep number="03" title="Selección y validación" text="Evaluación integral y confirmación del servicio bajo estándares Chasqui." />
            <OperationalStep number="04" title="Monitoreo en tránsito" text="Seguimiento GPS ininterrumpido con sistema de alertas en tiempo real." />
            <OperationalStep number="05" title="Entrega con evidencia" text="Registro fotográfico y geolocalizado en recojo y entrega final." />
            <OperationalStep number="06" title="Cierre y validación" text="Liberación automática de pago y generación de reporte de trazabilidad." />
          </div>
        </div>
      </section>

      {/* 📄 TRAZABILIDAD Y REPORTE */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-[3.5rem] overflow-hidden p-8 sm:p-20 flex flex-col lg:flex-row items-center gap-16 border-8 border-slate-100">
             <div className="flex-1 space-y-10 text-white">
                <div className="space-y-6">
                  <h2 className="text-sm font-black uppercase tracking-[0.3em] text-emerald-400 italic">Auditabilidad</h2>
                  <h3 className="text-4xl sm:text-5xl font-black leading-tight italic">Reporte logístico auditable</h3>
                </div>
                <p className="text-slate-400 text-lg font-medium leading-relaxed">
                  Cada operación genera un registro íntegro que documenta la ruta real, tiempos, incidentes, datos validados y evidencias digitales.
                </p>
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-4 text-emerald-100 font-bold">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Utilizable para control interno y cumplimiento</span>
                  </div>
                  <div className="flex items-center gap-4 text-emerald-100 font-bold">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Documentación válida para auditorías externas</span>
                  </div>
                </div>
             </div>
             
             <div className="flex-shrink-0 w-full lg:w-[400px]">
                <div className="bg-white rounded-[2rem] p-8 shadow-2xl text-slate-900 space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-24 w-24 bg-blue-500 rounded-bl-[4rem] flex items-center justify-center text-white">
                    <FileSearch className="h-10 w-10" />
                  </div>
                  <div className="space-y-6">
                    <div className="h-1 bg-slate-100 w-24 rounded-full"></div>
                    <h4 className="text-2xl font-black italic tracking-tighter">PDF LOGISTICS REPORT</h4>
                    <div className="space-y-2">
                       <div className="h-2 bg-slate-100 w-full rounded-full"></div>
                       <div className="h-2 bg-slate-100 w-full rounded-full"></div>
                       <div className="h-2 bg-slate-100 w-4/5 rounded-full"></div>
                    </div>
                  </div>
                  <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-slate-400">Verificado</span>
                      <span className="font-bold text-sm tracking-tighter">CHASQUI SECURE</span>
                    </div>
                    <div className="h-12 w-12 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                       <Zap className="h-6 w-6" />
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* 📊 IMPACTO FINAL */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-black text-slate-900 italic">Impacto para empresas exportadoras</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
             <ImpactItem title="Visibilidad Total" desc="Control en tiempo real de toda su operación logística previa al despacho final." />
             <ImpactItem title="Reducción de Riesgos" desc="Disminución de incidentes mediante validación de actores y monitoreo activo." />
             <ImpactItem title="Auditoría Estructurada" desc="Registro histórico detallado de cada movimiento de carga realizado." />
             <ImpactItem title="Optimización Operativa" desc="Eliminación de la comunicación manual ineficiente (llamadas/WhatsApp)." />
             <ImpactItem title="Garantía de Pago" desc="Seguridad financiera absoluta mediante nuestro sistema de custodia." />
             <ImpactItem title="Confianza Regional" desc="Sistema diseñado específicamente para la geografía y desafíos de Perú." />
          </div>
        </div>
      </section>

      {/* 🎯 FINAL CTA (CORPORATIVO) */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="space-y-12 bg-slate-900 p-16 sm:p-24 rounded-[4rem] text-white shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-emerald-600/20"></div>
            
            <div className="relative z-10 space-y-6">
              <h2 className="text-4xl sm:text-6xl font-black tracking-tighter leading-tight italic">
                Digitaliza y asegura tu <span className="text-blue-400 underline underline-offset-8 decoration-blue-500/50">operación logística</span>
              </h2>
              <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto">
                Chasqui permite transformar el transporte terrestre en un proceso controlado, trazable y confiable para entornos de exportación.
              </p>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
              <Link to="/register?role=comerciante" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-16 px-12 text-lg bg-blue-600 hover:bg-blue-500 rounded-2xl shadow-xl shadow-blue-600/40 border-0 font-black">
                  Solicitar Demo / Registrar Carga
                </Button>
              </Link>
              <Link to="/support" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-16 px-12 text-lg border-2 border-white/20 bg-white/5 hover:bg-white hover:text-slate-900 transition-all rounded-2xl text-white font-black">
                  Contactar Equipo Corporativo
                </Button>
              </Link>
            </div>
            
            <div className="relative z-10 pt-16 flex flex-col items-center gap-4">
               <div className="h-px w-24 bg-white/10"></div>
               <p className="text-xs font-black text-slate-500 uppercase tracking-[0.5em]">
                 Control logístico • Trazabilidad real • Chasqui v1.0
               </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER CORPORATIVO */}
      <footer className="py-20 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-10">
          <div className="flex justify-center">
            <ChasquiLogo size="sm" />
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
             <Link to="/terms" className="hover:text-slate-900 transition-colors">Términos y condiciones</Link>
             <Link to="/privacy" className="hover:text-slate-900 transition-colors">Privacidad</Link>
             <Link to="/legal" className="hover:text-slate-900 transition-colors">Aviso Legal</Link>
             <Link to="/support" className="hover:text-slate-900 transition-colors">Centro de Ayuda</Link>
          </div>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">© 2026 Chasqui Logística SAC. Diseñado para el comercio inteligente en Perú.</p>
        </div>
      </footer>
    </div>
  );
};

const HeroBadge = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex items-center justify-center gap-2 group cursor-default">
    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 transition-colors group-hover:bg-slate-900 group-hover:text-white">
      {icon}
    </div>
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-left leading-tight group-hover:text-slate-900 transition-colors">{label}</span>
  </div>
);

const ProblemItem = ({ text }: { text: string }) => (
  <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
    <div className="h-8 w-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
      <X className="h-4 w-4" />
    </div>
    <p className="text-slate-600 font-bold tracking-tight">{text}</p>
  </div>
);

const SolutionCard = ({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all flex flex-col gap-6"
  >
    <div className="h-14 w-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
      {icon}
    </div>
    <div className="space-y-3">
      <h4 className="text-xl font-black text-slate-900 italic">{title}</h4>
      <p className="text-sm text-slate-500 font-medium leading-relaxed">{text}</p>
    </div>
  </motion.div>
);

const OperationalStep = ({ number, title, text }: { number: string; title: string; text: string }) => (
  <div className="space-y-6 group">
    <div className="text-6xl font-black text-slate-100 group-hover:text-blue-100 transition-colors leading-none italic">{number}</div>
    <div className="space-y-2">
      <h4 className="text-xl font-black text-slate-900 leading-tight">{title}</h4>
      <p className="text-sm text-slate-500 font-medium leading-relaxed">{text}</p>
    </div>
  </div>
);

const CheckItem = ({ text }: { text: string }) => (
  <div className="flex items-center gap-3">
    <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
      <Check className="h-3 w-3" />
    </div>
    <span className="font-bold text-slate-700 text-sm">{text}</span>
  </div>
);

const ImpactItem = ({ title, desc }: { title: string; desc: string }) => (
  <div className="p-8 bg-white rounded-3xl border border-slate-100 space-y-3 hover:border-slate-200 transition-colors">
    <h4 className="text-lg font-black text-slate-900">{title}</h4>
    <p className="text-sm text-slate-500 font-medium leading-relaxed">{desc}</p>
  </div>
);

