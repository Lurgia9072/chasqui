import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError } from '../../firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { OperationType } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Package, MapPin, DollarSign, Info, ArrowLeft } from 'lucide-react';

const cargoSchema = z.object({
  origen: z.string().min(5, 'Dirección de origen inválida'),
  destino: z.string().min(5, 'Dirección de destino inválida'),
  tipoCarga: z.string().min(3, 'Tipo de carga inválido'),
  peso: z.string().min(1, 'Peso requerido'),
  descripcion: z.string().min(10, 'Descripción demasiado corta'),
  precioPropuesto: z.string().transform((val) => Number(val)).pipe(z.number().min(10, 'El precio debe ser mayor a S/ 10')),
});

type CargoFormValues = z.infer<typeof cargoSchema>;

export const PostCargo = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(cargoSchema),
  });

  const onSubmit = async (data: any) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const path = 'cargas';
      await addDoc(collection(db, path), {
        ...data,
        comercianteId: user.uid,
        comercianteNombre: user.nombre,
        estado: 'disponible',
        createdAt: Date.now(),
      });
      navigate('/merchant/dashboard');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'cargas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver
      </button>

      <Card>
        <CardHeader className="space-y-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Publicar Nueva Carga</CardTitle>
          </div>
          <CardDescription>
            Ingresa los detalles de tu envío para recibir ofertas de transportistas.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Ruta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-sm font-bold text-gray-900 uppercase tracking-wider">
                  <MapPin className="h-4 w-4 text-red-500" />
                  <span>Origen</span>
                </div>
                <Input
                  placeholder="Ej: Av. Javier Prado 123, San Isidro, Lima"
                  {...register('origen')}
                  error={errors.origen?.message}
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-sm font-bold text-gray-900 uppercase tracking-wider">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  <span>Destino</span>
                </div>
                <Input
                  placeholder="Ej: Calle Real 456, Huancayo, Junín"
                  {...register('destino')}
                  error={errors.destino?.message}
                />
              </div>
            </div>

            {/* Detalles de Carga */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Tipo de Carga"
                placeholder="Ej: Alimentos, Muebles, Construcción"
                {...register('tipoCarga')}
                error={errors.tipoCarga?.message}
              />
              <Input
                label="Peso Aproximado"
                placeholder="Ej: 500kg, 2 Toneladas"
                {...register('peso')}
                error={errors.peso?.message}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Descripción Detallada</label>
              <textarea
                className="w-full min-h-[100px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe el volumen, fragilidad o cualquier detalle importante..."
                {...register('descripcion')}
              />
              {errors.descripcion && (
                <p className="text-xs font-medium text-red-500">{errors.descripcion.message}</p>
              )}
            </div>

            {/* Precio */}
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
              <div className="flex items-center space-x-2 text-sm font-bold text-blue-900 uppercase tracking-wider mb-4">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span>Tu Propuesta de Precio</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">S/</span>
                  <input
                    type="number"
                    className="w-full h-14 pl-10 pr-4 rounded-xl border-2 border-blue-200 bg-white text-2xl font-extrabold text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="0.00"
                    {...register('precioPropuesto')}
                  />
                </div>
                <div className="hidden sm:flex items-center space-x-2 text-xs text-blue-700 max-w-[200px]">
                  <Info className="h-4 w-4 shrink-0" />
                  <p>Este es el precio base. Los transportistas podrán ofertar sobre este monto.</p>
                </div>
              </div>
              {errors.precioPropuesto && (
                <p className="mt-2 text-xs font-medium text-red-500">{errors.precioPropuesto.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-6">
            <Button type="submit" className="w-full h-14 text-lg" isLoading={isLoading}>
              Publicar Carga Ahora
            </Button>
            <p className="text-center text-xs text-gray-500">
              Al publicar, aceptas nuestros términos y condiciones de servicio.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
