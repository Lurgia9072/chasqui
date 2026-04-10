import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { Cargo, Offer, OperationType } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Package, MapPin, DollarSign, ArrowLeft, Clock, User, ShieldCheck, AlertCircle, Phone, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';

export const CarrierCargoDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [carga, setCarga] = useState<Cargo | null>(null);
  const [merchantData, setMerchantData] = useState<any>(null);
  const [myOffer, setMyOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [offerPrice, setOfferPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

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
        estado: 'pendiente',
        createdAt: Date.now(),
      });
      
      // Notificar al comerciante
      await addDoc(collection(db, 'notifications'), {
        userId: carga.comercianteId,
        titulo: 'Nueva Oferta Recibida',
        mensaje: `${user.nombre} ha enviado una oferta de S/ ${offerPrice} para tu carga de ${carga.tipoCarga}.`,
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

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  if (!carga) return <div className="text-center py-20">Carga no encontrada</div>;

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

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Peso</span>
                  <p className="text-gray-900 font-medium">{carga.peso}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Capacidad Requerida</span>
                  <p className="text-gray-900 font-medium">{carga.capacidadRequerida}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Comerciante</span>
                  <p className="text-gray-900 font-medium">{carga.comercianteNombre}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center text-yellow-500">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="ml-1 text-xs font-bold">{(merchantData?.rating || 5.0).toFixed(1)}</span>
                    </div>
                    {merchantData?.telefono && (
                      <p className="text-xs text-blue-600 font-bold flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {merchantData.telefono}
                      </p>
                    )}
                  </div>
                </div>
              </div>

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
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-blue-100">
                  <span className="text-sm font-medium text-gray-600">Precio Ofertado</span>
                  <span className="text-2xl font-extrabold text-blue-700">S/ {myOffer.precioOfertado}</span>
                </div>
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
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Precio Sugerido</span>
                    <span className="text-sm font-bold text-gray-900">S/ {carga.precioPropuesto}</span>
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
