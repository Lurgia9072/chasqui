import React, { useState, useEffect, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { Cargo, OperationType, Trip } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Truck, MapPin, Clock, ChevronRight, AlertCircle, RefreshCw, ShieldCheck, Upload, X, CheckCircle2, Navigation, FileText, Landmark, CreditCard, ArrowLeft, Phone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn, compressImage } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ADMIN_EMAILS, TRIP_STATUS_LABELS } from '../../lib/constants';
import { NearbyCargoMap } from '../../components/NearbyCargoMap';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Input } from '../../components/ui/Input';
import { useNotification } from '../../components/ui/NotificationProvider';
import { limit } from 'firebase/firestore';

export const CarrierDashboard = () => {
  const { user } = useAuthStore();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const [cargas, setCargas] = useState<Cargo[]>([]);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [completedTrips, setCompletedTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTrips, setLoadingTrips] = useState(true);

  const [showPaymentPreferenceModal, setShowPaymentPreferenceModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'bank' | 'yape' | 'plin' | null>(null);
  const [paymentData, setPaymentData] = useState({ bank: '', accountNumber: '', cci: '', titular: '', phone: '' });
  const [paymentEvidenceFile, setPaymentEvidenceFile] = useState<File | null>(null);
  const [paymentEvidenceUrl, setPaymentEvidenceUrl] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email.toLowerCase());

  useEffect(() => {
    if (isAdmin) {
      navigate('/admin');
    }
  }, [isAdmin, navigate]);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
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

  const fetchCompletedTrips = () => {
    if (!user || user.verificado !== 'verificado') return;

    const q = query(
      collection(db, 'trips'),
      where('transportistaId', '==', user.uid),
      where('estado', '==', 'completado'),
      orderBy('entregaRealAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
      setCompletedTrips(docs);
      
      // Check if we should show payment modal
      const hasPaymentInfo = user?.metodoPago && (user?.datosPago?.numeroCuenta || user?.datosPago?.celular);
      const hasUnpaidCompletedTrips = docs.some(trip => {
        const isCompletado = trip.estado === 'completado';
        const isNotPaid = trip.payoutInfo?.estado !== 'pagado';
        return isCompletado && isNotPaid;
      });
      
      if (hasUnpaidCompletedTrips && !hasPaymentInfo) {
        setShowPaymentPreferenceModal(true);
      } else {
        setShowPaymentPreferenceModal(false);
      }
    });

    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribeCargas = fetchCargas();
    const unsubscribeTrips = fetchActiveTrips();
    const unsubscribeCompleted = fetchCompletedTrips();
    return () => {
      unsubscribeCargas?.();
      unsubscribeTrips?.();
      unsubscribeCompleted?.();
    };
  }, [user?.uid, user?.verificado, user?.metodoPago]);

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
    
    const hasDni = files.dni || user.documentosUrls?.dni;
    const hasLicencia = files.licencia || user.documentosUrls?.licencia;
    const hasTarjeta = files.tarjetaPropiedad || user.documentosUrls?.tarjetaPropiedad;
    
    if (!hasDni || !hasLicencia || !hasTarjeta) {
      alert("Por favor, sube todos los documentos obligatorios (DNI, Licencia y Tarjeta de Propiedad).");
      return;
    }

    setUploading(true);
    try {
      const dniUrl = files.dni ? await compressImage(files.dni) : user.documentosUrls?.dni;
      const licenciaUrl = files.licencia ? await compressImage(files.licencia) : user.documentosUrls?.licencia;
      const tarjetaUrl = files.tarjetaPropiedad ? await compressImage(files.tarjetaPropiedad) : user.documentosUrls?.tarjetaPropiedad;
      
      const userRef = doc(db, 'users', user.uid);
      const updatedData = {
        verificado: 'pendiente' as const,
        documentosUrls: {
          ...user.documentosUrls,
          dni: dniUrl,
          licencia: licenciaUrl,
          tarjetaPropiedad: tarjetaUrl
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

  const handleSavePaymentPreference = async () => {
    if (!user || !selectedPaymentMethod) return;
    setIsUpdating(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const datosPago: any = {};
      
      let fotoUrl = '';
      if (paymentEvidenceFile) {
        fotoUrl = await compressImage(paymentEvidenceFile);
      }
      
      if (selectedPaymentMethod === 'bank') {
        datosPago.banco = paymentData.bank;
        datosPago.numeroCuenta = paymentData.accountNumber;
        datosPago.cci = paymentData.cci;
        datosPago.titular = paymentData.titular;
      } else {
        datosPago.celular = paymentData.phone;
        datosPago.titular = paymentData.titular;
      }

      if (fotoUrl) {
        datosPago.fotoUrl = fotoUrl;
      }

      await updateDoc(userRef, {
        metodoPago: selectedPaymentMethod,
        datosPago: datosPago,
        updatedAt: Date.now()
      });

      addNotification({
        title: 'Método de pago guardado',
        message: 'Tus datos han sido guardados para futuros cobros.',
        type: 'success'
      });

      setShowPaymentPreferenceModal(false);
    } catch (err) {
      console.error('Error saving payment preference:', err);
      addNotification({
        title: 'Error',
        message: 'No se pudieron guardar tus datos de pago.',
        type: 'error'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (user?.verificado !== 'verificado') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
                  : "Para empezar de ganar dinero, necesitamos verificar tu identidad y documentos del vehículo."}
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
              <Card className="bg-gray-50/50 border-dashed">
                <CardContent className="p-5 flex items-start space-x-4">
                  <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <Landmark className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-900">Método de Cobro</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {user?.metodoPago ? `Configurado (${user.metodoPago.toUpperCase()})` : "Se configurará automáticamente al completar tu primer viaje."}
                    </p>
                    <div className="mt-3">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                        user?.metodoPago ? "text-green-600 bg-green-50" : "text-gray-400 bg-gray-50"
                      )}>
                        {user?.metodoPago ? "Configurado" : "Pendiente"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
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

                {user?.verificado === 'pendiente' && isAdmin && (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl space-y-3">
                      <p className="text-xs text-orange-800 italic">
                        <strong>Modo Administrador:</strong> Puedes aprobar esta cuenta para pruebas.
                      </p>
                      <Button 
                        onClick={handleAdminApprove} 
                        isLoading={uploading} 
                        size="sm"
                        className="w-full bg-orange-600 hover:bg-orange-700"
                      >
                        Aprobar cuenta ahora
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
                      disabled={uploading || 
                        !(files.dni || user?.documentosUrls?.dni) || 
                        !(files.licencia || user?.documentosUrls?.licencia) || 
                        !(files.tarjetaPropiedad || user?.documentosUrls?.tarjetaPropiedad)
                      }
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

        <AnimatePresence>
          {showPaymentPreferenceModal && completedTrips.length > 0 && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
              >
                <div className="p-8 text-center space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-gray-900">¡Entrega confirmada! 🎉</h3>
                    <p className="text-gray-600">
                      Tu pago de <span className="font-bold text-blue-600 text-lg">S/. {(completedTrips[0].precioFinal - completedTrips[0].comision).toFixed(2)}</span> está listo para transferirse.
                    </p>
                  </div>

                  {!selectedPaymentMethod ? (
                    <div className="space-y-4">
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">¿Cómo prefieres cobrar?</p>
                      <div className="grid grid-cols-1 gap-3">
                        <button 
                          onClick={() => setSelectedPaymentMethod('bank')}
                          className="flex items-center justify-between p-4 rounded-2xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                              <CreditCard className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">Cuenta bancaria</p>
                              <p className="text-xs text-gray-500">BCP, Interbank, etc.</p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-300" />
                        </button>

                        <button 
                          onClick={() => setSelectedPaymentMethod('yape')}
                          className="flex items-center justify-between p-4 rounded-2xl border-2 border-gray-100 hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                              <span className="text-sm font-black text-purple-600">YAPE</span>
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">Yape</p>
                              <p className="text-xs text-gray-500">Solo número de celular</p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-300" />
                        </button>

                        <button 
                          onClick={() => setSelectedPaymentMethod('plin')}
                          className="flex items-center justify-between p-4 rounded-2xl border-2 border-gray-100 hover:border-cyan-500 hover:bg-cyan-50 transition-all text-left group"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 bg-cyan-100 rounded-xl flex items-center justify-center group-hover:bg-cyan-200 transition-colors">
                              <span className="text-sm font-black text-cyan-600">PLIN</span>
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">Plin</p>
                              <p className="text-xs text-gray-500">Solo número de celular</p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-300" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 text-left animate-in fade-in slide-in-from-right duration-300">
                      <button 
                        onClick={() => setSelectedPaymentMethod(null)}
                        className="text-xs font-bold text-blue-600 hover:underline flex items-center"
                      >
                        <ArrowLeft className="h-3 w-3 mr-1" />
                        Cambiar método
                      </button>

                      <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-sm font-bold text-gray-700">Titular de la cuenta:</label>
                           <Input 
                             placeholder="Nombre completo del titular"
                             value={paymentData.titular}
                             onChange={(e) => setPaymentData({...paymentData, titular: e.target.value})}
                           />
                           <p className="text-[10px] text-amber-600 font-bold">⚠️ Debe coincidir con tu nombre legal para evitar rechazos en el pago.</p>
                        </div>

                        {selectedPaymentMethod === 'bank' ? (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Banco:</label>
                                <Input 
                                  placeholder="Ej: BCP, Interbank..."
                                  value={paymentData.bank}
                                  onChange={(e) => setPaymentData({...paymentData, bank: e.target.value})}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">N° Cuenta:</label>
                                <Input 
                                  placeholder="Cuenta corriente/ahorros"
                                  value={paymentData.accountNumber}
                                  onChange={(e) => setPaymentData({...paymentData, accountNumber: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-gray-700">CCI (Interbancaria):</label>
                              <Input 
                                placeholder="Introduce tu CCI de 20 dígitos"
                                value={paymentData.cci}
                                onChange={(e) => setPaymentData({...paymentData, cci: e.target.value})}
                              />
                            </div>
                          </>
                        ) : (
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Número de Celular ({selectedPaymentMethod === 'yape' ? 'Yape' : 'Plin'}):</label>
                            <Input 
                              type="tel"
                              placeholder="999 999 999"
                              value={paymentData.phone}
                              onChange={(e) => setPaymentData({...paymentData, phone: e.target.value})}
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Foto de cuenta/tarjeta (Opcional):</label>
                          <div 
                            className={cn(
                              "border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all",
                              paymentEvidenceFile ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                            )}
                            onClick={() => document.getElementById('payment-evidence-upload-dash')?.click()}
                          >
                            <input 
                              id="payment-evidence-upload-dash"
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setPaymentEvidenceFile(file);
                                  const reader = new FileReader();
                                  reader.onload = (ev) => setPaymentEvidenceUrl(ev.target?.result as string);
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            {paymentEvidenceUrl ? (
                              <div className="flex items-center justify-center space-x-2">
                                <img src={paymentEvidenceUrl} alt="Preview" className="h-10 w-10 object-cover rounded border" referrerPolicy="no-referrer" />
                                <span className="text-xs text-green-700 font-bold truncate max-w-[200px]">{paymentEvidenceFile?.name}</span>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPaymentEvidenceFile(null);
                                    setPaymentEvidenceUrl('');
                                  }}
                                  className="text-red-500 p-1 hover:bg-red-100 rounded"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                <Upload className="h-5 w-5 text-gray-400 mb-1" />
                                <span className="text-xs text-gray-500">Subir foto para mayor seguridad</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button 
                        className={cn(
                          "w-full h-12 text-lg shadow-xl",
                          selectedPaymentMethod === 'bank' 
                            ? (paymentData.bank && paymentData.accountNumber && paymentData.cci && paymentData.titular ? "bg-blue-600" : "bg-gray-300 cursor-not-allowed")
                            : (paymentData.phone && paymentData.titular ? (selectedPaymentMethod === 'yape' ? "bg-purple-600" : "bg-cyan-600") : "bg-gray-300 cursor-not-allowed")
                        )}
                        disabled={
                          isUpdating || 
                          (selectedPaymentMethod === 'bank' ? !(paymentData.bank && paymentData.accountNumber && paymentData.cci && paymentData.titular) : !(paymentData.phone && paymentData.titular))
                        }
                        onClick={handleSavePaymentPreference}
                      >
                        {isUpdating ? 'Guardando...' : 'Guardar y Continuar'}
                      </Button>
                    </div>
                  )}
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
                        <div className="flex items-center space-x-2">
                           <p className="text-[10px] uppercase font-bold text-green-600 tracking-widest">Servicio Activo</p>
                           <StatusBadge status={trip.estado} />
                        </div>
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
      ) : viewMode === 'map' ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full"
        >
          <NearbyCargoMap cargas={cargas} />
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cargas.map((carga) => (
            <Link key={carga.id} to={`/carrier/cargo/${carga.id}`}>
              <Card className="hover:border-blue-300 transition-all group overflow-hidden border-2 border-transparent hover:border-blue-500">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-bold group-hover:text-blue-600 transition-colors">
                      {carga.nombreProducto || carga.tipoDeCarga || carga.tipoCarga}
                    </CardTitle>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Peso / Unid</span>
                      <span className="text-xs font-bold text-blue-600 truncate max-w-[80px]">{carga.vehiculo?.capacidad?.peso || carga.capacidadRequerida}</span>
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
