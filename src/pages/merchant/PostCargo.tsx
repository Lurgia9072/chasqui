import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { OperationType } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Package, MapPin, DollarSign, Info, ArrowLeft, Truck, X, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, cleanObject } from '../../lib/utils';

const cargoSchema = z.object({
  origen: z.string().min(5, 'Dirección de origen inválida'),
  destino: z.string().min(5, 'Dirección de destino inválida'),
  tipoCarga: z.string().min(3, 'Tipo de carga inválido'),
  categoria: z.enum(['general', 'perecible', 'fragil', 'peligrosa']),
  
  // Datos Producto Exportable
  nombreProducto: z.string().min(3, 'Nombre del producto requerido'),
  lote: z.string().min(1, 'Código de lote requerido'),
  certificacion: z.enum(['organico', 'globalgap', 'fair_trade', 'sin_certificacion']),
  partidaArancelaria: z.string().optional(),

  // Condiciones de Transporte
  temperaturaRequerida: z.string().optional(),
  tipoVehiculoRequerido: z.enum(['refrigerado', 'seco', 'isotermico', 'indiferente']),
  condicionSanitaria: z.boolean().default(false),

  // Datos de Exportación
  guiaRemision: z.string().min(1, 'Guía de remisión requerida'),
  puertoDestino: z.string().min(1, 'Puerto de destino requerido'),
  fechaHoraLimitePuerto: z.string().min(1, 'Fecha límite requerida'),
  numeroContenedor: z.string().optional(),

  cuidadoEspecial: z.string().optional(),
  peso: z.string().transform((val) => Number(val)).pipe(z.number().min(0.1, 'El peso debe ser mayor a 0')),
  capacidadRequerida: z.string().min(1, 'Capacidad requerida'),
  descripcion: z.string().min(10, 'Descripción demasiado corta'),
  precioPropuesto: z.string().transform((val) => Number(val)).pipe(z.number().min(10, 'El precio debe ser mayor a S/ 10')),
});

type CargoFormValues = z.infer<typeof cargoSchema>;

// Fix Leaflet default icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const MapPicker = ({ onLocationSelect, initialPos }: { onLocationSelect: (lat: number, lng: number) => void, initialPos: [number, number] }) => {
  const [position, setPosition] = useState<[number, number]>(initialPos);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onLocationSelect(lat, lng);
    },
  });

  return position ? <Marker position={position} /> : null;
};

