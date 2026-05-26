import React, { useState } from 'react';
import { 
  Search, Plus, Filter, Calendar, MapPin, Thermometer, 
  Trash2, Copy, FileText, ChevronRight, X, AlertTriangle, 
  ArrowRight, Shield, CheckCircle2, DollarSign, Clock, ClipboardList, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EnterpriseCargo, EnterpriseCarrier } from '../../pages/enterprise/EnterpriseTypes';

interface EnterpriseCargosProps {
  cargos: EnterpriseCargo[];
  carriers: EnterpriseCarrier[];
  onSaveCargo: (cargoData: Omit<EnterpriseCargo, 'id'>) => Promise<any>;
  onUpdateCargo: (id: string, updates: Partial<EnterpriseCargo>) => Promise<any>;
  onRemoveCargo: (id: string) => Promise<any>;
  onDownloadPDF: (cargo: EnterpriseCargo) => void;
}

export const EnterpriseCargos: React.FC<EnterpriseCargosProps> = ({
  cargos,
  carriers,
  onSaveCargo,
  onUpdateCargo,
  onRemoveCargo,
  onDownloadPDF
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [priorityFilter, setPriorityFilter] = useState<string>('todos');
  const [carrierFilter, setCarrierFilter] = useState<string>('todos');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState<EnterpriseCargo | null>(null);

  // Form state
  const [newCargo, setNewCargo] = useState({
    nombreProducto: '',
    tipoDeCarga: 'Refrigerado',
    origen: '',
    destino: '',
    precioPropuesto: 1500,
    fechaEntregaLimite: '',
    temperaturaSet: -18.0,
    prioridad: 'media' as any,
    pesoKg: 15000,
    volumenM3: 40,
    carrierId: '',
    observaciones: ''
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const carrier = carriers.find(c => c.id === newCargo.carrierId);
    
    await onSaveCargo({
      nombreProducto: newCargo.nombreProducto,
      tipoDeCarga: newCargo.tipoDeCarga,
      origen: newCargo.origen,
      destino: newCargo.destino,
      precioPropuesto: Number(newCargo.precioPropuesto),
      fechaEntregaLimite: newCargo.fechaEntregaLimite || new Date(Date.now() + 86450000).toISOString().split('T')[0],
      temperaturaSet: newCargo.tipoDeCarga.toLowerCase().includes('refrig') ? Number(newCargo.temperaturaSet) : null,
      temperaturaActual: newCargo.tipoDeCarga.toLowerCase().includes('refrig') ? Number(newCargo.temperaturaSet) + 0.2 : null,
      prioridad: newCargo.prioridad,
      pesoKg: Number(newCargo.pesoKg),
      volumenM3: Number(newCargo.volumenM3),
      carrierId: newCargo.carrierId || null,
      carrierName: carrier ? carrier.name : null,
      observaciones: newCargo.observaciones,
      estado: 'pendiente',
      createdAt: Date.now()
    } as any);

    setShowCreateModal(false);
    // Reset
    setNewCargo({
      nombreProducto: '',
      tipoDeCarga: 'Refrigerado',
      origen: '',
      destino: '',
      precioPropuesto: 1500,
      fechaEntregaLimite: '',
      temperaturaSet: -18.0,
      prioridad: 'media',
      pesoKg: 15000,
      volumenM3: 40,
      carrierId: '',
      observaciones: ''
    });
  };

  const handleAdvanceStatus = async (cargo: EnterpriseCargo) => {
    const statusFlow: EnterpriseCargo['estado'][] = [
      'pendiente',
      'buscando_transporte',
      'en_negociacion',
      'asignada',
      'en_recojo',
      'en_ruta',
      'en_entrega',
      'entregada',
      'completada'
    ];
    const currentIndex = statusFlow.indexOf(cargo.estado);
    if (currentIndex !== -1 && currentIndex < statusFlow.length - 1) {
      const nextStatus = statusFlow[currentIndex + 1];
      
      const updates: Partial<EnterpriseCargo> = { estado: nextStatus };
      
      if (nextStatus === 'asignada' && !cargo.conductorAsignado) {
        updates.conductorAsignado = 'Carlos Mendoza (Vehículo V8-500)';
      }
      
      await onUpdateCargo(cargo.id, updates);
      setSelectedCargo(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleDuplicate = async (cargo: EnterpriseCargo) => {
    const { id, ...rest } = cargo;
    const duplicated: Omit<EnterpriseCargo, 'id'> = {
      ...rest,
      nombreProducto: `${rest.nombreProducto} (Duplicado)`,
      estado: 'pendiente',
      createdAt: Date.now()
    };
    await onSaveCargo(duplicated);
  };

  const filteredCargos = cargos.filter(c => {
    const matchesSearch = c.nombreProducto.toLowerCase().includes(search.toLowerCase()) || 
                          c.id.toLowerCase().includes(search.toLowerCase()) ||
                          c.origen.toLowerCase().includes(search.toLowerCase()) ||
                          c.destino.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || c.estado === statusFilter;
    const matchesPriority = priorityFilter === 'todos' || c.prioridad === priorityFilter;
    const matchesCarrier = carrierFilter === 'todos' || c.carrierId === carrierFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCarrier;
  });

  return (
    <div className="space-y-6">
      
      {/* Search & Actions Header Row */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-1.5 font-sans">
            <ClipboardList className="h-5 w-5 text-indigo-400" />
            <span>Workspace de Despacho de Cargas</span>
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">Controla, cotiza, asocia transportistas y audita la cadena de custodia de envíos.</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-600/10 pointer-events-auto"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Crear Nueva Carga</span>
        </button>
      </div>

      {/* Advanced Filter Workspace Bar */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        
        <div className="relative">
          <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Buscar Producto o Destino</span>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Ej. Arándanos, Callao..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-600 font-medium"
            />
          </div>
        </div>

        <div>
          <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Filtrar por Estado</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-350 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-600"
          >
            <option value="todos">Todos los Estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="buscando_transporte">Buscando Transporte</option>
            <option value="en_negociacion">En Negociación</option>
            <option value="asignada">Asignada</option>
            <option value="en_recojo">En Recojo</option>
            <option value="en_ruta">En Ruta (Activa)</option>
            <option value="en_entrega">En Entrega</option>
            <option value="entregada">Entregada</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        <div>
          <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Filtrar por Prioridad</span>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-350 text-xs px-3 py-2 rounded-xl focus:outline-none"
          >
            <option value="todos">Cualquier Prioridad</option>
            <option value="baja">Prioridad Baja</option>
            <option value="media">Prioridad Media</option>
            <option value="alta">Prioridad Alta</option>
            <option value="critica">Crítica / Urgente</option>
          </select>
        </div>

        <div>
          <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Filtrar por Transportista Partner</span>
          <select
            value={carrierFilter}
            onChange={e => setCarrierFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-350 text-xs px-3 py-2 rounded-xl focus:outline-none"
          >
            <option value="todos">Todos los Transportistas</option>
            {carriers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Cargo Operational Grid */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Carga ID</th>
                <th className="p-4">Detalle Comercial</th>
                <th className="p-4">Ruta e Intervalo</th>
                <th className="p-4">Tarifa Propuesta</th>
                <th className="p-4 text-center">Prioridad</th>
                <th className="p-4">Transportista</th>
                <th className="p-4 text-right">Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredCargos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-sans">
                    <div className="max-w-md mx-auto space-y-2">
                      <p className="text-sm font-semibold">No se encontraron cargas activas con los filtros actuales.</p>
                      <p className="text-xs text-slate-500">Intente modificando el buscador o configure una nueva embarcación masiva.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCargos.map(c => {
                  const hasIncident = c.estado === 'en_ruta' && c.temperaturaActual && c.temperaturaSet && Math.abs(c.temperaturaActual - c.temperaturaSet) > 1.5;
                  
                  return (
                    <tr 
                      key={c.id} 
                      onClick={() => setSelectedCargo(c)}
                      className="hover:bg-slate-900/40 transition-colors cursor-pointer"
                    >
                      <td className="p-4 font-mono font-black text-indigo-400 tracking-wider">
                        #{c.id.substring(0, 8).toUpperCase()}
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-white block truncate max-w-xs">{c.nombreProducto}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-550 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-semibold uppercase">{c.tipoDeCarga}</span>
                          <span className="text-[10px] text-indigo-400 font-mono">{(c.pesoKg || 12000) / 1000} Tons</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                          <MapPin className="h-3 w-3 text-red-400 shrink-0" />
                          <span>{c.origen.split(',')[0]}</span>
                          <ArrowRight className="h-3 w-3 text-slate-500 shrink-0" />
                          <span>{c.destino.split(',')[0]}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-1">Plazo Límite: {c.fechaEntregaLimite}</span>
                      </td>

                      <td className="p-4 font-mono text-emerald-400 font-black text-sm">
                        S/. {c.precioPropuesto.toLocaleString()}
                      </td>

                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          c.prioridad === 'critica' ? 'bg-red-500/10 text-red-400 border border-red-500/10' :
                          c.prioridad === 'alta' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' :
                          c.prioridad === 'media' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {c.prioridad || 'media'}
                        </span>
                      </td>

                      <td className="p-4">
                        {c.carrierName ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            <span className="font-bold text-slate-300">{c.carrierName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Buscando...</span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasIncident && (
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" title="Desvío Térmico" />
                          )}
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase text-center border ${
                            c.estado === 'completada' || c.estado === 'entregada'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' 
                              : c.estado === 'en_ruta' || c.estado === 'en_entrega'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/10'
                                : c.estado === 'pendiente'
                                  ? 'bg-slate-800 text-slate-400 border-slate-700'
                                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/10 animate-pulse'
                          }`}>
                            {c.estado.replace('_', ' ')}
                          </span>
                        </div>
                      </td>

                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE CARGO MODAL PANEL (Right Side-Over Drawer Style) */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-lg bg-slate-950 border-l border-slate-800 h-full overflow-y-auto p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
                  <div>
                    <h4 className="text-base font-black text-white flex items-center gap-1.5">
                      <Plus className="h-5 w-5 text-indigo-400" />
                      <span>Registrar Orden de Carga Shiper</span>
                    </h4>
                    <p className="text-xs text-slate-450 mt-1">Ingresa especificaciones operacionales del envío.</p>
                  </div>
                  <button 
                    onClick={() => setShowCreateModal(false)}
                    className="p-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                <form onSubmit={handleCreate} id="create-cargo-form" className="space-y-4 text-xs font-sans">
                  
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Nombre de Producto / Carga</label>
                    <input
                      type="text"
                      required
                      value={newCargo.nombreProducto}
                      onChange={e => setNewCargo({ ...newCargo, nombreProducto: e.target.value })}
                      placeholder="Ej. Arándanos Premium Ventarrón - 40 Pllts"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Tipo de Contenedor</label>
                      <select
                        value={newCargo.tipoDeCarga}
                        onChange={e => setNewCargo({ ...newCargo, tipoDeCarga: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none"
                      >
                        <option value="Refrigerado">Refrigerado (Reefer)</option>
                        <option value="Seco">Seco Standard</option>
                        <option value="Plataforma">Plataforma Especial</option>
                        <option value="Sider">Carga Sider Cortina</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Prioridad Crítica</label>
                      <select
                        value={newCargo.prioridad}
                        onChange={e => setNewCargo({ ...newCargo, prioridad: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none"
                      >
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                        <option value="critica">Crítica (Urgente)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Sede Planta de Origen</label>
                      <input
                        type="text"
                        required
                        value={newCargo.origen}
                        onChange={e => setNewCargo({ ...newCargo, origen: e.target.value })}
                        placeholder="Ej. Planta Piura Cold, Piura"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Puerto / Destino Principal</label>
                      <input
                        type="text"
                        required
                        value={newCargo.destino}
                        onChange={e => setNewCargo({ ...newCargo, destino: e.target.value })}
                        placeholder="Ej. Callao DP World, Puerto Callao"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {newCargo.tipoDeCarga === 'Refrigerado' && (
                    <div className="space-y-1 col-span-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                        <Thermometer className="h-3 w-3 text-blue-400" />
                        <span>Punto de Ajuste Temperatura (°C)</span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={newCargo.temperaturaSet}
                        onChange={e => setNewCargo({ ...newCargo, temperaturaSet: Number(e.target.value) })}
                        placeholder="Ej. -18.0"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Tarifa Presupuestada (S/.)</label>
                      <input
                        type="number"
                        required
                        value={newCargo.precioPropuesto}
                        onChange={e => setNewCargo({ ...newCargo, precioPropuesto: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Fecha Límite</label>
                      <input
                        type="date"
                        value={newCargo.fechaEntregaLimite}
                        onChange={e => setNewCargo({ ...newCargo, fechaEntregaLimite: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Peso Neto (Kg)</label>
                      <input
                        type="number"
                        value={newCargo.pesoKg}
                        onChange={e => setNewCargo({ ...newCargo, pesoKg: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Volumen (m³)</label>
                      <input
                        type="number"
                        value={newCargo.volumenM3}
                        onChange={e => setNewCargo({ ...newCargo, volumenM3: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Asignar Transportista</label>
                    <select
                      value={newCargo.carrierId}
                      onChange={e => setNewCargo({ ...newCargo, carrierId: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none"
                    >
                      <option value="">Buscar en Bolsa Abierta (Sin transportista)</option>
                      {carriers.map(car => (
                        <option key={car.id} value={car.id}>{car.name} (SLA: {car.slaPercent}%)</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Observaciones Generales</label>
                    <textarea
                      value={newCargo.observaciones}
                      onChange={e => setNewCargo({ ...newCargo, observaciones: e.target.value })}
                      placeholder="Instrucciones especiales para el estibado, precinto de seguridad, etc."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white h-20"
                    />
                  </div>

                </form>
              </div>

              <div className="pt-6 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-slate-900 text-slate-400 font-bold px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-850"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="create-cargo-form"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/10"
                >
                  Confirmar Despacho
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CARGO DETAIL VIEW (Details sliding card drawer) */}
      <AnimatePresence>
        {selectedCargo && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-lg bg-slate-950 border-l border-slate-800 h-full p-6 overflow-y-auto flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
                  <div>
                    <span className="text-[10px] text-indigo-400 font-mono font-black uppercase tracking-widest">
                      EXPEDIENTE DE TRÁNSITO
                    </span>
                    <h4 className="text-base font-black text-white mt-1">
                      #{selectedCargo.id.toUpperCase()}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onDownloadPDF(selectedCargo)}
                      title="Descargar Acta Compliance"
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 hover:text-emerald-300"
                    >
                      <FileText className="h-4.5 w-4.5" />
                    </button>
                    <button
                      onClick={() => {
                        handleDuplicate(selectedCargo);
                        setSelectedCargo(null);
                      }}
                      title="Duplicar Despacho"
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-indigo-400 hover:text-indigo-300"
                    >
                      <Copy className="h-4.5 w-4.5" />
                    </button>
                    <button
                      onClick={async () => {
                        await onRemoveCargo(selectedCargo.id);
                        setSelectedCargo(null);
                      }}
                      title="Eliminar Expediente"
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-550 hover:text-rose-400"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                    <button 
                      onClick={() => setSelectedCargo(null)}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>

                {/* State Progress Timeline visualization */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 mb-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trazabilidad de Custodia</span>
                    <span className="font-mono text-[10px] text-indigo-400 font-bold uppercase">{selectedCargo.estado.replace('_', ' ')}</span>
                  </div>

                  <div className="grid grid-cols-5 gap-1 pt-1.5">
                    {['pendiente', 'asignada', 'en_ruta', 'entregada', 'completada'].map((state, index) => {
                      const states = ['pendiente', 'buscando_transporte', 'en_negociacion', 'asignada', 'en_recojo', 'en_ruta', 'en_entrega', 'entregada', 'completada'];
                      const currentId = states.indexOf(selectedCargo.estado);
                      const targetId = states.indexOf(state);
                      
                      const isDone = currentId >= targetId;
                      const isActive = selectedCargo.estado === state;

                      return (
                        <div key={state} className="space-y-1">
                          <div className={`h-1.5 rounded-full ${
                            isDone ? 'bg-indigo-500' : 'bg-slate-800'
                          } ${isActive ? 'animate-pulse bg-emerald-500' : ''}`} />
                          <span className={`text-[8.5px] uppercase block truncate text-center ${
                            isDone ? 'text-slate-300 font-bold' : 'text-slate-650'
                          }`}>
                            {state === 'pendiente' ? 'creada' : state}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {selectedCargo.estado !== 'completada' && (
                    <button
                      onClick={() => handleAdvanceStatus(selectedCargo)}
                      className="w-full mt-4 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white font-bold text-[10px] uppercase py-2.5 rounded-xl border border-indigo-500/10 hover:border-indigo-600 transition flex items-center justify-center gap-1.5"
                    >
                      <span>Avanzar al siguiente estado</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Main Information blocks */}
                <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                  
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850">
                    <span className="text-[9px] uppercase font-bold text-slate-550 block">Producto</span>
                    <span className="font-bold text-white mt-1 block">{selectedCargo.nombreProducto}</span>
                  </div>

                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850">
                    <span className="text-[9px] uppercase font-bold text-slate-550 block">Tipo Carga</span>
                    <span className="font-bold text-slate-200 mt-1 block uppercase">{selectedCargo.tipoDeCarga}</span>
                  </div>

                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850">
                    <span className="text-[9px] uppercase font-bold text-slate-550 block">Sede Origen</span>
                    <div className="font-normal text-slate-300 mt-1 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-blue-400" />
                      <span>{selectedCargo.origen}</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850">
                    <span className="text-[9px] uppercase font-bold text-slate-550 block">Destino Final</span>
                    <div className="font-normal text-slate-300 mt-1 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-red-400" />
                      <span>{selectedCargo.destino}</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850">
                    <span className="text-[9px] uppercase font-bold text-slate-550 block">Tarifa Acordada</span>
                    <span className="font-bold text-emerald-400 mt-1 block font-mono text-sm">S/. {selectedCargo.precioPropuesto.toLocaleString()}</span>
                  </div>

                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850">
                    <span className="text-[9px] uppercase font-bold text-slate-550 block">Despacho Límite</span>
                    <span className="font-bold text-slate-300 mt-1 block">{selectedCargo.fechaEntregaLimite}</span>
                  </div>

                  {selectedCargo.tipoDeCarga.toLowerCase().includes('refrig') && (
                    <>
                      <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850 col-span-1">
                        <span className="text-[9px] uppercase font-bold text-slate-450 block">Punto de Ajuste (Set)</span>
                        <span className="font-bold text-indigo-400 mt-1 block font-mono">{selectedCargo.temperaturaSet ?? -18.0} °C</span>
                      </div>
                      <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850 col-span-1">
                        <span className="text-[10px] uppercase font-bold text-slate-450 block">Lectura Satelital</span>
                        <span className={`font-bold mt-1 block font-mono ${
                          selectedCargo.temperaturaActual && selectedCargo.temperaturaSet && Math.abs(selectedCargo.temperaturaActual - selectedCargo.temperaturaSet) > 1.5
                            ? 'text-rose-500 font-extrabold animate-pulse'
                            : 'text-emerald-400'
                        }`}>
                          {selectedCargo.temperaturaActual ?? -17.8} °C
                        </span>
                      </div>
                    </>
                  )}

                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850 col-span-2">
                    <span className="text-[9px] uppercase font-bold text-slate-550 block">Operador Partner</span>
                    <span className="font-bold text-slate-350 mt-1 block">
                      {selectedCargo.carrierName ? `${selectedCargo.carrierName} (ID: ${selectedCargo.carrierId})` : 'Subasta abierta en mesa de ofertas'}
                    </span>
                  </div>

                  {selectedCargo.observaciones && (
                    <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850 col-span-2">
                      <span className="text-[9px] uppercase font-bold text-slate-550 block">Instrucciones y Observaciones</span>
                      <p className="text-slate-400 mt-1 leading-relaxed text-[11px] font-sans">{selectedCargo.observaciones}</p>
                    </div>
                  )}

                </div>

                {/* SRE checkpoints & incidents logged under this cargo */}
                <div className="pt-6 mt-6 border-t border-slate-850 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Puntos de Control & Compliance</h4>
                  
                  <div className="bg-slate-900/10 border border-slate-850 rounded-xl p-3 space-y-2.5">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pb-1 border-b border-slate-850">
                      <span>Log Certificado</span>
                      <span>Estatus GPS</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2.5 text-slate-300">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-white block">Salida de Planta de Congelados</span>
                          <span className="text-[10.5px] text-slate-550">Registro del termógrafo y precinto certificado. Conforme.</span>
                        </div>
                      </div>

                      {selectedCargo.estado === 'en_ruta' && (
                        <div className="flex items-start gap-2.5 text-slate-300">
                          <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
                          <div>
                            <span className="font-bold text-indigo-300 block">En Tránsito por Panamericana</span>
                            <span className="text-[10.5px] text-slate-550">Posición telemétrica activa. Velocidad promedio 62 km/h.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              <div className="pt-6 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedCargo(null)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition"
                >
                  Regresar al Workspace
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
