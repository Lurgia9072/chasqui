import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Truck, AlertCircle, User, Briefcase, FileText, MapPin } from 'lucide-react';
import { User as UserType, UserRole, AccountType } from '../types';
import { cn } from '../lib/utils';

const registerSchema = z.object({
  nombre: z.string().min(3, 'Nombre demasiado corto'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  documento: z.string().min(8, 'Documento inválido'),
  telefono: z.string().min(9, 'Teléfono inválido'),
  tipoUsuario: z.enum(['comerciante', 'transportista']),
  tipoCuenta: z.enum(['natural', 'ruc10', 'ruc20']).optional(),
  // Carrier specific
  tipoVehiculo: z.string().optional(),
  placa: z.string().optional(),
  capacidad: z.string().optional(),
  zonas: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const Register = () => {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') as 'comerciante' | 'transportista') || 'comerciante';
  
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'comerciante' | 'transportista'>(initialRole);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      tipoUsuario: initialRole,
      tipoCuenta: 'natural',
    },
  });

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      const newUser: UserType = {
        uid: userCredential.user.uid,
        nombre: data.nombre,
        tipoUsuario: data.tipoUsuario as 'comerciante' | 'transportista',
        tipoCuenta: data.tipoCuenta as AccountType,
        documento: data.documento,
        telefono: data.telefono,
        email: data.email,
        verificado: data.tipoUsuario === 'comerciante' ? 'verificado' : 'pendiente',
        rating: 5.0,
        createdAt: Date.now(),
      };

      if (data.tipoUsuario === 'transportista') {
        newUser.vehiculo = {
          tipo: data.tipoVehiculo || '',
          placa: data.placa || '',
          capacidad: data.capacidad || '',
        };
        newUser.zonasOperacion = data.zonas?.split(',').map(s => s.trim()) || [];
      }

      await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
      setUser(newUser);
      
      if (newUser.tipoUsuario === 'comerciante') {
        navigate('/merchant/dashboard');
      } else {
        navigate('/carrier/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      setError('Error al registrar usuario. El email podría estar en uso.');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">Crea tu cuenta</CardTitle>
          <CardDescription>
            Únete a la red de transporte de carga más grande del Perú
          </CardDescription>
          
          {/* Progress Bar */}
          <div className="mt-8 flex items-center justify-center space-x-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-2 w-12 rounded-full transition-colors",
                  step >= s ? "bg-blue-600" : "bg-gray-200"
                )}
              />
            ))}
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
                  onClick={() => { setRole('comerciante'); nextStep(); }}
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
                  onClick={() => { setRole('transportista'); nextStep(); }}
                  className={cn(
                    "flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all text-center",
                    role === 'transportista' ? "border-blue-600 bg-blue-50" : "border-gray-100 hover:border-blue-200"
                  )}
                >
                  <Truck className="h-12 w-12 text-blue-600 mb-4" />
                  <h3 className="font-bold text-lg">Soy Transportista</h3>
                  <p className="text-sm text-gray-500 mt-2">Tengo un vehículo y quiero ofertar por servicios de carga.</p>
                </button>
                <input type="hidden" {...register('tipoUsuario')} value={role} />
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
                      />
                      <Input
                        label="Placa"
                        placeholder="ABC-123"
                        {...register('placa')}
                      />
                    </div>
                    <Input
                      label="Capacidad de Carga"
                      placeholder="Ej: 5 Toneladas"
                      {...register('capacidad')}
                    />
                    <Input
                      label="Zonas de Operación (separadas por coma)"
                      placeholder="Ej: Lima, Arequipa, Trujillo"
                      {...register('zonas')}
                    />
                    <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
                      <div className="flex items-start space-x-3">
                        <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-bold text-blue-900">Validación de Documentos</h4>
                          <p className="text-xs text-blue-700 mt-1">
                            Para empezar a trabajar, deberás subir fotos de tu DNI, Licencia y Tarjeta de Propiedad en tu perfil después de registrarte.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="flex justify-center mb-4">
                      <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold">¡Todo listo!</h3>
                    <p className="text-gray-600 mt-2">Haz clic en finalizar para crear tu cuenta de comerciante.</p>
                  </div>
                )}
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
