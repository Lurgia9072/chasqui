import React, { useState } from 'react';
import { 
  Plus, Users, Phone, Mail, Award, X, Trash2, 
  MapPin, ShieldAlert, CheckCircle2, MessageSquare, Star, Settings2, Info
} from 'lucide-react';
import { EnterpriseCarrier } from '../../pages/enterprise/EnterpriseTypes';

interface EnterpriseCarriersProps {
  carriers: EnterpriseCarrier[];
  onAddCarrier: (carrierData: Omit<EnterpriseCarrier, 'id'>) => Promise<any>;
  onRemoveCarrier: (id: string) => Promise<any>;
  onOpenDirectChat?: (carrierName: string) => void;
}

export const EnterpriseCarriers: React.FC<EnterpriseCarriersProps> = ({
  carriers,
  onAddCarrier,
  onRemoveCarrier,
  onOpenDirectChat
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCarrier, setNewCarrier] = useState({
    name: '',
    ruc: '',
    telefono: '',
    email: '',
    flotaSize: 15,
    operacionZonas: 'Nacional',
    slaPercent: 98.4,
    viajesConcretados: 0,
    documentosVigentes: true,
    contactoNombre: '',
    estadoStr: 'activo' as any
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddCarrier(newCarrier);
    setShowAddModal(false);
    // Reset
    setNewCarrier({
      name: '',
      ruc: '',
      telefono: '',
      email: '',
      flotaSize: 15,
      operacionZonas: 'Nacional',
      slaPercent: 98.4,
      viajesConcretados: 0,
      documentosVigentes: true,
      contactoNombre: '',
      estadoStr: 'activo'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Row */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-1.5 font-sans">
            <Users className="h-5 w-5 text-indigo-400" />
            <span>Directorio de Transportistas de Cárga Asociados</span>
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">Vincule empresas transportistas homologadas, Supervise SLAs y audite vigencia de pólizas.</p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-505 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition hover:bg-indigo-500"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Vincular Transportista Partner</span>
        </button>
      </div>

      {/* Info Warning Hub */}
      <div className="bg-indigo-950/20 border border-indigo-950/40 p-4 rounded-xl flex gap-3 text-xs leading-relaxed">
        <Info className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-slate-300">
          <p className="font-bold text-white">SLA Homologado y Compliance Operativo</p>
          <p className="mt-1 text-slate-400 text-[11px]">Todas las flotas y transportistas autorizados en este panel deben registrar y mantener actualizados sus certificados de SOAT, habilitación vehicular del MTC y revisiones técnicas obligatorias. La falta de estos inhabilitará los tránsitos automáticamente.</p>
        </div>
      </div>

      {/* Grid listing of associated carriers */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {carriers.length === 0 ? (
          <div className="md:col-span-3 text-center p-12 bg-slate-950 rounded-2xl border border-slate-800 border-dashed text-slate-400 font-sans">
            <p className="font-semibold text-sm">No hay transportistas vinculados bajo su organización corporativa.</p>
            <p className="text-xs text-slate-500 mt-1">Haga clic en Vincular para registrar su primera flota homologada.</p>
          </div>
        ) : (
          carriers.map(c => (
            <div key={c.id} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div className="flex justify-between items-start border-b border-slate-900 pb-3 mb-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 font-mono">RUC: {c.ruc}</span>
                    <h4 className="font-bold text-white text-base mt-0.5">{c.name}</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                    c.estadoStr === 'activo' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-slate-850 text-slate-400'
                  }`}>
                    {c.estadoStr}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                  <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-900">
                    <span className="text-[9px] uppercase font-bold text-slate-550 block">Flota Disponible</span>
                    <span className="font-bold text-slate-300 mt-0.5 block">{c.flotaSize} Camiones</span>
                  </div>
                  <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-900">
                    <span className="text-[9px] uppercase font-bold text-slate-550 block">SLA Global</span>
                    <span className="font-black text-indigo-400 font-mono mt-0.5 block text-xs">{c.slaPercent}%</span>
                  </div>
                  <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-900 col-span-2">
                    <span className="text-[9px] uppercase font-bold text-slate-550 block">Zonas Cobertura</span>
                    <span className="font-semibold text-slate-300 text-[11px] block mt-0.5">{c.operacionZonas}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-900 pt-3 pb-4">
                  <div className="flex justify-between">
                    <span className="text-[10px] text-slate-550">Contacto Principal:</span>
                    <span className="font-semibold text-slate-300">{c.contactoNombre}</span>
                  </div>
                  <div className="flex justify-between font-mono text-[10.5px]">
                    <span className="text-[10px] text-slate-550 font-sans">Tlf:</span>
                    <span>{c.telefono}</span>
                  </div>
                  <div className="flex justify-between font-mono text-[10.5px]">
                    <span className="text-[10px] text-slate-550 font-sans">Email:</span>
                    <span className="truncate max-w-[200px]">{c.email}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-900 pt-3 flex justify-between items-center text-xs">
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  <span className="font-bold text-slate-400">{(c.slaPercent / 20).toFixed(1)} Stars</span>
                </div>

                <div className="flex gap-2">
                  {onOpenDirectChat && (
                    <button
                      onClick={() => onOpenDirectChat(c.name)}
                      className="bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/10 font-bold px-2.5 py-1.5 rounded-lg text-[10px] uppercase flex items-center gap-1 transition shrink-0"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Chat Directo</span>
                    </button>
                  )}
                  <button
                    onClick={() => onRemoveCarrier(c.id)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-550 hover:text-red-400 transition"
                    title="Desvincular Partner"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ADD CARRIER POPUP MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 text-slate-100 shadow-2xl relative">
            <h4 className="text-base font-black text-white border-b border-slate-900 pb-3 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-455" />
              <span>Homologar Cuenta de Transportista</span>
            </h4>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Razón Social Corporativa</label>
                <input
                  type="text"
                  required
                  value={newCarrier.name}
                  onChange={e => setNewCarrier({ ...newCarrier, name: e.target.value })}
                  placeholder="Ej. Líneas Terrestres del Sur SAC"
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">RUC (11 dígitos)</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={newCarrier.ruc}
                    onChange={e => setNewCarrier({ ...newCarrier, ruc: e.target.value })}
                    placeholder="20503029182"
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-white font-mono focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Flota Nominal</label>
                  <input
                    type="number"
                    value={newCarrier.flotaSize}
                    onChange={e => setNewCarrier({ ...newCarrier, flotaSize: Number(e.target.value) })}
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Zonas de Cobertura</label>
                  <input
                    type="text"
                    value={newCarrier.operacionZonas}
                    onChange={e => setNewCarrier({ ...newCarrier, operacionZonas: e.target.value })}
                    placeholder="Norte, Centro, Sur"
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">SLA Inicial %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newCarrier.slaPercent}
                    onChange={e => setNewCarrier({ ...newCarrier, slaPercent: Number(e.target.value) })}
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Nombre de Contacto Directo</label>
                <input
                  type="text"
                  required
                  value={newCarrier.contactoNombre}
                  onChange={e => setNewCarrier({ ...newCarrier, contactoNombre: e.target.value })}
                  placeholder="Ej. Roberto Gómez (Gerente de Operaciones)"
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Teléfono Contacto</label>
                  <input
                    type="text"
                    value={newCarrier.telefono}
                    onChange={e => setNewCarrier({ ...newCarrier, telefono: e.target.value })}
                    placeholder="982312051"
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Correo Electrónico</label>
                  <input
                    type="email"
                    value={newCarrier.email}
                    onChange={e => setNewCarrier({ ...newCarrier, email: e.target.value })}
                    placeholder="roberto@transportes.com"
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-white"
                  />
                </div>
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
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl shadow-lg"
                >
                  Confirmar Enlace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
