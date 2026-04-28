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
      {/* 🚀 HERO SECTION */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-slate-50 border-b border-slate-200">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider mb-4">
                <Zap className="h-3 w-3 fill-current" />
                <span>Logística 4.0 en Perú</span>
              </div>
              
              <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-slate-900 leading-[1.1]">
                Transporte de carga <span className="text-blue-600">seguro, negociado</span> y monitoreado
              </h1>
              
              <p className="mt-8 text-xl text-slate-600 max-w-3xl mx-auto font-medium leading-relaxed">
                Conecta con transportistas verificados, negocia el precio y sigue tu carga minuto a minuto con alertas inteligentes.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link to="/register?role=comerciante" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-16 px-10 text-lg shadow-xl shadow-blue-500/20 group">
                  <Package className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                  Publicar Carga
                </Button>
              </Link>
              <Link to="/register?role=transportista" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-16 px-10 text-lg border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300">
                  <Truck className="mr-2 h-5 w-5" />
                  Quiero Transportar
                </Button>
              </Link>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="flex flex-wrap items-center justify-center gap-8 pt-12 grayscale opacity-60"
            >
              <div className="flex items-center gap-2 group cursor-default hover:grayscale-0 hover:opacity-100 transition-all">
                <Lock className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-bold text-slate-700 uppercase tracking-tighter">Pagos Protegidos</span>
              </div>
              <div className="flex items-center gap-2 group cursor-default hover:grayscale-0 hover:opacity-100 transition-all">
                <MapPin className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-bold text-slate-700 uppercase tracking-tighter">GPS en Tiempo Real</span>
              </div>
              <div className="flex items-center gap-2 group cursor-default hover:grayscale-0 hover:opacity-100 transition-all">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-bold text-slate-700 uppercase tracking-tighter">Conductores Verificados</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 💡 EL PROBLEMA */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl font-black text-slate-900 sm:text-4xl">
                El transporte de carga en Perú sigue siendo <span className="text-red-500 underline decoration-red-200 decoration-4 underline-offset-4 font-black">inseguro e informal.</span>
              </h2>
              <div className="space-y-4">
                {[
                  "No sabes quién lleva realmente tu mercadería",
                  "No hay seguimiento real (solo llamadas molestas)",
                  "Riesgo constante de estafas o robos",
                  "Pagos sin garantía y precios abusivos"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-xl hover:bg-red-50 transition-colors group">
                    <div className="mt-1 h-6 w-6 flex items-center justify-center rounded-full bg-red-100 text-red-500 flex-shrink-0 group-hover:scale-110 transition-transform">
                      <X className="h-4 w-4" />
                    </div>
                    <p className="text-slate-600 font-medium">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <motion.div 
               whileHover={{ scale: 1.02 }}
               className="relative lg:h-[500px] bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl group border-[12px] border-slate-100"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 p-12 flex flex-col justify-center text-white">
                <div className="space-y-6">
                  <div className="h-16 w-16 bg-blue-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/40">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-4xl font-black">Es hora de cambiar las reglas.</h3>
                  <p className="text-slate-400 text-lg max-w-md">
                    Chasqui transforma la logística en un sistema seguro, transparente y controlado por ti.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 🚀 LA SOLUCIÓN (Bento Grid) */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-black text-slate-900">Nuestra solución es tu control total</h2>
            <p className="text-slate-600 max-w-2xl mx-auto font-medium">Logística diseñada para comerciantes y transportistas reales.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<Shield className="h-6 w-6 text-emerald-500" />}
              title="Verificación Completa"
              desc="DNI, licencia, SOAT y antecedentes validados para cada conductor y vehículo."
              bgColor="bg-emerald-50"
            />
            <FeatureCard 
              icon={<BarChart3 className="h-6 w-6 text-blue-500" />}
              title="Negociación Directa"
              desc="tú propones, ellos ofertan. Sin intermediarios que encarezcan el servicio."
              bgColor="bg-blue-50"
            />
            <FeatureCard 
              icon={<MapPin className="h-6 w-6 text-indigo-500" />}
              title="Seguimiento GPS"
              desc="Visualiza la ruta en tiempo real y recibe alertas inteligentes por desvíos o paradas."
              bgColor="bg-indigo-50"
            />
            <FeatureCard 
              icon={<Signal className="h-6 w-6 text-amber-500" />}
              title="Estado de Conexión"
              desc="Monitorea la señal del transportista: estable, baja o sin conexión en zonas críticas."
              bgColor="bg-amber-50"
            />
            <FeatureCard 
              icon={<Lock className="h-6 w-6 text-purple-500" />}
              title="Pago Protegido"
              desc="Mantenemos el dinero en custodia hasta que confirmas la entrega exitosa."
              bgColor="bg-purple-50"
            />
            <FeatureCard 
              icon={<Monitor className="h-6 w-6 text-cyan-500" />}
              title="Dashboards Modernos"
              desc="Toda la información de tus viajes, ingresos y reportes en una sola interfaz limpia."
              bgColor="bg-cyan-50"
            />
          </div>
        </div>
      </section>

      {/* ⚙️ CÓMO FUNCIONA */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl font-black text-slate-900">Flujo claro para tu tranquilidad</h2>
            <p className="text-slate-600 font-medium">Del clic a la entrega en 6 pasos sencillos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-12 relative">
            {/* Steps line for desktop */}
            <div className="hidden lg:block absolute top-10 left-32 right-32 h-0.5 bg-slate-100 -z-10"></div>
            
            <StepItem number="1" title="Publica tu carga" text="Indica origen, destino, tipo de vehículo y cuánto deseas pagar." />
            <StepItem number="2" title="Recibe ofertas" text="Transportistas verificados compiten o contraofertan por tu carga." />
            <StepItem number="3" title="Acepta el mejor trato" text="Analiza perfiles de conductores y elige con quién trabajar." />
            <StepItem number="4" title="Seguimiento en vivo" text="Visualiza el viaje en tiempo real con GPS y alertas de estado." />
            <StepItem number="5" title="Entrega verificada" text="Evidencia fotográfica en recojo y entrega para tu seguridad." />
            <StepItem number="6" title="Pago seguro" text="El dinero se libera solo cuando confirmas que todo llegó bien." />
          </div>
        </div>
      </section>

      {/* 📊 REPORTE PROFESIONAL VS SEGURIDAD */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <motion.div 
                animate={{ rotate: -2 }}
                className="bg-white rounded-[2rem] shadow-2xl p-8 border border-white/20 text-slate-900"
              >
                <div className="flex items-center justify-between border-b pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                      <Zap className="h-6 w-6" />
                    </div>
                    <span className="font-bold uppercase tracking-widest text-xs">Reporte de Viaje</span>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-black uppercase">Válido</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-dashed pb-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Origen / Destino</span>
                    <span className="text-xs font-bold font-mono">Lima → Huancayo</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Ruta Realizada</span>
                        <div className="h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                          <MapPin className="h-4 w-4 text-blue-500" />
                          <div className="ml-1 w-12 h-1 bg-blue-200 rounded-full relative">
                            <div className="absolute right-0 top-0 h-1 w-4 bg-blue-500 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Incidentes</span>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span className="text-xs font-bold">0 Alertas críticas</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Conductor</span>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 bg-slate-200 rounded-full"></div>
                          <span className="text-xs font-bold">Carlos M.</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Evidencias</span>
                        <div className="flex gap-1">
                          <div className="h-8 w-8 bg-slate-100 rounded"></div>
                          <div className="h-8 w-8 bg-slate-100 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-4 border-t border-slate-100 flex justify-center">
                   <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-not-allowed opacity-80">
                      <Receipt className="h-4 w-4" />
                      Descargar Reporte PDF
                   </div>
                </div>
              </motion.div>
              
              {/* Badge for PDF */}
              <div className="absolute -top-6 -right-6 h-24 w-24 bg-emerald-500 rounded-full flex items-center justify-center text-white rotate-12 flex-col leading-none shadow-xl border-4 border-slate-900">
                <span className="text-[10px] font-bold">VALOR</span>
                <span className="text-xl font-black italic">ORO</span>
              </div>
            </div>

            <div className="space-y-10">
              <div className="space-y-6">
                <h2 className="text-4xl font-black leading-tight italic">
                  Reportes profesionales para empresas reales.
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed font-medium">
                  Al finalizar cada viaje, obtienes un reporte completo en PDF con ruta histórica, incidentes, datos del conductor y evidencias de entrega. El estándar de seguridad que tu negocio merece.
                </p>
              </div>

              <div className="space-y-6 border-l-2 border-blue-500 pl-8">
                <SecurityTag title="Validación de Identidad" text="Verificación biométrica y documental de cada chofer." />
                <SecurityTag title="Validación de Vehículo" text="SOAT, Revisión Técnica y permisos MTC vigentes." />
                <SecurityTag title="Monitoreo Activo" text="Nuestro sistema detecta paradas no autorizadas automáticamente." />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🎯 FINAL CTA */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="space-y-10 bg-slate-50 border border-slate-200 p-12 sm:p-20 rounded-[3rem] shadow-2xl"
          >
            <div className="space-y-6">
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Empieza a transportar con <span className="text-blue-600">seguridad hoy mismo</span>
              </h2>
              <p className="text-slate-600 text-lg font-medium max-w-xl mx-auto">
                No somos solo una app, somos tu garantía logística en todo el territorio nacional.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/register?role=comerciante" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-16 px-12 text-lg shadow-xl shadow-blue-500/20">
                  Publicar Carga Ahora
                </Button>
              </Link>
              <Link to="/register?role=transportista" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-16 px-12 text-lg border-2 border-slate-200 bg-white shadow-xl shadow-slate-100">
                  Registrarme como Transportista
                </Button>
              </Link>
            </div>
            
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
              Logística sin incertidumbre • Chasqui SAC
            </p>
          </motion.div>
        </div>
        
        {/* Background decorative elements */}
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-blue-100 rounded-full blur-[100px] -translate-y-1/2 -z-10 opacity-50"></div>
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-emerald-100 rounded-full blur-[100px] -translate-y-1/2 -z-10 opacity-50"></div>
      </section>

      {/* FOOTER SIMPLE */}
      <footer className="py-12 border-t border-slate-100 bg-slate-50">
        <div className="max-w-7xl auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
              <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center text-white rotate-3">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-xl font-black tracking-tighter text-slate-900">chasqui</span>
          </div>
          <p className="text-sm font-medium text-slate-400">© 2026 Chasqui Logística. Diseñado para el comercio peruano.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, bgColor }: { icon: React.ReactNode; title: string; desc: string; bgColor: string }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className={cn("p-8 rounded-3xl border border-slate-100 bg-white transition-all hover:shadow-xl hover:shadow-slate-200/50 flex flex-col items-start gap-6")}
  >
    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center text-xl shadow-sm", bgColor)}>
      {icon}
    </div>
    <div className="space-y-3">
      <h3 className="text-xl font-bold tracking-tight text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
  </motion.div>
);

const StepItem = ({ number, title, text }: { number: string; title: string; text: string }) => (
  <div className="flex flex-col items-start lg:items-center text-left lg:text-center space-y-4 group">
    <div className="h-20 w-20 rounded-full bg-slate-50 border border-slate-100 text-slate-900 flex items-center justify-center text-2xl font-black shadow-lg shadow-slate-100 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 transition-all duration-300">
      {number}
    </div>
    <div className="space-y-2">
      <h4 className="text-xl font-black text-slate-900">{title}</h4>
      <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[200px] mx-auto">{text}</p>
    </div>
  </div>
);

const SecurityTag = ({ title, text }: { title: string; text: string }) => (
  <div className="space-y-1">
    <div className="flex items-center gap-2">
      <Check className="h-5 w-5 text-blue-500" />
      <h4 className="text-lg font-bold">{title}</h4>
    </div>
    <p className="text-slate-500 text-sm font-medium">{text}</p>
  </div>
);
