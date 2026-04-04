import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, onSnapshot, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { Cargo, Offer, Trip, OperationType } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Package, MapPin, DollarSign, ArrowLeft, Clock, User, Star, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';

export const MerchantCargoDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [carga, setCarga] = useState<Cargo | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState<string | null>(null);

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
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
      setOffers(docs.sort((a, b) => a.precioOfertado - b.precioOfertado));
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
        cargoTipo: carga.tipoCarga,
        comercianteId: user!.uid,
        comercianteNombre: user!.nombre,
        transportistaId: offer.transportistaId,
        transportistaNombre: offer.transportistaNombre,
        vehiculo: { tipo: 'Camión de Carga', placa: 'V3R-982' }, // Mocked for now
        origen: carga.origen,
        destino: carga.destino,
        precioFinal: offer.precioOfertado,
        comision: offer.precioOfertado * 0.1,
        estado: 'en_camino_a_recojo',
        seguimiento: { lat: -12.046374, lng: -77.042793, updatedAt: Date.now() }, // Lima default
        tiempoEstimado: '45 min para el recojo', // Mocked estimation
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

      // 5. Navegar al viaje
      navigate(`/trip/${tripRef.id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'trips');
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
                  <span className="text-[10px] uppercase font-bold text-gray-400">Peso</span>
                  <p className="text-sm text-gray-900 font-medium">{carga.peso}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Propuesta</span>
                  <p className="text-sm text-blue-600 font-bold">S/ {carga.precioPropuesto}</p>
                </div>
              </div>

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
                        <div className="h-14 w-14 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                          <User className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-lg font-bold text-gray-900">{offer.transportistaNombre}</h4>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center text-yellow-500">
                              <Star className="h-4 w-4 fill-current" />
                              <span className="ml-1 text-sm font-bold">{offer.transportistaRating}</span>
                            </div>
                            <span className="text-gray-300">|</span>
                            <span className="text-xs text-gray-500">Verificado</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-8 flex-1">
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Precio Ofertado</span>
                          <span className="text-3xl font-extrabold text-blue-600">S/ {offer.precioOfertado}</span>
                        </div>
                        
                        {carga.estado === 'disponible' ? (
                          <Button 
                            onClick={() => handleAcceptOffer(offer)}
                            isLoading={isAccepting === offer.id}
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
