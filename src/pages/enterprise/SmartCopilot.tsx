import React, { useState, useRef, useEffect } from 'react';
import { 
  Brain, Cpu, Send, Terminal, AlertTriangle, Sparkles, 
  TrendingUp, RefreshCw, Zap, ShieldCheck 
} from 'lucide-react';

interface QuickPrompt {
  id: string;
  label: string;
  prompt: string;
}

export const SmartCopilot: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: '📡 Chasqui CoPiloto v1.2 SRE activo. Hazme cualquier consulta sobre el estado de flota, riesgos de congestión en puertos de exportación (Callao/Paita) o predicción de tránsitos de tus contenedores.' }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts: QuickPrompt[] = [
    { id: 'p1', label: 'Análisis de Riesgos de Ruta', prompt: 'Analiza los riesgos de retardo telemático para la ruta de despacho Huarmey - Callao en furgones refrigerados.' },
    { id: 'p2', label: 'Optimización de Cargas', prompt: '¿Cuál es el camionero óptimo para despachar el lote L-902 de espárragos frescos en Planta Paita hoy?' },
    { id: 'p3', label: 'Predicciones de Retraso de Puertos', prompt: 'Preve el congestionamiento de camiones en puerta de APM Terminals Callao para esta tarde.' }
  ];

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAskAI = async (promptText: string) => {
    if (!promptText.trim() || loading) return;

    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: promptText }]);

    try {
      const res = await fetch('/api/gemini/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText })
      });

      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', text: data.text }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: `⚠️ Error operacional: ${data.error || 'No se pudo contactar al motor de Gemini.'}` }]);
      }
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', text: '⚠️ Error de comunicación: Falló el enlace con el proxy del servidor de Chasqui.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const prompt = inputText;
    setInputText('');
    handleAskAI(prompt);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      
      {/* AI Terminal console (8 cols) */}
      <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-2xl min-h-[460px]">
        <div>
          <div className="flex justify-between items-center pb-3.5 border-b border-slate-900 mb-4 text-xs">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Terminal className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
              <span>Chasqui CoPiloto Logístico Coprocessor</span>
            </h4>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-900 border border-slate-850 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Model: gemini-3.5-flash
            </span>
          </div>

          {/* Console feed */}
          <div className="bg-black/70 rounded-xl p-4 font-mono text-xs border border-slate-900 space-y-4 h-[280px] overflow-y-auto max-h-[280px] leading-relaxed">
            {messages.map((m, idx) => (
              <div 
                key={idx} 
                className={`p-3.5 rounded-xl border ${
                  m.role === 'user' 
                    ? 'bg-slate-900/40 border-slate-850 text-indigo-300 ml-6' 
                    : 'bg-indigo-950/20 border-indigo-950/30 text-emerald-400 mr-6'
                }`}
              >
                <div className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 border-b border-black/40 pb-1 mb-1.5 flex justify-between items-center">
                  <span>{m.role === 'user' ? '👤 Despachador' : '🤖 Chasqui AI'}</span>
                  <span>System node: live_dec_ok</span>
                </div>
                <p className="whitespace-pre-wrap">{m.text}</p>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2.5 text-indigo-400 font-bold p-3 animate-pulse bg-slate-900/20 rounded-xl border border-dashed border-indigo-505/20 mr-6">
                <RefreshCw className="h-4 w-4 animate-spin text-indigo-500" />
                <span>Analizando telemetría y prediciendo desvíos o demoras con Gemini...</span>
              </div>
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>

        {/* Input area */}
        <form onSubmit={handleFormSubmit} className="mt-4 pt-4 border-t border-slate-900 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Introduce órdenes como 'Recomienda rutas alternas para Huacho' o 'Analiza el consumo del camión v2'..."
            className="flex-1 bg-slate-900 border border-slate-800 text-white rounded-xl px-4 text-xs font-mono focus:ring-0 focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 rounded-xl text-xs flex items-center gap-1.5 transition disabled:opacity-40 font-sans"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Preguntar</span>
          </button>
        </form>
      </div>

      {/* Side suggestions panel (4 cols) */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Quick Prompts Suggestions */}
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase font-mono">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>Consultas Rápidas</span>
          </h4>
          <p className="text-[10.5px] text-slate-400 leading-relaxed">Selecciona un comando telemático pre-configurado para que el copiloto calcule los factores de riesgo de inmediato:</p>
          
          <div className="space-y-2 pt-2">
            {quickPrompts.map(p => (
              <button
                key={p.id}
                onClick={() => handleAskAI(p.prompt)}
                className="w-full text-left p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-850 text-slate-300 hover:text-white text-xs font-bold transition flex items-center justify-between"
              >
                <span>{p.label}</span>
                <Zap className="h-3 w-3 text-indigo-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Predictive stats summaries card */}
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3 text-xs leading-relaxed">
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase font-mono">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span>SRE Predicciones Siguiente Turno</span>
          </h4>
          
          <div className="space-y-3 pt-2 font-mono text-[10px]">
            <div className="flex border-b border-slate-905 pb-1.5 items-center justify-between text-slate-400">
              <span>Alerta Congestión Paita:</span>
              <span className="text-emerald-400 font-bold">BAJA (Fluido)</span>
            </div>
            
            <div className="flex border-b border-slate-905 pb-1.5 items-center justify-between text-slate-400">
              <span>Demoras Estimadas Callao:</span>
              <span className="text-amber-400 font-bold">18 min promedio</span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>Probabilidad Incidencia Frío:</span>
              <span className="text-rose-400 font-black flex items-center gap-0.5 animate-pulse">
                <AlertTriangle className="h-3 w-3" /> 2.4% (Estable)
              </span>
            </div>
          </div>
          
          <div className="pt-2 text-[10px] text-slate-500 font-sans mt-2 border-t border-slate-900 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
            <span>Recomendaciones verificadas</span>
          </div>
        </div>

      </div>

    </div>
  );
};
