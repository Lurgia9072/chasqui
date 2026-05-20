import React, { useState } from 'react';
import { 
  Wrench, ShieldCheck, AlertCircle, Plus, Calendar, 
  Trash2, Gauge, CheckSquare, Sparkles, Filter 
} from 'lucide-react';
import { EnterpriseVehicle } from '../../pages/enterprise/EnterpriseTypes';

interface FleetManagementProps {
  organizationId?: string;
  vehicles: EnterpriseVehicle[];
  onAddVehicle: (e: React.FormEvent) => void;
  onDeleteVehicle: (id: string) => void;
  newVehicle: { placa: string; tipo: 'refrigerado' | 'seco' | 'cortina' | 'plataforma'; capacidad: string; conductorId: string };
  setNewVehicle: React.Dispatch<React.SetStateAction<{ placa: string; tipo: 'refrigerado' | 'seco' | 'cortina' | 'plataforma'; capacidad: string; conductorId: string }>>;
  onAddAlertLog: (log: string) => void;
}

interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  tipo: 'preventivo' | 'correctivo' | 'inspeccion';
  descripcion: string;
  costo: number;
  kilometraje: number;
  fecha: string;
  banco: string;
}

export const FleetManagement: React.FC<FleetManagementProps> = ({
  organizationId,
  vehicles,
  onAddVehicle,
  onDeleteVehicle,
  newVehicle,
  setNewVehicle,
  onAddAlertLog
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'todos' | 'refrigerado' | 'incidencia'>('todos');
  
  // Advanced fleet maintenance storage
  const [records, setRecords] = useState<MaintenanceRecord[]>([
    { id: 'rec_1', vehicleId: 'v1', tipo: 'preventivo', descripcion: 'Cambio de filtros de furgón frío ThermoKing y aceite mineral', costo: 1250, kilometraje: 45200, fecha: '2026-05-10', banco: 'BCP' },
    { id: 'rec_2', vehicleId: 'v2', tipo: 'inspeccion', descripcion: 'Inspección de calibración de sensores telemáticos de cola y humedad', costo: 320, kilometraje: 28900, fecha: '2026-05-14', banco: 'BBVA' },
  ]);

  const [newRecord, setNewRecord] = useState({
    vehicleId: 'v1',
    tipo: 'preventivo' as 'preventivo' | 'correctivo' | 'inspeccion',
    descripcion: '',
    costo: 350,
    kilometraje: 12000,
    fecha: new Date().toISOString().split('T')[0]
  });

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.descripcion) return;

    const entry: MaintenanceRecord = {
      id: `rec_${Date.now()}`,
      vehicleId: newRecord.vehicleId,
      tipo: newRecord.tipo,
      descripcion: newRecord.descripcion,
      costo: Number(newRecord.costo),
      kilometraje: Number(newRecord.kilometraje),
      fecha: newRecord.fecha,
      banco: 'Local Caja/SaaS'
    };

    setRecords(prev => [entry, ...prev]);
    onAddAlertLog(`[FLOTA] Registro de mantenimiento agregado para vehículo ${newRecord.vehicleId}: ${newRecord.descripcion}`);
    setNewRecord({ vehicleId: 'v1', tipo: 'preventivo', descripcion: '', costo: 350, kilometraje: 12000, fecha: new Date().toISOString().split('T')[0] });
  };

  const filteredVehicles = vehicles.filter(v => {
    if (activeFilter === 'todos') return true;
    if (activeFilter === 'refrigerado') return v.tipo === 'refrigerado';
    if (activeFilter === 'incidencia') return v.estado === 'incidencia';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <Wrench className="h-5 w-5 text-indigo-400" />
            <span>Mantenimiento & Telemetría Reglada de Flotas</span>
          </h3>
          <p className="text-xs text-slate-400">Soporte técnico, SOAT, MTC y alertas preventivas de sub-unidades.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filters */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs font-bold text-slate-400">
            <button 
              className={`px-3 py-1.5 rounded transition ${activeFilter === 'todos' ? 'bg-indigo-600 text-white' : 'hover:text-white'}`}
              onClick={() => setActiveFilter('todos')}
            >
              Todos
            </button>
            <button 
              className={`px-3 py-1.5 rounded transition ${activeFilter === 'refrigerado' ? 'bg-indigo-600 text-white' : 'hover:text-white'}`}
              onClick={() => setActiveFilter('refrigerado')}
            >
              Fríos
            </button>
            <button 
              className={`px-3 py-1.5 rounded transition ${activeFilter === 'incidencia' ? 'bg-indigo-600 text-white' : 'hover:text-white'}`}
              onClick={() => setActiveFilter('incidencia')}
            >
              Alertas
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(prev => !prev)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow transition-all font-sans"
          >
            <Plus className="h-4 w-4" />
            <span>Agregar Vehículo</span>
          </button>
        </div>
      </div>

      {showAddModal && (
        <form onSubmit={(e) => { onAddVehicle(e); setShowAddModal(false); }} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl grid gap-4 sm:grid-cols-4 items-end shadow-2xl transition-all">
          <div className="sm:col-span-1">
            <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5">Placa del Vehículo</label>
            <input 
              type="text" 
              placeholder="PE-8945" 
              required
              value={newVehicle.placa}
              onChange={(e) => setNewVehicle(prev => ({ ...prev, placa: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs focus:ring-0 focus:border-indigo-500 font-mono"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5">Tipo de Furgón</label>
            <select
              value={newVehicle.tipo}
              onChange={(e: any) => setNewVehicle(prev => ({ ...prev, tipo: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs focus:ring-0 focus:border-indigo-500"
            >
              <option value="refrigerado">Refrigerado (ColdChain)</option>
              <option value="seco">Seco Carga General</option>
              <option value="cortina">Cortina Lateral</option>
              <option value="plataforma">Plataforma Abierta</option>
            </select>
          </div>
          <div className="sm:col-span-1">
            <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5">Tonelaje/Capacidad</label>
            <input
              type="text"
              placeholder="12 Toneladas"
              required
              value={newVehicle.capacidad}
              onChange={(e) => setNewVehicle(prev => ({ ...prev, capacidad: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs focus:ring-0 focus:border-indigo-500"
            />
          </div>
          <div className="sm:col-span-1 flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition"
            >
              Registrar Placa
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-white px-2.5 py-2.5 rounded-xl text-xs transition"
            >
              X
            </button>
          </div>
        </form>
      )}

      {/* Grid: Vehicles list cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredVehicles.map(v => (
          <div key={v.id} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden group">
            {v.estado === 'incidencia' && (
              <div className="absolute top-0 inset-x-0 h-1 bg-rose-500 animate-pulse" />
            )}
            
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] uppercase font-black text-indigo-400 bg-indigo-505/10 rounded px-1.5 py-0.5 tracking-wider">{v.tipo}</span>
                  <h4 className="text-xl font-black font-mono text-white mt-1.5">{v.placa}</h4>
                  <p className="text-slate-400 text-xs mt-0.5">Capacidad: {v.capacidad}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    v.estado === 'viaje' ? 'bg-emerald-500 shadow-emerald-500/50' : (v.estado === 'incidencia' ? 'bg-rose-500 animate-ping' : 'bg-slate-500')
                  }`} />
                  <span className="text-[10px] font-bold text-slate-300 capitalize font-mono text-slate-400">{v.estado}</span>
                </div>
              </div>

              {/* Countdown regulatory metrics */}
              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-850 space-y-2 text-[10px] font-mono">
                <span className="text-slate-500 block text-[9px] uppercase font-black tracking-widest mb-1.5">Vencimientos Regulatorios</span>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">SOAT Nacional (La Positiva)</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> Vigente: 182 días
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Inspección Técnica (MTC Vía)</span>
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-amber-500" /> Alerta: 22 días
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Permiso Especial de Puertos</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> Vigente
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-900 flex justify-between items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500">Chofer: {v.conductorId}</span>
              <button
                onClick={() => onDeleteVehicle(v.id)}
                className="hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 p-2 rounded-lg transition"
                title="Quitar camión de flota telemática"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Fleet Maintenance Form & Logs Tracker */}
      <div className="grid gap-6 md:grid-cols-12 bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="md:col-span-5 space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-850 pb-2">
            <Wrench className="h-4 w-4 text-indigo-400" />
            <span>Programar Mantenimiento Preventivo</span>
          </h4>

          <form onSubmit={handleAddRecord} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Elegir Camión de Flota</label>
              <select
                value={newRecord.vehicleId}
                onChange={(e) => setNewRecord(prev => ({ ...prev, vehicleId: e.target.value }))}
                className="w-full bg-slate-900 text-white border border-slate-800 p-2.5 rounded-xl text-xs focus:ring-0 focus:border-indigo-500"
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.placa}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Tipo Servicio</label>
                <select
                  value={newRecord.tipo}
                  onChange={(e: any) => setNewRecord(prev => ({ ...prev, tipo: e.target.value }))}
                  className="w-full bg-slate-900 text-white border border-slate-800 p-2.5 rounded-xl text-xs focus:ring-0"
                >
                  <option value="preventivo">Preventivo</option>
                  <option value="correctivo">Correctivo</option>
                  <option value="inspeccion">Inspección telemática</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Costo Estimado (S/.)</label>
                <input
                  type="number"
                  value={newRecord.costo}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, costo: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs focus:ring-0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Odometer (km)</label>
                <input
                  type="number"
                  value={newRecord.kilometraje}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, kilometraje: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs focus:ring-0"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Fecha Agenda</label>
                <input
                  type="date"
                  value={newRecord.fecha}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, fecha: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs focus:ring-0"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Servicios Ejecutados / Observaciones</label>
              <textarea
                value={newRecord.descripcion}
                onChange={(e) => setNewRecord(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="P.ej. Lubricación, purga de gas refrigerante R404a, inspección telemática de sensores de puerta de cabina..."
                required
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs h-16 resize-none focus:ring-0 focus:border-indigo-500 font-sans"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition"
            >
              Confirmar Operación en Libro Técnico
            </button>
          </form>
        </div>

        {/* Maintenance timeline logs */}
        <div className="md:col-span-7 space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-850 pb-2">
            <Gauge className="h-4 w-4 text-emerald-400" />
            <span>Acciones Recientes y Registro Técnico</span>
          </h4>

          <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1 text-xs">
            {records.map(rec => (
              <div key={rec.id} className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-white text-xs">{rec.vehicleId.toUpperCase()}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                      rec.tipo === 'preventivo' ? 'bg-indigo-500/10 text-indigo-400' : (rec.tipo === 'correctivo' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400')
                    }`}>{rec.tipo}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] mt-1.5 leading-relaxed">{rec.descripcion}</p>
                  <span className="text-[10px] font-mono text-slate-500 block mt-2">Lectura: {rec.kilometraje.toLocaleString()} km  |  Medio: {rec.banco}</span>
                </div>
                <div className="text-right">
                  <span className="text-white font-extrabold font-mono text-xs block">S/. {rec.costo}</span>
                  <span className="text-[10px] font-mono text-slate-500 mt-1 block">{rec.fecha}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
