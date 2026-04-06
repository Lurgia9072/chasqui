import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, onSnapshot, updateDoc, addDoc, collection, query, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError } from '../firebase';
import { useAuthStore } from '../store/useAuthStore';
import { Trip, Cargo, OperationType, TripStatus } from '../types';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Truck, MapPin, DollarSign, ArrowLeft, Clock, User, ShieldCheck, CheckCircle, Navigation, Phone, MessageSquare, Package, Star, Calendar, Info, AlertCircle, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { Chat } from '../components/ui/Chat';



const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '1rem',
};

const center = {
  lat: -12.046374,
  lng: -77.042793,
};

export const TripDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [carga, setCarga] = useState<Cargo | null>(null);
  const [merchantPhone, setMerchantPhone] = useState<string | null>(null);
  const [carrierPhone, setCarrierPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState<number | null>(null);
  const [hasUnread, setHasUnread] = useState(false);

  const isCarrier = user?.tipoUsuario === 'transportista';

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '', // El usuario deberá configurar esto
  });

  useEffect(() => {
    if (!id || !user) return;

    const unsubscribe = onSnapshot(doc(db, 'trips', id), async (snapshot) => {
      try {
        if (snapshot.exists()) {
          const tripData = { id: snapshot.id, ...snapshot.data() } as Trip;
          setTrip(tripData);
          
          // Fetch merchant phone if not already fetched
          if (!merchantPhone) {
            try {
              const merchantDoc = await getDoc(doc(db, 'users', tripData.comercianteId));
              if (merchantDoc.exists()) {
                setMerchantPhone(merchantDoc.data().telefono || null);
              }
            } catch (err) {
              console.warn('No se pudo obtener el teléfono del comerciante:', err);
            }
          }

          // Fetch carrier phone if not already fetched
          if (!carrierPhone) {
            try {
              const carrierDoc = await getDoc(doc(db, 'users', tripData.transportistaId));
              if (carrierDoc.exists()) {
                setCarrierPhone(carrierDoc.data().telefono || null);
              }
            } catch (err) {
              console.warn('No se pudo obtener el teléfono del transportista:', err);
            }
          }
          
          if (!carga) {
            try {
              const cargaDoc = await getDoc(doc(db, 'cargas', tripData.cargoId));
              if (cargaDoc.exists()) {
                setCarga({ id: cargaDoc.id, ...cargaDoc.data() } as Cargo);
              }
            } catch (err) {
              console.warn('No se pudo obtener la información de la carga:', err);
            }
          }
        }
      } catch (err) {
        console.error('Error en el listener de viaje:', err);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `trips/${id}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, user, carga]);

  // Listener para nuevos mensajes (Auto-abrir chat)
  useEffect(() => {
    if (!id || !user) return;

    const q = query(
      collection(db, 'trips', id, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) return;
      
      const lastMsg = snapshot.docs[0].data();
      
      // Si el mensaje es del otro usuario y no es el primero que vemos en esta sesión
      if (lastMsg.senderId !== user.uid) {
        if (lastMessageCount !== null) {
          // Si el chat está cerrado o minimizado, marcar como no leído
          if (!showChat || isChatMinimized) {
            setHasUnread(true);
          }
          
          // Opcional: Auto-abrir si el usuario lo prefiere (ya estaba implementado)
          // setShowChat(true);
          // setIsChatMinimized(false);
        }
      }
      setLastMessageCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [id, user, lastMessageCount, showChat, isChatMinimized]);

  // Resetear notificaciones cuando el chat se abre y expande
  useEffect(() => {
    if (showChat && !isChatMinimized) {
      setHasUnread(false);
    }
  }, [showChat, isChatMinimized]);

  // Simulación de movimiento del transportista
  useEffect(() => {
    const activeStatuses: TripStatus[] = ['en_camino_a_recojo', 'recojo_completado', 'en_camino_a_destino'];
    if (trip && activeStatuses.includes(trip.estado) && user?.tipoUsuario === 'transportista') {
      const interval = setInterval(async () => {
        const newLat = (trip.seguimiento?.lat || center.lat) + (Math.random() - 0.5) * 0.001;
        const newLng = (trip.seguimiento?.lng || center.lng) + (Math.random() - 0.5) * 0.001;
        
        await updateDoc(doc(db, 'trips', trip.id), {
          seguimiento: { lat: newLat, lng: newLng, updatedAt: Date.now() }
        });
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [trip?.estado, trip?.id, trip?.seguimiento, user?.tipoUsuario]);

  const updateTripStatus = async (newStatus: TripStatus) => {
    if (!trip || !carga) return;
    setIsUpdating(true);
    try {
      const updates: any = { estado: newStatus };
      let notificationTitle = '';
      let notificationMessage = '';
      
      // Actualizar tiempo estimado según el estado
      if (newStatus === 'recojo_completado') {
        updates.tiempoEstimado = 'En camino al destino';
        notificationTitle = 'Carga Recogida';
        notificationMessage = `El transportista ha recogido tu carga de ${carga.tipoCarga} y está en camino al destino.`;
      } else if (newStatus === 'en_camino_a_destino') {
        updates.tiempoEstimado = '1h 30min para la entrega';
        notificationTitle = 'En Tránsito';
        notificationMessage = `Tu carga de ${carga.tipoCarga} está en camino al destino final.`;
      } else if (newStatus === 'entregado_pendiente_confirmacion') {
        updates.tiempoEstimado = 'Esperando confirmación';
        notificationTitle = 'Carga Entregada';
        notificationMessage = `El transportista indica que ha entregado tu carga de ${carga.tipoCarga}. Por favor, confirma la recepción.`;
      } else if (newStatus === 'completado') {
        updates.tiempoEstimado = 'Viaje Finalizado';
        notificationTitle = 'Viaje Completado';
        notificationMessage = `El comerciante ha confirmado la recepción de la carga. ¡Buen trabajo!`;
        
        // También actualizar el estado de la carga original
        await updateDoc(doc(db, 'cargas', trip.cargoId), { estado: 'completado' });
      }

      await updateDoc(doc(db, 'trips', trip.id), updates);

      // Enviar notificación al otro usuario
      const recipientId = isCarrier ? trip.comercianteId : trip.transportistaId;
      if (notificationTitle) {
        await addDoc(collection(db, 'notifications'), {
          userId: recipientId,
          titulo: notificationTitle,
          mensaje: notificationMessage,
          tipo: 'viaje_actualizado',
          leido: false,
          link: `/trip/${trip.id}`,
          createdAt: Date.now(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `trips/${trip.id}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCall = () => {
    if (!trip) return;
    const phoneToCall = isCarrier ? merchantPhone : carrierPhone;
    if (phoneToCall) {
      window.location.href = `tel:${phoneToCall}`;
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  if (!trip || !carga) return <div className="text-center py-20">Viaje no encontrado</div>;

  const getStatusLabel = (status: TripStatus) => {
    switch (status) {
      case 'en_camino_a_recojo': return 'En camino al recojo';
      case 'recojo_completado': return 'Carga Recogida';
      case 'en_camino_a_destino': return 'En camino al destino';
      case 'entregado_pendiente_confirmacion': return 'Entregado (Pendiente Confirmación)';
      case 'completado': return 'Completado';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold text-gray-900">Seguimiento de Viaje</h1>
            <span className={cn(
              "text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider",
              trip.estado === 'completado' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
            )}>
              {getStatusLabel(trip.estado)}
            </span>
          </div>
          <p className="text-gray-600">ID de Viaje: {trip.id}</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={handleCall}>
            <Phone className="h-4 w-4 mr-2" />
            Llamar
          </Button>
          <Button 
            variant={showChat ? "default" : "outline"} 
            size="sm"
            onClick={() => {
              setShowChat(!showChat);
              setIsChatMinimized(false);
            }}
            className="relative"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
            {hasUnread && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
        {/* Mapa y Seguimiento */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-2 border-blue-100">
            <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Navigation className="h-5 w-5 animate-pulse" />
                <span className="font-bold">
                  {trip.estado === 'en_camino_a_recojo' ? 'Camino al punto de recojo' : 'Camino al punto de entrega'}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-medium opacity-80">Actualizado hace unos segundos</span>
                {trip.tiempoEstimado && (
                  <span className="text-[10px] font-bold uppercase tracking-wider">{trip.tiempoEstimado}</span>
                )}
              </div>
            </div>
            <div className="p-0">
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={trip.seguimiento || center}
                  zoom={15}
                >
                  <Marker position={trip.seguimiento || center} icon={{
                    url: 'https://cdn-icons-png.flaticon.com/512/744/744465.png',
                    scaledSize: new window.google.maps.Size(40, 40)
                  }} />
                </GoogleMap>
              ) : (
                <div className="h-[400px] bg-gray-100 flex items-center justify-center">
                  <p className="text-gray-500 italic">Cargando mapa...</p>
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className={cn(trip.estado === 'en_camino_a_recojo' && "ring-2 ring-blue-500")}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Punto de Recojo</CardTitle>
                {trip.estado === 'en_camino_a_recojo' && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">ACTUAL</span>}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-gray-900 font-medium">{carga.origen}</p>
                </div>
                <div className="flex items-center space-x-4 pt-2 border-t border-gray-50">
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                    {trip.fechaRecojo || 'Hoy'}
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                    {trip.horaRecojo || '14:30'}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Punto de Entrega</CardTitle>
                {trip.estado === 'en_camino_a_destino' && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">ACTUAL</span>}
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-gray-900 font-medium">{carga.destino}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Instrucciones de Carga/Descarga */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="bg-gray-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">Instrucciones de Recojo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 italic">
                  "Presentarse en la puerta 4 con el documento de identidad. Preguntar por el encargado de almacén."
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">Instrucciones de Entrega</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 italic">
                  "Entregar guía de remisión firmada. El horario de descarga es hasta las 6:00 PM."
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Línea de tiempo del viaje */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Línea de Tiempo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-gray-200 before:to-gray-200">
                {[
                  { id: 'en_camino_a_recojo', label: 'Camino al Recojo', desc: 'El transportista se dirige al origen.' },
                  { id: 'recojo_completado', label: 'Carga Recogida', desc: 'La mercadería ha sido cargada en el vehículo.' },
                  { id: 'en_camino_a_destino', label: 'En Tránsito', desc: 'La carga está en camino al destino final.' },
                  { id: 'entregado_pendiente_confirmacion', label: 'Entregado', desc: 'El transportista ha llegado al destino.' },
                  { id: 'completado', label: 'Finalizado', desc: 'El comerciante confirmó la recepción.' }
                ].map((step, idx) => {
                  const stepsOrder = ['en_camino_a_recojo', 'recojo_completado', 'en_camino_a_destino', 'entregado_pendiente_confirmacion', 'completado'];
                  const isPast = stepsOrder.indexOf(trip.estado) > idx;
                  const isCurrent = step.id === trip.estado;
                  
                  return (
                    <div key={step.id} className="relative flex items-center justify-between md:justify-start md:space-x-10">
                      <div className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow-sm z-10",
                        isPast ? "bg-green-500" : isCurrent ? "bg-blue-600 animate-pulse" : "bg-gray-200"
                      )}>
                        {isPast ? <CheckCircle className="h-5 w-5 text-white" /> : <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                      <div className="flex-1 ml-4">
                        <h4 className={cn("text-sm font-bold", isCurrent ? "text-blue-600" : "text-gray-900")}>{step.label}</h4>
                        <p className="text-xs text-gray-500">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detalles del Servicio y Pago */}
        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Detalles del Servicio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Package className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Carga</p>
                    <p className="font-bold text-gray-900">{carga.tipoCarga}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase font-bold">Peso</p>
                  <p className="font-bold text-gray-900">{carga.peso}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Precio Acordado</span>
                  <span className="font-bold text-gray-900">S/ {trip.precioFinal}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Comisión (10%)</span>
                  <span className="font-bold text-red-500">- S/ {trip.comision.toFixed(2)}</span>
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total a {isCarrier ? 'Recibir' : 'Pagar'}</span>
                  <span className="text-2xl font-extrabold text-blue-600">S/ {(trip.precioFinal - (isCarrier ? trip.comision : 0)).toFixed(2)}</span>
                </div>
              </div>

              {isCarrier && trip.estado !== 'completado' && (
                <div className="space-y-3">
                  {trip.estado === 'en_camino_a_recojo' && (
                    <Button 
                      className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-lg shadow-lg shadow-blue-100"
                      onClick={() => updateTripStatus('recojo_completado')}
                      isLoading={isUpdating}
                    >
                      <Package className="h-5 w-5 mr-2" />
                      Confirmar Recojo
                    </Button>
                  )}
                  
                  {trip.estado === 'recojo_completado' && (
                    <Button 
                      className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-lg shadow-lg shadow-blue-100"
                      onClick={() => updateTripStatus('en_camino_a_destino')}
                      isLoading={isUpdating}
                    >
                      <Navigation className="h-5 w-5 mr-2" />
                      Iniciar Ruta a Destino
                    </Button>
                  )}

                  {trip.estado === 'en_camino_a_destino' && (
                    <Button 
                      className="w-full h-14 bg-green-600 hover:bg-green-700 text-lg shadow-lg shadow-green-100"
                      onClick={() => updateTripStatus('entregado_pendiente_confirmacion')}
                      isLoading={isUpdating}
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Confirmar Entrega
                    </Button>
                  )}

                  {trip.estado === 'entregado_pendiente_confirmacion' && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start space-x-3">
                      <Clock className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                      <p className="text-sm text-blue-800">
                        Has marcado la carga como entregada. Esperando que el comerciante confirme la recepción para finalizar el servicio.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!isCarrier && trip.estado === 'entregado_pendiente_confirmacion' && (
                <div className="space-y-4">
                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-yellow-800 font-medium">
                      El transportista ha marcado la carga como entregada. Por favor, verifica que todo esté correcto y confirma la recepción.
                    </p>
                  </div>
                  <Button 
                    className="w-full h-14 bg-green-600 hover:bg-green-700 text-lg shadow-lg shadow-green-100"
                    onClick={() => updateTripStatus('completado')}
                    isLoading={isUpdating}
                  >
                    <ShieldCheck className="h-5 w-5 mr-2" />
                    Confirmar Recepción de Carga
                  </Button>
                </div>
              )}

              {trip.estado === 'completado' && (
                <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center space-y-2">
                  <CheckCircle className="h-10 w-10 text-green-600 mx-auto" />
                  <h3 className="text-lg font-bold text-green-900">Viaje Completado</h3>
                  <p className="text-sm text-green-700">El servicio ha sido finalizado con éxito.</p>
                  <Button variant="outline" className="mt-4 w-full" onClick={() => navigate('/')}>
                    Volver al Inicio
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">
                {isCarrier ? 'Comerciante' : 'Transportista'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">
                    {isCarrier ? carga.comercianteNombre : (trip.transportistaNombre || 'Transportista Asignado')}
                  </p>
                  <div className="flex items-center text-yellow-500">
                    <Star className="h-3 w-3 fill-current" />
                    <span className="ml-1 text-xs font-bold">5.0</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    {isCarrier ? merchantPhone : carrierPhone}
                  </p>
                </div>
              </div>
              
              {!isCarrier && trip.vehiculo && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Vehículo Asignado</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Truck className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">{trip.vehiculo.tipo}</span>
                    </div>
                    <span className="text-sm font-bold bg-gray-100 px-2 py-0.5 rounded uppercase">{trip.vehiculo.placa}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating Chat Window (Facebook Style) */}
      <div className="fixed bottom-0 right-0 z-50 p-4 pointer-events-none w-full max-w-md">
        <div className="flex flex-col items-end space-y-2 pointer-events-auto">
          {showChat && (
            <div className={cn(
              "w-full bg-white rounded-t-2xl shadow-2xl border border-gray-200 transition-all duration-300 overflow-hidden flex flex-col",
              isChatMinimized ? "h-14" : "h-[550px]"
            )}>
              {/* Chat Header / Bar */}
              <div 
                className="bg-blue-600 p-4 text-white flex items-center justify-between cursor-pointer shrink-0 relative"
                onClick={() => setIsChatMinimized(!isChatMinimized)}
              >
                {isChatMinimized && hasUnread && (
                  <span className="absolute top-0 left-0 w-full h-full bg-red-500/10 animate-pulse pointer-events-none" />
                )}
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-1.5 rounded-full relative">
                    {isCarrier ? <Truck className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    {isChatMinimized && hasUnread && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Chat del Viaje</h3>
                    {!isChatMinimized && <p className="text-[10px] text-blue-100">En línea</p>}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsChatMinimized(!isChatMinimized);
                    }}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    {isChatMinimized ? <Navigation className="h-4 w-4 rotate-180" /> : <div className="w-4 h-0.5 bg-white rounded-full" />}
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowChat(false);
                    }}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Chat Content */}
              {!isChatMinimized && (
                <div className="flex-1 overflow-hidden">
                  <Chat 
                    tripId={trip.id} 
                    isCarrier={isCarrier} 
                    onClose={() => setShowChat(false)} 
                  />
                </div>
              )}
            </div>
          )}

          {!showChat && (
            <Button 
              onClick={() => {
                setShowChat(true);
                setIsChatMinimized(false);
              }}
              className="rounded-full h-14 w-14 shadow-xl bg-blue-600 hover:bg-blue-700 flex items-center justify-center p-0 relative"
            >
              <MessageSquare className="h-6 w-6" />
              {hasUnread && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 border-2 border-white"></span>
                </span>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};