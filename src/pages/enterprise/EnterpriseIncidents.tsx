import React, { useState } from 'react';
import { 
  AlertTriangle, Plus, X, ShieldAlert, CheckCircle2, 
  Clock, ArrowRight, UserCheck, AlertOctagon, HelpCircle
} from 'lucide-react';
import { EnterpriseIncident, EnterpriseCargo } from '../../pages/enterprise/EnterpriseTypes';

interface EnterpriseIncidentsProps {
  incidents: EnterpriseIncident[];
  cargos: EnterpriseCargo[];
  onAddIncident: (incidentData: Omit<EnterpriseIncident, 'id'>) => Promise<any>;
  onUpdateIncident: (id: string, updates: Partial<EnterpriseIncident>) => Promise<any>;
}

export const EnterpriseIncidents: React.FC<EnterpriseIncidentsProps> = ({
  incidents,
  cargos,
  onAddIncident,
  onUpdateIncident
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIncident, setNewIncident] = useState({
    cargoId: '',
    tipo: 'retraso' as any,
    gravedad: 'media' as any,
    descripcion: '',
    creadoPor: 'Mesa de Monitoreo GPS'
  });

  const [resolutionNote, setResolutionNote] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<EnterpriseIncident | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cargo = cargos.find(c => c.id === newIncident.cargoId);
    
    await onAddIncident({
      cargoId: newIncident.cargoId,
      cargoName: cargo ? cargo.nombreProducto : 'Carga General',
      tipo: newIncident.tipo,
      gravedad: newIncident.gravedad,
      descripcion: newIncident.descripcion,
      estado: 'abierto',
      creadoPor: newIncident.creadoPor,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    setShowAddModal(false);
    // Reset
    setNewIncident({
      cargoId: '',
      tipo: 'retraso',
      gravedad: 'media',
      descripcion: '',
      creadoPor: 'Mesa de Monitoreo GPS'
    });
  };

  const handleEscalateIncident = async (id: string) => {
    await onUpdateIncident(id, { estado: 'escalado', updatedAt: Date.now() });
    setSelectedIncident(prev => prev ? { ...prev, estado: 'escalado', updatedAt: Date.now() } : null);
  };

  const handleResolveIncident = async (id: string) => {
    if (!resolutionNote.trim()) return;
    await onUpdateIncident(id, { 
      estado: 'resuelto', 
      solucion: resolutionNote,
      updatedAt: Date.now() 
    });
    setResolutionNote('');
    setSelectedIncident(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Block Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-1.5 font-sans">
            <AlertOctagon className="h-5 w-5 text-red-500 animate-pulse" />
            <span>Mesa de Control de Alertas e Incidencias en Ruta</span>
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">Supervise desviaciones del plan de viaje, rupturas térmicas menores, y retornos de aduanas.</p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-red-650 hover:bg-red-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 border border-red-500/10 transition"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Reportar Alerta Crítica</span>
        </button>
      </div>

      {incidents.length === 0 ? (
        <div className="text-center p-12 bg-slate-950 rounded-2xl border border-slate-800 border-dashed text-slate-400 font-sans">
          <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
          <p className="font-semibold text-sm">Operación limpia. Cero incidentes reportados en ruta en este turno.</p>
          <p className="text-xs text-slate-500 mt-1">El centro de monitoreo por GPS no ha flagged ninguna anomalía de velocidad o temperatura.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {incidents.map(inc => {
            const isResolved = inc.estado === 'resuelto';
            const isEscalated = inc.estado === 'escalado';

            return (
              <div 
                key={inc.id} 
                className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex justify-between items-start pb-3.5 border-b border-slate-900 mb-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 font-mono">Trece ID: #{inc.id.substring(0, 8).toUpperCase()}</span>
                      <h4 className="font-bold text-white text-[13px] block mt-0.5">{inc.cargoName}</h4>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase text-center border ${
                      inc.gravedad === 'critica' ? 'bg-red-500/10 text-red-400 border-red-500/10' :
                      inc.gravedad === 'alta' ? 'bg-amber-500/10 text-amber-500 border-amber-500/10' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {inc.gravedad}
                    </span>
                  </div>

                  <p className="text-slate-350 text-xs mt-1.5 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-slate-900 mb-4 min-h-[64px]">
                    {inc.descripcion}
                  </p>

                  <div className="space-y-1.5 text-[11px] text-slate-400 font-sans">
                    <div className="flex justify-between">
                      <span className="text-slate-550">Tipo Reporte:</span>
                      <span className="font-bold uppercase text-slate-300">{inc.tipo.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-550">Informa:</span>
                      <span className="font-semibold">{inc.creadoPor}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-550 font-sans">Fecha:</span>
                      <span>{new Date(inc.createdAt).toLocaleString()}</span>
                    </div>
                    {inc.solucion && (
                      <div className="mt-3 bg-emerald-500/10 border border-emerald-500/10 p-2.5 rounded-lg text-emerald-400 text-xs">
                        <span className="font-black uppercase tracking-wider text-[9px] block">Acción de Solución:</span>
                        <p className="mt-0.5 font-sans leading-relaxed text-[11px]">{inc.solucion}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-900 mt-4 pt-3.5 flex justify-between items-center">
                  <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${
                    isResolved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                    isEscalated ? 'bg-rose-500/10 text-rose-450 border border-rose-500/10' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {inc.estado}
                  </span>

                  {!isResolved && (
                    <div className="flex gap-1.5">
                      {!isEscalated && (
                        <button
                          onClick={() => handleEscalateIncident(inc.id)}
                          className="bg-indigo-600/15 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-505/10 font-bold px-2 py-1 rounded text-[10px] uppercase transition"
                        >
                          Escalar
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedIncident(inc)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded text-[10px] uppercase transition"
                      >
                        Solucionar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAILED RESOLUTION INTERACTIVE DIALOG POPUP */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3 mb-4">
              <h4 className="text-base font-black text-white flex items-center gap-1.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span>Registrar Cierre de Incidencia</span>
              </h4>
              <button 
                onClick={() => setSelectedIncident(null)}
                className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-900">
                <span className="text-[9px] uppercase font-bold text-slate-550 block">Expediente Asociado</span>
                <span className="font-bold text-white block truncate mb-1 mt-0.5">{selectedIncident.cargoName}</span>
                <p className="text-slate-400 text-[11px] leading-relaxed mt-1">{selectedIncident.descripcion}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Nota de Solución Operativa (Acción Tomada)</label>
                <textarea
                  required
                  value={resolutionNote}
                  onChange={e => setResolutionNote(e.target.value)}
                  placeholder="Ej. Se solicitó auxilio técnico en ruta, regulando la válvula termosellada. Temperatura estabilizada a -18.1°C conforme."
                  className="w-full bg-slate-905 border border-slate-800 bg-slate-900 rounded-xl px-3 py-2 text-white h-24 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="pt-4 border-t border-slate-900 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="bg-slate-900 text-slate-400 font-bold px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-850"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!resolutionNote.trim()}
                  onClick={() => handleResolveIncident(selectedIncident.id)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl shadow-lg transition disabled:opacity-40"
                >
                  Cerrar Log Conforme
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE INCIDENT POPUP MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 text-slate-100 shadow-2xl">
            <h4 className="text-base font-black text-white border-b border-slate-900 pb-3 mb-4 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              <span>Reportar Nueva Alerta de Ruta</span>
            </h4>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Vincular a Embarque Logístico</label>
                <select
                  required
                  value={newIncident.cargoId}
                  onChange={e => setNewIncident({ ...newIncident, cargoId: e.target.value })}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-slate-300 focus:outline-none"
                >
                  <option value="">Seleccionar Embarque...</option>
                  {cargos.map(car => (
                    <option key={car.id} value={car.id}>
                      #{car.id.substring(0, 8).toUpperCase()} - {car.nombreProducto} ({car.estado})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Tipo de Anomalía</label>
                  <select
                    value={newIncident.tipo}
                    onChange={e => setNewIncident({ ...newIncident, tipo: e.target.value as any })}
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-slate-350 focus:outline-none"
                  >
                    <option value="retraso">Retraso de Tránsito</option>
                    <option value="desvio">Desvío de Ruta (GPS)</option>
                    <option value="temperatura">Pérdida de Frío (IoT)</option>
                    <option value="parada_sospechosa">Prada Sospechosa</option>
                    <option value="falla_mecanica">Falla de Alternador</option>
                    <option value="otra">Otra Contingencia</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Gravedad de Evento</label>
                  <select
                    value={newIncident.gravedad}
                    onChange={e => setNewIncident({ ...newIncident, gravedad: e.target.value as any })}
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-slate-355 focus:outline-none"
                  >
                    <option value="baja">Baja (Informativa)</option>
                    <option value="media">Media (Bajo Análisis)</option>
                    <option value="alta">Alta (Escalada)</option>
                    <option value="critica">Crítica (SOP Activado)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Descripción Detallada del Incidente</label>
                <textarea
                  required
                  value={newIncident.descripcion}
                  onChange={e => setNewIncident({ ...newIncident, descripcion: e.target.value })}
                  placeholder="Ej. Chofer reporta retención vial de 45 minutos por huelga agraria en Panamericana Km 142. Solicitamos ruta alterna para evitar pérdida de frío..."
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-white h-24 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Informa / Sensor Atribución</label>
                <input
                  type="text"
                  value={newIncident.creadoPor}
                  onChange={e => setNewIncident({ ...newIncident, creadoPor: e.target.value })}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-900 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-900 text-slate-400 font-bold px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-850"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-red-650 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-xl shadow-lg"
                >
                  Reportar Alerta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
