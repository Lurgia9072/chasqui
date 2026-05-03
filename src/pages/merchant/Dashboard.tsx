import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { auth, db, handleFirestoreError } from '../../firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { Cargo, OperationType, Trip } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Plus, Package, MapPin, Clock, ChevronRight, AlertCircle, Navigation, ShieldCheck, Truck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';
import { ADMIN_EMAILS, TRIP_STATUS_LABELS } from '../../lib/constants';
import { NearbyCarriersMap } from '../../components/NearbyCarriersMap';
import { generateMonthlyReport } from '../../lib/pdfGenerator';
import { User } from '../../types';

export const MerchantDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [cargas, setCargas] = useState<Cargo[]>([]);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [completedTrips, setCompletedTrips] = useState<Trip[]>([]);
  const [carriers, setCarriers] = useState<User[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [filter, setFilter] = useState<'activas' | 'por_salir' | 'completadas'>('activas');
  const [loading, setLoading] = useState(true);
  const [loadingTrips, setLoadingTrips] = useState(true);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email.toLowerCase());

  useEffect(() => {
    if (isAdmin) {
      navigate('/admin');
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (!user) return;

    const qCargas = query(
      collection(db, 'cargas'),
      where('comercianteId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeCargas = onSnapshot(qCargas, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cargo));
      setCargas(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'cargas');
      setLoading(false);
    });

    const qTrips = query(
      collection(db, 'trips'),
      where('comercianteId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeTrips = onSnapshot(qTrips, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
      setActiveTrips(docs.filter(t => !['completado', 'cancelado'].includes(t.estado)));
      setCompletedTrips(docs.filter(t => t.estado === 'completado'));
      setLoadingTrips(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'trips');
      setLoadingTrips(false);
    });

    const qCarriers = query(
      collection(db, 'users'),
      where('tipoUsuario', '==', 'transportista'),
      where('verificado', '==', 'verificado')
    );

    const unsubscribeCarriers = onSnapshot(qCarriers, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
      setCarriers(docs);
    });

    return () => {
      unsubscribeCargas();
      unsubscribeTrips();
      unsubscribeCarriers();
    };
  }, [user]);

  const handleExportMonthly = () => {
    if (!user || completedTrips.length === 0) {
      alert('No hay viajes completados este mes para exportar.');
      return;
    }
    generateMonthlyReport(completedTrips, user as any);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white border border-slate-800 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="space-y-4 text-center md:text-left">
              <div className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-300 px-4 py-1.5 rounded-full border border-blue-500/30 text-xs font-bold tracking-widest uppercase">
                 <ShieldCheck className="h-4 w-4" />
                 <span>Panel de Control - Empresa Exportadora</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none italic">
                {user?.nombre}
              </h1>
              <p className="text-slate-400 text-lg max-w-xl font-medium">
                Trazabilidad logística en tiempo real para transportes seguros.
              </p>
           </div>
           
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 text-center">
                 <p className="text-3xl font-black text-blue-400">{activeTrips.length}</p>
                 <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">En Tránsito</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 text-center">
                 <p className="text-3xl font-black text-green-400">{cargas.filter(c => c.estado === 'completado').length}</p>
                 <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Entregados</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 text-center">
                 <p className="text-3xl font-black text-orange-400">{activeTrips.filter(t => t.alertas?.riesgoLlegadaTardia).length}</p>
                 <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">En Riesgo</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 text-center">
                 <p className="text-3xl font-black text-purple-400">{cargas.length}</p>
                 <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Total Envíos</p>
              </div>
            </div>
        </div>
        
        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-400/10 rounded-full blur-[80px] -ml-32 -mb-32" />
      </div>

      {user?.verificado !== 'verificado' && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-100 relative overflow-hidden"
        >
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-4 text-center md:text-left">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
                <Clock className="h-3 w-3 mr-2" />
                Proceso de Verificación
              </div>
              <h1 className="text-3xl md:text-4xl font-black">
                Estamos validando tu cuenta
              </h1>
              <p className="text-blue-100 text-lg max-w-2xl">
                ¡Excelente! Hemos recibido tu DNI. Nuestro equipo lo está revisando para asegurar la seguridad de la plataforma. Este proceso suele demorar menos de 24 horas.
              </p>
            </div>
            <div className="shrink-0">
              <div className="h-32 w-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20">
                <ShieldCheck className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>
          <div className="absolute -right-10 -top-10 h-40 w-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-10 -bottom-10 h-40 w-40 bg-blue-400/20 rounded-full blur-3xl" />
        </motion.div>
      )}

      {isAdmin && (
        <div className="bg-purple-600 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-purple-200">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Modo Administrador Activo</h2>
              <p className="text-purple-100 text-sm">Tienes pagos pendientes por verificar en la plataforma.</p>
            </div>
          </div>
          <Link to="/admin">
            <Button className="bg-white text-purple-600 hover:bg-purple-50 font-bold px-8 h-12">
              Ir al Panel Admin
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      )}

      {/* Viajes en Curso */}
      {activeTrips.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Navigation className="h-5 w-5 text-blue-600 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Seguimiento de Envíos</h2>
            </div>
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {activeTrips.length} en camino
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeTrips.map((trip) => (
              <Link key={trip.id} to={`/trip/${trip.id}`}>
                <Card className="border-2 border-slate-200 hover:border-blue-500 transition-all bg-white overflow-hidden group shadow-lg shadow-slate-100">
                  <div className={cn(
                    "h-1.5 w-full",
                    trip.alertas?.riesgoLlegadaTardia || trip.alertas?.desvioRuta ? "bg-red-500 animate-pulse" : "bg-blue-600"
                  )} />
                  <CardContent className="p-6 space-y-5">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                           <p className="text-[10px] uppercase font-black text-blue-600 tracking-widest">
                            {TRIP_STATUS_LABELS[trip.estado]?.label || trip.estado.replace(/_/g, ' ')}
                           </p>
                           {trip.alertas?.riesgoLlegadaTardia && (
                             <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center">
                               <AlertCircle className="h-3 w-3 mr-1" /> MARGEN CRÍTICO
                             </span>
                           )}
                        </div>
                        <h3 className="text-xl font-black text-slate-900 leading-tight">
                           {trip.nombreProducto || trip.tipoCarga || 'Carga General'}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Lote: {trip.lote || 'PEN-77'}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center min-w-[80px]">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Puerto</p>
                        <p className="text-xs font-black text-slate-900">{trip.puertoDestino || 'CALLAO'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-slate-600 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <span className="text-[9px] uppercase font-black text-slate-400 mb-1">Origen</span>
                        <span className="truncate font-bold text-slate-800">{trip.origen}</span>
                      </div>
                      <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0 border border-slate-100">
                        <ChevronRight className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="flex flex-col flex-1 overflow-hidden text-right">
                        <span className="text-[9px] uppercase font-black text-slate-400 mb-1">Destino</span>
                        <span className="truncate font-bold text-slate-800">{trip.destino}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex flex-col">
                         <span className="text-[10px] text-slate-400 font-black uppercase">Llegada Estimada</span>
                         <span className="text-blue-600 font-black text-sm">{trip.tiempoEstimado || 'Calculando...'}</span>
                      </div>
                      <Button size="sm" className="bg-slate-900 hover:bg-black h-11 px-6 rounded-xl font-black">
                        MONITOREO GPS
                        <Navigation className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Cargas</h1>
          <p className="text-gray-600">Gestiona tus envíos y revisa las ofertas recibidas.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 p-1 rounded-xl mr-2">
            <button 
              onClick={() => setFilter('activas')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                filter === 'activas' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              En Tránsito
            </button>
            <button 
              onClick={() => setFilter('por_salir')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                filter === 'por_salir' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Por salir
            </button>
            <button 
              onClick={() => setFilter('completadas')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                filter === 'completadas' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Completadas
            </button>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-xl mr-2">
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === 'list' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Lista
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === 'map' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Mapa
            </button>
          </div>
          <Link to="/merchant/post-cargo">
            <Button className="h-12 px-6 shadow-lg shadow-blue-200">
              <Plus className="h-5 w-5 mr-2" />
              Publicar Nueva Carga
            </Button>
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : cargas.length === 0 ? (
        <Card className="border-dashed border-2 py-20 text-center">
          <CardContent className="space-y-4">
            <div className="mx-auto h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900">No tienes cargas publicadas</h3>
              <p className="text-gray-500">Publica tu primera carga para empezar a recibir ofertas de transportistas.</p>
            </div>
            <Link to="/merchant/post-cargo">
              <Button variant="outline">Publicar Carga</Button>
            </Link>
          </CardContent>
        </Card>
      ) : viewMode === 'map' ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full space-y-6"
        >
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900">Transportistas Cercanos</h3>
                <p className="text-xs text-blue-700">Explora los transportistas disponibles en tu área.</p>
              </div>
            </div>
            <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-blue-600 border border-blue-200">
              {carriers.length} Activos
            </span>
          </div>
          <NearbyCarriersMap carriers={carriers} />
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filter === 'completadas' ? (
            completedTrips.map((trip) => (
              <Link key={trip.id} to={`/trip/${trip.id}`}>
                <Card className="hover:border-green-300 border-2 border-green-50 transition-all group overflow-hidden bg-white shadow-sm">
                  <div className="h-1.5 w-full bg-green-500" />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-bold group-hover:text-green-600 transition-colors">
                        {trip.nombreProducto || trip.tipoCarga || 'Carga Finalizada'}
                      </CardTitle>
                      <span className="text-[10px] uppercase font-bold px-2 py-1 rounded-full bg-green-100 text-green-700">
                        Entregado
                      </span>
                    </div>
                    <CardDescription className="flex items-center text-[10px] font-bold text-slate-500 uppercase">
                      <ShieldCheck className="h-3 w-3 mr-1 text-green-600" />
                      Trazabilidad Certificada
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pb-6">
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                      <span>Guía: <span className="text-slate-900">{trip.guiaRemision || 'N/E'}</span></span>
                      <span>Lote: <span className="text-slate-900">{trip.lote || 'N/E'}</span></span>
                    </div>
                    <div className="space-y-2 border-t border-slate-50 pt-3">
                      <div className="flex items-start text-sm">
                        <MapPin className="h-4 w-4 text-slate-400 mr-2 mt-0.5 shrink-0" />
                        <span className="text-gray-600 font-medium truncate">{trip.origen}</span>
                      </div>
                      <div className="flex items-start text-sm">
                        <MapPin className="h-4 w-4 text-green-500 mr-2 mt-0.5 shrink-0" />
                        <span className="text-gray-600 font-medium truncate">{trip.destino}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-4 border-t border-green-50">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Inversión Final</span>
                        <span className="text-lg font-extrabold text-gray-900">S/ {trip.precioFinal}</span>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                        <ChevronRight className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            cargas
              .filter(c => {
                 if (filter === 'activas') return c.estado === 'asignado';
                 if (filter === 'por_salir') return c.estado === 'disponible' || c.estado === 'en_negociacion';
                 return true;
              })
              .map((carga) => (
              <Link key={carga.id} to={`/merchant/cargo/${carga.id}`}>
                <Card className="hover:border-blue-300 transition-all group overflow-hidden">
                  <div className={cn(
                    "h-1.5 w-full",
                    carga.estado === 'disponible' ? "bg-green-500" : 
                    carga.estado === 'en_negociacion' ? "bg-blue-500" : "bg-gray-400"
                  )} />
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-bold group-hover:text-blue-600 transition-colors">
                        {carga.nombreProducto || carga.tipoCarga}
                      </CardTitle>
                      <span className={cn(
                        "text-[10px] uppercase font-bold px-2 py-1 rounded-full",
                        carga.estado === 'disponible' ? "bg-green-100 text-green-700" : 
                        carga.estado === 'en_negociacion' ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                      )}>
                        {carga.estado}
                      </span>
                    </div>
                    <CardDescription className="flex items-center text-[10px] font-bold text-slate-500 uppercase">
                      <Clock className="h-3 w-3 mr-1" />
                      Puerto Destino: <span className="text-slate-900 ml-1">{carga.puertoDestino || 'N/E'}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pb-6">
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                      <span>Lote: <span className="text-slate-900">{carga.lote || 'N/E'}</span></span>
                      <span>Guía: <span className="text-slate-900">{carga.guiaRemision || 'N/E'}</span></span>
                    </div>
                    <div className="space-y-2 border-t border-slate-50 pt-3">
                      <div className="flex items-start text-sm">
                        <MapPin className="h-4 w-4 text-red-500 mr-2 mt-0.5 shrink-0" />
                        <span className="text-gray-600 font-medium truncate">{carga.origen}</span>
                      </div>
                      <div className="flex items-start text-sm">
                        <MapPin className="h-4 w-4 text-blue-500 mr-2 mt-0.5 shrink-0" />
                        <span className="text-gray-600 font-medium truncate">{carga.destino}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Precio Propuesto</span>
                        <span className="text-xl font-extrabold text-gray-900">S/ {carga.precioPropuesto}</span>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Reports Section */}
      <section className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
             <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black">
                RE
             </div>
             <div>
                <h2 className="text-2xl font-black text-slate-900">Auditoría y Reportes</h2>
                <p className="text-sm text-slate-500">Historial de trazabilidad certificado por Chasqui.</p>
             </div>
          </div>
          <Button 
            variant="outline" 
            className="font-bold border-slate-200"
            onClick={handleExportMonthly}
          >
            Exportar Reporte Mensual PDF
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <Package className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="font-black text-slate-900">Reportes del Mes</h3>
              <p className="text-xs text-slate-500 mt-1">{cargas.filter(c => c.estado === 'completado').length} envíos certificados este mes.</p>
           </div>
           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <ShieldCheck className="h-8 w-8 text-green-600 mb-4" />
              <h3 className="font-black text-slate-900">KPI de Cumplimiento</h3>
              <p className="text-xs text-slate-500 mt-1">98.4% de las cargas llegaron conforme y a tiempo.</p>
           </div>
           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <AlertCircle className="h-8 w-8 text-orange-600 mb-4" />
              <h3 className="font-black text-slate-900">Alertas Activas</h3>
              <p className="text-xs text-slate-500 mt-1">{activeTrips.filter(t => t.alertas?.riesgoLlegadaTardia).length} envíos con margen de tiempo crítico.</p>
           </div>
        </div>
      </section>
    </div>
  );
};
