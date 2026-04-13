import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { db, handleFirestoreError } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { OperationType, Review, User as UserType } from '../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User, Phone, Mail, CreditCard, ShieldCheck, Camera, Check, AlertCircle, Building2, Landmark, Star, Truck, MessageSquare, FileText, CheckCircle, XCircle, Upload, Clock, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, setUser: setCurrentUser } = useAuthStore();
  const [profileUser, setProfileUser] = useState<UserType | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = !id || id === currentUser?.uid;

  // Form states
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Bank states
  const [banco, setBanco] = useState('');
  const [tipoCuenta, setTipoCuenta] = useState('');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [cci, setCci] = useState('');
  const [titular, setTitular] = useState('');

  // Verification states
  const [dniUrl, setDniUrl] = useState('');
  const [licenciaUrl, setLicenciaUrl] = useState('');
  const [tarjetaPropiedadUrl, setTarjetaPropiedadUrl] = useState('');
  const [soatUrl, setSoatUrl] = useState('');

  // Fetch Profile User
  useEffect(() => {
    const fetchProfile = async () => {
      if (isOwnProfile) {
        setProfileUser(currentUser);
        setNombre(currentUser?.nombre || '');
        setTelefono(currentUser?.telefono || '');
        setPhotoUrl(currentUser?.photoUrl || '');
        setBanco(currentUser?.datosBancarios?.banco || '');
        setTipoCuenta(currentUser?.datosBancarios?.tipoCuenta || '');
        setNumeroCuenta(currentUser?.datosBancarios?.numeroCuenta || '');
        setCci(currentUser?.datosBancarios?.cci || '');
        setTitular(currentUser?.datosBancarios?.titular || '');
        setDniUrl(currentUser?.documentosUrls?.dni || '');
        setLicenciaUrl(currentUser?.documentosUrls?.licencia || '');
        setTarjetaPropiedadUrl(currentUser?.documentosUrls?.tarjetaPropiedad || '');
        setSoatUrl(currentUser?.documentosUrls?.soat || '');
        setLoadingProfile(false);
      } else {
        setLoadingProfile(true);
        try {
          const userSnap = await getDoc(doc(db, 'users', id));
          if (userSnap.exists()) {
            setProfileUser({ uid: userSnap.id, ...userSnap.data() } as UserType);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${id}`);
        } finally {
          setLoadingProfile(false);
        }
      }
    };

    fetchProfile();
  }, [id, currentUser, isOwnProfile]);

  // Fetch Reviews
  useEffect(() => {
    const targetUid = id || currentUser?.uid;
    if (!targetUid) return;

    const q = query(
      collection(db, 'reviews'),
      where('targetUserId', '==', targetUid),
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
  }, [id, currentUser?.uid]);

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

  const handleDocumentUpload = (type: 'dni' | 'licencia' | 'tarjetaPropiedad' | 'soat') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          const compressedBase64 = await compressImage(file);
          if (type === 'dni') setDniUrl(compressedBase64);
          if (type === 'licencia') setLicenciaUrl(compressedBase64);
          if (type === 'tarjetaPropiedad') setTarjetaPropiedadUrl(compressedBase64);
          if (type === 'soat') setSoatUrl(compressedBase64);
        } catch (err) {
          console.error('Error compressing image:', err);
        }
      }
    };
    input.click();
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setIsSaving(true);

    try {
      const userRef = doc(db, 'users', currentUser.uid);
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
        },
        documentosUrls: {
          dni: dniUrl,
          licencia: licenciaUrl,
          tarjetaPropiedad: tarjetaPropiedadUrl,
          soat: soatUrl
        },
        // If they uploaded documents, set status to pending if it was rejected or empty
        verificado: (dniUrl && (currentUser.tipoUsuario === 'comerciante' || (licenciaUrl && tarjetaPropiedadUrl))) 
          ? (currentUser.verificado === 'verificado' ? 'verificado' : 'pendiente')
          : currentUser.verificado
      };

      await updateDoc(userRef, updatedData);
      
      // Update local state
      setCurrentUser({
        ...currentUser,
        ...updatedData
      } as UserType);

      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
        <h2 className="text-2xl font-bold text-gray-900">Usuario no encontrado</h2>
        <p className="text-gray-500">El perfil que buscas no existe o no está disponible.</p>
        <Link to="/">
          <Button variant="outline">Volver al inicio</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => navigate(-1)} 
        className="hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver
      </Button>

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
              {isEditing ? (
                photoUrl ? (
                  <img src={photoUrl} alt="Preview" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="h-12 w-12 text-gray-400" />
                )
              ) : profileUser.photoUrl ? (
                <img src={profileUser.photoUrl} alt={profileUser.nombre} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
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
            <h1 className="text-3xl font-bold text-gray-900">{profileUser.nombre}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full uppercase",
                profileUser.verificado === 'verificado' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
              )}>
                {profileUser.verificado}
              </span>
              <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">• {profileUser.tipoUsuario}</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          {isOwnProfile && (
            isEditing ? (
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
            )
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
              <CardDescription>
                {isOwnProfile ? 'Datos básicos de tu cuenta y contacto.' : `Información pública de ${profileUser.nombre}.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Nombre Completo</label>
                  {isEditing ? (
                    <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
                  ) : (
                    <p className="font-medium text-gray-900">{profileUser.nombre}</p>
                  )}
                </div>
                {isOwnProfile && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Correo Electrónico</label>
                    <p className="font-medium text-gray-900 flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {profileUser.email}
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Teléfono</label>
                  {isEditing ? (
                    <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                  ) : (
                    <p className="font-medium text-gray-900 flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {profileUser.telefono}
                    </p>
                  )}
                </div>
                {isOwnProfile && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Documento (DNI/RUC)</label>
                    <p className="font-medium text-gray-900">{profileUser.documento}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bank Info (Only for own profile) */}
          {isOwnProfile && (
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
                        {profileUser.datosBancarios?.banco || 'No configurado'}
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
                      <p className="font-medium text-gray-900">{profileUser.datosBancarios?.tipoCuenta || 'No configurado'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Número de Cuenta</label>
                    {isEditing ? (
                      <Input value={numeroCuenta} onChange={(e) => setNumeroCuenta(e.target.value)} />
                    ) : (
                      <p className="font-medium font-mono text-gray-900">{profileUser.datosBancarios?.numeroCuenta || 'No configurado'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">CCI (Interbancario)</label>
                    {isEditing ? (
                      <Input value={cci} onChange={(e) => setCci(e.target.value)} />
                    ) : (
                      <p className="font-medium font-mono text-gray-900">{profileUser.datosBancarios?.cci || 'No configurado'}</p>
                    )}
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Titular de la Cuenta</label>
                    {isEditing ? (
                      <Input value={titular} onChange={(e) => setTitular(e.target.value)} />
                    ) : (
                      <p className="font-medium text-gray-900 flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        {profileUser.datosBancarios?.titular || 'No configurado'}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Verification Center (Only for own profile) */}
          {isOwnProfile && (
            <Card className="border-blue-100 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <ShieldCheck className="h-5 w-5 mr-2 text-blue-600" />
                  Centro de Verificación
                </CardTitle>
                <CardDescription>
                  Completa tu perfil para obtener el sello de confianza y acceder a mejores beneficios.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* DNI / RUC */}
                  <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <span className="font-bold text-sm">DNI / RUC</span>
                      </div>
                      {dniUrl ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-orange-400" />
                      )}
                    </div>
                    {isEditing ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-xs"
                        onClick={() => handleDocumentUpload('dni')}
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        {dniUrl ? 'Cambiar Documento' : 'Subir Documento'}
                      </Button>
                    ) : (
                      <p className="text-xs text-gray-500">
                        {dniUrl ? 'Documento cargado correctamente.' : 'Pendiente de carga.'}
                      </p>
                    )}
                  </div>

                  {/* License (Only for Carriers) */}
                  {currentUser?.tipoUsuario === 'transportista' && (
                    <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <Truck className="h-5 w-5 text-gray-400" />
                          <span className="font-bold text-sm">Licencia de Conducir</span>
                        </div>
                        {licenciaUrl ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-orange-400" />
                        )}
                      </div>
                      {isEditing ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => handleDocumentUpload('licencia')}
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          {licenciaUrl ? 'Cambiar Licencia' : 'Subir Licencia'}
                        </Button>
                      ) : (
                        <p className="text-xs text-gray-500">
                          {licenciaUrl ? 'Licencia cargada correctamente.' : 'Pendiente de carga.'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Property Card (Only for Carriers) */}
                  {currentUser?.tipoUsuario === 'transportista' && (
                    <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-5 w-5 text-gray-400" />
                          <span className="font-bold text-sm">Tarjeta de Propiedad</span>
                        </div>
                        {tarjetaPropiedadUrl ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-orange-400" />
                        )}
                      </div>
                      {isEditing ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => handleDocumentUpload('tarjetaPropiedad')}
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          {tarjetaPropiedadUrl ? 'Cambiar Tarjeta' : 'Subir Tarjeta'}
                        </Button>
                      ) : (
                        <p className="text-xs text-gray-500">
                          {tarjetaPropiedadUrl ? 'Tarjeta cargada correctamente.' : 'Pendiente de carga.'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* SOAT (Only for Carriers) */}
                  {currentUser?.tipoUsuario === 'transportista' && (
                    <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <ShieldCheck className="h-5 w-5 text-gray-400" />
                          <span className="font-bold text-sm">SOAT (Opcional)</span>
                        </div>
                        {soatUrl ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-gray-300" />
                        )}
                      </div>
                      {isEditing ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => handleDocumentUpload('soat')}
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          {soatUrl ? 'Cambiar SOAT' : 'Subir SOAT'}
                        </Button>
                      ) : (
                        <p className="text-xs text-gray-500">
                          {soatUrl ? 'SOAT cargado correctamente.' : 'No cargado.'}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-lg bg-white/50 border border-blue-100">
                  <AlertCircle className={cn(
                    "h-5 w-5 mt-0.5",
                    profileUser.verificado === 'verificado' ? "text-green-600" : 
                    profileUser.verificado === 'rechazado' ? "text-red-600" : "text-blue-600"
                  )} />
                  <div className="text-xs text-blue-800 space-y-1">
                    <p className="font-bold">Estado de Verificación: {profileUser.verificado.toUpperCase()}</p>
                    <p className="text-gray-600">
                      {profileUser.verificado === 'verificado' 
                        ? '¡Felicidades! Tu cuenta está verificada y eres un usuario de confianza.' 
                        : profileUser.verificado === 'pendiente' 
                          ? (dniUrl ? 'Tus documentos están siendo revisados por nuestro equipo. Esto puede tardar hasta 24 horas.' : 'Sube tus documentos para iniciar el proceso de verificación.')
                          : 'Tu verificación ha sido rechazada. Por favor, revisa tus documentos y vuelve a subirlos.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                Calificaciones y Reseñas
              </CardTitle>
              <CardDescription>
                {isOwnProfile ? 'Lo que otros usuarios dicen sobre ti.' : `Lo que otros usuarios dicen sobre ${profileUser.nombre}.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingReviews ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500 italic">
                  Aún no ha recibido calificaciones.
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-3">
                      <div className="flex justify-between items-start">
                        <Link to={`/profile/${review.reviewerId}`} className="flex items-center space-x-3 group">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border border-blue-200">
                            {review.reviewerPhotoUrl ? (
                              <img src={review.reviewerPhotoUrl} alt={review.reviewerNombre} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {review.reviewerNombre}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {format(review.createdAt, "d 'de' MMMM, yyyy", { locale: es })}
                            </p>
                          </div>
                        </Link>
                        <div className="flex items-center text-yellow-500 bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={cn("h-3 w-3", i < review.rating ? "fill-current" : "text-gray-300")} 
                            />
                          ))}
                          <span className="ml-1.5 text-xs font-bold text-gray-700">{review.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-2 top-0 bottom-0 w-1 bg-blue-200 rounded-full opacity-50" />
                        <p className="text-sm text-gray-700 italic pl-3 leading-relaxed">
                          "{review.comentario}"
                        </p>
                      </div>
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
                  <p className="font-bold uppercase text-sm">{profileUser.verificado}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="font-bold text-lg">Nivel de Confianza</h3>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center text-yellow-400">
                    <Star className={cn("h-5 w-5", profileUser.totalRatings > 0 ? "fill-current" : "text-blue-300")} />
                    <span className="ml-1 text-2xl font-black">
                      {profileUser.totalRatings > 0 ? profileUser.rating.toFixed(1) : "---"}
                    </span>
                  </div>
                  <span className="text-blue-200 text-sm">/ 5.0</span>
                </div>
                <p className="text-xs text-blue-100">
                  {profileUser.totalRatings > 0 
                    ? `Basado en ${profileUser.totalRatings} calificaciones` 
                    : "Sin calificaciones aún"}
                </p>
              </div>

              {profileUser.tipoUsuario === 'transportista' && (
                <div className="pt-6 border-t border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-white/10 rounded-lg flex items-center justify-center">
                        <Truck className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">Viajes Completados</span>
                    </div>
                    <span className="text-xl font-bold">{profileUser.completedTrips || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {isOwnProfile && (
            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
              <p className="text-xs text-yellow-800">
                <strong>Nota:</strong> Mantener tus datos bancarios actualizados es crucial para asegurar que recibas tus reembolsos sin retrasos.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
