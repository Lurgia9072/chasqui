import { useState, useCallback, useEffect, FormEvent } from 'react';
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
import { Package, MapPin, DollarSign, Info, ArrowLeft, Truck, X, Search, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

const cargoSchema = z.object({
  origen: z.string().min(5, 'Dirección de origen inválida'),
  destino: z.string().min(5, 'Dirección de destino inválida'),
  tipoCarga: z.string().min(3, 'Tipo de carga inválido'),
  categoria: z.enum(['general', 'perecible', 'fragil', 'peligrosa']),
  temperaturaRequerida: z.string().optional(),
  cuidadoEspecial: z.string().optional(),
  peso: z.string().min(1, 'Peso requerido'),
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
      const docRef = await addDoc(collection(db, path), {
        ...data,
        origenCoords: coords.origen,
        destinoCoords: coords.destino,
        comercianteId: user.uid,
        comercianteNombre: user.nombre,
        estado: 'disponible',
        createdAt: Date.now(),
      });
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

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Peru')}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);
        setTempLocation({ lat: newLat, lng: newLng });
        // We'll need a way to move the map. Let's add a MapController component inside MapContainer.
      } else {
        alert('No se encontró la ubicación');
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const MapController = ({ center }: { center: { lat: number; lng: number } }) => {
    const map = useMap();
    useEffect(() => {
      map.setView([center.lat, center.lng], 15);
    }, [center, map]);
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
                  placeholder="Ej: Arándanos, Motores, Vidrio"
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
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-blue-800 uppercase tracking-wider">Temperatura Requerida (°C)</label>
                    <Input
                      placeholder="Ej: -18°C a -20°C"
                      {...register('temperaturaRequerida')}
                      className="h-12 border-blue-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-blue-800 uppercase tracking-wider">Protocolo de Cadena de Frío</label>
                    <Input
                      placeholder="Ej: Monitoreo cada 30 min"
                      {...register('cuidadoEspecial')}
                      className="h-12 border-blue-200"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-none"
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
                  onClick={() => { setShowMapModal({ show: false, field: 'origen' }); setSearchQuery(''); }} 
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 bg-white border-b border-gray-100 shrink-0">
                <form onSubmit={handleSearch} className="relative flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                      type="text"
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 text-sm outline-none transition-all"
                      placeholder="Buscar por distrito, región o nombre..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    size="sm" 
                    className="shrink-0 h-11 px-4 lg:px-6"
                    isLoading={isSearching}
                  >
                    Buscar
                  </Button>
                </form>
              </div>
              
              <div className="relative flex-1 min-h-[300px] h-[50vh] sm:h-[450px]">
                <MapContainer 
                  center={[-12.046374, -77.042793]} 
                  zoom={13} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <MapPicker 
                    initialPos={tempLocation ? [tempLocation.lat, tempLocation.lng] : [-12.046374, -77.042793]} 
                    onLocationSelect={(lat, lng) => setTempLocation({ lat, lng })}
                  />
                  {tempLocation && <MapController center={tempLocation} />}
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
