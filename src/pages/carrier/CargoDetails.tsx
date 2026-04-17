import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { Cargo, Offer, OperationType } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Package, MapPin, DollarSign, ArrowLeft, Clock, User, ShieldCheck, AlertCircle, Phone, Star, Navigation, Map as MapIcon, Thermometer } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const carrierIcon = L.divIcon({
  html: `<div class="w-8 h-8 bg-slate-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          <div class="w-2 h-2 bg-white rounded-full"></div>
        </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const originIcon = L.divIcon({
  html: `<div class="w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          <div class="w-2 h-2 bg-white rounded-full"></div>
        </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const destinationIcon = L.divIcon({
  html: `<div class="w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          <div class="w-2 h-2 bg-white rounded-full"></div>
        </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const MapController = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

export const CarrierCargoDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [carga, setCarga] = useState<Cargo | null>(null);
  const [merchantData, setMerchantData] = useState<any>(null);
  const [myOffer, setMyOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [offerPrice, setOfferPrice] = useState<number>(0);
  const [pickupTime, setPickupTime] = useState<string>('30 min');
  const [isLoading, setIsLoading] = useState(false);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [pickupCoords, setPickupCoords] = useState<[number, number][]>([]);
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [pickupInfo, setPickupInfo] = useState<{ distance: string; duration: string } | null>(null);

  useEffect(() => {
    if (!id || !user) return;

    const fetchCarga = async () => {
      try {
        const docRef = doc(db, 'cargas', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Cargo;
          setCarga(data);
          setOfferPrice(data.precioPropuesto);

          // Fetch merchant data
          try {
            const merchantDoc = await getDoc(doc(db, 'users', data.comercianteId));
            if (merchantDoc.exists()) {
              setMerchantData(merchantDoc.data());
            }
          } catch (err) {
            console.warn('No se pudo obtener datos del comerciante:', err);
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `cargas/${id}`);
      }
      setLoading(false);
    };

    fetchCarga();

    const q = query(
      collection(db, 'cargas', id, 'offers'),
      where('transportistaId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setMyOffer({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Offer);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `cargas/${id}/offers`);
    });

    return () => unsubscribe();
  }, [id, user]);

  const handleGoToTrip = async () => {
    if (!id || !user) return;
    try {
      const q = query(
        collection(db, 'trips'),
        where('cargoId', '==', id),
        where('transportistaId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        navigate(`/trip/${snapshot.docs[0].id}`);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'trips');
    }
  };

  const handleMakeOffer = async () => {
    if (!carga || !user || !id) return;
    setIsLoading(true);
    try {
      await addDoc(collection(db, 'cargas', id, 'offers'), {
        cargoId: id,
        transportistaId: user.uid,
        transportistaNombre: user.nombre,
        transportistaRating: user.rating,
        precioOfertado: offerPrice,
        tiempoRecojoEstimado: pickupTime,
        distanciaEstimada: routeInfo?.distance,
        duracionEstimada: routeInfo?.duration,
        estado: 'pendiente',
        createdAt: Date.now(),
      });
      
      // Notificar al comerciante
      await addDoc(collection(db, 'notifications'), {
        userId: carga.comercianteId,
        titulo: 'Nueva Oferta Recibida',
        mensaje: `${user.nombre} ha enviado una oferta de S/ ${offerPrice} (Recojo en ${pickupTime}) para tu carga de ${carga.tipoCarga}.`,
        tipo: 'oferta_nueva',
        leido: false,
        link: `/merchant/cargo/${id}`,
        createdAt: Date.now(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `cargas/${id}/offers`);
    } finally {
      setIsLoading(false);
    }
  };

  // Estimación de Ruta Completa y Recojo
  useEffect(() => {
    if (carga) {
      // 1. Geocodificar si no hay coordenadas
      const getCoords = async (address: string) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
          const data = await res.json();
          if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        } catch (err) { console.error(err); }
        return null;
      };

      const initCoords = async () => {
        let o = carga.origenCoords;
        let d = carga.destinoCoords;

        if (!o) o = await getCoords(carga.origen);
        if (!d) d = await getCoords(carga.destino);

        if (o) setOriginCoords(o);
        if (d) setDestinationCoords(d);
      };

      initCoords();
    }
  }, [carga]);

  useEffect(() => {
    if (originCoords && destinationCoords) {
      // Ruta de Carga
      fetch(`https://router.project-osrm.org/route/v1/driving/${originCoords.lng},${originCoords.lat};${destinationCoords.lng},${destinationCoords.lat}?overview=full&geometries=geojson`)
        .then(res => res.json())
        .then(data => {
          if (data.routes?.[0]) {
            const route = data.routes[0];
            setRouteCoords(route.geometry.coordinates.map((c: any) => [c[1], c[0]]));
            setRouteInfo({
              distance: `${(route.distance / 1000).toFixed(1)} km`,
              duration: `${Math.round(route.duration / 60)} min`
            });
          }
        });
    }

    if (user?.currentLocation && originCoords) {
      // Ruta de Recojo
      fetch(`https://router.project-osrm.org/route/v1/driving/${user.currentLocation.lng},${user.currentLocation.lat};${originCoords.lng},${originCoords.lat}?overview=full&geometries=geojson`)
        .then(res => res.json())
        .then(data => {
          if (data.routes?.[0]) {
            const route = data.routes[0];
            setPickupCoords(route.geometry.coordinates.map((c: any) => [c[1], c[0]]));
            const duration = Math.round(route.duration / 60);
            const durationText = `${duration} min`;
            setPickupInfo({
              distance: `${(route.distance / 1000).toFixed(1)} km`,
              duration: durationText
            });
            setPickupTime(durationText);
          }
        });
    }
  }, [originCoords, destinationCoords, user?.currentLocation]);

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  if (!carga) return <div className="text-center py-20">Carga no encontrada</div>;

  const centerDefault: [number, number] = (user?.currentLocation?.lat !== undefined) ? [user.currentLocation.lat, user.currentLocation.lng] : [-12.046374, -77.042793];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver a Cargas Disponibles
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Detalles de la Carga */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold">{carga.tipoCarga}</CardTitle>
                  <CardDescription className="flex items-center text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Publicado {formatDistanceToNow(carga.createdAt, { addSuffix: true, locale: es })}
                  </CardDescription>
                </div>
                <div className="bg-blue-50 px-4 py-2 rounded-xl text-right">
                  <span className="text-[10px] uppercase font-bold text-blue-600 block">Propuesta</span>
                  <span className="text-xl font-extrabold text-blue-700">S/ {carga.precioPropuesto}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Mapa de la Ruta */}
              {carga && (
                <div className="h-[400px] w-full rounded-xl overflow-hidden border border-gray-200 shadow-inner relative">
                  <MapContainer 
                    center={centerDefault} 
                    zoom={12} 
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    
                    <MapController center={centerDefault} />

                    {user?.currentLocation?.lat !== undefined && (
                      <Marker position={[user.currentLocation.lat, user.currentLocation.lng]} icon={carrierIcon}>
                        <Popup>Tu ubicación</Popup>
                      </Marker>
                    )}

                    {originCoords?.lat !== undefined && (
                      <Marker position={[originCoords.lat, originCoords.lng]} icon={originIcon}>
                        <Popup>Origen</Popup>
                      </Marker>
                    )}

                    {destinationCoords?.lat !== undefined && (
                      <Marker position={[destinationCoords.lat, destinationCoords.lng]} icon={destinationIcon}>
                        <Popup>Destino</Popup>
                      </Marker>
                    )}

                    {routeCoords.length > 0 && (
                      <Polyline positions={routeCoords} pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.8 }} />
                    )}

                    {pickupCoords.length > 0 && (
                      <Polyline positions={pickupCoords} pathOptions={{ color: '#94a3b8', weight: 4, dashArray: '10, 5', opacity: 0.6 }} />
                    )}
                  </MapContainer>
                  
                  <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2">
                    {pickupInfo && (
                      <div className="bg-slate-800/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-slate-700 flex justify-around items-center text-white">
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" />
                          <span className="text-[10px] uppercase font-bold text-slate-400">Distancia al Origen</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold">{pickupInfo.distance}</span>
                          <span className="mx-2 text-slate-500">|</span>
                          <span className="text-sm font-bold text-emerald-400">{pickupInfo.duration}</span>
                        </div>
                      </div>
                    )}
                    
                    {routeInfo && (
                      <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-blue-100 flex justify-around items-center">
                        <div className="text-center">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">Distancia de Carga</span>
                          <span className="text-sm font-bold text-blue-600">{routeInfo.distance}</span>
                        </div>
                        <div className="h-8 w-px bg-gray-100" />
                        <div className="text-center">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">Tiempo de Viaje</span>
                          <span className="text-sm font-bold text-blue-600">{routeInfo.duration}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Ruta Visual */}
              <div className="relative space-y-6 pl-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                <div className="relative">
                  <div className="absolute -left-8 top-1 h-2 w-2 rounded-full bg-red-500 ring-4 ring-red-50" />
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Origen</span>
                    <p className="text-gray-900 font-medium">{carga.origen}</p>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -left-8 top-1 h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-50" />
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Destino</span>
                    <p className="text-gray-900 font-medium">{carga.destino}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-50">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Categoría</span>
                  <p className="text-gray-900 font-bold capitalize">{carga.categoria || 'General'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Peso</span>
                  <p className="text-gray-900 font-medium">{carga.peso}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Capacidad</span>
                  <p className="text-gray-900 font-medium text-xs">{carga.capacidadRequerida}</p>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Cuidado</span>
                  <p className="text-gray-900 font-medium text-xs">{carga.cuidadoEspecial || 'Normal'}</p>
                </div>
              </div>

              {carga.temperaturaRequerida && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-blue-700">
                    <Thermometer className="h-5 w-5" />
                    <span className="text-sm font-bold">Cadena de Frío Requerida</span>
                  </div>
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-lg font-black text-sm">{carga.temperaturaRequerida}</span>
                </div>
              )}

              <div className="space-y-2 pt-4 border-t border-gray-50">
                <span className="text-[10px] uppercase font-bold text-gray-400">Descripción</span>
                <p className="text-gray-700 text-sm leading-relaxed">{carga.descripcion}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel de Oferta */}
        <div className="space-y-6">
          {myOffer ? (
            <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Tu Oferta</CardTitle>
                <CardDescription>Ya has enviado una oferta para esta carga.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-blue-100 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Precio Ofertado</span>
                  <p className="text-3xl font-black text-blue-700 leading-none">S/ {myOffer.precioOfertado}</p>
                </div>
                {myOffer.tiempoRecojoEstimado && (
                  <div className="bg-white p-4 rounded-xl border border-blue-100 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tiempo de Recojo</span>
                    <p className="text-xl font-bold text-gray-900 leading-none">{myOffer.tiempoRecojoEstimado}</p>
                  </div>
                )}
                <div className={cn(
                  "flex items-center space-x-2 p-3 rounded-lg text-sm font-bold uppercase tracking-wider justify-center",
                  myOffer.estado === 'pendiente' ? "bg-yellow-100 text-yellow-700" :
                  myOffer.estado === 'aceptada' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {myOffer.estado === 'pendiente' ? <Clock className="h-4 w-4" /> : 
                   myOffer.estado === 'aceptada' ? <ShieldCheck className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <span>{myOffer.estado}</span>
                </div>

                {myOffer.estado === 'aceptada' && (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100"
                    onClick={handleGoToTrip}
                  >
                    Ir al Viaje
                  </Button>
                )}
              </CardContent>
              <CardFooter>
                <p className="text-xs text-center text-gray-500 w-full">
                  Recibirás una notificación si el comerciante acepta tu oferta.
                </p>
              </CardFooter>
            </Card>
          ) : (
            <Card className="border-2 border-blue-600 shadow-xl shadow-blue-100">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Haz tu Oferta</CardTitle>
                <CardDescription>Propón un precio competitivo para ganar este servicio.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Precio Sugerido</span>
                    <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-lg">S/ {carga.precioPropuesto}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">S/</span>
                    <input
                      type="number"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(Number(e.target.value))}
                      className="w-full h-14 pl-10 pr-4 rounded-xl border-2 border-blue-200 bg-white text-2xl font-extrabold text-gray-900 focus:outline-none focus:border-blue-600 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Tiempo Estimado de Recojo</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      placeholder="Ej: 30 min, 1 hora..."
                      className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-blue-200 bg-white text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-600 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Comisión TransportaYa (10%)</span>
                    <span>- S/ {(offerPrice * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-green-600 pt-2 border-t border-gray-100">
                    <span>Recibirás</span>
                    <span>S/ {(offerPrice * 0.9).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full h-12" onClick={handleMakeOffer} isLoading={isLoading}>
                  Enviar Oferta
                </Button>
              </CardFooter>
            </Card>
          )}

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start space-x-3">
            <Info className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
            <p className="text-xs text-gray-500 italic">
              Recuerda que una vez aceptada la oferta, se generará un viaje y deberás cumplir con el servicio en el tiempo acordado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Info = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
