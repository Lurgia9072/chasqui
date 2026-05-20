import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { 
  Compass, Shield, AlertTriangle, Play, Pause, ChevronRight, Activity, 
  MapPin, RefreshCw, Battery, Radio, Gauge, Thermometer, Database
} from 'lucide-react';
import { EnterpriseVehicle } from '../../pages/enterprise/EnterpriseTypes';

// Fix Leaflet icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom markers for Control Tower
const vehicleNormalIcon = L.divIcon({
  html: `<div class="w-8 h-8 bg-indigo-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white">
           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-4l-3-4h-5"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
         </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const vehicleAlertIcon = L.divIcon({
  html: `<div class="w-9 h-9 bg-rose-500 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white animate-bounce">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
         </div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

interface ControlTowerMapProps {
  organizationId?: string;
  vehicles: EnterpriseVehicle[];
  onAddAlertLog: (log: string) => void;
}

export const ControlTowerMap: React.FC<ControlTowerMapProps> = ({ 
  organizationId, 
  vehicles, 
  onAddAlertLog 
}) => {
  const [activeTab, setActiveTab] = useState<'live' | 'playback' | 'geofences'>('live');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('v1');
  const [playbackActive, setPlaybackActive] = useState<boolean>(false);
  const [playbackIndex, setPlaybackIndex] = useState<number>(0);
  const [isHeatmapEnabled, setIsHeatmapEnabled] = useState<boolean>(false);
  
  // High-frequency telemetry status
  const [telemetry, setTelemetry] = useState({
    precisionGps: '98.4%',
    velocidadPromedio: '62 km/h',
    tiempoActivo: '14 hrs 32m',
    bateriaGPS: '92%',
    sensoresConectados: 12
  });

  // Intercepting coordinates for polyline playback (Piura - Lima road)
  const trajectoryCoords: [number, number][] = [
    [-5.1945, -80.6279], // Piura
    [-6.7714, -79.8441], // Chiclayo
    [-8.1160, -79.0298], // Trujillo
    [-9.0743, -78.5937], // Chimbote
    [-10.0689, -78.1522], // Huarmey
    [-11.1085, -77.6105], // Huacho
    [-12.0464, -77.0428]  // Lima
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (playbackActive) {
      interval = setInterval(() => {
        setPlaybackIndex(prev => {
          if (prev >= trajectoryCoords.length - 1) {
            setPlaybackActive(false);
            onAddAlertLog('[INFO] Reproducción de trazabilidad histórica de ruta completada para placa F2W-894.');
            return 0;
          }
          return prev + 1;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [playbackActive]);

  const activeVehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];

  return (
    <div className="grid gap-6 lg:grid-cols-12 bg-slate-900/40 p-1.5 rounded-2xl">
      {/* Control Tower Left Panel (4 col) */}
      <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-2xl">
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Torre de Control Real</span>
              </h3>
              <p className="text-[11px] text-slate-400">Telemática Integrada de Flota</p>
            </div>
            <button 
              onClick={() => onAddAlertLog(`[TELEMETRÍA] Barrido telemétrico finalizado. ${vehicles.length} camiones con enlace satelital activo.`)}
              className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Subtabs nested */}
          <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg text-[10px] font-bold">
            <button 
              className={`py-1.5 rounded transition ${activeTab === 'live' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              onClick={() => setActiveTab('live')}
            >
              Vivo (Telemática)
            </button>
            <button 
              className={`py-1.5 rounded transition ${activeTab === 'playback' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              onClick={() => setActiveTab('playback')}
            >
              Playback
            </button>
            <button 
              className={`py-1.5 rounded transition ${activeTab === 'geofences' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              onClick={() => {
                setActiveTab('geofences');
                onAddAlertLog('[INFO] Cargador de Geocercas: 4 polígonos industriales vigentes (Callao, Piura, Lurín, Trujillo).');
              }}
            >
              Geocercas
            </button>
          </div>

          {/* Vehicle List list box */}
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">Unidades Seleccionables</p>
            {vehicles.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVehicleId(v.id)}
                className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                  selectedVehicleId === v.id 
                    ? 'bg-slate-900 border-indigo-500/50 shadow' 
                    : 'bg-slate-90/50 border-slate-850 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div className={`p-1.5 rounded-full ${v.estado === 'incidencia' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-300'}`}>
                    <Radio className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold font-mono text-white">{v.placa}</h5>
                    <p className="text-[10px] text-slate-400">Capacidad: {v.capacidad}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                    v.estado === 'viaje' ? 'bg-emerald-500/10 text-emerald-400' : (v.estado === 'incidencia' ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-slate-800 text-slate-500')
                  }`}>
                    {v.estado}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected vehicle diagnostic details */}
        {activeVehicle && (
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 space-y-3.5">
            <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-indigo-400" />
                <span>Telemática: {activeVehicle.placa}</span>
              </span>
              <span className="font-mono text-slate-400 text-[10px]">915 Mhz Sat</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="bg-slate-950 p-2 rounded border border-slate-850">
                <span className="text-slate-500 block">Velocidad</span>
                <span className="text-white font-bold text-xs flex items-center gap-1 mt-0.5">
                  <Gauge className="h-3.5 w-3.5 text-blue-400" />
                  <span>{activeVehicle.estado === 'viaje' ? '68 km/h' : '0 km/h'}</span>
                </span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-850">
                <span className="text-slate-500 block">Combustible</span>
                <span className="text-white font-bold text-xs flex items-center gap-1 mt-0.5">
                  <Battery className="h-3.5 w-3.5 text-amber-500" />
                  <span>{activeVehicle.combustibleNivel}%</span>
                </span>
              </div>
              
              {activeVehicle.temperaturaActual !== undefined && (
                <div className="bg-slate-950 p-2 rounded border border-slate-850 col-span-2">
                  <span className="text-slate-500 block">Cadena de Frío Activa</span>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-white font-bold text-xs flex items-center gap-1">
                      <Thermometer className="h-3.5 w-3.5 text-sky-400" />
                      <span>{activeVehicle.temperaturaActual.toFixed(1)} °C</span>
                    </span>
                    <span className="text-[9px] text-slate-400">Set: {activeVehicle.temperaturaSet || -18.0} °C</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Control Tower Real Interactive Map Panel (8 col) */}
      <div className="lg:col-span-8 bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between shadow-2xl min-h-[440px]">
        <div className="flex justify-between items-center mb-3 text-xs">
          <h4 className="font-bold text-white flex items-center gap-2">
            <Compass className="h-4 w-4 text-emerald-400 animate-spin-slow" />
            <span>Mapeo Satelital de Unidades</span>
          </h4>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-slate-400 text-[10px] cursor-pointer">
              <input 
                type="checkbox" 
                checked={isHeatmapEnabled}
                onChange={() => setIsHeatmapEnabled(!isHeatmapEnabled)}
                className="rounded border-slate-800 text-indigo-600 bg-slate-900 focus:ring-0 cursor-pointer" 
              />
              <span>Filtro de Densidad (Heatmap)</span>
            </label>
            <span className="bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px] font-mono">
              ACTIVOS: {vehicles.filter(v => v.estado === 'viaje').length} / {vehicles.length}
            </span>
          </div>
        </div>

        {/* Real Leaflet Map */}
        <div className="relative flex-1 rounded-xl border border-slate-800 overflow-hidden min-h-[320px]">
          <MapContainer 
            center={[-9.0, -78.0]} 
            zoom={6} 
            scrollWheelZoom={true} 
            className="w-full h-full z-0"
            style={{ minHeight: '340px' }}
          >
            {/* Dark Mode Tiles styling utilizing thunderforest or cartodb */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {/* Render selected route playback */}
            {activeTab === 'playback' && (
              <>
                <Polyline 
                  positions={trajectoryCoords} 
                  color="#6366f1" 
                  weight={3} 
                  dashArray="4, 10" 
                />
                <Marker position={trajectoryCoords[playbackIndex]} icon={vehicleNormalIcon}>
                  <Popup>
                    <div className="text-slate-950 font-sans p-1">
                      <h4 className="font-bold text-xs">F2W-894 (Histórico)</h4>
                      <p className="text-[9px] text-slate-500 mt-1">Simulación de Trazado de GPS</p>
                    </div>
                  </Popup>
                </Marker>
              </>
            )}

            {/* Geofence Circles */}
            {activeTab === 'geofences' && (
              <>
                {/* Chiclayo Sede */}
                <Marker position={[-6.7714, -79.8441]} icon={vehicleAlertIcon}>
                  <Popup>
                    <div className="text-slate-950 p-1">
                      <b className="text-xs">Geocerca Chiclayo Norte</b>
                      <p className="text-[10px] mt-1">Autorización obligatoria para apertura de contenedor.</p>
                    </div>
                  </Popup>
                </Marker>

                {/* Sede Callao */}
                <Marker position={[-12.0464, -77.0428]} icon={vehicleNormalIcon}>
                  <Popup>
                    <div className="text-slate-950 p-1">
                      <b className="text-xs">Sede Hub Callao</b>
                      <p className="text-[10px] mt-1">Área autorizada de carga internacional.</p>
                    </div>
                  </Popup>
                </Marker>
              </>
            )}

            {/* Dynamic Real Vehicle Markers */}
            {activeTab === 'live' && vehicles.map((v, idx) => {
              // Interpolating mock coordinates so markers exist around Peru Coast Roads
              const latLngs: [number, number][] = [
                [-12.0464, -77.0428], // Lima
                [-8.1160, -79.0298], // Trujillo
                [-10.0689, -78.1522], // Huarmey
                [-5.1945, -80.6279], // Piura
              ];
              const coords = latLngs[idx % latLngs.length];

              return (
                <Marker 
                  key={v.id} 
                  position={coords} 
                  icon={v.estado === 'incidencia' ? vehicleAlertIcon : vehicleNormalIcon}
                >
                  <Popup>
                    <div className="text-slate-950 font-sans p-1.5 min-w-[140px]">
                      <div className="flex justify-between items-center border-b pb-1 mb-1">
                        <strong className="text-xs font-mono">{v.placa}</strong>
                        <span className="text-[8px] uppercase bg-slate-900 text-white rounded px-1.5 py-0.5">{v.estado}</span>
                      </div>
                      <p className="text-[10px]">T. Set: {v.temperaturaSet}°C</p>
                      <p className="text-[10px]">T. Act: {v.temperaturaActual}°C</p>
                      <p className="text-[10px]">Combustible: {v.combustibleNivel}%</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Map floating controllers */}
          {activeTab === 'playback' && (
            <div className="absolute top-3 left-14 bg-slate-950/90 border border-slate-800 p-2.5 rounded-xl flex items-center gap-3 z-10 shadow-2xl">
              <button 
                onClick={() => setPlaybackActive(!playbackActive)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg flex items-center justify-center transition"
              >
                {playbackActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <div className="text-[10px] font-mono">
                <span className="text-white block font-bold">Historial de Ruta Panamericana</span>
                <span className="text-slate-400">Punto {playbackIndex + 1} de {trajectoryCoords.length}</span>
              </div>
            </div>
          )}

          {/* Heatmap overlay when checked */}
          {isHeatmapEnabled && (
            <div className="absolute inset-0 bg-yellow-500/10 pointer-events-none z-10 flex items-center justify-center border-4 border-yellow-500/20">
              <span className="text-[10px] bg-slate-950 text-yellow-400 border border-yellow-500/40 px-3 py-1.5 rounded-full uppercase tracking-widest font-black font-mono">
                Mock Heatmap Overlay Activo (Zonas de Incidentes Frecuentes)
              </span>
            </div>
          )}
        </div>
        
        {/* Footprint informational bar */}
        <div className="mt-3 bg-slate-900 border border-slate-850 p-3 rounded-xl flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-indigo-400" />
              <span>Precisión GPS: <b>{telemetry.precisionGps}</b></span>
            </span>
            <span className="flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5 text-blue-400" />
              <span>Vel. Promedio Flota: <b>{telemetry.velocidadPromedio}</b></span>
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            Samsara, Onfleet & Motive Web-bridge Activo
          </span>
        </div>
      </div>
    </div>
  );
};
