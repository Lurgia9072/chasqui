import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signInWithEmailAndPassword, sendEmailVerification, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AlertCircle, Mail, Eye, EyeOff, CheckCircle2, X, Zap, ShieldCheck, Lock, ArrowLeft } from 'lucide-react';
import { User } from '../types';
import { ADMIN_EMAILS } from '../lib/constants';
import { motion, AnimatePresence } from 'motion/react';
import { ChasquiLogo } from '../components/ChasquiLogo';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login = () => {
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [unverifiedUser, setUnverifiedUser] = useState<any>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    setInfo(null);
    setUnverifiedUser(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      
      if (!userCredential.user.emailVerified) {
        setUnverifiedUser(userCredential.user);
        setError('Debes verificar tu correo electrónico antes de iniciar sesión.');
        await signOut(auth);
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        setUser(userData);
        
        if (userData.tipoUsuario === 'admin' || ADMIN_EMAILS.includes(userData.email.toLowerCase())) {
          navigate('/admin');
        } else if (userData.tipoUsuario === 'comerciante') {
          navigate('/merchant/dashboard');
        } else {
          navigate('/carrier/dashboard');
        }
      } else {
        setError('No se encontró el perfil del usuario.');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Demasiados intentos fallidos. Tu cuenta ha sido bloqueada temporalmente.');
      } else {
        setError('Error al iniciar sesión. Por favor intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedUser) return;
    setIsLoading(true);
    try {
      await sendEmailVerification(unverifiedUser);
      setInfo('Enlace de verificación enviado. Revisa tu correo.');
      setError(null);
    } catch (err: any) {
      setError('Error al enviar el enlace. Intenta de nuevo más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) return;
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
    } catch (err: any) {
      setError('Error al enviar el enlace de recuperación. Verifica el correo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Wall - Marketing (Only Desktop) */}
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
              Logística con <span className="text-blue-400">garantía</span> y control real.
            </h1>
            <p className="text-slate-400 text-lg font-medium">
              Únete a la plataforma que está transformando el transporte de carga en Perú con seguridad, transparencia y pagos protegidos.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4 text-white/80">
              <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold">Seguridad Certificada</p>
                <p className="text-xs text-slate-500">Conductores y vehículos verificados.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-white/80">
              <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Lock className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-bold">Pagos en Custodia</p>
                <p className="text-xs text-slate-500">Tu dinero está seguro hasta la entrega.</p>
              </div>
            </div>
          </div>
          
          <div className="pt-12">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
               <div className="flex -space-x-2">
                 {[1,2,3].map(i => <div key={i} className="h-8 w-8 rounded-full border-2 border-slate-900 bg-slate-700" />)}
               </div>
               <p className="text-xs font-bold text-slate-400">Más de 500 transportistas activos en Perú</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Wall - Form */}
      <div className="flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 bg-white">
        <div className="max-w-md w-full mx-auto space-y-10">
          <div className="lg:hidden flex justify-center mb-10">
             <Link to="/"><ChasquiLogo size="sm" /></Link>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900">Bienvenido de nuevo</h2>
            <p className="text-slate-500 font-medium">Ingresa tus credenciales para acceder a tu panel.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl bg-red-50 border border-red-100 p-4 space-y-2"
                >
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-bold">{error}</span>
                  </div>
                  {unverifiedUser && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      className="text-xs font-black text-red-700 hover:underline pl-6"
                    >
                      Reenviar enlace de verificación
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {info && (
              <div className="flex items-center gap-2 rounded-xl bg-blue-50 p-4 text-sm text-blue-600 border border-blue-100 font-bold">
                <Mail className="h-4 w-4" />
                <span>{info}</span>
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="Correo Electrónico"
                type="email"
                placeholder="nombre@ejemplo.com"
                {...register('email')}
                error={errors.email?.message}
                className="h-12 border-slate-200 focus:ring-blue-500"
              />
              <div className="space-y-1">
                <Input
                  label="Contraseña"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register('password')}
                  error={errors.password?.message}
                  className="h-12 border-slate-200 focus:ring-blue-500"
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  }
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 underline underline-offset-2"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-14 text-lg font-black shadow-lg shadow-blue-500/20" isLoading={isLoading}>
              Iniciar Sesión
            </Button>
          </form>

          <p className="text-center text-sm font-medium text-slate-500">
            ¿No tienes una cuenta?{' '}
            <Link to="/register" className="font-black text-blue-600 hover:text-blue-700 underline underline-offset-2">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
            >
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Recuperar Acceso</h3>
                <button onClick={() => setShowForgotModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                {resetSent ? (
                  <div className="text-center space-y-6 py-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-black text-slate-900">Enlace enviado</h4>
                      <p className="text-sm text-slate-500 font-medium">
                        Hemos enviado las instrucciones a <strong>{resetEmail}</strong>. Revisa tu bandeja de entrada.
                      </p>
                    </div>
                    <Button className="w-full h-12 font-bold" onClick={() => { setShowForgotModal(false); setResetSent(false); }}>
                      Regresar al Login
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                      No te preocupes. Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
                    </p>
                    <Input 
                      label="Correo Electrónico"
                      placeholder="tu@correo.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="h-12"
                    />
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 h-12 font-bold"
                        onClick={() => setShowForgotModal(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        className="flex-1 h-12 font-bold"
                        onClick={handleResetPassword}
                        isLoading={isLoading}
                        disabled={!resetEmail}
                      >
                        Enviar Enlace
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
