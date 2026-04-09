import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError } from '../firebase';
import { useAuthStore } from '../store/useAuthStore';
import { Trip, OperationType, TripStatus, Cargo } from '../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ShieldCheck, Clock, CheckCircle, ExternalLink, Search, Filter, AlertCircle, XCircle, FileText, Check, X, Package, Banknote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';

type AdminTab = 'revision' | 'confirmado' | 'rechazado' | 'pendiente' | 'payouts' | 'todos' | 'users' | 'cargas';

export const AdminDashboard = () => {
  const { user } = useAuthStore();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [platformUsers, setPlatformUsers] = useState<any[]>([]);
  const [platformCargas, setPlatformCargas] = useState<Cargo[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCargos: 0,
    totalTrips: 0,
    totalRevenue: 0,
    totalCommission: 0
  });
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('revision');
  const [rejectingTrip, setRejectingTrip] = useState<Trip | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [payingTrip, setPayingTrip] = useState<Trip | null>(null);
  const [payoutRef, setPayoutRef] = useState('');
  const [payoutFile, setPayoutFile] = useState<File | null>(null);
  const [payoutProofUrl, setPayoutProofUrl] = useState('');

  const isAdmin = user?.tipoUsuario === 'admin' || 
                  user?.email === 'lurgia18yuar@gmail.com' || 
                  user?.email === 'lurgiaalidayupa@gmail.com';

  // Fetch Platform Stats
  useEffect(() => {
    if (!isAdmin) return;

    // Users Count
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlatformUsers(docs);
      setStats(prev => ({ ...prev, totalUsers: snap.size }));
    });

    // Cargos Count
    const unsubCargos = onSnapshot(collection(db, 'cargas'), (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cargo));
      setPlatformCargas(docs);
      setStats(prev => ({ ...prev, totalCargos: snap.size }));
    });

    // Trips Stats
    const unsubTrips = onSnapshot(collection(db, 'trips'), (snap) => {
      const allTrips = snap.docs.map(d => d.data() as Trip);
      const completedTrips = allTrips.filter(t => t.estado === 'completado');
      const revenue = completedTrips.reduce((sum, t) => sum + (t.precioFinal || 0), 0);
      const commission = completedTrips.reduce((sum, t) => sum + (t.comision || 0), 0);
      
      setStats(prev => ({ 
        ...prev, 
        totalTrips: snap.size,
        totalRevenue: revenue,
        totalCommission: commission
      }));
    });

    return () => {
      unsubUsers();
      unsubCargos();
      unsubTrips();
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    setLoading(true);
    let q;
    
    if (activeTab === 'todos') {
      q = query(collection(db, 'trips'), orderBy('createdAt', 'desc'));
    } else {
      let statusFilter: TripStatus[] = [];
      if (activeTab === 'revision') statusFilter = ['pago_en_revision'];
      else if (activeTab === 'confirmado') statusFilter = ['en_camino_a_recojo', 'recojo_completado', 'en_camino_a_destino', 'entregado_pendiente_confirmacion', 'completado'];
      else if (activeTab === 'rechazado') statusFilter = ['pago_rechazado', 'pendiente_pago']; // Incluimos pendiente_pago para filtrar luego
      else if (activeTab === 'pendiente') statusFilter = ['pendiente_pago'];
      else if (activeTab === 'payouts') statusFilter = ['completado'];

      q = query(
        collection(db, 'trips'),
        where('estado', 'in', statusFilter),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
      
      // Ajuste para mostrar rechazos que están en estado pendiente_pago por limitaciones de reglas
      if (activeTab === 'rechazado') {
        // En la pestaña de rechazados, mostramos los que tienen motivo de rechazo
        // (Incluso si su estado técnico es pendiente_pago)
        docs = docs.filter(t => t.estado === 'pago_rechazado' || (t.estado === 'pendiente_pago' && t.pagoInfo?.motivoRechazo));
      } else if (activeTab === 'pendiente') {
        // En la pestaña de pendientes, ocultamos los que tienen motivo de rechazo (porque esos van a la pestaña de rechazados)
        docs = docs.filter(t => t.estado === 'pendiente_pago' && !t.pagoInfo?.motivoRechazo);
      } else if (activeTab === 'payouts') {
        // En la pestaña de reembolsos, mostramos los completados que no han sido pagados aún
        docs = docs.filter(t => t.estado === 'completado' && t.payoutInfo?.estado !== 'pagado');
      }

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

  const handleRejectPayment = async () => {
    if (!rejectingTrip || !rejectionReason.trim()) return;

    setIsUpdating(rejectingTrip.id);
    try {
      await updateDoc(doc(db, 'trips', rejectingTrip.id), {
        estado: 'pendiente_pago', // Usamos pendiente_pago porque pago_rechazado no está en las reglas actuales
        'pagoInfo.rechazadoPor': user?.uid,
        'pagoInfo.rechazadoAt': Date.now(),
        'pagoInfo.motivoRechazo': rejectionReason,
        tiempoEstimado: 'Pago rechazado - Por favor reintentar'
      });

      // Notificar al comerciante
      await addDoc(collection(db, 'notifications'), {
        userId: rejectingTrip.comercianteId,
        titulo: 'Pago Rechazado',
        mensaje: `Tu pago para el viaje a ${rejectingTrip.destino} ha sido rechazado. Motivo: ${rejectionReason}. Por favor, vuelve a informar el pago.`,
        tipo: 'viaje_actualizado',
        leido: false,
        link: `/trip/${rejectingTrip.id}`,
        createdAt: Date.now(),
      });

      setRejectingTrip(null);
      setRejectionReason('');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `trips/${rejectingTrip.id}`);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleProcessPayout = async () => {
    if (!payingTrip || !payoutRef.trim()) return;
    setIsUpdating(payingTrip.id);
    try {
      await updateDoc(doc(db, 'trips', payingTrip.id), {
        payoutInfo: {
          estado: 'pagado',
          referencia: payoutRef,
          comprobanteUrl: payoutProofUrl || '',
          pagadoAt: Date.now(),
          montoPagado: payingTrip.precioFinal - payingTrip.comision
        }
      });

      // Notificar al transportista
      await addDoc(collection(db, 'notifications'), {
        userId: payingTrip.transportistaId,
        titulo: '¡Pago Enviado!',
        mensaje: `Se ha procesado el pago de S/ ${(payingTrip.precioFinal - payingTrip.comision).toFixed(2)} por tu servicio a ${payingTrip.destino}.`,
        tipo: 'viaje_actualizado',
        leido: false,
        link: `/trip/${payingTrip.id}`,
        createdAt: Date.now(),
      });

      setPayingTrip(null);
      setPayoutRef('');
      setPayoutProofUrl('');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `trips/${payingTrip.id}`);
    } finally {
      setIsUpdating(null);
    }
  };
  const handleUpdateUserStatus = async (userId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        verificado: status
      });
      
      await addDoc(collection(db, 'notifications'), {
        userId,
        titulo: 'Estado de Cuenta Actualizado',
        mensaje: `Tu cuenta ha sido marcada como: ${status.toUpperCase()}.`,
        tipo: 'sistema',
        leido: false,
        createdAt: Date.now(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  if (!isAdmin) return <div className="text-center py-20">No tienes permisos para acceder a esta página.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-600 p-2 rounded-lg text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Panel de Control Maestro</h1>
          </div>
          <p className="text-gray-600">Supervisión global de la plataforma, usuarios y transacciones.</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start space-x-3 max-w-md">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-800">
            <strong>Modo Admin:</strong> Tienes acceso total para verificar pagos, gestionar usuarios y supervisar la logística en tiempo real.
          </p>
        </div>
      </header>

      {/* Platform Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Usuarios</p>
          <p className="text-2xl font-black text-gray-900">{stats.totalUsers}</p>
          <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-3/4" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cargas</p>
          <p className="text-2xl font-black text-gray-900">{stats.totalCargos}</p>
          <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 w-1/2" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Viajes</p>
          <p className="text-2xl font-black text-gray-900">{stats.totalTrips}</p>
          <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 w-2/3" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Volumen (S/)</p>
          <p className="text-2xl font-black text-gray-900">{stats.totalRevenue.toLocaleString()}</p>
          <p className="text-[10px] text-green-600 font-bold mt-1">Total fletes completados</p>
        </div>
        <div className="bg-purple-600 p-5 rounded-2xl border border-purple-500 shadow-lg shadow-purple-100">
          <p className="text-[10px] font-bold text-purple-200 uppercase tracking-widest mb-1">Comisiones (S/)</p>
          <p className="text-2xl font-black text-white">{stats.totalCommission.toLocaleString()}</p>
          <p className="text-[10px] text-purple-100 font-bold mt-1">Tu ganancia neta (10%)</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('revision')}
          className={cn(
            "px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center",
            activeTab === 'revision' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Clock className="h-4 w-4 mr-2" />
          En Revisión
        </button>
        <button
          onClick={() => setActiveTab('confirmado')}
          className={cn(
            "px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center",
            activeTab === 'confirmado' ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Confirmados
        </button>
        <button
          onClick={() => setActiveTab('rechazado')}
          className={cn(
            "px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center",
            activeTab === 'rechazado' ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Rechazados
        </button>
        <button
          onClick={() => setActiveTab('pendiente')}
          className={cn(
            "px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center",
            activeTab === 'pendiente' ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          Pendientes
        </button>
        <button
          onClick={() => setActiveTab('payouts')}
          className={cn(
            "px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center",
            activeTab === 'payouts' ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Banknote className="h-4 w-4 mr-2" />
          Reembolsos
        </button>
        <button
          onClick={() => setActiveTab('todos')}
          className={cn(
            "px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center",
            activeTab === 'todos' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Filter className="h-4 w-4 mr-2" />
          Todos
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={cn(
            "px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center",
            activeTab === 'users' ? "bg-white text-purple-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <ShieldCheck className="h-4 w-4 mr-2" />
          Usuarios
        </button>
        <button
          onClick={() => setActiveTab('cargas')}
          className={cn(
            "px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center",
            activeTab === 'cargas' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Package className="h-4 w-4 mr-2" />
          Cargas
        </button>
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
                {activeTab === 'todos' && <Filter className="h-5 w-5 mr-2 text-gray-500" />}
                {activeTab === 'users' && <ShieldCheck className="h-5 w-5 mr-2 text-purple-500" />}
                {activeTab === 'cargas' && <Package className="h-5 w-5 mr-2 text-blue-500" />}
                {activeTab === 'payouts' && <Banknote className="h-5 w-5 mr-2 text-emerald-500" />}
                {activeTab === 'revision' ? 'Pagos por Verificar' : 
                 activeTab === 'confirmado' ? 'Pagos Confirmados' :
                 activeTab === 'rechazado' ? 'Pagos Rechazados' : 
                 activeTab === 'pendiente' ? 'Viajes Pendientes de Pago' : 
                 activeTab === 'payouts' ? 'Reembolsos a Transportistas' :
                 activeTab === 'users' ? 'Gestión de Usuarios' : 
                 activeTab === 'cargas' ? 'Todas las Cargas Publicadas' : 'Todos los Viajes'}
              </CardTitle>
              <span className={cn(
                "text-xs font-bold px-3 py-1 rounded-full",
                activeTab === 'revision' ? "bg-blue-100 text-blue-700" :
                activeTab === 'confirmado' ? "bg-green-100 text-green-700" :
                activeTab === 'rechazado' ? "bg-red-100 text-red-700" : 
                activeTab === 'pendiente' ? "bg-orange-100 text-orange-700" : 
                activeTab === 'users' ? "bg-purple-100 text-purple-700" : 
                activeTab === 'cargas' ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
              )}>
                {activeTab === 'users' ? platformUsers.length : 
                 activeTab === 'cargas' ? platformCargas.length : trips.length} resultados
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading && activeTab !== 'users' && activeTab !== 'cargas' ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
              </div>
            ) : activeTab === 'users' ? (
              <div className="divide-y divide-gray-100">
                {platformUsers.map((u) => (
                  <div key={u.id} className="p-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500">
                        {u.nombre?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{u.nombre}</p>
                        <p className="text-xs text-gray-500">{u.email} • {u.tipoUsuario}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                        u.verificado === 'verificado' ? "bg-green-100 text-green-700" :
                        u.verificado === 'rechazado' ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                      )}>
                        {u.verificado || 'pendiente'}
                      </span>
                      <select 
                        className="text-xs border rounded p-1"
                        value={u.verificado || 'pendiente'}
                        onChange={(e) => handleUpdateUserStatus(u.id, e.target.value)}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="verificado">Verificado</option>
                        <option value="rechazado">Rechazado</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            ) : activeTab === 'cargas' ? (
              <div className="divide-y divide-gray-100">
                {platformCargas.map((c) => (
                  <div key={c.id} className="p-6 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{c.tipoCarga}</p>
                      <p className="text-xs text-gray-500">{c.origen} → {c.destino}</p>
                      <p className="text-[10px] text-gray-400 mt-1">Publicado por: {c.comercianteNombre}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-purple-600">S/ {c.precioSugerido}</p>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                        c.estado === 'abierta' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      )}>
                        {c.estado}
                      </span>
                    </div>
                  </div>
                ))}
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
                          <p className="text-[10px] uppercase font-bold text-gray-400">Referencia Pago</p>
                          <p className="text-sm font-mono font-bold text-blue-600">{trip.pagoInfo?.referencia || 'N/A'}</p>
                        </div>
                      </div>

                      {activeTab === 'payouts' && (
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Datos Bancarios del Transportista</p>
                            <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Monto a Pagar: S/ {(trip.precioFinal - trip.comision).toFixed(2)}</span>
                          </div>
                          {(() => {
                            const carrier = platformUsers.find(u => u.uid === trip.transportistaId);
                            if (!carrier?.datosBancarios) return <p className="text-xs text-red-600 font-bold">El transportista no ha configurado sus datos bancarios.</p>;
                            return (
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                  <p className="text-emerald-600 font-bold uppercase text-[9px]">Banco</p>
                                  <p className="font-bold text-gray-900">{carrier.datosBancarios.banco}</p>
                                </div>
                                <div>
                                  <p className="text-emerald-600 font-bold uppercase text-[9px]">Número de Cuenta</p>
                                  <p className="font-bold text-gray-900">{carrier.datosBancarios.numeroCuenta}</p>
                                </div>
                                <div>
                                  <p className="text-emerald-600 font-bold uppercase text-[9px]">CCI</p>
                                  <p className="font-bold text-gray-900">{carrier.datosBancarios.cci || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-emerald-600 font-bold uppercase text-[9px]">Titular</p>
                                  <p className="font-bold text-gray-900">{carrier.datosBancarios.titular}</p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                      
                      {trip.estado === 'pago_rechazado' && (
                        <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex items-start space-x-2">
                          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                          <p className="text-xs text-red-700"><strong>Motivo de rechazo:</strong> {trip.pagoInfo?.motivoRechazo}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 lg:w-80">
                      {trip.pagoInfo?.comprobanteUrl && (
                        <div className="w-full space-y-2">
                          <div 
                            className="relative h-24 w-full bg-gray-100 rounded-lg overflow-hidden border border-gray-200 cursor-pointer group flex items-center justify-center"
                            onClick={() => {
                              if (trip.pagoInfo?.comprobanteUrl && trip.pagoInfo.comprobanteUrl.startsWith('data:')) {
                                const win = window.open();
                                win?.document.write(`<img src="${trip.pagoInfo.comprobanteUrl}" style="max-width:100%">`);
                              } else if (trip.pagoInfo?.comprobanteUrl !== 'pdf_file_uploaded') {
                                window.open(trip.pagoInfo?.comprobanteUrl, '_blank');
                              }
                            }}
                          >
                            {trip.pagoInfo.comprobanteUrl === 'pdf_file_uploaded' ? (
                              <div className="flex flex-col items-center">
                                <FileText className="h-10 w-10 text-red-500" />
                                <span className="text-[10px] font-bold text-gray-500">PDF</span>
                              </div>
                            ) : (
                              <img 
                                src={trip.pagoInfo.comprobanteUrl} 
                                alt="Recibo" 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/error/200/300';
                                }}
                              />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ExternalLink className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <p className="text-[10px] text-center text-gray-500 font-medium truncate">{trip.pagoInfo.fileName || 'comprobante.jpg'}</p>
                        </div>
                      )}
                      
                      {activeTab === 'revision' && (
                        <div className="flex w-full gap-2">
                          <Button 
                            variant="outline"
                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => setRejectingTrip(trip)}
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
                      {activeTab === 'payouts' && (
                        <div className="w-full">
                          <Button 
                            className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100"
                            onClick={() => setPayingTrip(trip)}
                            disabled={isUpdating === trip.id || !platformUsers.find(u => u.uid === trip.transportistaId)?.datosBancarios}
                          >
                            <Banknote className="h-4 w-4 mr-2" />
                            Procesar Reembolso
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

      {/* Payout Modal */}
      {payingTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900">Procesar Reembolso</h3>
              <button onClick={() => setPayingTrip(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-start space-x-3">
                <Banknote className="h-5 w-5 text-emerald-600 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-emerald-900">Monto a reembolsar: S/ {(payingTrip.precioFinal - payingTrip.comision).toFixed(2)}</p>
                  <p className="text-[10px] text-emerald-700">Asegúrate de haber realizado la transferencia bancaria antes de confirmar.</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Referencia de Transferencia:</label>
                <input 
                  type="text"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Número de operación o referencia"
                  value={payoutRef}
                  onChange={(e) => setPayoutRef(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setPayingTrip(null)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  disabled={!payoutRef.trim() || isUpdating === payingTrip.id}
                  onClick={handleProcessPayout}
                  isLoading={isUpdating === payingTrip.id}
                >
                  Confirmar Pago
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900">Rechazar Pago</h3>
              <button onClick={() => setRejectingTrip(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <p className="text-sm text-red-800">
                  Indica el motivo por el cual el pago no es válido. El comerciante podrá ver este mensaje y volver a subir su comprobante.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Motivo del Rechazo:</label>
                <textarea 
                  className="w-full h-32 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Ej: El número de referencia no coincide, la imagen está borrosa, etc."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setRejectingTrip(null)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={!rejectionReason.trim() || isUpdating === rejectingTrip.id}
                  onClick={handleRejectPayment}
                  isLoading={isUpdating === rejectingTrip.id}
                >
                  Confirmar Rechazo
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
