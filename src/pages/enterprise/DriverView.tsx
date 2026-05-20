import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, Play, Square, AlertOctagon, Camera, Wifi, 
  WifiOff, Send, Navigation, FileText, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { EnterpriseVehicle, EnterpriseDriver } from '../../pages/enterprise/EnterpriseTypes';
import { queueOfflineEvent } from '@/src/services/EnterpriseService';

interface DriverViewProps {
  organizationId: string;
  drivers: EnterpriseDriver[];
  vehicles: EnterpriseVehicle[];
  isOnline: boolean;
  onAddAlertLog: (log: string) => void;
}

export const DriverView: React.FC<DriverViewProps> = ({
  organizationId,
  drivers,
  vehicles,
  isOnline,
  onAddAlertLog
}) => {
  const [activeDriver, setActiveDriver] = useState<string>('d1');
  const [activeVehicle, setActiveVehicle] = useState<string>('v1');
  
  // Trip control hooks
  const [inTrip, setInTrip] = useState<boolean>(false);
  const [recojoChecklist, setRecojoChecklist] = useState({
    lucesOperativas: false,
    llantasPresion: false,
    frenosProbados: false,
    combustibleSuficiente: false,
    documentosRegla: false
  });
  
  const [entregaChecklist, setEntregaChecklist] = useState({
    mercaderiaIntegra: false,
    firmaRecibo: false,
    guiasFirmadas: false,
    cadenaFrioIntacta: false
  });

  const [incidentInput, setIncidentInput] = useState({
    categoria: 'retraso_vias',
    detalles: '',
    gravedad: 'media'
  });

  const [evidencePhoto, setEvidencePhoto] = useState<string>('');
  const [showChecklistError, setShowChecklistError] = useState<boolean>(false);
  const [gpsSimActive, setGpsSimActive] = useState<boolean>(true);
  const [stepInfo, setStepInfo] = useState<string>('Selecciona iniciar viaje para recibir ruta de despacho.');

  // Simulated GPS background watcher
  useEffect(() => {
    let watchId: number;
    if (gpsSimActive && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (inTrip) {
            // Log real latitude and longitude background coordinates if online, or queue them offline!
            const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
            if (!isOnline) {
              queueOfflineEvent({
                action: 'GPS_UPDATE',
                orgId: organizationId,
                tripId: 'active_trip_sim',
                payload: { tripId: 'active_trip_sim', coords, temp: -18.4, fuel: 84 }
              });
            } else {
              onAddAlertLog(`[GPS REAL] Dispositivo telemático reportó nuevas coordenadas: Lat ${coords.lat.toFixed(5)}, Lng ${coords.lng.toFixed(5)}`);
            }
          }
        },
        (err) => console.warn('Background Geolocation watch error:', err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [gpsSimActive, inTrip, isOnline]);

  // Handle Photo selection simulator
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setEvidencePhoto(reader.result as string);
        onAddAlertLog('[DRIVER APP] Conductor adjuntó fotografía como evidencia digital.');
      };
      reader.readAsDataURL(file);
    }
  };

  // SOS Emergency Trigger
  const handleTriggerSOS = () => {
    onAddAlertLog('[🚨 BOTÓN DE EMERGENCIA SOS] ¡ALERTA ENVIADA! El chofer activó pánico en Lurín km 42 PN. Coordinadoras alertadas de inmediato.');
    alert('🚨 ¡SOS ACTIVADO! La Torre de Control y la policía de carreteras han sido notificadas del incidente con tu ubicación actual.');
  };

  // Iniciar viaje handler
  const handleStartTrip = () => {
    // Audit checklist first
    const checkedAll = Object.values(recojoChecklist).every(val => val === true);
    if (!checkedAll) {
      setShowChecklistError(true);
      return;
    }
    setShowChecklistError(false);
    setInTrip(true);
    setStepInfo('Viaje iniciado. Conduce con precaución. Destino: Almacenes Callao APM.');
    onAddAlertLog(`[CHOFER] Conductor ${activeDriver} inició viaje telemático con placa ${activeVehicle}. Sincronizando telemática.`);
  };

  // Finalizar viaje handler
  const handleEndTrip = () => {
    const checkedAll = Object.values(entregaChecklist).every(val => val === true);
    if (!checkedAll) {
      alert('Debes completar el checklist de entrega y verificación de mercadería para finalizar.');
      return;
    }
    setInTrip(false);
    setStepInfo('Viaje finalizado satisfactoriamente. Todos los soportes y checklists telemáticos se registraron.');
    onAddAlertLog(`[CHOFER] Conductor ${activeDriver} completó viaje telemático con placa ${activeVehicle}. Evidencia subida.`);
    
    // Reset checklists
    setRecojoChecklist({ lucesOperativas: false, llantasPresion: false, frenosProbados: false, combustibleSuficiente: false, documentosRegla: false });
    setEntregaChecklist({ mercaderiaIntegra: false, firmaRecibo: false, guiasFirmadas: false, cadenaFrioIntacta: false });
    setEvidencePhoto('');
  };

  // Incident Submit Handler
  const handleSubmitIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentInput.detalles) return;

    if (!isOnline) {
      queueOfflineEvent({
        action: 'INCIDENT_REPORT',
        orgId: organizationId,
        tripId: 'active_trip_sim',
        payload: { tripId: 'active_trip_sim', detalles: incidentInput.detalles, isDesvio: false }
      });
      onAddAlertLog('[OFFLINE COLA] Registrado reporte de incidente de camionero en cola local para sincronización rápida.');
    } else {
      onAddAlertLog(`[⚠️ INCIDENCIA CHOFER] Conductores reportan: ${incidentInput.detalles} (${incidentInput.gravedad.toUpperCase()})`);
    }

    setIncidentInput({ categoria: 'retraso_vias', detalles: '', gravedad: 'media' });
    alert('Reporte de incidente transferido al monitor del panel principal.');
  };

  return (
    <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 space-y-6 max-w-4xl mx-auto shadow-2xl">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></span>
            <span>Chasqui Chofer Pro v2.4</span>
          </h3>
          <p className="text-xs text-slate-400">Terminal móvil simplificado de operaciones en ruta</p>
        </div>
        <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full text-xs font-mono">
          {isOnline ? (
            <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
              <Wifi className="h-4 w-4" /> En Línea
            </span>
          ) : (
            <span className="text-rose-400 flex items-center gap-1.5 font-bold animate-pulse">
              <WifiOff className="h-4 w-4" /> Modo Fuera de Línea
            </span>
          )}
        </div>
      </div>

      {/* Driver Setup details selector */}
      {!inTrip && (
        <div className="grid gap-4 sm:grid-cols-2 bg-slate-900 p-4 rounded-xl border border-slate-850">
          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1.5">Elegir Chofer Activo</label>
            <select
              value={activeDriver}
              onChange={(e) => setActiveDriver(e.target.value)}
              className="w-full bg-slate-950 text-white border border-slate-800 p-2.5 rounded-xl text-xs focus:ring-0 focus:border-indigo-500"
            >
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.nombre} ({d.licencia})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1.5">Camión Asociado</label>
            <select
              value={activeVehicle}
              onChange={(e) => setActiveVehicle(e.target.value)}
              className="w-full bg-slate-950 text-white border border-slate-800 p-2.5 rounded-xl text-xs focus:ring-0 focus:border-indigo-500"
            >
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.placa} - {v.capacidad}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Current Navigation indicator */}
      <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-xl flex items-center gap-3.5">
        <div className="p-2.5 rounded-lg bg-indigo-600 text-white">
          <Navigation className="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <p className="text-indigo-400 text-[10px] uppercase tracking-wider font-bold font-mono">Direcciones en Curso</p>
          <p className="text-white text-xs font-bold font-sans mt-0.5">{stepInfo}</p>
        </div>
      </div>

      {/* Main actions grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* CHECKLISTS COMPONENT */}
        <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-850">
              <FileText className="h-4 w-4 text-indigo-400" />
              <span>{!inTrip ? '1. Checklist de Salida (Pre-Viaje)' : '2. Checklist de Entrega / Certificados'}</span>
            </h4>

            {showChecklistError && (
              <p className="text-[11px] text-rose-400 mt-2 font-mono">⚠️ Debes marcar todos los parámetros para certificar la salida del camión de terminal.</p>
            )}

            {/* Render Pre-Trip checklist */}
            {!inTrip ? (
              <div className="space-y-3 mt-4">
                {Object.keys(recojoChecklist).map((key) => (
                  <label key={key} className="flex items-center gap-3 text-slate-300 text-xs py-1.5 border-b border-slate-950 hover:text-white cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={(recojoChecklist as any)[key]}
                      onChange={(e) => setRecojoChecklist(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="rounded border-slate-800 text-indigo-600 bg-slate-900 focus:ring-0 cursor-pointer" 
                    />
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </label>
                ))}
              </div>
            ) : (
              // Active Trip: delivery checks
              <div className="space-y-3 mt-4">
                {Object.keys(entregaChecklist).map((key) => (
                  <label key={key} className="flex items-center gap-3 text-slate-300 text-xs py-1.5 border-b border-slate-950 hover:text-white cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={(entregaChecklist as any)[key]}
                      onChange={(e) => setEntregaChecklist(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="rounded border-slate-800 text-indigo-600 bg-slate-900 focus:ring-0 cursor-pointer" 
                    />
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </label>
                ))}

                {/* Simulated photo evidence selector */}
                <div className="pt-3">
                  <span className="block text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">3. Evidencia Fotográfica Digital</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 cursor-pointer text-xs font-bold transition">
                      <Camera className="h-4 w-4 text-slate-400" />
                      <span>{evidencePhoto ? 'Cambiar Foto' : 'Capturar Guía/Sello'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoSelect} 
                        className="hidden" 
                      />
                    </label>
                    {evidencePhoto && (
                      <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Cargado 1.2MB
                      </span>
                    )}
                  </div>
                  {evidencePhoto && (
                    <img 
                      src={evidencePhoto} 
                      alt="Compliance preview" 
                      className="mt-3 w-32 h-20 rounded-lg object-cover border border-slate-800" 
                      referrerPolicy="no-referrer" 
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="pt-6">
            {!inTrip ? (
              <button
                onClick={handleStartTrip}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/20 transition-all font-sans"
              >
                <Play className="h-4 w-4" />
                <span>INICIAR DESPACHO COMPLETO</span>
              </button>
            ) : (
              <button
                onClick={handleEndTrip}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/20 transition-all font-sans"
              >
                <Square className="h-4 w-4" />
                <span>CERTIFICAR CONFORMIDAD & ENTREGAR</span>
              </button>
            )}
          </div>
        </div>

        {/* INCIDENT REPORT & SOS PANE */}
        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-850">
              <AlertOctagon className="h-4 w-4 text-amber-500" />
              <span>Reportar Incidencia Operativa</span>
            </h4>

            <form onSubmit={handleSubmitIncident} className="space-y-4 mt-4">
              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Categoría del Fallo</label>
                <select
                  value={incidentInput.categoria}
                  onChange={(e) => setIncidentInput(prev => ({ ...prev, categoria: e.target.value }))}
                  className="w-full bg-slate-950 text-white border border-slate-800 p-2.5 rounded-xl text-xs focus:ring-0 focus:border-indigo-500"
                >
                  <option value="retraso_vias">Bloqueo de carretera o manifestaciones</option>
                  <option value="mecanico">Fallo mecánico pesado (Llantas/Motor)</option>
                  <option value="coldchain">Variación térmica en furgón frigorífico</option>
                  <option value="clima">Condición climática crítica (Neblina / Lluvia)</option>
                  <option value="inspeccion">Inspección de policía o aduana avanzada</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Gravedad Operacional</label>
                <div className="grid grid-cols-3 gap-2">
                  {['baja', 'media', 'alta'].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setIncidentInput(prev => ({ ...prev, gravedad: level }))}
                      className={`py-2 rounded-xl text-xs font-bold capitalize transition border ${
                        incidentInput.gravedad === level 
                          ? (level === 'alta' ? 'bg-rose-600 text-white border-rose-500' : 'bg-amber-600 text-white border-amber-500')
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Detalles en Vivo</label>
                <textarea
                  value={incidentInput.detalles}
                  onChange={(e) => setIncidentInput(prev => ({ ...prev, detalles: e.target.value }))}
                  placeholder="Describe qué sucede en carretera para notificar de inmediato a los operadores SaaS corporativos."
                  className="w-full bg-slate-950 text-white border border-slate-800 p-2.5 rounded-xl text-xs h-20 resize-none focus:ring-0 focus:border-indigo-500 font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={!incidentInput.detalles}
                className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Send className="h-3.5 w-3.5 text-slate-500" />
                <span>Transmitir Alerta a Sede</span>
              </button>
            </form>
          </div>

          {/* SOS RED BUTTON */}
          <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-3 bg-rose-500/20 rounded-full text-rose-500 animate-ping">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-white text-sm font-black uppercase tracking-wider">Botón de Pánico Crítico (SOS)</h4>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                Úsalo en caso de robo extremo, accidente vial grave o asalto. Transmite baliza de emergencia y enciende alarma en la Torre de Control nacional.
              </p>
            </div>
            <button
              onClick={handleTriggerSOS}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-4 rounded-xl text-sm transition-transform active:scale-95 shadow-lg shadow-rose-900/30 font-sans tracking-wide"
            >
              🚨 ACTIVAR ALERTA MÁXIMA SOS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
