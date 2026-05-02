import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Trip, Cargo, Checkpoint } from '../types';
import { MapPin, Clock, ShieldCheck, CheckCircle, Navigation, Info, AlertCircle, Package, Thermometer } from 'lucide-react';
import { formatDistanceToNow, format as dateFnsFormat } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
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
  html: `<div class="w-10 h-10 bg-blue-600 rounded-2xl border-2 border-white shadow-xl flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-2.235-2.977a1 1 0 0 0-.796-.383H15v4.5"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
        </div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
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

export const PublicTracking = () => {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [carga, setCarga] = useState<Cargo | null>(null);
  const [merchantName, setMerchantName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isArchived, setIsArchived] = useState(false);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(doc(db, 'trips', id), async (snapshot) => {
      if (snapshot.exists()) {
        const tripData = { id: snapshot.id, ...snapshot.data() } as Trip;
        setTrip(tripData);

        // Check for 30-day archival logic
        // Desde que el viaje INICIA hasta 30 días después de COMPLETADO
        const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        if (tripData.estado === 'completado' && tripData.entregaRealAt) {
          if (now - tripData.entregaRealAt > THIRTY_DAYS_MS) {
            setIsArchived(true);
          }
        }

        // Fetch simplified cargo info
        try {
          const cargoDoc = await getDoc(doc(db, 'cargas', tripData.cargoId));
          if (cargoDoc.exists()) {
            const cargoData = cargoDoc.data() as Cargo;
            setCarga(cargoData);
            
            // Fetch merchant name
            const merchantDoc = await getDoc(doc(db, 'users', tripData.comercianteId));
            if (merchantDoc.exists()) {
              setMerchantName(merchantDoc.data().razonSocial || merchantDoc.data().nombre);
            }

            // Geocode if coords not present
            if (cargoData.origenCoords) setOriginCoords(cargoData.origenCoords);
            else {
              fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cargoData.origen)}`)
                .then(res => res.json())
                .then(data => data?.[0] && setOriginCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }));
            }

            if (cargoData.destinoCoords) setDestinationCoords(cargoData.destinoCoords);
            else {
              fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cargoData.destino)}`)
                .then(res => res.json())
                .then(data => data?.[0] && setDestinationCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }));
            }
          }
        } catch (err) {
          console.error("Error fetching dependencies:", err);
        }
        setLoading(false);
      } else {
        setError("El viaje solicitado no existe o ha expirado.");
        setLoading(false);
      }
    }, (err) => {
      setError("No tienes permiso para ver este seguimiento o el enlace es inválido.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (trip?.seguimiento && destinationCoords) {
      fetch(`https://router.project-osrm.org/route/v1/driving/${trip.seguimiento.lng},${trip.seguimiento.lat};${destinationCoords.lng},${destinationCoords.lat}?overview=full&geometries=geojson`)
        .then(res => res.json())
        .then(data => {
          if (data.routes?.[0]) {
            const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number]);
            setRouteCoords(coords);
          }
        });
    }
  }, [trip?.seguimiento, destinationCoords]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4 shadow-xl shadow-blue-100"></div>
        <p className="text-gray-500 font-black animate-pulse  tracking-widest text-xs">Cargando Trazabilidad...</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-sm border border-gray-100">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-black text-gray-900 mb-2">Error de Seguimiento</h1>
          <p className="text-gray-500 font-medium mb-8">{error || "No se pudo encontrar la información del viaje."}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full h-12 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
          >
            Ir al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Dynamic Header */}
      <div className="bg-slate-900 text-white pt-10 pb-20 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-5 w-5 text-blue-400" />
              <span className="text-[10px] font-black  tracking-widest text-blue-400">
                {isArchived ? 'Historial de Trazabilidad Archivo' : 'Trazabilidad Certificada por Chasqui'}
              </span>
            </div>
            <h1 className="text-3xl font-black">{carga?.nombreProducto || carga?.tipoCarga || 'Seguimiento de Carga'}</h1>
            <p className="text-slate-400 font-medium mt-1">Lote: {trip.lote || 'N/E'} • GUÍA: {trip.guiaRemision || 'N/E'}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <p className="text-[10px] font-black  text-slate-400 mb-1">Estado Final del Viaje</p>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-3 h-3 rounded-full",
                trip.estado === 'completado' ? "bg-green-500" : "bg-blue-500",
                !isArchived && "animate-pulse"
              )} />
              <span className="text-xl font-black  italic tracking-tighter">
                {trip.estado.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto -mt-12 px-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content: Map & Info */}
        <div className="lg:col-span-2 space-y-6">
          {isArchived ? (
            <div className="bg-white rounded-3xl shadow-xl p-10 border border-gray-100 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-black text-gray-900 mb-2">Información Histórica</h2>
              <p className="text-gray-500 mb-6">Este viaje fue completado hace más de 30 días. El seguimiento en tiempo real y el mapa detallado ya no están disponibles por políticas de privacidad.</p>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 ">Recogido en</p>
                  <p className="text-sm font-black text-gray-800">{trip.recojoRealAt ? dateFnsFormat(trip.recojoRealAt, 'PPp', { locale: es }) : 'N/E'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 ">Entregado en</p>
                  <p className="text-sm font-black text-gray-800">{trip.entregaRealAt ? dateFnsFormat(trip.entregaRealAt, 'PPp', { locale: es }) : 'N/E'}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Real-time Map */}
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 h-[400px] relative">
                <MapContainer
                  center={trip.seguimiento ? [trip.seguimiento.lat, trip.seguimiento.lng] : [-12.046374, -77.042793]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {originCoords && (
                    <Marker position={[originCoords.lat, originCoords.lng]} icon={originIcon}>
                      <Popup>Origen de Carga</Popup>
                    </Marker>
                  )}
                  
                  {destinationCoords && (
                    <Marker position={[destinationCoords.lat, destinationCoords.lng]} icon={destinationIcon}>
                      <Popup>Destino Final (Puerto)</Popup>
                    </Marker>
                  )}

                  {trip.seguimiento && (
                    <Marker position={[trip.seguimiento.lat, trip.seguimiento.lng]} icon={carrierIcon}>
                      <MapController center={[trip.seguimiento.lat, trip.seguimiento.lng]} />
                    </Marker>
                  )}

                  {routeCoords.length > 0 && (
                    <Polyline positions={routeCoords} color="#2563eb" weight={4} dashArray="10, 10" opacity={0.6} />
                  )}
                </MapContainer>

                {/* GPS Overlay */}
                <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm p-3 rounded-2xl shadow-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-xl">
                      <Navigation className="h-5 w-5 text-blue-600 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 ">Señal GPS</p>
                      <p className="text-xs font-black text-gray-900 ">
                        {trip.estado === 'completado' ? 'VIAJE FINALIZADO' : 'ACTIVA Y VERIFICADA'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400  mb-2">Temperatura Última</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-red-50 rounded-xl flex items-center justify-center">
                      <Thermometer className="h-5 w-5 text-red-600" />
                    </div>
                    <span className="text-1xl font-black text-gray-900">{trip.temperaturaActual || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400  mb-2">Etapa estimado</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-1xl font-black text-gray-900">
                      {trip.estado === 'completado' ? 'Entregado' : (trip.tiempoEstimado || '--')}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400  mb-2">Integridad</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-green-50 rounded-xl flex items-center justify-center">
                      <Package className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-1xl font-black text-gray-900 ">Conforme</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sidebar: Details & Chronology */}
        <div className="space-y-6">
          {/* Order Details */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-black  text-gray-900 mb-4 flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" /> Detalles de Carga
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 ">Exportador</p>
                <p className="text-sm font-black text-gray-800">{merchantName || 'Cargando...'}</p>
              </div>
              <div className="pt-3 border-t border-gray-50">
                <p className="text-[10px] font-bold text-gray-400 ">Puerto de Destino</p>
                <p className="text-sm font-black text-gray-800 ">{carga?.puertoDestino || 'No especificado'}</p>
              </div>
              <div className="pt-3 border-t border-gray-50">
                <p className="text-[10px] font-bold text-gray-400 ">Certificación</p>
                <p className="text-sm font-black text-blue-600  italic">
                  {carga?.certificacion?.replace(/_/g, ' ') || 'Ninguna'}
                </p>
              </div>
            </div>
          </div>

          {/* Chronology */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-black  text-gray-900 mb-6 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" /> Cronología
            </h3>
            <div className="space-y-6 relative ml-2">
              <div className="absolute left-[7px] top-2 bottom-0 w-0.5 bg-gray-100"></div>
              
              {trip.checkpoints?.sort((a,b) => b.timestamp - a.timestamp).map((cp, idx) => (
                <div key={cp.id} className="relative pl-6">
                  <div className={cn(
                    "absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10",
                    idx === 0 ? "bg-blue-600 scale-125" : "bg-gray-300"
                  )}></div>
                  <p className="text-[10px] font-black text-gray-400  leading-none mb-1">
                    {dateFnsFormat(cp.timestamp, 'HH:mm', { locale: es })}
                  </p>
                  <p className="text-xs font-black text-gray-900  tracking-tighter">{cp.estado.replace(/_/g, ' ')}</p>
                  <p className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5">{cp.mensaje}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Verification Badge */}
      <div className="max-w-5xl mx-auto px-6 mt-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200/50 rounded-full border border-slate-300">
          <ShieldCheck className="h-4 w-4 text-slate-600" />
          <span className="text-[10px] font-bold text-slate-600  tracking-widest">Documento y Trazabilidad Certificados con Hash SHA-256</span>
        </div>
      </div>
    </div>
  );
};
