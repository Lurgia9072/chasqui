import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError } from '../firebase';
import { useAuthStore } from '../store/useAuthStore';
import { Trip, OperationType } from '../types';
import { TripCard } from '../components/ui/TripCard';
import { History as HistoryIcon, Search, Filter, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

export const History = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completado' | 'cancelado'>('all');

  useEffect(() => {
    if (!user) return;

    const roleField = user.tipoUsuario === 'comerciante' ? 'comercianteId' : 'transportistaId';
    
    let q = query(
      collection(db, 'trips'),
      where(roleField, '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
      setTrips(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'trips');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredTrips = trips.filter(trip => {
    if (filter === 'all') return true;
    return trip.estado === filter;
  });

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <HistoryIcon className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Historial de Viajes</h1>
          </div>
          <p className="text-gray-600">Revisa todos tus servicios y actividades pasadas.</p>
        </div>

        <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "px-4 py-2 text-sm font-bold rounded-lg transition-all",
              filter === 'all' ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:text-blue-600"
            )}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('completado')}
            className={cn(
              "px-4 py-2 text-sm font-bold rounded-lg transition-all",
              filter === 'completado' ? "bg-green-600 text-white shadow-md" : "text-gray-500 hover:text-green-600"
            )}
          >
            Completados
          </button>
          <button
            onClick={() => setFilter('cancelado')}
            className={cn(
              "px-4 py-2 text-sm font-bold rounded-lg transition-all",
              filter === 'cancelado' ? "bg-red-600 text-white shadow-md" : "text-gray-500 hover:text-red-600"
            )}
          >
            Cancelados
          </button>
        </div>
      </header>

      {filteredTrips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              cargoName={trip.tipoCarga || 'Carga General'}
              partnerName={user?.tipoUsuario === 'comerciante' ? (trip.transportistaNombre || 'Transportista') : (trip.comercianteNombre || 'Comerciante')}
              isMerchant={user?.tipoUsuario === 'comerciante'}
              onClick={() => navigate(`/trip/${trip.id}`)}
              className={cn(
                trip.estado === 'cancelado' && "opacity-75 grayscale-[0.5]"
              )}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-20 text-center space-y-4">
          <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
            <Search className="h-10 w-10 text-gray-300" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-gray-900">No hay viajes en el historial</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? "Aún no has realizado ningún servicio." 
                : `No tienes viajes con estado "${filter}".`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
