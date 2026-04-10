import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { db, handleFirestoreError } from '../firebase';
import { doc, updateDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { OperationType, Review } from '../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User, Phone, Mail, CreditCard, ShieldCheck, Camera, Check, AlertCircle, Building2, Landmark, Star, Truck, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const Profile = () => {
  const { user, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [telefono, setTelefono] = useState(user?.telefono || '');
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || '');

  // Bank states
  const [banco, setBanco] = useState(user?.datosBancarios?.banco || '');
  const [tipoCuenta, setTipoCuenta] = useState(user?.datosBancarios?.tipoCuenta || '');
  const [numeroCuenta, setNumeroCuenta] = useState(user?.datosBancarios?.numeroCuenta || '');
  const [cci, setCci] = useState(user?.datosBancarios?.cci || '');
  const [titular, setTitular] = useState(user?.datosBancarios?.titular || '');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'reviews'),
      where('targetUserId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
      setReviews(docs);
      setLoadingReviews(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reviews');
      setLoadingReviews(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const userRef = doc(db, 'users', user.uid);
      const updatedData = {
        nombre,
        telefono,
        photoUrl,
        datosBancarios: {
          banco,
          tipoCuenta,
          numeroCuenta,
          cci,
          titular
        }
      };

      await updateDoc(userRef, updatedData);
      
      // Update local state
      setUser({
        ...user,
        ...updatedData
      });

      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <div 
              className={cn(
                "h-24 w-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 flex items-center justify-center",
                isEditing && "cursor-pointer hover:opacity-80 transition-opacity"
              )}
              onClick={isEditing ? handlePhotoClick : undefined}
            >
              {photoUrl ? (
                <img src={photoUrl} alt={user.nombre} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="h-12 w-12 text-gray-400" />
              )}
              {isEditing && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{user.nombre}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full uppercase",
                user.verificado === 'verificado' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
              )}>
                {user.verificado}
              </span>
              <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">• {user.tipoUsuario}</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} isLoading={isSaving}>
                Guardar Cambios
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              Editar Perfil
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Personal Info */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <ShieldCheck className="h-5 w-5 mr-2 text-blue-600" />
                Información Personal
              </CardTitle>
              <CardDescription>Datos básicos de tu cuenta y contacto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Nombre Completo</label>
                  {isEditing ? (
                    <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
                  ) : (
                    <p className="font-medium text-gray-900">{user.nombre}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Correo Electrónico</label>
                  <p className="font-medium text-gray-900 flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {user.email}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Teléfono</label>
                  {isEditing ? (
                    <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                  ) : (
                    <p className="font-medium text-gray-900 flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {user.telefono}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Documento (DNI/RUC)</label>
                  <p className="font-medium text-gray-900">{user.documento}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-emerald-600" />
                Datos Bancarios
              </CardTitle>
              <CardDescription>Información necesaria para recibir tus reembolsos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Banco</label>
                  {isEditing ? (
                    <Input value={banco} onChange={(e) => setBanco(e.target.value)} placeholder="Ej: BCP, BBVA, Interbank" />
                  ) : (
                    <p className="font-medium text-gray-900 flex items-center">
                      <Landmark className="h-4 w-4 mr-2 text-gray-400" />
                      {user.datosBancarios?.banco || 'No configurado'}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Tipo de Cuenta</label>
                  {isEditing ? (
                    <select 
                      className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={tipoCuenta}
                      onChange={(e) => setTipoCuenta(e.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Ahorros">Ahorros</option>
                      <option value="Corriente">Corriente</option>
                    </select>
                  ) : (
                    <p className="font-medium text-gray-900">{user.datosBancarios?.tipoCuenta || 'No configurado'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Número de Cuenta</label>
                  {isEditing ? (
                    <Input value={numeroCuenta} onChange={(e) => setNumeroCuenta(e.target.value)} />
                  ) : (
                    <p className="font-medium font-mono text-gray-900">{user.datosBancarios?.numeroCuenta || 'No configurado'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">CCI (Interbancario)</label>
                  {isEditing ? (
                    <Input value={cci} onChange={(e) => setCci(e.target.value)} />
                  ) : (
                    <p className="font-medium font-mono text-gray-900">{user.datosBancarios?.cci || 'No configurado'}</p>
                  )}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Titular de la Cuenta</label>
                  {isEditing ? (
                    <Input value={titular} onChange={(e) => setTitular(e.target.value)} />
                  ) : (
                    <p className="font-medium text-gray-900 flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      {user.datosBancarios?.titular || 'No configurado'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                Calificaciones y Reseñas
              </CardTitle>
              <CardDescription>Lo que otros usuarios dicen sobre ti.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingReviews ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500 italic">
                  Aún no has recibido calificaciones.
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{review.reviewerNombre}</p>
                            <p className="text-[10px] text-gray-500">
                              {format(review.createdAt, "d 'de' MMMM, yyyy", { locale: es })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center text-yellow-500">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={cn("h-3 w-3", i < review.rating ? "fill-current" : "text-gray-300")} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 italic">"{review.comentario}"</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="bg-blue-600 text-white border-none shadow-xl shadow-blue-200">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Estado</span>
                  <p className="font-bold uppercase text-sm">{user.verificado}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="font-bold text-lg">Nivel de Confianza</h3>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center text-yellow-400">
                    <Star className="h-5 w-5 fill-current" />
                    <span className="ml-1 text-2xl font-black">{(user.rating || 5.0).toFixed(1)}</span>
                  </div>
                  <span className="text-blue-200 text-sm">/ 5.0</span>
                </div>
                <p className="text-xs text-blue-100">Basado en {user.totalRatings || 0} calificaciones</p>
              </div>

              {user.tipoUsuario === 'transportista' && (
                <div className="pt-6 border-t border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-white/10 rounded-lg flex items-center justify-center">
                        <Truck className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">Viajes Completados</span>
                    </div>
                    <span className="text-xl font-bold">{user.completedTrips || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
            <p className="text-xs text-yellow-800">
              <strong>Nota:</strong> Mantener tus datos bancarios actualizados es crucial para asegurar que recibas tus reembolsos sin retrasos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
