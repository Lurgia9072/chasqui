import { useState, useEffect } from 'react';
import { collectionGroup, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { Offer } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export const MyOffers = () => {
  const { user } = useAuthStore();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Usamos collectionGroup para buscar ofertas en todas las subcolecciones de cargas
    const q = query(
      collectionGroup(db, 'offers'),
      where('transportistaId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
      setOffers(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching offers:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Mis Ofertas</h1>
      
      {loading ? (
        <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>
      ) : offers.length === 0 ? (
        <Card className="border-dashed border-2 py-20 text-center">
          <CardContent className="space-y-4">
            <div className="mx-auto h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center">
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900">No has realizado ninguna oferta</h3>
              <p className="text-gray-500">Busca cargas disponibles y empieza a ofertar.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <Card key={offer.id} className="hover:border-blue-300 transition-all group">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-bold">S/ {offer.precioOfertado}</CardTitle>
                  <div className={cn(
                    "flex items-center space-x-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    offer.estado === 'pendiente' ? "bg-yellow-100 text-yellow-700" :
                    offer.estado === 'aceptada' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {offer.estado === 'pendiente' ? <Clock className="h-3 w-3" /> : 
                     offer.estado === 'aceptada' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    <span>{offer.estado}</span>
                  </div>
                </div>
                <CardDescription className="flex items-center text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Ofertado {formatDistanceToNow(offer.createdAt, { addSuffix: true, locale: es })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">ID Carga: {offer.cargoId}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
