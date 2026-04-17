import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, onSnapshot, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { Cargo, Offer, Trip, OperationType } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Package, MapPin, DollarSign, ArrowLeft, Clock, User, Star, CheckCircle, AlertCircle, ChevronRight, Phone, Truck, Navigation, ShieldCheck, Thermometer } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { useNotification } from '../../components/ui/NotificationProvider';

export const MerchantCargoDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  
  const [carga, setCarga] = useState<Cargo | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [carrierDataMap, setCarrierDataMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState<string | null>(null);
  const [etas, setEtas] = useState<Record<string, string>>({});

  useEffect(() => {
    if (offers.length > 0 && carga && Object.keys(carrierDataMap).length > 0) {
      // Usar OSRM Table Service para obtener ETAs de múltiples transportistas al origen de la carga
      const carriersWithLocation = offers.filter(o => carrierDataMap[o.transportistaId]?.currentLocation);
      
      if (carriersWithLocation.length === 0) return;

      const cargoOriginPromise = (async () => {
        if (carga.origenCoords) return carga.origenCoords;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(carga.origen)}`);
        const data = await res.json();
        return data?.[0] ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null;
      })();

      cargoOriginPromise.then(async (originCoords) => {
        if (!originCoords) return;

        // Limitar a máximo 25 para evitar URLs gigantescas
        const limitedCarriers = carriersWithLocation.slice(0, 25);
        const coordinates = limitedCarriers.map(o => {
          const loc = carrierDataMap[o.transportistaId].currentLocation;
          return `${loc.lng},${loc.lat}`;
        }).join(';');

        const url = `https://router.project-osrm.org/table/v1/driving/${coordinates};${originCoords.lng},${originCoords.lat}?sources=${limitedCarriers.map((_, i) => i).join(',')}&destinations=${limitedCarriers.length}`;
        
        try {
          const res = await fetch(url);
          const data = await res.json();
          if (data.durations) {
            const newEtas: Record<string, string> = {};
            data.durations.forEach((durationRow: any, i: number) => {
              const seconds = durationRow[0];
              if (seconds !== null) {
                const mins = Math.round(seconds / 60);
                newEtas[limitedCarriers[i].id] = mins > 60 ? `${Math.floor(mins/60)}h ${mins%60}m` : `${mins} min`;
              }
            });
            setEtas(newEtas);
          }
        } catch (err) {
          console.error("Error fetching ETAs from OSRM:", err);
        }
      });
    }
  }, [offers.length, carga?.origen, Object.keys(carrierDataMap).length]);

  useEffect(() => {
    if (!id || !user) return;

    const fetchCarga = async () => {
      const docRef = doc(db, 'cargas', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCarga({ id: docSnap.id, ...docSnap.data() } as Cargo);
      }
      setLoading(false);
    };

    fetchCarga();

    const q = query(collection(db, 'cargas', id, 'offers'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
        setOffers(docs.sort((a, b) => a.precioOfertado - b.precioOfertado));

        // Fetch carrier data
        const newCarrierData = { ...carrierDataMap };
        for (const offer of docs) {
          if (!newCarrierData[offer.transportistaId]) {
            try {
              const carrierDoc = await getDoc(doc(db, 'users', offer.transportistaId));
              if (carrierDoc.exists()) {
                newCarrierData[offer.transportistaId] = carrierDoc.data();
              }
            } catch (err) {
              console.warn(`No se pudo obtener datos del transportista ${offer.transportistaId}:`, err);
            }
          }
        }
        setCarrierDataMap(newCarrierData);
      } catch (err) {
        console.error('Error procesando ofertas:', err);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `cargas/${id}/offers`);
    });

    return () => unsubscribe();
  }, [id, user]);

  const handleAcceptOffer = async (offer: Offer) => {
    if (!carga || !id) return;
    setIsAccepting(offer.id);
    try {
      // 1. Crear el viaje
      const tripData: Omit<Trip, 'id'> = {
        cargoId: id,
        tipoCarga: carga.tipoCarga,
        comercianteId: user!.uid,
        comercianteNombre: user!.nombre,
        transportistaId: offer.transportistaId,
        transportistaNombre: offer.transportistaNombre,
        vehiculo: { tipo: 'Camión de Carga', placa: 'V3R-982' }, // Mocked for now
        origen: carga.origen,
        destino: carga.destino,
        precioFinal: offer.precioOfertado,
        comision: offer.precioOfertado * 0.1,
        estado: 'pendiente_pago',
        seguimiento: { lat: -12.046374, lng: -77.042793, updatedAt: Date.now() }, // Lima default
        checkpoints: [],
        tiempoEstimado: 'Esperando pago del flete',
        fechaRecojo: new Date().toLocaleDateString('es-PE'),
        horaRecojo: '14:30', // Mocked
        createdAt: Date.now(),
      };
      
      const tripRef = await addDoc(collection(db, 'trips'), tripData);
      
      // 2. Actualizar estado de la carga
      await updateDoc(doc(db, 'cargas', id), {
        estado: 'asignado',
      });

      // 3. Actualizar estado de la oferta
      await updateDoc(doc(db, 'cargas', id, 'offers', offer.id), {
        estado: 'aceptada',
      });

      // 4. Crear notificación para el transportista
      await addDoc(collection(db, 'notifications'), {
        userId: offer.transportistaId,
        titulo: '¡Oferta Aceptada!',
        mensaje: `Tu oferta para la carga "${carga.tipoCarga}" ha sido aceptada. El viaje ya está en curso.`,
        tipo: 'oferta_aceptada',
        leido: false,
        link: `/trip/${tripRef.id}`,
        createdAt: Date.now(),
      });

      addNotification({
        title: '¡Oferta Aceptada!',
        message: 'El viaje ha sido creado exitosamente. Redirigiendo...',
        type: 'success'
      });

      // 5. Navegar al viaje
      navigate(`/trip/${tripRef.id}`);
    } catch (err: any) {
      console.error("Error accepting offer:", err);
      
      let errorMessage = "No se pudo aceptar la oferta. Por favor intenta de nuevo.";
      if (err.message?.includes("permissions")) {
        errorMessage = "Error de permisos: Debes actualizar las reglas de Firestore en tu consola de Firebase para permitir el estado 'pendiente_pago'.";
      }

      addNotification({
        title: 'Error al aceptar oferta',
        message: errorMessage,
        type: 'error',
        duration: 10000
      });
    } finally {
      setIsAccepting(null);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  if (!carga) return <div className="text-center py-20">Carga no encontrada</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver a Mis Cargas
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Detalles de la Carga */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold">{carga.tipoCarga}</CardTitle>
                <CardDescription className="flex items-center text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Publicado {formatDistanceToNow(carga.createdAt, { addSuffix: true, locale: es })}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                <div className="relative">
                  <div className="absolute -left-6 top-1 h-2 w-2 rounded-full bg-red-500" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Origen</span>
                    <p className="text-xs text-gray-900 font-medium leading-tight">{carga.origen}</p>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -left-6 top-1 h-2 w-2 rounded-full bg-blue-500" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Destino</span>
                    <p className="text-xs text-gray-900 font-medium leading-tight">{carga.destino}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Categoría</span>
                  <p className="text-xs text-gray-900 font-bold capitalize">{carga.categoria || 'General'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Peso</span>
                  <p className="text-sm text-gray-900 font-medium">{carga.peso}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Capacidad</span>
                  <p className="text-sm text-gray-900 font-medium whitespace-nowrap overflow-hidden text-ellipsis">{carga.capacidadRequerida}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Propuesta</span>
                  <p className="text-sm text-blue-600 font-bold">S/ {carga.precioPropuesto}</p>
                </div>
              </div>

              {carga.temperaturaRequerida && (
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-blue-700">
                    <Thermometer className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase">Cadena de Frío</span>
                  </div>
                  <span className="text-xs font-black text-blue-600">{carga.temperaturaRequerida}</span>
                </div>
              )}

              <div className="space-y-2 pt-4 border-t border-gray-50">
                <span className="text-[10px] uppercase font-bold text-gray-400">Descripción</span>
                <p className="text-gray-700 text-xs leading-relaxed">{carga.descripcion}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Ofertas */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Ofertas Recibidas</h2>
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
              {offers.length} {offers.length === 1 ? 'oferta' : 'ofertas'}
            </span>
          </div>

          {offers.length === 0 ? (
            <Card className="border-dashed border-2 py-20 text-center">
              <CardContent className="space-y-4">
                <div className="mx-auto h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center">
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-900">Esperando ofertas...</h3>
                  <p className="text-gray-500">Los transportistas verán tu carga y empezarán a ofertar pronto.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {offers.map((offer) => (
                <Card key={offer.id} className={cn(
                  "overflow-hidden transition-all",
                  offer.estado === 'aceptada' ? "border-green-500 bg-green-50/30" : "hover:border-blue-300"
                )}>
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-6">
                      <div className="flex items-center space-x-4">
                        <Link to={`/profile/${offer.transportistaId}`} className="h-14 w-14 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden hover:opacity-80 transition-opacity">
                          {carrierDataMap[offer.transportistaId]?.photoUrl ? (
                            <img src={carrierDataMap[offer.transportistaId].photoUrl} alt={offer.transportistaNombre} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <User className="h-8 w-8 text-gray-400" />
                          )}
                        </Link>
                        <div className="space-y-1">
                          <Link to={`/profile/${offer.transportistaId}`} className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors">
                            {offer.transportistaNombre}
                          </Link>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                              <Star className="h-3.5 w-3.5 fill-current" />
                              <span className="ml-1 text-xs font-bold">{(carrierDataMap[offer.transportistaId]?.rating || 5.0).toFixed(1)}</span>
                            </div>
                            <div className="flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 shadow-sm">
                              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                              <span className="text-xs font-bold uppercase tracking-tighter">TRUST: {carrierDataMap[offer.transportistaId]?.indiceConfiabilidad || '95'}%</span>
                            </div>
                            <div className="flex items-center text-gray-600 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                              <Truck className="h-3.5 w-3.5" />
                              <span className="ml-1 text-xs font-bold">{carrierDataMap[offer.transportistaId]?.completedTrips || 0} viajes</span>
                            </div>
                            {etas[offer.id] && (
                              <div className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                                <Navigation className="h-3.5 w-3.5" />
                                <span className="ml-1 text-xs font-bold">Llega en {etas[offer.id]}</span>
                              </div>
                            )}
                            {offer.tiempoRecojoEstimado && (
                              <div className="flex items-center text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                                <Clock className="h-3.5 w-3.5" />
                                <span className="ml-1 text-xs font-bold">Recojo: {offer.tiempoRecojoEstimado}</span>
                              </div>
                            )}
                            {carrierDataMap[offer.transportistaId]?.telefono && (
                              <p className="text-xs text-gray-500 font-medium flex items-center px-1">
                                <Phone className="h-3 w-3 mr-1" />
                                {carrierDataMap[offer.transportistaId].telefono}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between sm:justify-end gap-6 flex-1 border-t sm:border-t-0 pt-6 sm:pt-0">
                        <div className="flex flex-col items-center sm:items-end">
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest leading-none mb-1">Precio Ofertado</span>
                          <span className="text-3xl font-black text-blue-600 leading-none">S/ {offer.precioOfertado}</span>
                        </div>
                        
                        {carga.estado === 'disponible' ? (
                          <Button 
                            onClick={() => handleAcceptOffer(offer)}
                            isLoading={isAccepting === offer.id}
                            disabled={isAccepting !== null}
                            className="h-12 px-8"
                          >
                            Aceptar
                          </Button>
                        ) : offer.estado === 'aceptada' ? (
                          <div className="flex items-center text-green-600 font-bold">
                            <CheckCircle className="h-6 w-6 mr-2" />
                            Aceptada
                          </div>
                        ) : (
                          <div className="text-gray-400 font-medium italic text-sm">
                            Cerrada
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
