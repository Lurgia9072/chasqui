import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError } from '../firebase';
import { useAuthStore } from '../store/useAuthStore';
import { Trip, OperationType, TripStatus } from '../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ShieldCheck, Clock, CheckCircle, ExternalLink, Search, Filter, AlertCircle, XCircle, FileText, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';

type AdminTab = 'revision' | 'confirmado' | 'rechazado' | 'pendiente';

export const AdminDashboard = () => {
  const { user } = useAuthStore();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('revision');

  const isAdmin = user?.tipoUsuario === 'admin' || 
                  user?.email === 'lurgia18yuar@gmail.com' || 
                  user?.email === 'lurgiaalidayupa@gmail.com';

  useEffect(() => {
    if (!isAdmin) return;

    setLoading(true);
    let statusFilter: TripStatus[] = [];
    
    if (activeTab === 'revision') statusFilter = ['pago_en_revision'];
    else if (activeTab === 'confirmado') statusFilter = ['en_camino_a_recojo', 'recojo_completado', 'en_camino_a_destino', 'entregado_pendiente_confirmacion', 'completado'];
    else if (activeTab === 'rechazado') statusFilter = ['pago_rechazado'];
    else if (activeTab === 'pendiente') statusFilter = ['pendiente_pago'];

    const q = query(
      collection(db, 'trips'),
      where('estado', 'in', statusFilter),
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
  }, [isAdmin, activeTab]);

  const handleVerifyPayment = async (trip: Trip) => {
    setIsUpdating(trip.id);
    try {
      await updateDoc(doc(db, 'trips', trip.id), {
        estado: 'en_camino_a_recojo',
        'pagoInfo.verificadoPor': user?.uid,
        'pagoInfo.verificadoAt': Date.now(),
        tiempoEstimado: '45 min para el recojo'
      });

      // Notificar al transportista
      await addDoc(collection(db, 'notifications'), {
        userId: trip.transportistaId,
        titulo: '¡Pago Verificado!',
        mensaje: `El pago para el viaje de ${trip.tipoCarga} ha sido verificado. Ya puedes iniciar el recojo.`,
        tipo: 'viaje_actualizado',
        leido: false,
        link: `/trip/${trip.id}`,
        createdAt: Date.now(),
      });

      // Notificar al comerciante
      await addDoc(collection(db, 'notifications'), {
        userId: trip.comercianteId,
        titulo: 'Pago Confirmado',
        mensaje: `Tu pago para el viaje a ${trip.destino} ha sido verificado. El transportista está en camino.`,
        tipo: 'viaje_actualizado',
        leido: false,
        link: `/trip/${trip.id}`,
        createdAt: Date.now(),
      });

    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `trips/${trip.id}`);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRejectPayment = async (trip: Trip) => {
    const reason = window.prompt('Indica el motivo del rechazo del pago:');
    if (reason === null) return;

    setIsUpdating(trip.id);
    try {
      await updateDoc(doc(db, 'trips', trip.id), {
        estado: 'pago_rechazado',
        'pagoInfo.rechazadoPor': user?.uid,
        'pagoInfo.rechazadoAt': Date.now(),
        'pagoInfo.motivoRechazo': reason,
        tiempoEstimado: 'Pago rechazado por el administrador'
      });

      // Notificar al comerciante
      await addDoc(collection(db, 'notifications'), {
        userId: trip.comercianteId,
        titulo: 'Pago Rechazado',
        mensaje: `Tu pago para el viaje a ${trip.destino} ha sido rechazado. Motivo: ${reason}. Por favor, vuelve a informar el pago.`,
        tipo: 'viaje_actualizado',
        leido: false,
        link: `/trip/${trip.id}`,
        createdAt: Date.now(),
      });

    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `trips/${trip.id}`);
    } finally {
      setIsUpdating(null);
    }
  };

  if (!isAdmin) return <div className="text-center py-20">No tienes permisos para acceder a esta página.</div>;

  const stats = {
    revision: trips.filter(t => t.estado === 'pago_en_revision').length,
    confirmado: trips.filter(t => ['en_camino_a_recojo', 'recojo_completado', 'en_camino_a_destino', 'entregado_pendiente_confirmacion', 'completado'].includes(t.estado)).length,
    rechazado: trips.filter(t => t.estado === 'pago_rechazado').length,
    pendiente: trips.filter(t => t.estado === 'pendiente_pago').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-600 p-2 rounded-lg text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
          </div>
          <p className="text-gray-600">Gestión de pagos, verificaciones y estados de viajes.</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start space-x-3 max-w-md">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-800">
            <strong>Nota:</strong> Los viajes aparecen aquí una vez que un comerciante acepta una oferta. Los pagos aparecen "En Revisión" cuando el comerciante sube su comprobante.
          </p>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={cn(
          "p-4 rounded-2xl border-2 transition-all cursor-pointer",
          activeTab === 'revision' ? "bg-blue-50 border-blue-200" : "bg-white border-gray-100 hover:border-gray-200"
        )} onClick={() => setActiveTab('revision')}>
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span className="text-2xl font-black text-blue-700">{activeTab === 'revision' ? trips.length : '...'}</span>
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">En Revisión</p>
        </div>
        <div className={cn(
          "p-4 rounded-2xl border-2 transition-all cursor-pointer",
          activeTab === 'confirmado' ? "bg-green-50 border-green-200" : "bg-white border-gray-100 hover:border-gray-200"
        )} onClick={() => setActiveTab('confirmado')}>
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-2xl font-black text-green-700">{activeTab === 'confirmado' ? trips.length : '...'}</span>
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confirmados</p>
        </div>
        <div className={cn(
          "p-4 rounded-2xl border-2 transition-all cursor-pointer",
          activeTab === 'rechazado' ? "bg-red-50 border-red-200" : "bg-white border-gray-100 hover:border-gray-200"
        )} onClick={() => setActiveTab('rechazado')}>
          <div className="flex items-center justify-between mb-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="text-2xl font-black text-red-700">{activeTab === 'rechazado' ? trips.length : '...'}</span>
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rechazados</p>
        </div>
        <div className={cn(
          "p-4 rounded-2xl border-2 transition-all cursor-pointer",
          activeTab === 'pendiente' ? "bg-orange-50 border-orange-200" : "bg-white border-gray-100 hover:border-gray-200"
        )} onClick={() => setActiveTab('pendiente')}>
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <span className="text-2xl font-black text-orange-700">{activeTab === 'pendiente' ? trips.length : '...'}</span>
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pendientes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                {activeTab === 'revision' && <Clock className="h-5 w-5 mr-2 text-blue-500" />}
                {activeTab === 'confirmado' && <CheckCircle className="h-5 w-5 mr-2 text-green-500" />}
                {activeTab === 'rechazado' && <XCircle className="h-5 w-5 mr-2 text-red-500" />}
                {activeTab === 'pendiente' && <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />}
                {activeTab === 'revision' ? 'Pagos por Verificar' : 
                 activeTab === 'confirmado' ? 'Pagos Confirmados' :
                 activeTab === 'rechazado' ? 'Pagos Rechazados' : 'Viajes Pendientes de Pago'}
              </CardTitle>
              <span className={cn(
                "text-xs font-bold px-3 py-1 rounded-full",
                activeTab === 'revision' ? "bg-blue-100 text-blue-700" :
                activeTab === 'confirmado' ? "bg-green-100 text-green-700" :
                activeTab === 'rechazado' ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
              )}>
                {trips.length} resultados
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
              </div>
            ) : trips.length === 0 ? (
              <div className="text-center py-20 space-y-3">
                <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="h-6 w-6 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">No se encontraron viajes en esta categoría.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {trips.map((trip) => (
                  <div key={trip.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-gray-900 text-lg">{trip.tipoCarga}</h4>
                            <Link to={`/trip/${trip.id}`} className="text-blue-600 hover:underline text-xs flex items-center">
                              Ver Detalle <ExternalLink className="h-3 w-3 ml-1" />
                            </Link>
                          </div>
                          <p className="text-sm text-gray-500">ID Viaje: {trip.id}</p>
                          <p className="text-xs text-gray-400">Creado {formatDistanceToNow(trip.createdAt, { addSuffix: true, locale: es })}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 uppercase font-bold">Monto del Flete</p>
                          <p className="text-2xl font-black text-purple-600">S/ {trip.precioFinal.toFixed(2)}</p>
                          <p className="text-[10px] text-green-600 font-bold">Comisión: S/ {trip.comision.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-gray-400">Comerciante</p>
                          <p className="text-sm font-bold text-gray-700">{trip.comercianteNombre}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-gray-400">Transportista</p>
                          <p className="text-sm font-bold text-gray-700">{trip.transportistaNombre}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-gray-400">Referencia</p>
                          <p className="text-sm font-mono font-bold text-blue-600">{trip.pagoInfo?.referencia || 'N/A'}</p>
                        </div>
                      </div>
                      
                      {trip.estado === 'pago_rechazado' && (
                        <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex items-start space-x-2">
                          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                          <p className="text-xs text-red-700"><strong>Motivo de rechazo:</strong> {trip.pagoInfo?.motivoRechazo}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 lg:w-80">
                      {trip.pagoInfo?.comprobanteUrl && (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => window.open(trip.pagoInfo?.comprobanteUrl, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Ver Recibo
                        </Button>
                      )}
                      
                      {activeTab === 'revision' && (
                        <div className="flex w-full gap-2">
                          <Button 
                            variant="outline"
                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => handleRejectPayment(trip)}
                            disabled={isUpdating === trip.id}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Rechazar
                          </Button>
                          <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100"
                            onClick={() => handleVerifyPayment(trip)}
                            isLoading={isUpdating === trip.id}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Aprobar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
