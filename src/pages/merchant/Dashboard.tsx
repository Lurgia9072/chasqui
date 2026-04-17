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
import { ADMIN_EMAILS } from '../../lib/constants';
import { NearbyCarriersMap } from '../../components/NearbyCarriersMap';
import { User } from '../../types';

export const MerchantDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [cargas, setCargas] = useState<Cargo[]>([]);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [carriers, setCarriers] = useState<User[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
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
      where('estado', 'in', ['pendiente_pago', 'pago_en_revision', 'en_camino_a_recojo', 'recojo_completado', 'en_camino_a_destino', 'entregado_pendiente_confirmacion']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeTrips = onSnapshot(qTrips, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
      setActiveTrips(docs);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
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
                <Card className="border-2 border-blue-200 hover:border-blue-500 transition-all bg-blue-50/30 overflow-hidden group">
                  <div className="bg-blue-600 h-1 w-full" />
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-blue-600 tracking-widest">
                          {trip.estado === 'pendiente_pago' || trip.estado === 'pago_en_revision' || trip.estado === 'pago_rechazado' ? 'Pago Requerido' : 'Carga en Tránsito'}
                        </p>
                        <h3 className="text-lg font-bold text-gray-900">Destino: {trip.destino}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-gray-400">Estado</p>
                        <p className={cn(
                          "text-sm font-bold",
                          trip.estado === 'pendiente_pago' ? "text-orange-600" :
                          trip.estado === 'pago_en_revision' ? "text-blue-600" : 
                          trip.estado === 'pago_rechazado' ? "text-red-600" : "text-green-600"
                        )}>
                          {trip.estado === 'pendiente_pago' ? 'Pendiente de Pago' :
                           trip.estado === 'pago_en_revision' ? 'En Revisión' : 
                           trip.estado === 'pago_rechazado' ? 'Pago Rechazado' : 'En Camino'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 bg-white/50 p-3 rounded-xl border border-blue-100">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-red-500" />
                        <span className="truncate max-w-[120px]">{trip.origen}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-blue-500" />
                        <span className="truncate max-w-[120px]">{trip.destino}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center text-xs text-gray-500 font-medium">
                        <Clock className="h-3.5 w-3.5 mr-1.5" />
                        Llega en: <span className="text-blue-700 font-bold ml-1">{trip.tiempoEstimado || 'Calculando...'}</span>
                      </div>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-9 px-4">
                        Rastrear Carga
                        <Navigation className="h-3.5 w-3.5 ml-1.5" />
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
          {cargas.map((carga) => (
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
                      {carga.tipoCarga}
                    </CardTitle>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Capacidad</span>
                      <span className="text-xs font-bold text-blue-600">{carga.capacidadRequerida}</span>
                    </div>
                    <span className={cn(
                      "text-[10px] uppercase font-bold px-2 py-1 rounded-full",
                      carga.estado === 'disponible' ? "bg-green-100 text-green-700" : 
                      carga.estado === 'en_negociacion' ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                    )}>
                      {carga.estado}
                    </span>
                  </div>
                  <CardDescription className="flex items-center text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Publicado {formatDistanceToNow(carga.createdAt, { addSuffix: true, locale: es })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pb-6">
                  <div className="space-y-2">
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
          ))}
        </div>
      )}
    </div>
  );
};
