import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { auth, db, handleFirestoreError } from '../../firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { Cargo, OperationType } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Plus, Package, MapPin, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';

export const MerchantDashboard = () => {
  const { user } = useAuthStore();
  const [cargas, setCargas] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'cargas'),
      where('comercianteId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cargo));
      setCargas(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'cargas');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Cargas</h1>
          <p className="text-gray-600">Gestiona tus envíos y revisa las ofertas recibidas.</p>
        </div>
        <Link to="/merchant/post-cargo">
          <Button className="h-12 px-6 shadow-lg shadow-blue-200">
            <Plus className="h-5 w-5 mr-2" />
            Publicar Nueva Carga
          </Button>
        </Link>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : cargas.length === 0 ? (
        <Card className="border-dashed border-2 py-20 text-center">
          <CardContent className="space-y-4">
            <div className="mx-auto h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900">No tienes cargas publicadas</h3>
              <p className="text-gray-500">Publica tu primera carga para empezar a recibir ofertas de transportistas.</p>
            </div>
            <Link to="/merchant/post-cargo">
              <Button variant="outline">Publicar Carga</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cargas.map((carga) => (
            <Link key={carga.id} to={`/merchant/cargo/${carga.id}`}>
              <Card className="hover:border-blue-300 transition-all group overflow-hidden">
                <div className={cn(
                  "h-1.5 w-full",
                  carga.estado === 'disponible' ? "bg-green-500" : 
                  carga.estado === 'en_negociacion' ? "bg-blue-500" : "bg-gray-400"
                )} />
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-bold group-hover:text-blue-600 transition-colors">
                      {carga.tipoCarga}
                    </CardTitle>
                    <span className={cn(
                      "text-[10px] uppercase font-bold px-2 py-1 rounded-full",
                      carga.estado === 'disponible' ? "bg-green-100 text-green-700" : 
                      carga.estado === 'en_negociacion' ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                    )}>
                      {carga.estado}
                    </span>
                  </div>
                  <CardDescription className="flex items-center text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Publicado {formatDistanceToNow(carga.createdAt, { addSuffix: true, locale: es })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pb-6">
                  <div className="space-y-2">
                    <div className="flex items-start text-sm">
                      <MapPin className="h-4 w-4 text-red-500 mr-2 mt-0.5 shrink-0" />
                      <span className="text-gray-600 font-medium truncate">{carga.origen}</span>
                    </div>
                    <div className="flex items-start text-sm">
                      <MapPin className="h-4 w-4 text-blue-500 mr-2 mt-0.5 shrink-0" />
                      <span className="text-gray-600 font-medium truncate">{carga.destino}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Precio Propuesto</span>
                      <span className="text-xl font-extrabold text-gray-900">S/ {carga.precioPropuesto}</span>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                    </div>
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
