import React from 'react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, Award, Clock, AlertTriangle, BatteryCharging, 
  DollarSign, Activity, Percent, ThumbsUp
} from 'lucide-react';

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

// Mock analytics trends
const monthlyShipmentData = [
  { name: 'Ene', despachos: 42, puntualidad: 92, costoPromedio: 1450 },
  { name: 'Feb', despachos: 58, puntualidad: 94, costoPromedio: 1380 },
  { name: 'Mar', despachos: 69, puntualidad: 91, costoPromedio: 1520 },
  { name: 'Abr', despachos: 84, puntualidad: 95, costoPromedio: 1310 },
  { name: 'May', despachos: 96, puntualidad: 96, costoPromedio: 1290 }
];

const incidentsCategoryData = [
  { name: 'Bloqueo Vías', value: 12 },
  { name: 'Falla Mecánica', value: 5 },
  { name: 'Desvío Ruta', value: 3 },
  { name: 'Alerta Temperatura', value: 7 },
  { name: 'Pérdida Señal', value: 4 }
];

const sedePerformanceData = [
  { name: 'San Isidro HQ', completados: 124, incidentes: 2, eficiencia: 98 },
  { name: 'Planta Paita', completados: 85, incidentes: 4, eficiencia: 95 },
  { name: 'Almacén Callao', completados: 152, incidentes: 8, eficiencia: 92 },
  { name: 'Lurín Terminal', completados: 63, incidentes: 1, eficiencia: 97 }
];

export const AnalyticsDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      
      {/* Visual KPI Header Card Blocks */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Card 1: OTIF */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">OTIF Puntualidad</span>
              <h4 className="text-2xl font-black font-mono text-white mt-1">96.4%</h4>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Award className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between text-[11px] font-mono">
            <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
              <TrendingUp className="h-3 w-3" /> +1.2% este mes
            </span>
            <span className="text-slate-500">Meta: 95%</span>
          </div>
        </div>

        {/* Card 2: Costo Promedio */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Costo de Despacho</span>
              <h4 className="text-2xl font-black font-mono text-white mt-1">S/. 1,290</h4>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <DollarSign className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between text-[11px] font-mono">
            <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
              <TrendingUp className="h-3 w-3" /> -4.5% eficiencia
            </span>
            <span className="text-slate-500">Base: S/. 1,400</span>
          </div>
        </div>

        {/* Card 3: Viajes Totales */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Productividad Total</span>
              <h4 className="text-2xl font-black font-mono text-white mt-1">424 Viajes</h4>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between text-[11px] font-mono">
            <span className="text-indigo-400 font-bold">42 Unidades Activas</span>
            <span className="text-slate-500">Cap: 94%</span>
          </div>
        </div>

        {/* Card 4: Incidentes cerrados */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Severidad Incidentes</span>
              <h4 className="text-2xl font-black font-mono text-white mt-1">1.8%</h4>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between text-[11px] font-mono">
            <span className="text-emerald-400 font-bold">98% Resueltos en &lt;1hr</span>
            <span className="text-slate-500">Límite: 3.0%</span>
          </div>
        </div>

      </div>

      {/* Grid: Charts graphs */}
      <div className="grid gap-6 md:grid-cols-12">
        
        {/* LineChart Trends (8 cols) */}
        <div className="md:col-span-8 bg-slate-950 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Historial Operacional y Puntualidad</h4>
              <p className="text-[10px] text-slate-400">Comparativa mensual de envíos despachados y porcentaje de entregas conformes (OTIF)</p>
            </div>
            <span className="text-[9px] bg-indigo-505/10 text-indigo-400 font-mono px-2 py-0.5 rounded border border-slate-850">KPI_TRENDS_OK</span>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyShipmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                <YAxis yAxisId="left" stroke="#818cf8" fontSize={10} />
                <YAxis yAxisId="right" orientation="right" stroke="#34d399" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1f2937', color: '#fff', fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line yAxisId="left" type="monotone" dataKey="despachos" stroke="#818cf8" strokeWidth={2.5} name="Volumen Envíos" activeDot={{ r: 8 }} />
                <Line yAxisId="right" type="monotone" dataKey="puntualidad" stroke="#34d399" strokeWidth={2.5} name="OTIF Puntualidad %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PieChart Categories of breakdowns (4 cols) */}
        <div className="md:col-span-4 bg-slate-950 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Métricas de Incidentes</h4>
            <p className="text-[10px] text-slate-400 mb-6">Tipos de reportes generados en carretera por choferes</p>
          </div>

          <div className="h-[160px] w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incidentsCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {incidentsCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1f2937', fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest block">Incidentes</span>
              <span className="text-white font-mono text-lg font-black">{incidentsCategoryData.reduce((acc, curr) => acc + curr.value, 0)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[9.5px] mt-4 pt-4 border-t border-slate-900 font-mono">
            {incidentsCategoryData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="truncate">{entry.name}: <b>{entry.value}</b></span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Sede terminal performance rankings table */}
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Eficiencia Operativa por Planta y Sede</h4>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-400 font-sans border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-[10px] uppercase text-slate-500 font-black tracking-widest">
                <th className="py-3 px-2">Terminal Sede</th>
                <th className="py-3 px-2 text-center">Viajes Completados</th>
                <th className="py-3 px-2 text-center">Incidentes Flagged</th>
                <th className="py-3 px-2 text-center">Eficiencia Promedio</th>
                <th className="py-3 px-2 text-right">Estatus Telemático</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60 font-medium">
              {sedePerformanceData.map(sede => (
                <tr key={sede.name} className="hover:bg-slate-900/40">
                  <td className="py-3 px-2 font-bold text-white">{sede.name}</td>
                  <td className="py-3 px-2 text-center font-mono text-slate-200">{sede.completados} despachos</td>
                  <td className="py-3 px-2 text-center font-mono">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      sede.incidentes > 3 ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-900 text-slate-500'
                    }`}>
                      {sede.incidentes} eventos
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-850">
                        <div className="bg-indigo-500 h-full" style={{ width: `${sede.eficiencia}%` }} />
                      </div>
                      <span className="font-mono text-[10.5px] text-slate-300 font-bold">{sede.eficiencia}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right text-[10px] font-mono font-bold text-emerald-400 flex items-center justify-end gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>915 Mhz Sat</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
