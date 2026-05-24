import React from 'react';
import { 
  ArrowRight, ShieldAlert, Check, Calendar, 
  MapPin, Clock, AlertTriangle, Truck, UserRound
} from 'lucide-react';
import { EnterpriseCargo } from '../../pages/enterprise/EnterpriseTypes';

interface EnterpriseKanbanProps {
  cargos: EnterpriseCargo[];
  onUpdateCargo: (id: string, updates: Partial<EnterpriseCargo>) => Promise<any>;
}

export const EnterpriseKanban: React.FC<EnterpriseKanbanProps> = ({
  cargos,
  onUpdateCargo
}) => {
  
  // Logical columns
  const columns = [
    {
      id: 'subasta',
      title: 'Buscando Carrier',
      desc: 'Órdenes en licitación o negociación',
      color: 'border-slate-800 text-slate-400 bg-slate-900/10',
      states: ['pendiente', 'buscando_transporte', 'en_negociacion']
    },
    {
      id: 'asignado',
      title: 'Asignadas',
      desc: 'Lote asociado a transportista',
      color: 'border-indigo-900/50 text-indigo-400 bg-indigo-950/5',
      states: ['asignada', 'en_recojo']
    },
    {
      id: 'ruta',
      title: 'En Tránsito (Live Route)',
      desc: 'Unidades en carretera / Aduanas',
      color: 'border-blue-900/50 text-blue-400 bg-blue-950/5',
      states: ['en_ruta', 'en_entrega']
    },
    {
      id: 'completado',
      title: 'Entregado / Conforme',
      desc: 'Custodia ingresada con firma',
      color: 'border-emerald-900/50 text-emerald-400 bg-emerald-950/5',
      states: ['entregada', 'completada']
    }
  ];

  const handleAdvance = async (cargo: EnterpriseCargo) => {
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
      await onUpdateCargo(cargo.id, { estado: statusFlow[currentIndex + 1] });
    }
  };

  const handleMoveBack = async (cargo: EnterpriseCargo) => {
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
    if (currentIndex > 0) {
      await onUpdateCargo(cargo.id, { estado: statusFlow[currentIndex - 1] });
    }
  };

  return (
    <div className="space-y-6">
      
      <div>
        <h3 className="text-lg font-black text-white font-sans">Mesa de Despacho Logístico (Kanban Board)</h3>
        <p className="text-slate-400 text-xs mt-0.5">Gestione visualmente el pipeline comercial de embarques y agilice las transiciones de custodia.</p>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-start select-none">
        {columns.map(col => {
          const colCargos = cargos.filter(c => col.states.includes(c.estado));

          return (
            <div key={col.id} className="bg-slate-950 rounded-2xl border border-slate-800/80 p-4 space-y-4">
              
              {/* Column Header */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <div>
                  <h4 className="font-bold text-white text-xs">{col.title}</h4>
                  <p className="text-[10px] text-slate-500">{col.desc}</p>
                </div>
                <span className="text-[10px] font-mono font-black border border-slate-800 bg-slate-900 px-2 py-0.5 rounded-md text-slate-400">
                  {colCargos.length}
                </span>
              </div>

              {/* Column cards container */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {colCargos.length === 0 ? (
                  <div className="text-center py-8 text-slate-600 text-[11px] italic">
                    Sin embarques
                  </div>
                ) : (
                  colCargos.map(c => {
                    const hasIncident = c.estado === 'en_ruta' && c.temperaturaActual && c.temperaturaSet && Math.abs(c.temperaturaActual - c.temperaturaSet) > 1.5;

                    return (
                      <div 
                        key={c.id} 
                        className={`p-3.5 rounded-xl border border-slate-850 bg-slate-900/40 space-y-3 hover:border-slate-700 transition relative overflow-hidden`}
                      >
                        {/* Red blink tag for live temperature alarm deviation */}
                        {hasIncident && (
                          <div className="absolute top-0 right-0 bg-red-650 text-white font-black px-2 py-0.5 text-[8px] uppercase tracking-widest animate-pulse border-bl border-red-500/10">
                            Fuga de Frío
                          </div>
                        )}

                        <div>
                          <div className="flex justify-between items-start text-[9px] font-mono font-bold text-slate-500">
                            <span>#{c.id.substring(0, 8).toUpperCase()}</span>
                            <span>{c.tipoDeCarga}</span>
                          </div>
                          
                          <h5 className="font-bold text-white text-xs mt-1 truncate" title={c.nombreProducto}>
                            {c.nombreProducto}
                          </h5>
                        </div>

                        {/* Route Pinpoints */}
                        <div className="text-[11px] text-slate-350 space-y-1">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-blue-400" />
                            <span className="truncate">{c.origen.split(',')[0]}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-red-400" />
                            <span className="truncate">{c.destino.split(',')[0]}</span>
                          </div>
                        </div>

                        {/* Bottom Metadata bar */}
                        <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-[11px]">
                          <span className="font-black font-mono text-emerald-400">S/. {c.precioPropuesto.toLocaleString()}</span>
                          <span className="text-[9px] text-slate-500 font-bold uppercase">{c.estado.replace('_', ' ')}</span>
                        </div>

                        {/* Quick Interactive Drag/Transition actions */}
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-950 text-[9px] uppercase font-black font-mono">
                          <button
                            disabled={c.estado === 'pendiente'}
                            onClick={() => handleMoveBack(c)}
                            className="bg-slate-950 hover:bg-slate-850 text-slate-500 hover:text-slate-300 px-1 py-1 rounded text-center transition border border-slate-850 disabled:opacity-30 disabled:pointer-events-none"
                          >
                            Regresar
                          </button>
                          <button
                            disabled={c.estado === 'completada'}
                            onClick={() => handleAdvance(c)}
                            className="bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white px-1 py-1 rounded text-center transition border border-indigo-505/10 disabled:opacity-30 disabled:pointer-events-none"
                          >
                            Avanzar
                          </button>
                        </div>

                      </div>
                    )
                  })
                )}
              </div>

            </div>
          )
        })}
      </div>

    </div>
  );
};
