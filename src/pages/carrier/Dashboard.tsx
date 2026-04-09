import { useState, useEffect, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { Cargo, OperationType, Trip } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Truck, MapPin, Clock, ChevronRight, AlertCircle, RefreshCw, ShieldCheck, Upload, X, CheckCircle2, Navigation } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const CarrierDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [cargas, setCargas] = useState<Cargo[]>([]);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTrips, setLoadingTrips] = useState(true);

  const isAdmin = user?.email === 'lurgia18yuar@gmail.com' || user?.email === 'lurgiaalidayupa@gmail.com';

  useEffect(() => {
    if (isAdmin) {
      navigate('/admin');
    }
  }, [isAdmin, navigate]);
  const [refreshing, setRefreshing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [indexError, setIndexError] = useState<string | null>(null);
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    dni: null,
    licencia: null,
    tarjetaPropiedad: null
  });

  const fetchCargas = () => {
    if (!user || user.verificado !== 'verificado') {
      setLoading(false);
      return;
    }
    setRefreshing(true);
    setIndexError(null);

    const q = query(
      collection(db, 'cargas'),
      where('estado', '==', 'disponible'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cargo));
      setCargas(docs);
      setLoading(false);
      setRefreshing(false);
    }, (error: any) => {
      if (error.message?.includes('index')) {
        setIndexError(error.message);
      }
      handleFirestoreError(error, OperationType.LIST, 'cargas');
      setLoading(false);
      setRefreshing(false);
    });

    return unsubscribe;
  };

  const fetchActiveTrips = () => {
    if (!user || user.verificado !== 'verificado') {
      setLoadingTrips(false);
      return;
    }

    const q = query(
      collection(db, 'trips'),
      where('transportistaId', '==', user.uid),
      where('estado', 'in', ['en_camino_a_recojo', 'recojo_completado', 'en_camino_a_destino', 'entregado_pendiente_confirmacion']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
      setActiveTrips(docs);
      setLoadingTrips(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'trips');
      setLoadingTrips(false);
    });

    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribeCargas = fetchCargas();
    const unsubscribeTrips = fetchActiveTrips();
    return () => {
      unsubscribeCargas?.();
      unsubscribeTrips?.();
    };
  }, [user?.uid, user?.verificado]);

  const handleFileChange = (type: string, e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [type]: e.target.files![0] }));
    }
  };

  const handleUpload = async () => {
    if (!user) return;
    setUploading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const updatedData = {
        verificado: 'pendiente' as const,
        documentosUrls: {
          dni: 'https://placeholder.com/dni.jpg',
          licencia: 'https://placeholder.com/licencia.jpg',
          tarjetaPropiedad: 'https://placeholder.com/tarjeta.jpg'
        }
      };
      await updateDoc(userRef, updatedData);
      
      useAuthStore.getState().setUser({
        ...user,
        ...updatedData
      });
      
      setShowUploadModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAdminApprove = async () => {
    if (!user) return;
    setUploading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { verificado: 'verificado' });
      useAuthStore.getState().setUser({ ...user, verificado: 'verificado' });
    } catch (error) {
      console.error("Error approving:", error);
    } finally {
      setUploading(false);
    }
  };

  if (user?.verificado !== 'verificado') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-8">
        <div className="mx-auto h-20 w-20 bg-yellow-50 rounded-full flex items-center justify-center">
          <ShieldCheck className="h-10 w-10 text-yellow-600" />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.verificado === 'pendiente' ? "Documentos en Revisión" : "Cuenta en Verificación"}
          </h1>
          <p className="text-lg text-gray-600">
            {user?.verificado === 'pendiente' 
              ? "Hemos recibido tus documentos. Nuestro equipo los validará en un plazo máximo de 24 horas."
              : "Tu cuenta está siendo revisada por nuestro equipo. Una vez verificado, podrás empezar a ofertar por cargas."}
          </p>
          
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-left">
            <h3 className="font-bold text-blue-900 mb-2">Estado de documentos:</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-center">
                <div className={cn("h-1.5 w-1.5 rounded-full mr-2", (files.dni || user?.documentosUrls?.dni) ? "bg-green-500" : "bg-blue-600")} /> 
                DNI {(files.dni || user?.documentosUrls?.dni) && <CheckCircle2 className="h-3 w-3 ml-1 text-green-600" />}
              </li>
              <li className="flex items-center">
                <div className={cn("h-1.5 w-1.5 rounded-full mr-2", (files.licencia || user?.documentosUrls?.licencia) ? "bg-green-500" : "bg-blue-600")} /> 
                Licencia de Conducir {(files.licencia || user?.documentosUrls?.licencia) && <CheckCircle2 className="h-3 w-3 ml-1 text-green-600" />}
              </li>
              <li className="flex items-center">
                <div className={cn("h-1.5 w-1.5 rounded-full mr-2", (files.tarjetaPropiedad || user?.documentosUrls?.tarjetaPropiedad) ? "bg-green-500" : "bg-blue-600")} /> 
                Tarjeta de Propiedad {(files.tarjetaPropiedad || user?.documentosUrls?.tarjetaPropiedad) && <CheckCircle2 className="h-3 w-3 ml-1 text-green-600" />}
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user?.verificado !== 'pendiente' && (
              <Button variant="outline" onClick={() => setShowUploadModal(true)}>Subir Documentos Ahora</Button>
            )}
            
            {/* Botón de simulación para el dueño de la app */}
            {user?.verificado === 'pendiente' && (
              <div className="space-y-4 w-full">
                <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl text-orange-800 text-sm italic">
                  Como eres el desarrollador, puedes usar este botón para simular la aprobación que haría un administrador.
                </div>
                <Button onClick={handleAdminApprove} isLoading={uploading} className="bg-orange-600 hover:bg-orange-700">
                  Simular Aprobación (Admin)
                </Button>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showUploadModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
              >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h2 className="text-xl font-bold text-gray-900">Subir Documentos</h2>
                  <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    {['dni', 'licencia', 'tarjetaPropiedad'].map((type) => (
                      <div key={type} className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 capitalize">
                          {type === 'tarjetaPropiedad' ? 'Tarjeta de Propiedad' : type.toUpperCase()}
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            onChange={(e) => handleFileChange(type, e)}
                            className="hidden"
                            id={`file-${type}`}
                            accept="image/*"
                          />
                          <label
                            htmlFor={`file-${type}`}
                            className={cn(
                              "flex items-center justify-between p-3 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                              files[type] ? "border-green-200 bg-green-50" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                            )}
                          >
                            <div className="flex items-center">
                              <Upload className={cn("h-5 w-5 mr-3", files[type] ? "text-green-600" : "text-gray-400")} />
                              <span className="text-sm text-gray-600 truncate max-w-[200px]">
                                {files[type] ? files[type]!.name : "Seleccionar archivo..."}
                              </span>
                            </div>
                            {files[type] && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4">
                    <Button 
                      className="w-full h-12 text-lg shadow-lg shadow-blue-200"
                      onClick={handleUpload}
                      disabled={!files.dni || !files.licencia || !files.tarjetaPropiedad || uploading}
                      isLoading={uploading}
                    >
                      {uploading ? "Subiendo..." : "Enviar para Verificación"}
                    </Button>
                    <p className="text-center text-xs text-gray-400 mt-4">
                      Tus datos están protegidos y solo serán usados para la verificación de tu cuenta.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Viajes en Curso */}
      {activeTrips.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Navigation className="h-5 w-5 text-green-600 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Viajes en Curso</h2>
            </div>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {activeTrips.length} Activo{activeTrips.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeTrips.map((trip) => (
              <Link key={trip.id} to={`/trip/${trip.id}`}>
                <Card className="border-2 border-green-200 hover:border-green-500 transition-all bg-green-50/30 overflow-hidden group">
                  <div className="bg-green-600 h-1 w-full" />
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-green-600 tracking-widest">Servicio Activo</p>
                        <h3 className="text-lg font-bold text-gray-900">Viaje a {trip.destino}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-gray-400">Pago Final</p>
                        <p className="text-xl font-black text-gray-900">S/ {trip.precioFinal}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 bg-white/50 p-3 rounded-xl border border-green-100">
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
                        Llega en: <span className="text-green-700 font-bold ml-1">{trip.tiempoEstimado || 'Calculando...'}</span>
                      </div>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 h-9 px-4">
                        Ver Mapa
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
          <h1 className="text-3xl font-bold text-gray-900">Cargas Disponibles</h1>
          <p className="text-gray-600">Encuentra fletes en tus zonas de operación y haz tu oferta.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-green-700 uppercase tracking-wider">En Línea</span>
          </div>
          <Button variant="outline" onClick={() => fetchCargas()} isLoading={refreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Actualizar
          </Button>
        </div>
      </header>

      {/* Zonas Activas */}
      <section className="flex flex-wrap gap-2">
        <span className="text-sm font-bold text-gray-500 uppercase tracking-wider mr-2 self-center">Zonas Activas:</span>
        {user.zonasOperacion?.map((zona) => (
          <span key={zona} className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-100">
            {zona}
          </span>
        ))}
      </section>

      {indexError && (
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-orange-900">Falta un índice en Firestore</h4>
            <p className="text-sm text-orange-800">
              Esta consulta requiere un índice compuesto. Por favor, haz clic en el enlace que aparece en la consola del navegador para crearlo.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : cargas.length === 0 ? (
        <Card className="border-dashed border-2 py-20 text-center">
          <CardContent className="space-y-4">
            <div className="mx-auto h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center">
              <Truck className="h-8 w-8 text-gray-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900">No hay cargas disponibles</h3>
              <p className="text-gray-500">Vuelve a intentar en unos minutos o revisa tus zonas de operación.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cargas.map((carga) => (
            <Link key={carga.id} to={`/carrier/cargo/${carga.id}`}>
              <Card className="hover:border-blue-300 transition-all group overflow-hidden border-2 border-transparent hover:border-blue-500">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-bold group-hover:text-blue-600 transition-colors">
                      {carga.tipoCarga}
                    </CardTitle>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Peso</span>
                      <span className="text-sm font-bold text-gray-900">{carga.peso}</span>
                    </div>
                  </div>
                  <CardDescription className="flex items-center text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Publicado {formatDistanceToNow(carga.createdAt, { addSuffix: true, locale: es })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pb-6">
                  <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-start text-sm">
                      <div className="flex flex-col items-center mr-3 mt-1">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <div className="w-0.5 h-6 bg-gray-200 my-1" />
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                      </div>
                      <div className="space-y-4 flex-1">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-gray-400">Origen</span>
                          <span className="text-gray-900 font-medium truncate">{carga.origen}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-gray-400">Destino</span>
                          <span className="text-gray-900 font-medium truncate">{carga.destino}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Propuesta</span>
                      <span className="text-2xl font-extrabold text-blue-600">S/ {carga.precioPropuesto}</span>
                    </div>
                    <Button size="sm" className="h-10 px-6">
                      Ofertar
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
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
