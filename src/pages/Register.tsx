import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Truck, AlertCircle, User, Briefcase, FileText, Mail, CheckCircle2, Upload, CreditCard, Landmark } from 'lucide-react';
import { User as UserType, UserRole, AccountType } from '../types';
import { cn } from '../lib/utils';
import { ADMIN_EMAILS } from '../lib/constants';

const registerSchema = z.object({
  nombre: z.string().min(3, 'Nombre demasiado corto'),
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial'),
  documento: z.string().min(8, 'Documento inválido'),
  telefono: z.string().min(9, 'Teléfono inválido'),
  tipoUsuario: z.enum(['comerciante', 'transportista']),
  tipoCuenta: z.enum(['natural', 'ruc10', 'ruc20']).optional(),
  // Carrier specific
  tipoVehiculo: z.string().optional(),
  placa: z.string().optional(),
  capacidad: z.string().optional(),
  zonas: z.string().optional(),
  // Bank details
  banco: z.string().optional(),
  tipoCuentaBancaria: z.string().optional(),
  numeroCuenta: z.string().optional(),
  cci: z.string().optional(),
  titularCuenta: z.string().optional(),
  // Documents (Data URLs)
  dniDoc: z.string().optional(),
  licenciaDoc: z.string().optional(),
  tarjetaPropiedadDoc: z.string().optional(),
  soatDoc: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const Register = () => {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') as 'comerciante' | 'transportista') || 'comerciante';
  
  const [step, setStep] = useState(1);
  const [isRegistered, setIsRegistered] = useState(false);
  const [role, setRole] = useState<'comerciante' | 'transportista'>(initialRole);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dniUrl, setDniUrl] = useState<string | null>(null);
  const [licenciaUrl, setLicenciaUrl] = useState<string | null>(null);
  const [tarjetaPropiedadUrl, setTarjetaPropiedadUrl] = useState<string | null>(null);
  const [soatUrl, setSoatUrl] = useState<string | null>(null);
  
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      tipoUsuario: initialRole,
      tipoCuenta: 'natural',
    },
  });

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    const isAdminEmail = ADMIN_EMAILS.includes(data.email.toLowerCase());

    if (role === 'transportista') {
      if (!dniUrl || !licenciaUrl || !tarjetaPropiedadUrl) {
        setError('Debes subir todos los documentos requeridos para continuar.');
        return;
      }
      if (!data.banco || !data.numeroCuenta || !data.titularCuenta) {
        setError('Debes completar la información bancaria para continuar.');
        return;
      }
    } else if (role === 'comerciante' && !isAdminEmail) {
      if (!dniUrl) {
        setError('Debes subir una foto de tu DNI para continuar.');
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    try {
      let user;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        user = userCredential.user;
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-in-use') {
          try {
            const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
            user = userCredential.user;
            
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const isAdminEmail = ADMIN_EMAILS.includes(data.email.toLowerCase());
            
            if (userDoc.exists() && !isAdminEmail) {
              setError('Este correo electrónico ya está registrado. Por favor, inicia sesión.');
              setIsLoading(false);
              return;
            }
            // Si es admin, permitimos continuar para que el setDoc de abajo actualice el rol
          } catch (signInErr: any) {
            setError('Este correo electrónico ya está registrado en el sistema de autenticación, pero no pudimos validar tu perfil. Por favor, contacta a soporte o usa otro correo.');
            setIsLoading(false);
            return;
          }
        } else {
          throw authErr;
        }
      }

      if (!user) throw new Error('No se pudo obtener la información del usuario.');

      const newUser: UserType = {
        uid: user.uid,
        nombre: data.nombre,
        tipoUsuario: isAdminEmail ? 'admin' : (data.tipoUsuario as 'comerciante' | 'transportista'),
        tipoCuenta: data.tipoCuenta as AccountType,
        documento: data.documento,
        telefono: data.telefono,
        email: data.email,
        verificado: isAdminEmail ? 'verificado' : 'pendiente', 
        rating: 0, 
        totalRatings: 0,
        sumRatings: 0,
        completedTrips: 0,
        indiceConfiabilidad: 100, // Starts with 100% reliability
        createdAt: Date.now(),
        documentosUrls: {
          dni: dniUrl || '',
        }
      };

      if (data.tipoUsuario === 'transportista') {
        newUser.vehiculo = {
          tipo: data.tipoVehiculo || '',
          placa: data.placa || '',
          capacidad: data.capacidad || '',
        };
        newUser.zonasOperacion = data.zonas?.split(',').map(s => s.trim()) || [];
        
        newUser.documentosUrls = {
          ...newUser.documentosUrls,
          licencia: licenciaUrl || '',
          tarjetaPropiedad: tarjetaPropiedadUrl || '',
          soat: soatUrl || '',
        };

        newUser.datosBancarios = {
          banco: data.banco || '',
          tipoCuenta: data.tipoCuentaBancaria || 'ahorros',
          numeroCuenta: data.numeroCuenta || '',
          cci: data.cci || '',
          titular: data.titularCuenta || '',
        };
      }

      await setDoc(doc(db, 'users', user.uid), newUser);
      
      // Set user in store and navigate to home/profile
      setUser(newUser);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocurrió un error al registrar la cuenta.');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof RegisterFormValues)[] = [];
    
    if (step === 1) {
      fieldsToValidate = ['tipoUsuario'];
    } else if (step === 2) {
      fieldsToValidate = ['nombre', 'email', 'telefono', 'documento', 'password'];
      if (role === 'comerciante') {
        fieldsToValidate.push('tipoCuenta');
      }
    } else if (step === 3) {
      if (role === 'transportista') {
        fieldsToValidate = ['tipoVehiculo', 'placa', 'capacidad', 'zonas'];
      }
    }
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(s => s + 1);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'dni' | 'licencia' | 'tarjetaPropiedad' | 'soat') => {
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
        setError('Error al procesar la imagen. Intenta con un archivo más pequeño.');
      }
    }
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
          
          // Compress to JPEG with 0.7 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const prevStep = () => setStep(s => s - 1);

  if (isRegistered) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 mb-4">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">¡Verifica tu correo!</CardTitle>
            <CardDescription>
              Hemos enviado un enlace de verificación a tu correo electrónico.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Por favor, revisa tu bandeja de entrada (y la carpeta de spam) y haz clic en el enlace para activar tu cuenta.
            </p>
            <div className="rounded-lg bg-blue-50 p-4 border border-blue-100 text-left">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Una vez verificado, podrás iniciar sesión y comenzar a usar la plataforma.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button className="w-full" onClick={() => navigate('/login')}>
              Ir al Inicio de Sesión
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-6">
            
          </div>
          <CardTitle className="text-3xl font-bold">Crea tu cuenta</CardTitle>
          <CardDescription>
            Únete a la red de transporte de carga más grande del Perú
          </CardDescription>
          
          {/* Progress Bar */}
          <div className="mt-8 flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((s) => {
              // Only show 4 steps for carriers
              if (s === 4 && role === 'comerciante') return null;
              return (
                <div
                  key={s}
                  className={cn(
                    "h-2 w-12 rounded-full transition-colors",
                    step >= s ? "bg-blue-600" : "bg-gray-200"
                  )}
                />
              );
            })}
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="mt-6 space-y-6">
            {error && (
              <div className="flex items-center space-x-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Role Selection */}
            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => { 
                    setValue('tipoUsuario', 'comerciante');
                    setRole('comerciante'); 
                    nextStep(); 
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all text-center",
                    role === 'comerciante' ? "border-blue-600 bg-blue-50" : "border-gray-100 hover:border-blue-200"
                  )}
                >
                  <Briefcase className="h-12 w-12 text-blue-600 mb-4" />
                  <h3 className="font-bold text-lg">Soy Comerciante</h3>
                  <p className="text-sm text-gray-500 mt-2">Quiero enviar carga y recibir ofertas de transportistas.</p>
                </button>
                <button
                  type="button"
                  onClick={() => { 
                    setValue('tipoUsuario', 'transportista');
                    setRole('transportista'); 
                    nextStep(); 
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all text-center",
                    role === 'transportista' ? "border-blue-600 bg-blue-50" : "border-gray-100 hover:border-blue-200"
                  )}
                >
                  <Truck className="h-12 w-12 text-blue-600 mb-4" />
                  <h3 className="font-bold text-lg">Soy Transportista</h3>
                  <p className="text-sm text-gray-500 mt-2">Tengo un vehículo y quiero ofertar por servicios de carga.</p>
                </button>
                <input type="hidden" {...register('tipoUsuario')} />
              </div>
            )}

            {/* Step 2: Basic Info */}
            {step === 2 && (
              <div className="space-y-4">
                <Input
                  label={role === 'comerciante' ? "Nombre o Razón Social" : "Nombre Completo"}
                  placeholder="Ej: Juan Pérez o Logística SAC"
                  {...register('nombre')}
                  error={errors.nombre?.message}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Email"
                    type="email"
                    autoComplete="email"
                    placeholder="nombre@ejemplo.com"
                    {...register('email')}
                    error={errors.email?.message}
                  />
                  <Input
                    label="Teléfono"
                    placeholder="999 999 999"
                    {...register('telefono')}
                    error={errors.telefono?.message}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="DNI o RUC"
                    placeholder="Documento de identidad"
                    {...register('documento')}
                    error={errors.documento?.message}
                  />
                  <Input
                    label="Contraseña"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...register('password')}
                    error={errors.password?.message}
                  />
                </div>
                {role === 'comerciante' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Tipo de Cuenta</label>
                    <select
                      {...register('tipoCuenta')}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="natural">Persona Natural</option>
                      <option value="ruc10">RUC 10 (Persona con Negocio)</option>
                      <option value="ruc20">RUC 20 (Empresa)</option>
                    </select>
                  </div>
                )}
                <div className="flex justify-between pt-4">
                  <Button variant="ghost" onClick={prevStep}>Atrás</Button>
                  <Button onClick={nextStep}>Siguiente</Button>
                </div>
              </div>
            )}

            {/* Step 3: Role Specific / Final */}
            {step === 3 && (
              <div className="space-y-4">
                {role === 'transportista' ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Tipo de Vehículo"
                        placeholder="Ej: Camión 5tn, Furgón"
                        {...register('tipoVehiculo')}
                        error={errors.tipoVehiculo?.message}
                      />
                      <Input
                        label="Placa"
                        placeholder="ABC-123"
                        {...register('placa')}
                        error={errors.placa?.message}
                      />
                    </div>
                    <Input
                      label="Capacidad de Carga"
                      placeholder="Ej: 5 Toneladas"
                      {...register('capacidad')}
                      error={errors.capacidad?.message}
                    />
                    <Input
                      label="Zonas de Operación (separadas por coma)"
                      placeholder="Ej: Lima, Arequipa, Trujillo"
                      {...register('zonas')}
                      error={errors.zonas?.message}
                    />
                    <div className="flex justify-between pt-4">
                      <Button variant="ghost" onClick={prevStep}>Atrás</Button>
                      <Button onClick={nextStep}>Siguiente: Documentos y Pago</Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-bold">
                        {ADMIN_EMAILS.includes(watch('email')?.toLowerCase()) ? 'Registro de Administrador' : 'Verificación de Identidad'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {ADMIN_EMAILS.includes(watch('email')?.toLowerCase()) 
                          ? 'Estás registrando una cuenta con privilegios de administrador.' 
                          : 'Sube una foto de tu DNI para validar tu cuenta de comerciante.'}
                      </p>
                    </div>
                    
                    {!ADMIN_EMAILS.includes(watch('email')?.toLowerCase()) && (
                      <div className="flex justify-center">
                        <div className="w-full max-w-xs space-y-2">
                          <label className="text-xs font-bold text-gray-700">DNI / RUC</label>
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'dni')}
                              className="hidden"
                              id="dni-upload-merchant"
                            />
                            <label
                              htmlFor="dni-upload-merchant"
                              className={cn(
                                "flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-2xl cursor-pointer transition-all",
                                dniUrl ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-blue-400"
                              )}
                            >
                              {dniUrl ? (
                                <CheckCircle2 className="h-12 w-12 text-green-500" />
                              ) : (
                                <Upload className="h-12 w-12 text-gray-400" />
                              )}
                              <span className="text-sm mt-3 font-medium">Subir foto de DNI</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between pt-8">
                      <Button variant="ghost" onClick={prevStep}>Atrás</Button>
                      <Button 
                        type="submit" 
                        isLoading={isLoading} 
                        disabled={!dniUrl && !ADMIN_EMAILS.includes(watch('email')?.toLowerCase())}
                      >
                        Finalizar Registro
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Documents & Bank Info (Only for Carriers) */}
            {step === 4 && role === 'transportista' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-lg flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    Documentos de Identidad y Vehículo
                  </h3>
                  <p className="text-xs text-gray-500">Sube fotos claras de tus documentos para validar tu cuenta.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700">DNI / RUC</label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'dni')}
                          className="hidden"
                          id="dni-upload"
                        />
                        <label
                          htmlFor="dni-upload"
                          className={cn(
                            "flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                            dniUrl ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-blue-400"
                          )}
                        >
                          {dniUrl ? (
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                          ) : (
                            <Upload className="h-8 w-8 text-gray-400" />
                          )}
                          <span className="text-[10px] mt-2 font-medium">DNI</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700">Licencia</label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'licencia')}
                          className="hidden"
                          id="licencia-upload"
                        />
                        <label
                          htmlFor="licencia-upload"
                          className={cn(
                            "flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                            licenciaUrl ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-blue-400"
                          )}
                        >
                          {licenciaUrl ? (
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                          ) : (
                            <Upload className="h-8 w-8 text-gray-400" />
                          )}
                          <span className="text-[10px] mt-2 font-medium">Licencia</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700">Tarjeta Prop.</label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'tarjetaPropiedad')}
                          className="hidden"
                          id="tarjeta-upload"
                        />
                        <label
                          htmlFor="tarjeta-upload"
                          className={cn(
                            "flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                            tarjetaPropiedadUrl ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-blue-400"
                          )}
                        >
                          {tarjetaPropiedadUrl ? (
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                          ) : (
                            <Upload className="h-8 w-8 text-gray-400" />
                          )}
                          <span className="text-[10px] mt-2 font-medium">Tarjeta</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700">SOAT (Opcional)</label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'soat')}
                          className="hidden"
                          id="soat-upload"
                        />
                        <label
                          htmlFor="soat-upload"
                          className={cn(
                            "flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                            soatUrl ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-blue-400"
                          )}
                        >
                          {soatUrl ? (
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                          ) : (
                            <Upload className="h-8 w-8 text-gray-400" />
                          )}
                          <span className="text-[10px] mt-2 font-medium">SOAT</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="font-bold text-lg flex items-center">
                    <Landmark className="h-5 w-5 mr-2 text-blue-600" />
                    Información Bancaria
                  </h3>
                  <p className="text-xs text-gray-500">Necesaria para recibir tus pagos de forma segura.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Banco</label>
                      <select
                        {...register('banco')}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecciona un banco</option>
                        <option value="BCP">BCP</option>
                        <option value="Interbank">Interbank</option>
                        <option value="BBVA">BBVA</option>
                        <option value="Scotiabank">Scotiabank</option>
                        <option value="Banco de la Nación">Banco de la Nación</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Tipo de Cuenta</label>
                      <select
                        {...register('tipoCuentaBancaria')}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="ahorros">Ahorros</option>
                        <option value="corriente">Corriente</option>
                      </select>
                    </div>
                  </div>

                  <Input
                    label="Número de Cuenta"
                    placeholder="Ej: 191-XXXXXXXX-X-XX"
                    {...register('numeroCuenta')}
                    error={errors.numeroCuenta?.message}
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="CCI (Opcional)"
                      placeholder="Ej: 002-XXXXXXXXXXXXXXXXXXXX"
                      {...register('cci')}
                      error={errors.cci?.message}
                    />
                    <Input
                      label="Titular de la Cuenta"
                      placeholder="Nombre completo del titular"
                      {...register('titularCuenta')}
                      error={errors.titularCuenta?.message}
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="ghost" onClick={prevStep}>Atrás</Button>
                  <Button type="submit" isLoading={isLoading}>Finalizar Registro</Button>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-center border-t border-gray-100 bg-gray-50/50 py-4">
            <p className="text-sm text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:underline">
                Inicia sesión
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
