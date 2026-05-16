import React, { useState, useCallback, useEffect } from 'react';
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
import { Package, MapPin, DollarSign, Info, ArrowLeft, Truck, X, Navigation, AlertCircle, Box, Sprout, Factory, Thermometer, Layers, Settings, ChevronRight, User, Shield, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, cleanObject } from '../../lib/utils';

const cargoSchema = z.object({
  tipoDeCarga: z.string().min(1, 'Selecciona un tipo de carga'),
  origen: z.string().min(5, 'Dirección de origen inválida'),
  destino: z.string().min(5, 'Dirección de destino inválida'),
  
  vehiculo: z.object({
    tipo: z.string().min(1, 'Selecciona un tipo de vehículo'),
    otroTipo: z.string().optional(),
    caracteristicas: z.array(z.string()).default([]),
    capacidad: z.object({
      peso: z.string().optional(),
      volumen: z.string().optional(),
      pallets: z.string().optional(),
      dimensiones: z.string().optional(),
    }),
  }),

  nombreProducto: z.string().min(1, 'Nombre del producto requerido'),
  horario: z.string().optional(),
  descripcion: z.string().min(10, 'Descripción demasiado corta'),
  precioPropuesto: z.string()
    .transform((val) => val.replace(/[^\d.]/g, ''))
    .transform((val) => Number(val))
    .pipe(z.number().min(10, 'El precio debe ser mayor a S/ 10')),

  // Avanzados (Agro)
  lote: z.string().optional(),
  partidaArancelaria: z.string().optional(),
  puertoDestino: z.string().optional(),
  numeroContenedor: z.string().optional(),
  temperaturaRequerida: z.string().optional(),
  certificacion: z.string().optional(),
  eudr: z.string().optional(),
  guiaRemision: z.string().optional(),
  fechaHoraLimitePuerto: z.string().optional(),
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
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<any>({
    resolver: zodResolver(cargoSchema),
    mode: 'onChange',
    defaultValues: {
      tipoDeCarga: '',
      vehiculo: {
        caracteristicas: [],
        capacidad: {}
      }
    }
  });

  const selectedTipoCarga = watch('tipoDeCarga');
  const selectedVehiculoTipo = watch('vehiculo.tipo');

  const cargoTypes = [
    { id: 'Carga General', icon: <Package />, label: 'Carga General', color: 'bg-blue-500' },
    { id: 'Mudanza', icon: <Box />, label: 'Mudanza', color: 'bg-orange-500' },
    { id: 'Agroexportación', icon: <Sprout />, label: 'Agroexportación', color: 'bg-emerald-500' },
    { id: 'Carga Industrial', icon: <Factory />, label: 'Carga Industrial', color: 'bg-slate-700' },
    { id: 'Cadena de Frío', icon: <Thermometer />, label: 'Cadena de Frío', color: 'bg-blue-400' },
    { id: 'Repuestos / Mercadería', icon: <Settings />, label: 'Repuestos / Mercadería', color: 'bg-indigo-500' },
    { id: 'Distribución Urbana', icon: <Truck />, label: 'Distribución Urbana', color: 'bg-yellow-500' },
    { id: 'Carga Pesada', icon: <Layers />, label: 'Carga Pesada', color: 'bg-red-600' },
  ];

  const vehicleOptions = [
    'Mototaxi', 'Minivan', 'Furgón', 'Furgón refrigerado', 'Camión 2T', 'Camión 5T', 'Camión 10T', 
    'Semitrailer', 'Plataforma', 'Cama baja', 'Cisterna', 'Pickup', 'Indiferente', 'Otro'
  ];

  const vehicleFeatures = [
    { id: 'Refrigeración', label: 'Refrigeración' },
    { id: 'GPS', label: 'GPS' },
    { id: 'Seguro de carga', label: 'Seguro de carga' },
    { id: 'Unidad sellada', label: 'Unidad sellada' },
    { id: 'Elevador hidráulico', label: 'Elevador hidráulico' },
    { id: 'Carga frágil', label: 'Carga frágil' },
    { id: 'Carga peligrosa', label: 'Carga peligrosa' },
    { id: 'Ayudante de carga', label: 'Ayudante de carga' },
    { id: 'Rastreo activo', label: 'Rastreo activo' },
  ];

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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <button
        onClick={() => step > 1 ? setStep(1) : navigate(-1)}
        className="flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        {step > 1 ? 'Cambiar tipo de carga' : 'Volver'}
      </button>

      {/* PROGRESS BAR */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2].map((i) => (
          <div 
            key={i} 
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-500",
              step >= i ? "bg-blue-600" : "bg-gray-200"
            )} 
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                PASO 1 — ¿Qué tipo de carga deseas transportar?
              </h1>
              <p className="text-slate-500 font-medium">Selecciona una categoría para personalizar tu solicitud.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {cargoTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setValue('tipoDeCarga', type.id);
                    setStep(2);
                  }}
                  className={cn(
                    "p-6 rounded-3xl border-2 text-left transition-all group flex flex-col gap-4 h-full",
                    selectedTipoCarga === type.id 
                      ? "border-blue-600 bg-blue-50/50 shadow-xl shadow-blue-900/5 ring-4 ring-blue-600/5" 
                      : "border-slate-100 bg-white hover:border-blue-200 hover:shadow-lg"
                  )}
                >
                  <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center text-white transition-transform group-hover:scale-110",
                    type.color
                  )}>
                    {React.cloneElement(type.icon as React.ReactElement, { className: 'h-6 w-6' })}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 mb-1">{type.label}</h3>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium uppercase tracking-wider">Transporte especializado</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="shadow-2xl border-none overflow-hidden rounded-[2.5rem]">
              <CardHeader className="p-8 bg-slate-900 text-white relative">
                 <div className="absolute top-0 right-0 p-8 opacity-20">
                    {cargoTypes.find(t => t.id === selectedTipoCarga)?.icon}
                 </div>
                 <div className="space-y-1 relative z-10">
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-black uppercase tracking-widest text-blue-400 mb-2">
                     <Box className="h-3 w-3" />
                     {selectedTipoCarga}
                   </div>
                   <CardTitle className="text-3xl font-black italic">Detalles de la Operación</CardTitle>
                   <CardDescription className="text-slate-400 font-medium italic">Completa la información técnica para recibir ofertas precisas.</CardDescription>
                 </div>
              </CardHeader>

              <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="p-8 space-y-12">
                  {/* SECCIÓN RUTA */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-slate-900">
                      <MapPin className="h-5 w-5 text-red-500" />
                      <h3 className="text-lg font-black uppercase tracking-tighter italic">1. Ruta de Transporte</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Origen</label>
                          <button type="button" onClick={() => setShowMapModal({ show: true, field: 'origen' })} className="text-[10px] font-bold text-blue-600 hover:underline">Ver mapa</button>
                        </div>
                        <Input placeholder="Punto de recojo..." {...register('origen')} error={errors.origen?.message} className="rounded-2xl" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Destino</label>
                          <button type="button" onClick={() => setShowMapModal({ show: true, field: 'destino' })} className="text-[10px] font-bold text-blue-600 hover:underline">Ver mapa</button>
                        </div>
                        <Input placeholder="Punto de entrega..." {...register('destino')} error={errors.destino?.message} className="rounded-2xl" />
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN VEHÍCULO (CLAVE) */}
                  <div className="space-y-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-900">
                      <Truck className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-black uppercase tracking-tighter italic">2. Vehículo Requerido</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo de Unidad</label>
                        <select 
                          {...register('vehiculo.tipo')}
                          className="w-full h-14 rounded-2xl border-2 border-white bg-white px-4 text-sm font-bold shadow-sm focus:border-blue-500 transition-all"
                        >
                          <option value="">Selecciona vehículo...</option>
                          {vehicleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        {selectedVehiculoTipo === 'Otro' && (
                          <Input 
                            placeholder="Especifica el tipo de vehículo..." 
                            {...register('vehiculo.otroTipo')}
                            className="h-12 rounded-xl"
                          />
                        )}

                        <div className="pt-4 space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Capacidad Estimada</label>
                          <div className="grid grid-cols-2 gap-4">
                            <Input placeholder="Peso (kg/t)" {...register('vehiculo.capacidad.peso')} className="h-12" />
                            <Input placeholder="Volumen (m3)" {...register('vehiculo.capacidad.volumen')} className="h-12" />
                            <Input placeholder="Pallets (cant.)" {...register('vehiculo.capacidad.pallets')} className="h-12" />
                            <Input placeholder="Dimensiones" {...register('vehiculo.capacidad.dimensiones')} className="h-12" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Características Requeridas</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {vehicleFeatures.map(feat => (
                            <label key={feat.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 hover:border-blue-200 transition-all cursor-pointer group">
                              <input 
                                type="checkbox" 
                                value={feat.id}
                                {...register('vehiculo.caracteristicas')}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                              />
                              <span className="text-[11px] font-black text-slate-600 group-hover:text-slate-900 uppercase tracking-tight">{feat.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN GENERAL — CAMPOS QUE SIEMPRE APARECEN */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-4">
                      <Box className="h-5 w-5 text-indigo-600" />
                      <h3 className="text-lg font-black uppercase tracking-tighter italic">3. Información de Carga</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input label="Nombre de la Mercadería" placeholder="Ej: 50 sacos de arándanos..." {...register('nombreProducto')} error={errors.nombreProducto?.message} />
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Horario Sugerido de Recojo</label>
                        <Input type="datetime-local" {...register('horario')} className="h-12" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Descripción y Detalles del Envío</label>
                      <textarea 
                        {...register('descripcion')}
                        className="w-full min-h-[120px] rounded-[2rem] border-2 border-slate-100 bg-slate-50 p-6 text-sm font-medium focus:bg-white focus:border-blue-500 transition-all placeholder:italic"
                        placeholder="Específica si la carga es delicada, si requiere manipulación especial, o detalles de las evidencias requeridas al entregar..."
                      />
                      {errors.descripcion && <p className="text-xs text-red-500 font-bold px-4">{errors.descripcion.message}</p>}
                    </div>

                    <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                          <DollarSign className="h-20 w-20" />
                       </div>
                       <div className="relative z-10 space-y-6">
                          <div className="flex items-center gap-2">
                             <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
                                <DollarSign className="h-4 w-4 text-white" />
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tu Presupuesto Sugerido (S/.)</span>
                          </div>
                          <div className="flex flex-col sm:flex-row items-center gap-6">
                             <div className="relative flex-1 w-full">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 text-3xl font-black italic">S/</span>
                                <input 
                                  type="number"
                                  {...register('precioPropuesto')}
                                  className="w-full h-20 pl-16 pr-8 rounded-2xl bg-white/5 border-2 border-white/10 text-4xl font-black text-white focus:border-blue-500 transition-all outline-none"
                                  placeholder="0.00"
                                />
                             </div>
                             <div className="max-w-xs text-sm text-slate-400 font-medium italic border-l-2 border-blue-500/50 pl-6">
                                Este es un punto de partida para la negociación con los transportistas.
                             </div>
                          </div>
                          {errors.precioPropuesto && <p className="text-xs text-red-400 font-bold tracking-tight">{errors.precioPropuesto.message}</p>}
                       </div>
                    </div>
                  </div>

                  {/* CAMPOS AVANZADOS (Solo para Agroexportación) */}
                  {selectedTipoCarga === 'Agroexportación' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-8 bg-blue-50/50 p-8 rounded-[2.5rem] border-2 border-blue-100"
                    >
                      <div className="flex items-center gap-2 text-slate-900 border-b border-blue-100 pb-4">
                        <ShieldCheck className="h-5 w-5 text-emerald-600" />
                        <h3 className="text-lg font-black uppercase tracking-tighter italic">4. Datos de Agroexportación</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Input label="Código de Lote" placeholder="LOTE-XXXX" {...register('lote')} />
                        <Input label="Partida Arancelaria" placeholder="08.04.40.00.00" {...register('partidaArancelaria')} />
                        <Input label="Puerto Destino" placeholder="DP World / APM Terminals" {...register('puertoDestino')} />
                        <Input label="Guía de Remisión" placeholder="T001-000000" {...register('guiaRemision')} />
                        <Input label="Temp. Requerida (°C)" placeholder="Ej: 5°C" {...register('temperaturaRequerida')} />
                        <Input label="N° de Contenedor" placeholder="MSCUXXXXX" {...register('numeroContenedor')} />
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Fecha Límite Puerto (Stacking)</label>
                           <Input type="datetime-local" {...register('fechaHoraLimitePuerto')} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Certificación</label>
                          <select {...register('certificacion')} className="w-full h-12 rounded-xl border border-blue-200 bg-white px-4 text-xs font-bold uppercase">
                            <option value="">Ninguna</option>
                            <option value="GlobalGAP">GlobalGAP</option>
                            <option value="Fairtrade">Fairtrade</option>
                            <option value="Orgánico">Orgánico</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">EUDR Compliance</label>
                          <select {...register('eudr')} className="w-full h-12 rounded-xl border border-blue-200 bg-white px-4 text-xs font-bold uppercase">
                            <option value="no">No requerido</option>
                            <option value="yes">Cumple EUDR</option>
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </CardContent>

                <CardFooter className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col gap-6">
                  {Object.keys(errors).length > 0 && (
                    <div className="w-full p-6 bg-red-50 border border-red-100 rounded-[2rem] flex items-center gap-4">
                      <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />
                      <div>
                        <p className="text-sm font-black text-red-900 uppercase">Faltan datos críticos</p>
                        <p className="text-xs text-red-600 font-medium italic">Revisa los campos en rojo para poder publicar la carga.</p>
                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className={cn(
                      "w-full h-20 text-2xl font-black italic rounded-3xl shadow-2xl transition-all uppercase tracking-tight",
                      isValid ? "bg-slate-900 hover:bg-black text-white" : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    )}
                    isLoading={isLoading}
                  >
                    Publicar Operación Logística
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

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