export const PostCargo = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showMapModal, setShowMapModal] = useState<{ show: boolean; field: 'origen' | 'destino' }>({ show: false, field: 'origen' });
  const [tempLocation, setTempLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [coords, setCoords] = useState<{ origen?: { lat: number; lng: number }; destino?: { lat: number; lng: number } }>({});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<any>({
    resolver: zodResolver(cargoSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: any) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const path = 'cargas';
      const cargoData = cleanObject({
        ...data,
        fechaHoraLimitePuerto: data.fechaHoraLimitePuerto ? new Date(data.fechaHoraLimitePuerto).getTime() : null,
        origenCoords: coords.origen || null,
        destinoCoords: coords.destino || null,
        comercianteId: user.uid,
        comercianteNombre: user.nombre,
        estado: 'disponible',
        createdAt: Date.now(),
      });
      const docRef = await addDoc(collection(db, path), cargoData);
      navigate(`/merchant/cargo/${docRef.id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'cargas');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmLocation = async () => {
    if (!tempLocation) return;
    
    // Simple reverse geocoding using Nominatim (OpenStreetMap)
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${tempLocation.lat}&lon=${tempLocation.lng}`);
      const data = await response.json();
      if (data.display_name) {
        setValue(showMapModal.field, data.display_name, { shouldValidate: true });
      } else {
        setValue(showMapModal.field, `${tempLocation.lat.toFixed(6)}, ${tempLocation.lng.toFixed(6)}`, { shouldValidate: true });
      }
      
      // Guardar coordenadas
      setCoords(prev => ({
        ...prev,
        [showMapModal.field]: tempLocation
      }));
    } catch (error) {
      console.error("Geocoding failed:", error);
      setValue(showMapModal.field, `${tempLocation.lat.toFixed(6)}, ${tempLocation.lng.toFixed(6)}`, { shouldValidate: true });
    }
    
    setShowMapModal({ show: false, field: 'origen' });
    setTempLocation(null);
  };

  const MapController = ({ center }: { center: { lat: number; lng: number } }) => {
    const map = useMap();
    useEffect(() => {
      map.setView([center.lat, center.lng], map.getZoom());
    }, [center, map]);
    
    // Fix for blank map in modals: invalidate size after animation
    useEffect(() => {
      // Small delay to let the modal open
      const t1 = setTimeout(() => map.invalidateSize(), 300);
      // Second check to be sure after any potential layout shifts
      const t2 = setTimeout(() => map.invalidateSize(), 1000);
      
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }, [map]);

    return null;
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

      <Card className="shadow-xl border-none">
        <CardHeader className="space-y-1 bg-gray-50/50 rounded-t-3xl border-b border-gray-100">
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Publicar Nueva Carga</CardTitle>
              <CardDescription>
                Ingresa los detalles de tu envío para recibir ofertas de transportistas.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-8 p-8">
            {/* Ruta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm font-bold text-gray-900 uppercase tracking-wider">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <span>Origen</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowMapModal({ show: true, field: 'origen' })}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg"
                  >
                    <Navigation className="h-3 w-3" />
                    Mapa
                  </button>
                </div>
                <Input
                  placeholder="Ej: Av. Javier Prado 123, San Isidro, Lima"
                  {...register('origen')}
                  error={errors.origen?.message}
                  className="h-12"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm font-bold text-gray-900 uppercase tracking-wider">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span>Destino</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowMapModal({ show: true, field: 'destino' })}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg"
                  >
                    <Navigation className="h-3 w-3" />
                    Mapa
                  </button>
                </div>
                <Input
                  placeholder="Ej: Calle Real 456, Huancayo, Junín"
                  {...register('destino')}
                  error={errors.destino?.message}
                  className="h-12"
                />
              </div>
            </div>

            {/* Detalles de Carga */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Tipo de Mercancía</label>
                <Input
                  placeholder="Ej: Abarrotes, Muebles, Construcción"
                  {...register('tipoCarga')}
                  error={errors.tipoCarga?.message}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Categoría Logística</label>
                <select
                  className={cn(
                    "w-full h-12 rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium",
                    errors.categoria ? "border-red-500 shadow-sm shadow-red-50" : "border-gray-200"
                  )}
                  {...register('categoria')}
                >
                  <option value="general">Carga General</option>
                  <option value="perecible">Perecible (Alimentos/Fármacos)</option>
                  <option value="fragil">Frágil / Delicado</option>
                  <option value="peligrosa">Material Peligroso (MATPEL)</option>
                </select>
                {errors.categoria && (
                  <p className="text-[10px] font-bold text-red-500 uppercase">{errors.categoria.message}</p>
                )}
              </div>
            </div>

            <AnimatePresence>
              {watch('categoria') === 'perecible' && (
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                  <Info className="h-5 w-5 text-emerald-600" />
                  <p className="text-xs font-bold text-emerald-800">Recuerda especificar la temperatura exacta en la sección de condiciones de transporte.</p>
                </div>
              )}
            </AnimatePresence>

            {/* Datos del Producto Exportable */}
            <div className="space-y-6 pt-4">
              <h3 className="text-lg font-black text-slate-900 border-l-4 border-emerald-500 pl-4 uppercase tracking-wider">Datos del Producto Exportable</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Nombre del Producto (Ej: Palta Hass)" placeholder="Ej: Palta Hass" {...register('nombreProducto')} error={errors.nombreProducto?.message} />
                <Input label="Código de Lote / Producción" placeholder="Ej: LOT-2026-X" {...register('lote')} error={errors.lote?.message} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Certificación</label>
                  <select
                    className="w-full h-12 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    {...register('certificacion')}
                  >
                    <option value="sin_certificacion">Sin Certificación</option>
                    <option value="organico">Orgánico</option>
                    <option value="globalgap">GlobalGAP</option>
                    <option value="fair_trade">Fair Trade</option>
                  </select>
                </div>
                <Input label="Partida Arancelaria (Opcional)" placeholder="Ej: 0804400000" {...register('partidaArancelaria')} />
              </div>
            </div>

            {/* Condiciones de Transporte */}
            <div className="space-y-6 pt-4">
              <h3 className="text-lg font-black text-slate-900 border-l-4 border-blue-500 pl-4 uppercase tracking-wider">Condiciones de Transporte</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Temperatura Requerida</label>
                  <select
                    className="w-full h-12 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    {...register('temperaturaRequerida')}
                  >
                    <option value="ambiente">Ambiente</option>
                    <option value="refrigerado">Refrigerado (2°C - 8°C)</option>
                    <option value="congelado">Congelado (-18°C)</option>
                    <option value="controlado">Controlado (8°C - 15°C)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Tipo de Vehículo Requerido</label>
                  <select
                    className="w-full h-12 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    {...register('tipoVehiculoRequerido')}
                  >
                    <option value="indiferente">Indiferente</option>
                    <option value="refrigerado">Refrigerado / Cámara</option>
                    <option value="seco">Seco / Furgón</option>
                    <option value="isotermico">Isotérmico</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <input type="checkbox" id="sanitaria" {...register('condicionSanitaria')} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="sanitaria" className="text-sm font-bold text-slate-700">Vehículo con limpieza previa certificada</label>
              </div>
            </div>

            {/* Datos de Exportación */}
            <div className="space-y-6 pt-4">
              <h3 className="text-lg font-black text-slate-900 border-l-4 border-red-500 pl-4 uppercase tracking-wider">Datos de Exportación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Guía de Remisión" placeholder="Ej: T001-000123" {...register('guiaRemision')} error={errors.guiaRemision?.message} />
                <Input label="Puerto / Punto de Embarque Destino" placeholder="Ej: DP World Callao" {...register('puertoDestino')} error={errors.puertoDestino?.message} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Fecha y Hora Límite en Puerto</label>
                  <Input type="datetime-local" {...register('fechaHoraLimitePuerto')} error={errors.fechaHoraLimitePuerto?.message} />
                  <p className="text-[10px] text-red-500 font-bold uppercase">Activa alertas críticas de puntualidad</p>
                </div>
                <Input label="Número de Contenedor (Opcional)" placeholder="Ej: MSKU1234567" {...register('numeroContenedor')} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Peso Aprox.</label>
                <Input
                  placeholder="Ej: 5 Toneladas"
                  {...register('peso')}
                  error={errors.peso?.message}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Capacidad Requerida</label>
                <select
                  className={cn(
                    "w-full h-12 rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium",
                    errors.capacidadRequerida ? "border-red-500 shadow-sm shadow-red-50" : "border-gray-200"
                  )}
                  {...register('capacidadRequerida')}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Furgón Cerrado">Furgón Cerrado</option>
                  <option value="Camión Baranda">Camión Baranda</option>
                  <option value="Cámara Frigorífica">Cámara Frigorífica</option>
                  <option value="Plataforma">Plataforma</option>
                  <option value="Cisterna">Cisterna</option>
                </select>
                {errors.capacidadRequerida && (
                  <p className="text-[10px] font-bold text-red-500 uppercase">{errors.capacidadRequerida.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Tratamiento Especial</label>
                <select
                  className="w-full h-12 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  {...register('cuidadoEspecial')}
                >
                  <option value="Ninguno">Ninguno</option>
                  <option value="Requiere Estiba">Requiere Estiba</option>
                  <option value="Solo de Día">Solo de Día</option>
                  <option value="Custodia">Requiere Custodia</option>
                  <option value="Urgente">Prioridad Máxima</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Descripción Detallada</label>
              <textarea
                className={cn(
                  "w-full min-h-[120px] rounded-2xl border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all",
                  errors.descripcion ? "border-red-500" : "border-gray-200"
                )}
                placeholder="Describe el volumen, fragilidad o cualquier detalle importante..."
                {...register('descripcion')}
              />
              {errors.descripcion && (
                <p className="text-[10px] font-bold text-red-500 uppercase">{errors.descripcion.message}</p>
              )}
            </div>

            {/* Precio */}
            <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100 shadow-inner">
              <div className="flex items-center space-x-2 text-sm font-bold text-blue-900 uppercase tracking-wider mb-6">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <span>Tu Propuesta de Precio</span>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="relative flex-1 w-full">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xl">S/</span>
                  <input
                    type="number"
                    className="w-full h-16 pl-12 pr-4 rounded-2xl border-2 border-blue-200 bg-white text-3xl font-black text-gray-900 focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                    placeholder="0.00"
                    {...register('precioPropuesto')}
                  />
                </div>
                <div className="flex items-center space-x-3 text-xs text-blue-700 bg-white/50 p-4 rounded-2xl border border-blue-100 max-w-xs">
                  <Info className="h-5 w-5 shrink-0 text-blue-500" />
                  <p className="leading-relaxed">Este es el precio base. Los transportistas podrán ofertar sobre este monto.</p>
                </div>
              </div>
              {errors.precioPropuesto && (
                <p className="mt-3 text-[10px] font-bold text-red-500 uppercase">{errors.precioPropuesto.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 p-8 bg-gray-50/50 rounded-b-3xl border-t border-gray-100">
            <Button 
              type="submit" 
              className={cn(
                "w-full h-16 text-xl font-bold shadow-xl transition-all",
                isValid ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200" : "bg-gray-300 cursor-not-allowed"
              )} 
              isLoading={isLoading}
              disabled={!isValid || isLoading}
            >
              Publicar Carga Ahora
            </Button>
            <p className="text-center text-xs text-gray-500 font-medium">
              Al publicar, aceptas nuestros términos y condiciones de servicio.
            </p>
          </CardFooter>
        </form>
      </Card>

      {/* Map Modal */}
      <AnimatePresence>
        {showMapModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white sm:rounded-3xl shadow-2xl w-full h-full sm:h-auto sm:max-w-3xl overflow-hidden flex flex-col"
            >
              <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-xl font-bold text-gray-900 leading-tight">Ubicación de {showMapModal.field === 'origen' ? 'Origen' : 'Destino'}</h2>
                    <p className="hidden sm:block text-xs text-gray-500">Haz clic en el mapa o busca por nombre.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowMapModal({ show: false, field: 'origen' })} 
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="relative w-full h-[50vh] sm:h-[500px] overflow-hidden bg-gray-100 border-t border-gray-100">
                <MapContainer 
                  center={[-12.046374, -77.042793]} 
                  zoom={13} 
                  style={{ height: '100%', width: '100%', zIndex: 1 }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <MapPicker 
                    initialPos={tempLocation ? [tempLocation.lat, tempLocation.lng] : [-12.046374, -77.042793]} 
                    onLocationSelect={(lat, lng) => setTempLocation({ lat, lng })}
                  />
                  <MapController center={tempLocation || { lat: -12.046374, lng: -77.042793 }} />
                </MapContainer>
                
                {tempLocation && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[200px] sm:max-w-xs px-4 z-[1000]">
                    <Button 
                      className="w-full h-12 shadow-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                      onClick={confirmLocation}
                    >
                      Confirmar
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
