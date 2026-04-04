import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError } from '../firebase';
import { useAuthStore } from '../store/useAuthStore';
import { Trip, Cargo, OperationType } from '../types';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Truck, MapPin, DollarSign, ArrowLeft, Clock, User, ShieldCheck, CheckCircle, Navigation, Phone, MessageSquare, Package, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';

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
  const [loading, setLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '', // El usuario deberá configurar esto
  });

  useEffect(() => {
    if (!id || !user) return;

    const unsubscribe = onSnapshot(doc(db, 'trips', id), async (snapshot) => {
      if (snapshot.exists()) {
        const tripData = { id: snapshot.id, ...snapshot.data() } as Trip;
        setTrip(tripData);
        
        if (!carga) {
          const cargaDoc = await getDoc(doc(db, 'cargas', tripData.cargoId));
          if (cargaDoc.exists()) {
            setCarga({ id: cargaDoc.id, ...cargaDoc.data() } as Cargo);
          }
        }
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `trips/${id}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, user, carga]);

  // Simulación de movimiento del transportista
  useEffect(() => {
    if (trip?.estado === 'en_progreso' && user?.tipoUsuario === 'transportista') {
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

  const handleCompleteTrip = async () => {
    if (!trip) return;
    setIsCompleting(true);
    try {
      await updateDoc(doc(db, 'trips', trip.id), {
        estado: 'completado',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `trips/${trip.id}`);
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  if (!trip || !carga) return <div className="text-center py-20">Viaje no encontrado</div>;

  const isCarrier = user?.tipoUsuario === 'transportista';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold text-gray-900">Viaje en Curso</h1>
            <span className={cn(
              "text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider",
              trip.estado === 'en_progreso' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
            )}>
              {trip.estado}
            </span>
          </div>
          <p className="text-gray-600">ID de Viaje: {trip.id}</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Phone className="h-4 w-4 mr-2" />
            Llamar
          </Button>
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mapa y Seguimiento */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-2 border-blue-100">
            <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Navigation className="h-5 w-5 animate-pulse" />
                <span className="font-bold">Ubicación en Tiempo Real</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-medium opacity-80">Actualizado hace unos segundos</span>
                {trip.tiempoEstimado && (
                  <span className="text-[10px] font-bold uppercase tracking-wider">Llega en: {trip.tiempoEstimado}</span>
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
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Origen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-gray-900 font-medium">{carga.origen}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Destino</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-gray-900 font-medium">{carga.destino}</p>
                </div>
              </CardContent>
            </Card>
          </div>
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

              {trip.estado === 'en_progreso' && isCarrier && (
                <Button 
                  className="w-full h-14 bg-green-600 hover:bg-green-700 text-lg shadow-lg shadow-green-100"
                  onClick={handleCompleteTrip}
                  isLoading={isCompleting}
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Finalizar Viaje
                </Button>
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
                <div>
                  <p className="font-bold text-gray-900">
                    {isCarrier ? carga.comercianteNombre : 'Transportista Asignado'}
                  </p>
                  <div className="flex items-center text-yellow-500">
                    <Star className="h-3 w-3 fill-current" />
                    <span className="ml-1 text-xs font-bold">5.0</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
