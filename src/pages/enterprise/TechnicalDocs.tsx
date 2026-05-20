import { useState } from 'react';
import { Copy, Check, FileCode, Shield, Smartphone, Milestone, Server, ArrowRight } from 'lucide-react';
import { FIRESTORE_SCHEMA, REACT_NATIVE_COMPONENT, SECURITY_RULES } from './MockData';

export const TechnicalDocs = () => {
  const [activeSubTab, setActiveSubTab] = useState<'architecture' | 'firestore' | 'security' | 'mobile' | 'roadmap'>('architecture');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-slate-950 p-6 text-slate-100 shadow-2xl">
      <div className="mb-6 border-b border-slate-800 pb-4">
        <h3 className="text-xl font-bold text-white flex items-center space-x-2">
          <span>🏛️ Planos de Infraestructura & Ecosistema</span>
          <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400">Desarrollador</span>
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          Planos y especificaciones técnicas para migrar Chasqui de un sistema simple de fletes a una plataforma empresarial multi-tenant.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveSubTab('architecture')}
          className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
            activeSubTab === 'architecture' ? 'bg-blue-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:bg-slate-850'
          }`}
        >
          <Server className="h-4 w-4" />
          <span>Arquitectura SaaS</span>
        </button>
        <button
          onClick={() => setActiveSubTab('firestore')}
          className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
            activeSubTab === 'firestore' ? 'bg-blue-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:bg-slate-850'
          }`}
        >
          <FileCode className="h-4 w-4" />
          <span>Colecciones Firestore</span>
        </button>
        <button
          onClick={() => setActiveSubTab('security')}
          className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
            activeSubTab === 'security' ? 'bg-blue-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:bg-slate-850'
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Reglas de Seguridad</span>
        </button>
        <button
          onClick={() => setActiveSubTab('mobile')}
          className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
            activeSubTab === 'mobile' ? 'bg-blue-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:bg-slate-850'
          }`}
        >
          <Smartphone className="h-4 w-4" />
          <span>React Native SDK</span>
        </button>
        <button
          onClick={() => setActiveSubTab('roadmap')}
          className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
            activeSubTab === 'roadmap' ? 'bg-blue-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:bg-slate-850'
          }`}
        >
          <Milestone className="h-4 w-4" />
          <span>Roadmap de Escala</span>
        </button>
      </div>

      {/* Custom Tabs Renderer */}
      <div className="space-y-4">
        {activeSubTab === 'architecture' && (
          <div className="space-y-6 text-sm">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl bg-slate-900 p-5 border border-slate-800">
                <h4 className="font-bold text-white mb-2 text-sm flex items-center space-x-1">
                  <span className="text-blue-400">1.</span>
                  <span>Estructura Multi-Tenant de Datos</span>
                </h4>
                <p className="text-slate-400 leading-relaxed text-xs">
                  Proponemos un modelo <strong>"Híbrido Consolidado"</strong>. Los usuarios y vehículos pertenecen físicamente
                  a subcolecciones dentro de la colección principal <code className="text-emerald-400 font-mono">organizations</code>.
                  Sin embargo, las <code className="text-emerald-400 font-mono">cargas</code> y <code className="text-emerald-400 font-mono">trips</code> siguen siendo globales para
                  permitir a las empresas de transporte independientes ofertar libremente en el marketplace compartido, mientras que las cargas corporativas son asignadas directamente en canales privados.
                </p>
              </div>

              <div className="rounded-xl bg-slate-900 p-5 border border-slate-800">
                <h4 className="font-bold text-white mb-2 text-sm flex items-center space-x-1">
                  <span className="text-blue-400">2.</span>
                  <span>Control de Accesos Basado en Roles (RBAC)</span>
                </h4>
                <p className="text-slate-400 leading-relaxed text-xs">
                  Un único Token de Firebase Auth almacena el ID de la organización y el rol del usuario mediante
                  <strong> Custom Claims</strong>. Cuando se carga el Dashboard, recuperamos:
                  <code className="text-emerald-400 font-mono block rounded bg-black/40 p-1.5 mt-2">
                    user.claims.orgId = 'org123';<br/>
                    user.claims.rol = 'supervisor';
                  </code>
                  Esto acelera el performance evitando realizar llamadas de lectura extras a Firestore por cada carga de pantalla.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-900 p-5 border border-slate-800">
              <h4 className="font-bold text-white mb-3 text-sm">Organigrama de la Organización Logística</h4>
              <div className="grid gap-4 md:grid-cols-6 text-center text-[11px] font-mono">
                <div className="rounded border border-slate-700 bg-slate-950 p-2.5">
                  <span className="font-bold text-cyan-400 block">ADMIN EMPRESA</span>
                  <span className="text-slate-400 text-[10px]">Control total corporativo, facturación, y accesos.</span>
                </div>
                <div className="rounded border border-slate-700 bg-slate-950 p-2.5">
                  <span className="font-bold text-cyan-400 block">SUPERVISOR</span>
                  <span className="text-slate-400 text-[10px]">Monitoreo de carga, asignación directa y sedes.</span>
                </div>
                <div className="rounded border border-slate-700 bg-slate-950 p-2.5">
                  <span className="font-bold text-cyan-400 block">MONITORISTA GPS</span>
                  <span className="text-slate-400 text-[10px]">Gestión de alertas de geocerca, incidentes térmicos.</span>
                </div>
                <div className="rounded border border-slate-700 bg-slate-950 p-2.5">
                  <span className="font-bold text-cyan-400 block">OPERADOR</span>
                  <span className="text-slate-400 text-[10px]">Creador de cargas en lote, coordinación directa.</span>
                </div>
                <div className="rounded border border-slate-700 bg-slate-950 p-2.5">
                  <span className="font-bold text-cyan-400 block">AUDITOR</span>
                  <span className="text-slate-400 text-[10px]">Inspección pasiva de trazabilidad y reportes.</span>
                </div>
                <div className="rounded border border-slate-700 bg-slate-950 p-2.5">
                  <span className="font-bold text-emerald-400 block">CHOFER FLOTA</span>
                  <span className="text-slate-400 text-[10px]">Recepción de viaje asignado y telemetría de ruta.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'firestore' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center bg-slate-900 px-4 py-2 rounded-t-lg border-t border-x border-slate-800">
              <span className="text-xs font-mono text-slate-400">Modelo: db-structure.json</span>
              <button
                onClick={() => handleCopy(FIRESTORE_SCHEMA, 'schema')}
                className="flex items-center space-x-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300"
              >
                {copiedText === 'schema' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedText === 'schema' ? '¡Copiado!' : 'Copiar Código'}</span>
              </button>
            </div>
            <pre className="overflow-x-auto rounded-b-lg bg-black/60 p-4 text-xs font-mono text-emerald-400 border-b border-x border-slate-800 leading-relaxed max-h-[420px]">
              {FIRESTORE_SCHEMA}
            </pre>
          </div>
        )}

        {activeSubTab === 'security' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center bg-slate-900 px-4 py-2 rounded-t-lg border-t border-x border-slate-800">
              <span className="text-xs font-mono text-slate-400">Archivo: firestore.rules</span>
              <button
                onClick={() => handleCopy(SECURITY_RULES, 'rules')}
                className="flex items-center space-x-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300"
              >
                {copiedText === 'rules' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedText === 'rules' ? '¡Copiado!' : 'Copiar Código'}</span>
              </button>
            </div>
            <pre className="overflow-x-auto rounded-b-lg bg-black/60 p-4 text-xs font-mono text-sky-400 border-b border-x border-slate-800 leading-relaxed max-h-[420px]">
              {SECURITY_RULES}
            </pre>
          </div>
        )}

        {activeSubTab === 'mobile' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Componente móvil optimizado en <strong>React Native (Expo / Firestore)</strong> para que los conductores de flotas asignadas transmitan su geolocalización en segundo plano con telemetría integrada.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-slate-900 px-4 py-2 rounded-t-lg border-t border-x border-slate-800">
                <span className="text-xs font-mono text-slate-400">Componente: DriverTracker.tsx</span>
                <button
                  onClick={() => handleCopy(REACT_NATIVE_COMPONENT, 'mobileCode')}
                  className="flex items-center space-x-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300"
                >
                  {copiedText === 'mobileCode' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedText === 'mobileCode' ? '¡Copiado!' : 'Copiar Código'}</span>
                </button>
              </div>
              <pre className="overflow-x-auto rounded-b-lg bg-black/60 p-4 text-xs font-mono text-yellow-300 border-b border-x border-slate-800 leading-relaxed max-h-[420px]">
                {REACT_NATIVE_COMPONENT}
              </pre>
            </div>
          </div>
        )}

        {activeSubTab === 'roadmap' && (
          <div className="space-y-6">
            <p className="text-xs text-slate-400">
              Cronograma de desarrollo secuencial para que el equipo comercial lance la migración corporativa sin afectar la operación actual.
            </p>
            <div className="relative border-l border-slate-800 ml-4 py-2 space-y-6">
              
              <div className="relative pl-6">
                <div className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-blue-500 border-2 border-slate-950"></div>
                <h5 className="font-bold text-white text-xs flex items-center space-x-2">
                  <span>Fase 1: Multi-Tenancy Engine (Semanas 1-2)</span>
                  <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-400">Completo</span>
                </h5>
                <p className="text-slate-400 text-xs mt-1">
                  Reestructuración del login en React Native, despliegue de Firebase Security Rules de aislamiento y soporte RUC10/20.
                </p>
              </div>

              <div className="relative pl-6">
                <div className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-blue-500 border-2 border-slate-950"></div>
                <h5 className="font-bold text-white text-xs flex items-center space-x-2">
                  <span>Fase 2: Módulo de Flota & Despacho Directo (Semanas 3-4)</span>
                  <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-400">Mock Completado</span>
                </h5>
                <p className="text-slate-400 text-xs mt-1">
                  CRUD de trailers y choferes con bloqueo biométrico o licencias vigentes MTC del Perú en la base de datos de Auth.
                </p>
              </div>

              <div className="relative pl-6">
                <div className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-amber-500 border-2 border-slate-950 animate-pulse"></div>
                <h5 className="font-bold text-white text-xs flex items-center space-x-2">
                  <span>Fase 3: Trazabilidad Térmica Integrada & Geocercas (Semanas 5-6)</span>
                  <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400">En Desarrollo</span>
                </h5>
                <p className="text-slate-400 text-xs mt-1">
                  Integración de APIs de termógrafos de contendedores (Samsara y Motive) y alertas automáticas por email.
                </p>
              </div>

              <div className="relative pl-6">
                <div className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-slate-700 border-2 border-slate-950"></div>
                <h5 className="font-bold text-white text-xs">Fase 4: Suscripciones Stripe Latam & IA Copilot (Semanas 7-8)</h5>
                <p className="text-slate-400 text-xs mt-1">
                  Lanzamiento de planes Business y Enterprise con procesamiento de pagos recurrente Stripe e Inteligencia Artificial de rutas.
                </p>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
