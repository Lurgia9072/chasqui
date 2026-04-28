import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Truck, AlertCircle, Briefcase, FileText, Mail, CheckCircle2, Upload, Landmark, Eye, EyeOff, Zap, ShieldCheck, Lock, User, Check } from 'lucide-react';
import { User as UserType, AccountType } from '../types';
import { cn } from '../lib/utils';
import { ADMIN_EMAILS } from '../lib/constants';
import { motion, AnimatePresence } from 'motion/react';
import { ChasquiLogo } from '../components/ChasquiLogo';

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
  tipoVehiculo: z.string().optional(),
  placa: z.string().optional(),
  capacidad: z.string().optional(),
  zonas: z.string().optional(),
  banco: z.string().optional(),
  tipoCuentaBancaria: z.string().optional(),
  numeroCuenta: z.string().optional(),
  cci: z.string().optional(),
  titularCuenta: z.string().optional(),
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
  const [showPassword, setShowPassword] = useState(false);
  
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
          } catch (signInErr: any) {
            setError('Este correo electrónico ya está registrado. Por favor intenta con otro o recupera tu contraseña.');
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
        indiceConfiabilidad: 100,
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
      
      if (!isAdminEmail) {
        await sendEmailVerification(user);
        setIsRegistered(true);
      } else {
        setUser(newUser);
        navigate('/');
      }
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
      window.scrollTo(0, 0);
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
        setError('Error al procesar la imagen.');
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
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const prevStep = () => {
    setStep(s => s - 1);
    window.scrollTo(0, 0);
  };

  if (isRegistered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[3rem] shadow-2xl p-12 max-w-md w-full text-center space-y-8 border border-slate-100"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 rotate-3">
            <Mail className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">¡Verifica tu cuenta!</h2>
            <p className="text-slate-500 font-medium">
              Hemos enviado un enlace de activación a tu correo electrónico. Por favor revisa tu bandeja de entrada.
            </p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-left flex gap-3">
             <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
             <p className="text-xs font-bold text-emerald-700 leading-relaxed">
               Una vez verificado, podrás publicar cargas o realizar ofertas de inmediato.
             </p>
          </div>
          <Button className="w-full h-14 text-lg font-bold" onClick={() => navigate('/login')}>
            Ir al Inicio de Sesión
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Wall - Marketing */}
      <div className="hidden lg:flex flex-col justify-center p-12 bg-slate-900 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px]"></div>
        <div className="relative z-10 space-y-12 max-w-lg mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-900 rotate-3">
              <Zap className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">chasqui</span>
          </Link>
          <div className="space-y-6">
            <h1 className="text-5xl font-black text-white leading-tight">
              Únete a la <span className="text-blue-400">red logística</span> más segura del Perú.
            </h1>
            <p className="text-slate-400 text-lg font-medium">
              Ya seas comerciante o transportista, Chasqui te brinda las herramientas para operar con total transparencia y seguridad.
            </p>
          </div>
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-white/80">
              <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Check className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="text-sm font-bold">Registro rápido y verificado</p>
            </div>
            <div className="flex items-center gap-4 text-white/80">
              <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Check className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-sm font-bold">Sin comisiones ocultas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Wall - Form */}
      <div className="flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 bg-white overflow-y-auto">
        <div className="max-w-2xl w-full mx-auto space-y-10">
          <div className="lg:hidden flex justify-center mb-6">
             <Link to="/"><ChasquiLogo size="sm" /></Link>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900">Crea tu cuenta</h2>
                <p className="text-slate-500 font-medium tracking-tight">Regístrate en pocos pasos.</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Paso {step} / {role === 'transportista' ? '4' : '3'}</span>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4].map(s => {
                    if (s === 4 && role === 'comerciante') return null;
                    return (
                      <div key={s} className={cn("h-1.5 w-6 rounded-full", step >= s ? "bg-blue-600" : "bg-slate-100")} />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-bold flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 1: Role Selection */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <RoleCard 
                  active={role === 'comerciante'} 
                  onClick={() => { setValue('tipoUsuario', 'comerciante'); setRole('comerciante'); nextStep(); }}
                  icon={<Briefcase className="h-10 w-10" />}
                  title="Soy Comerciante"
                  desc="Quiero enviar carga y recibir ofertas de transportistas."
                />
                <RoleCard 
                  active={role === 'transportista'} 
                  onClick={() => { setValue('tipoUsuario', 'transportista'); setRole('transportista'); nextStep(); }}
                  icon={<Truck className="h-10 w-10" />}
                  title="Soy Transportista"
                  desc="Tengo un vehículo y quiero ofertar por servicios de carga."
                />
              </motion.div>
            )}

            {/* Step 2: Information */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <Input label="Nombre o Razón Social" placeholder="Juan Pérez" {...register('nombre')} error={errors.nombre?.message} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Email" type="email" placeholder="nombre@ejemplo.com" {...register('email')} error={errors.email?.message} />
                  <Input label="Teléfono" placeholder="999 999 999" {...register('telefono')} error={errors.telefono?.message} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="DNI o RUC" placeholder="Documento" {...register('documento')} error={errors.documento?.message} />
                  <Input label="Contraseña" type={showPassword ? "text" : "password"} placeholder="••••••••" {...register('password')} error={errors.password?.message} 
                         suffix={<button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>} />
                </div>
                {role === 'comerciante' && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Tipo de Cuenta</label>
                    <select {...register('tipoCuenta')} className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500">
                      <option value="natural">Persona Natural</option>
                      <option value="ruc10">RUC 10</option>
                      <option value="ruc20">RUC 20</option>
                    </select>
                  </div>
                )}
                <div className="flex justify-between pt-6">
                  <Button variant="ghost" onClick={prevStep} className="font-bold">Retroceder</Button>
                  <Button onClick={nextStep} className="px-10 h-12 font-black">Continuar</Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Specifics / Upload */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                {role === 'transportista' ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Tipo de Vehículo" placeholder="Camión 5tn" {...register('tipoVehiculo')} error={errors.tipoVehiculo?.message} />
                      <Input label="Placa" placeholder="ABC-123" {...register('placa')} error={errors.placa?.message} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Capacidad" placeholder="5 Toneladas" {...register('capacidad')} error={errors.capacidad?.message} />
                      <Input label="Zonas de Operación" placeholder="Lima, Ica, Piura" {...register('zonas')} error={errors.zonas?.message} />
                    </div>
                    <div className="flex justify-between pt-6">
                      <Button variant="ghost" onClick={prevStep} className="font-bold">Retroceder</Button>
                      <Button onClick={nextStep} className="px-10 h-12 font-black">Siguiente Paso</Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-10">
                    <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center text-center space-y-6">
                       <h3 className="text-xl font-black">Verificación de Identidad</h3>
                       <p className="text-sm text-slate-500 font-medium">Sube una foto clara de tu DNI o RUC para mayor seguridad en la plataforma.</p>
                       <UploadBox id="dni-m" active={!!dniUrl} label="Foto del DNI" onChange={(e) => handleFileUpload(e, 'dni')} />
                    </div>
                    <div className="flex justify-between pt-6">
                      <Button variant="ghost" onClick={prevStep} className="font-bold">Atrás</Button>
                      <Button type="submit" isLoading={isLoading} disabled={!dniUrl && !ADMIN_EMAILS.includes(watch('email')?.toLowerCase())} className="px-12 h-14 font-black text-lg">Finalizar Registro</Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 4: Documents & Bank (Only Transportista) */}
            {step === 4 && role === 'transportista' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                <div className="space-y-6">
                  <h3 className="text-xl font-black flex items-center gap-2"><FileText className="h-5 w-5 text-blue-600" /> Documentación</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <UploadBox id="dni" size="small" active={!!dniUrl} label="DNI" onChange={(e) => handleFileUpload(e, 'dni')} />
                    <UploadBox id="lic" size="small" active={!!licenciaUrl} label="Licencia" onChange={(e) => handleFileUpload(e, 'licencia')} />
                    <UploadBox id="tar" size="small" active={!!tarjetaPropiedadUrl} label="Tarjeta P." onChange={(e) => handleFileUpload(e, 'tarjetaPropiedad')} />
                    <UploadBox id="soat" size="small" active={!!soatUrl} label="SOAT" onChange={(e) => handleFileUpload(e, 'soat')} />
                  </div>
                </div>
                <div className="space-y-6 pt-8 border-t border-slate-100">
                  <h3 className="text-xl font-black flex items-center gap-2"><Landmark className="h-5 w-5 text-blue-600" /> Datos de Pago</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700">Banco</label>
                       <select {...register('banco')} className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold">
                         <option value="">Selecciona...</option>
                         <option value="BCP">BCP</option>
                         <option value="Interbank">Interbank</option>
                         <option value="BBVA">BBVA</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700">Tipo de Cuenta</label>
                       <select {...register('tipoCuentaBancaria')} className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold">
                         <option value="ahorros">Ahorros</option>
                         <option value="corriente">Corriente</option>
                       </select>
                    </div>
                  </div>
                  <Input label="Número de Cuenta" placeholder="Ej: 191-..." {...register('numeroCuenta')} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="CCI (Opcional)" placeholder="002-..." {...register('cci')} />
                    <Input label="Titular" placeholder="Nombre completo" {...register('titularCuenta')} />
                  </div>
                </div>
                <div className="flex justify-between pt-8">
                  <Button variant="ghost" onClick={prevStep} className="font-bold">Atrás</Button>
                  <Button type="submit" isLoading={isLoading} className="h-14 px-12 font-black text-lg">Finalizar Registro</Button>
                </div>
              </motion.div>
            )}
          </form>

          <p className="text-center text-sm font-medium text-slate-500 py-6">
            ¿Ya tienes una cuenta? <Link to="/login" className="font-black text-blue-600 hover:text-blue-700 underline">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const RoleCard = ({ active, onClick, icon, title, desc }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string }) => (
  <button type="button" onClick={onClick} className={cn("flex flex-col items-center justify-center p-8 rounded-[2rem] border-2 transition-all text-center space-y-4", active ? "border-blue-600 bg-blue-50 shadow-xl shadow-blue-500/10 scale-[1.02]" : "border-slate-100 hover:border-slate-200 bg-slate-50/50")}>
    <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg", active ? "bg-blue-600 text-white" : "bg-white text-slate-400")}>{icon}</div>
    <div className="space-y-1">
      <h3 className="font-black text-lg text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 font-medium leading-relaxed leading-snug">{desc}</p>
    </div>
  </button>
);

const UploadBox = ({ id, label, active, size = "large", onChange }: { id: string; label: string; active: boolean; size?: "small" | "large"; onChange: (e: any) => void }) => (
  <div className="w-full flex flex-col items-center gap-2">
    <input type="file" accept="image/*" onChange={onChange} className="hidden" id={id} />
    <label htmlFor={id} className={cn("flex flex-col items-center justify-center border-2 border-dashed rounded-2xl cursor-pointer transition-all w-full", size === "small" ? "h-24" : "h-32 shadow-sm bg-white", active ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-blue-400")}>
      {active ? <CheckCircle2 className="h-8 w-8 text-emerald-500" /> : <Upload className="h-7 w-7 text-slate-300" />}
      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-2">{label}</span>
    </label>
  </div>
);
