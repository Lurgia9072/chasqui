import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signInWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Truck, AlertCircle, Mail } from 'lucide-react';
import { User } from '../types';

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
      
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        setUser(userData);
        
        if (userData.tipoUsuario === 'comerciante') {
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
      } else if (err.code === 'auth/user-disabled') {
        setError('Esta cuenta de usuario ha sido desactivada.');
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

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Truck className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Bienvenido de nuevo</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder a tu cuenta
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex flex-col space-y-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
                {unverifiedUser && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="text-xs font-bold text-red-700 hover:underline text-left pl-6"
                  >
                    Reenviar enlace de verificación
                  </button>
                )}
              </div>
            )}
            {info && (
              <div className="flex items-center space-x-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-600 border border-blue-100">
                <Mail className="h-4 w-4" />
                <span>{info}</span>
              </div>
            )}
            <Input
              label="Email"
              type="email"
              placeholder="nombre@ejemplo.com"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message}
            />
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Iniciar Sesión
            </Button>
            <p className="text-center text-sm text-gray-600">
              ¿No tienes una cuenta?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
