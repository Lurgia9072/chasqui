import React, { useState, useEffect, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { Cargo, OperationType, Trip } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Truck, MapPin, Clock, ChevronRight, AlertCircle, RefreshCw, ShieldCheck, Upload, X, CheckCircle2, Navigation, FileText, Landmark } from 'lucide-react';
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

  const isAdmin = user?.email === 'vvendiya@gmail.com' || user?.email === 'lurgiaalidayupa@gmail.com';

  useEffect(() => {
    if (isAdmin) {
      navigate('/admin');
    }
  }, [isAdmin, navigate]);
  const [refreshing, setRefreshing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [indexError, setIndexError] = useState<string | null>(null);
  const [fileErrors, setFileErrors] = useState<{ [key: string]: string | null }>({
    dni: null,
    licencia: null,
    tarjetaPropiedad: null
  });
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    dni: null,
    licencia: null,
    tarjetaPropiedad: null
  });
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankData, setBankData] = useState({
    banco: user?.datosBancarios?.banco || '',
    tipoCuenta: user?.datosBancarios?.tipoCuenta || '',
    numeroCuenta: user?.datosBancarios?.numeroCuenta || '',
    cci: user?.datosBancarios?.cci || '',
    titular: user?.datosBancarios?.titular || user?.nombre || ''
  });
  const [savingBank, setSavingBank] = useState(false);

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
    const file = e.target.files?.[0];
    setFileErrors(prev => ({ ...prev, [type]: null }));
    
    if (!file) return;

    // Validar tipo (Imágenes y PDF)
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setFileErrors(prev => ({ ...prev, [type]: 'Solo JPG, PNG o PDF.' }));
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFileErrors(prev => ({ ...prev, [type]: 'Máximo 5MB.' }));
      return;
    }

    setFiles(prev => ({ ...prev, [type]: file }));
  };

  const handleUpload = async () => {
    if (!user) return;
    setUploading(true);
    try {
      // Simular tiempo de subida
      await new Promise(resolve => setTimeout(resolve, 2000));

      const userRef = doc(db, 'users', user.uid);
      const updatedData = {
        verificado: 'pendiente' as const,
        documentosUrls: {
          dni: 'https://firebasestorage.googleapis.com/v0/b/transportaya.appspot.com/o/docs%2Fdni.jpg?alt=media',
          licencia: 'https://firebasestorage.googleapis.com/v0/b/transportaya.appspot.com/o/docs%2Flicencia.jpg?alt=media',
          tarjetaPropiedad: 'https://firebasestorage.googleapis.com/v0/b/transportaya.appspot.com/o/docs%2Ftarjeta.jpg?alt=media'
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

  const handleSaveBank = async () => {
    if (!user) return;
    setSavingBank(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        datosBancarios: bankData
      });
      useAuthStore.getState().setUser({
        ...user,
        datosBancarios: bankData
      });
      setShowBankModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setSavingBank(false);
    }
  };

  if (user?.verificado !== 'verificado') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner de Verificación Pendiente */}
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
                {user?.verificado === 'pendiente' ? "Estamos validando tu cuenta" : "Completa tu perfil de Transportista"}
              </h1>
              <p className="text-blue-100 text-lg max-w-2xl">
                {user?.verificado === 'pendiente' 
                  ? "¡Excelente! Hemos recibido tus documentos. Nuestro equipo los está revisando minuciosamente. Este proceso suele demorar menos de 24 horas."
                  : "Para empezar a recibir ofertas y ganar dinero, necesitamos verificar tu identidad y documentos del vehículo."}
              </p>
              {user?.verificado !== 'pendiente' && (
                <Button 
                  onClick={() => setShowUploadModal(true)}
                  className="bg-white text-blue-600 hover:bg-blue-50 h-12 px-8 font-bold"
                >
                  Subir Documentos Ahora
                </Button>
              )}
            </div>
            <div className="shrink-0">
              <div className="h-32 w-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20">
                <ShieldCheck className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute -right-10 -top-10 h-40 w-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-10 -bottom-10 h-40 w-40 bg-blue-400/20 rounded-full blur-3xl" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Truck className="h-6 w-6 mr-2 text-blue-600" />
              Próximos Pasos
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StepCard 
                icon={<FileText className="h-6 w-6 text-blue-600" />}
                title="Validación de Documentos"
                description="Revisamos tu DNI, Licencia y Tarjeta de Propiedad."
                status={user?.verificado === 'pendiente' ? 'in_progress' : 'pending'}
              />
              <StepCard 
                icon={<Landmark className="h-6 w-6 text-emerald-600" />}
                title="Datos Bancarios"
                description="Configura dónde quieres recibir tus pagos."
                status={user?.datosBancarios?.numeroCuenta ? 'completed' : 'pending'}
              />
            </div>

            <Card className="border-dashed border-2 bg-gray-50/50">
              <CardContent className="p-12 text-center space-y-4">
                <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Clock className="h-8 w-8 text-gray-300" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-900">Cargas Bloqueadas</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    Una vez que tu cuenta sea verificada (máx. 24 hrs), aquí aparecerán todas las cargas disponibles en tus zonas de operación.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estado de Verificación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <DocStatusItem label="DNI / RUC" status={user?.documentosUrls?.dni ? 'uploaded' : 'missing'} />
                  <DocStatusItem label="Licencia de Conducir" status={user?.documentosUrls?.licencia ? 'uploaded' : 'missing'} />
                  <DocStatusItem label="Tarjeta de Propiedad" status={user?.documentosUrls?.tarjetaPropiedad ? 'uploaded' : 'missing'} />
                </div>

                {user?.verificado === 'pendiente' && (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl space-y-3">
                      <p className="text-xs text-orange-800 italic">
                        <strong>Modo Desarrollador:</strong> Puedes aprobar tu propia cuenta para probar el dashboard completo.
                      </p>
                      <Button 
                        onClick={handleAdminApprove} 
                        isLoading={uploading} 
                        size="sm"
                        className="w-full bg-orange-600 hover:bg-orange-700"
                      >
                        Aprobar mi cuenta ahora
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
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
                            accept="image/*,application/pdf"
                          />
                          <label
                            htmlFor={`file-${type}`}
                            className={cn(
                              "flex items-center justify-between p-3 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                              files[type] ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-blue-400 hover:bg-blue-50/50",
                              fileErrors[type] && "border-red-400 bg-red-50"
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
                          {fileErrors[type] && (
                            <p className="text-[10px] text-red-600 font-bold mt-1 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {fileErrors[type]}
                            </p>
                          )}
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
      {/* Alerta de Datos Bancarios Faltantes */}
      {!user.datosBancarios?.numeroCuenta && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-50 border-2 border-orange-200 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-orange-100"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-orange-100 rounded-2xl flex items-center justify-center shrink-0">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-orange-900">Configura tus datos bancarios</h3>
              <p className="text-sm text-orange-800">Es obligatorio para poder recibir tus pagos una vez finalizados los servicios.</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowBankModal(true)}
            className="bg-orange-600 hover:bg-orange-700 whitespace-nowrap"
          >
            Configurar Ahora
          </Button>
        </motion.div>
      )}

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
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Capacidad</span>
                      <span className="text-xs font-bold text-blue-600">{carga.capacidadRequerida}</span>
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

      {/* Modal de Datos Bancarios */}
      <AnimatePresence>
        {showBankModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900">Datos Bancarios</h2>
                <button onClick={() => setShowBankModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Banco</label>
                  <select 
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    value={bankData.banco}
                    onChange={(e) => setBankData({...bankData, banco: e.target.value})}
                  >
                    <option value="">Seleccionar banco...</option>
                    <option value="BCP">BCP</option>
                    <option value="Interbank">Interbank</option>
                    <option value="BBVA">BBVA</option>
                    <option value="Scotiabank">Scotiabank</option>
                    <option value="Banco de la Nación">Banco de la Nación</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Tipo de Cuenta</label>
                  <select 
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    value={bankData.tipoCuenta}
                    onChange={(e) => setBankData({...bankData, tipoCuenta: e.target.value})}
                  >
                    <option value="">Seleccionar tipo...</option>
                    <option value="Ahorros">Ahorros</option>
                    <option value="Corriente">Corriente</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Número de Cuenta</label>
                  <input 
                    type="text"
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: 191-XXXXXXXX-X-XX"
                    value={bankData.numeroCuenta}
                    onChange={(e) => setBankData({...bankData, numeroCuenta: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">CCI (Opcional)</label>
                  <input 
                    type="text"
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: 002-XXXXXXXXXXXXXXXXXXXX"
                    value={bankData.cci}
                    onChange={(e) => setBankData({...bankData, cci: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Titular de la Cuenta</label>
                  <input 
                    type="text"
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre completo del titular"
                    value={bankData.titular}
                    onChange={(e) => setBankData({...bankData, titular: e.target.value})}
                  />
                </div>

                <div className="pt-4">
                  <Button 
                    className="w-full h-12 text-lg shadow-lg shadow-blue-200"
                    onClick={handleSaveBank}
                    disabled={!bankData.banco || !bankData.numeroCuenta || !bankData.titular || savingBank}
                    isLoading={savingBank}
                  >
                    Guardar Datos Bancarios
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StepCard = ({ icon, title, description, status }: { icon: React.ReactNode; title: string; description: string; status: 'completed' | 'in_progress' | 'pending' }) => (
  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start space-x-4">
    <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div className="flex-1">
      <h4 className="text-sm font-bold text-gray-900">{title}</h4>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      <div className="mt-3 flex items-center">
        {status === 'completed' ? (
          <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase">Completado</span>
        ) : status === 'in_progress' ? (
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">En Revisión</span>
        ) : (
          <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full uppercase">Pendiente</span>
        )}
      </div>
    </div>
  </div>
);

const DocStatusItem = ({ label, status }: { label: string; status: 'uploaded' | 'missing' }) => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
    <span className="text-xs font-medium text-gray-700">{label}</span>
    {status === 'uploaded' ? (
      <div className="flex items-center text-green-600 text-[10px] font-bold uppercase">
        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
        Cargado
      </div>
    ) : (
      <div className="flex items-center text-gray-400 text-[10px] font-bold uppercase">
        <Clock className="h-3.5 w-3.5 mr-1" />
        Pendiente
      </div>
    )}
  </div>
);
