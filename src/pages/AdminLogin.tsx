import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  ShieldAlert, Mail, Lock, Eye, EyeOff, CheckCircle2, 
  User, Phone, FileText, ArrowLeft, KeyRound, Terminal, Radio 
} from 'lucide-react';
import { ChasquiLogo } from '../components/ChasquiLogo';
import { ADMIN_EMAILS } from '../lib/constants';
import { motion, AnimatePresence } from 'motion/react';
import { cleanObject } from '../lib/utils';
import { User as UserType } from '../types';

// Admin Login Schema
const adminLoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

// Admin Register Schema (New Account)
const adminRegisterSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Email de acceso inválido'),
  telefono: z.string().min(9, 'El teléfono debe tener al menos 9 dígitos'),
  documento: z.string().min(8, 'Documento (DNI/RUC) inválido'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
});

type AdminRegisterFormValues = z.infer<typeof adminRegisterSchema>;

export const AdminLogin = () => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  // Login Form
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    reset: resetLoginForm,
  } = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
  });

  // Register Form
  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
    reset: resetRegisterForm,
  } = useForm<AdminRegisterFormValues>({
    resolver: zodResolver(adminRegisterSchema),
  });

  // Login Action
  const onLoginSubmit = async (data: AdminLoginFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const isAdminEmail = ADMIN_EMAILS.includes(user.email?.toLowerCase() || '');
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserType;
        const isUserAdmin = userData.tipoUsuario === 'admin' || isAdminEmail;
        
        if (isUserAdmin) {
          // Grant access
          setUser(userData);
          setSuccess('Acceso autorizado como Administrador. Redirigiendo...');
          setTimeout(() => {
            navigate('/admin');
          }, 1500);
        } else {
          // Reject and logout
          setError('Restringido: La cuenta ingresada no cuenta con privilegios de Administrador.');
          await signOut(auth);
        }
      } else if (isAdminEmail) {
        // Create matching admin profile if email is listed in constants but has no firestore doc yet
        const newAdmin: UserType = {
          uid: user.uid,
          nombre: user.displayName || 'Administrador',
          tipoUsuario: 'admin',
          tipoCuenta: 'natural',
          documento: 'SYSADMIN',
          telefono: 'N/A',
          email: user.email || '',
          verificado: 'verificado',
          rating: 5,
          totalRatings: 0,
          sumRatings: 0,
          completedTrips: 0,
          indiceConfiabilidad: 100,
          createdAt: Date.now(),
        };
        await setDoc(doc(db, 'users', user.uid), cleanObject(newAdmin));
        setUser(newAdmin);
        setSuccess('Acceso autorizado. Perfil creado. Redirigiendo...');
        setTimeout(() => {
          navigate('/admin');
        }, 1500);
      } else {
        setError('Acceso denegado: El perfil no corresponde a un Administrador.');
        await signOut(auth);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Credenciales incorrectas de administrador.');
      } else {
        setError('Error de conexión con el servidor de autenticación.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Register Action
  const onRegisterSubmit = async (data: AdminRegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      const newAdmin: UserType = {
        uid: user.uid,
        nombre: data.nombre,
        tipoUsuario: 'admin',
        tipoCuenta: 'natural',
        documento: data.documento,
        telefono: data.telefono,
        email: data.email,
        verificado: 'verificado', // Auto-authorized admin
        rating: 5,
        totalRatings: 0,
        sumRatings: 0,
        completedTrips: 0,
        indiceConfiabilidad: 100,
        createdAt: Date.now(),
        organizationType: undefined,
      };

      // Write user profile doc to firestore
      await setDoc(doc(db, 'users', user.uid), cleanObject(newAdmin));

      setSuccess('Cuenta de Administrador creada con éxito. Iniciando sesión...');
      setUser(newAdmin);
      
      setTimeout(() => {
        navigate('/admin');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo electrónico ya está registrado.');
      } else {
        setError(err.message || 'Error al crear la cuenta de administrador.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError(null);
    setSuccess(null);
    resetLoginForm();
    resetRegisterForm();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Dynamic Grid Background with futuristic laser light lines */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:32px_32px]"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-md w-full z-10 space-y-8">
        {/* Terminal Header Info */}
        <div className="flex flex-col items-center text-center space-y-4">
          <Link to="/" className="inline-flex hover:opacity-85 transition-opacity">
            <ChasquiLogo variant="white" />
          </Link>
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full">
            <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-slate-400 tracking-wider">CHASQUI SECURE SHELL v4.2</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-white uppercase tracking-tight font-sans flex items-center justify-center gap-2">
              <KeyRound className="h-5 w-5 text-emerald-400" />
              <span>Consola del Sistema</span>
            </h2>
            <p className="text-xs text-slate-400">
              {isRegisterMode 
                ? 'Introduce las credenciales para registrar un nuevo perfil de administración.' 
                : 'Acceso restringido para personal de administración y soporte autorizado.'}
            </p>
          </div>
        </div>

        {/* Central Terminal Control Panel */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/20 via-emerald-500 to-indigo-500/20"></div>
          
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-red-950/40 border border-red-900/60 text-red-400 rounded-2xl text-xs font-bold font-mono flex gap-3 items-start"
              >
                <ShieldAlert className="h-4.5 w-4.5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold uppercase mb-1">ACCESO DENEGADO</div>
                  <p className="font-medium text-red-300 leading-relaxed">{error}</p>
                </div>
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 rounded-2xl text-xs font-bold font-mono flex gap-2.5 items-start"
              >
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold uppercase mb-1">PROCESANDO SOLICITUD</div>
                  <p className="font-medium text-emerald-300 leading-relaxed">{success}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {!isRegisterMode ? (
              // LOGIN FORM
              <motion.form 
                key="login-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLoginSubmit(onLoginSubmit)} 
                className="space-y-5"
              >
                <div className="space-y-4 font-mono">
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">ID Operador (Email)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-500" />
                      </div>
                      <input
                        type="email"
                        placeholder="admin@chasqui.pe"
                        {...loginRegister('email')}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-10 pr-4 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
                      />
                    </div>
                    {loginErrors.email && (
                      <span className="text-[10px] text-red-500 font-extrabold">{loginErrors.email.message}</span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Clave de Seguridad</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-500" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...loginRegister('password')}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-10 pr-10 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                    </div>
                    {loginErrors.password && (
                      <span className="text-[10px] text-red-500 font-extrabold">{loginErrors.password.message}</span>
                    )}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-xs font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-550 active:bg-emerald-700 text-slate-950 rounded-xl flex items-center justify-center gap-2 mt-2" 
                  isLoading={isLoading}
                >
                  <Terminal className="h-4 w-4" />
                  <span>Autenticar Operador</span>
                </Button>
              </motion.form>
            ) : (
              // REGISTER FORM
              <motion.form 
                key="register-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleRegisterSubmit(onRegisterSubmit)} 
                className="space-y-4"
              >
                <div className="space-y-3 font-mono">
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Nombre Completo</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-slate-500" />
                      </div>
                      <input
                        type="text"
                        placeholder="Ing. Carlos Mendoza"
                        {...registerRegister('nombre')}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-10 pr-4 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
                      />
                    </div>
                    {registerErrors.nombre && (
                      <span className="text-[10px] text-red-500 font-extrabold">{registerErrors.nombre.message}</span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Correo Electrónico Corporativo</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-500" />
                      </div>
                      <input
                        type="email"
                        placeholder="carlos.mendoza@chasqui.pe"
                        {...registerRegister('email')}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-10 pr-4 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
                      />
                    </div>
                    {registerErrors.email && (
                      <span className="text-[10px] text-red-500 font-extrabold">{registerErrors.email.message}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Teléfono</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Phone className="h-4 w-4 text-slate-500" />
                        </div>
                        <input
                          type="text"
                          placeholder="987654321"
                          {...registerRegister('telefono')}
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-10 pr-4 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
                        />
                      </div>
                      {registerErrors.telefono && (
                        <span className="text-[10px] text-red-500 font-extrabold">{registerErrors.telefono.message}</span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">DNI / de Seguridad</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <FileText className="h-4 w-4 text-slate-500" />
                        </div>
                        <input
                          type="text"
                          placeholder="45127896"
                          {...registerRegister('documento')}
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-10 pr-4 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
                        />
                      </div>
                      {registerErrors.documento && (
                        <span className="text-[10px] text-red-500 font-extrabold">{registerErrors.documento.message}</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Definir Contraseña</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-500" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 8 caract. y 1 Mayús."
                        {...registerRegister('password')}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-10 pr-10 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                    </div>
                    {registerErrors.password && (
                      <span className="text-[10px] text-red-500 font-extrabold">{registerErrors.password.message}</span>
                    )}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-xs font-bold uppercase tracking-widest bg-indigo-600 hover:bg-indigo-550 active:bg-indigo-700 text-white rounded-xl flex items-center justify-center gap-2 mt-2" 
                  isLoading={isLoading}
                >
                  <User className="h-4 w-4" />
                  <span>Crear Credencial de Admin</span>
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Toggle between Login and Register with beautiful layout */}
          <div className="mt-6 pt-4 border-t border-slate-800/60 text-center space-y-3 font-mono">
            <button
              type="button"
              onClick={toggleMode}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
            >
              {isRegisterMode 
                ? '¿Ya tienes credenciales? Iniciar Sesión' 
                : '¿No posees credenciales? Solicitar Registro de Administrador'}
            </button>
          </div>
        </div>

        {/* Back Link to general platform */}
        <div className="text-center font-mono">
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-all font-bold hover:underline uppercase tracking-wide"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Volver al Acceso General de Usuarios</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
