import React, { useState } from 'react';
import { 
  Building2, CreditCard, Check, ShieldAlert, Sparkles, 
  HelpCircle, RefreshCw, BarChart3, AlertOctagon 
} from 'lucide-react';

interface SaaSBillingProps {
  activePlan: 'free' | 'business' | 'enterprise';
  sedesCount: number;
  vehiclesCount: number;
  driversCount: number;
  onUpdatePlan: (newPlan: 'free' | 'business' | 'enterprise') => void;
  onAddAlertLog: (log: string) => void;
}

export const SaaSBilling: React.FC<SaaSBillingProps> = ({
  activePlan,
  sedesCount,
  vehiclesCount,
  driversCount,
  onUpdatePlan,
  onAddAlertLog
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'business' | 'enterprise'>(activePlan);
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [checkoutMethod, setCheckoutMethod] = useState<'card' | 'bank' | 'yape'>('card');
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  const [paymentForm, setPaymentForm] = useState({ cardNum: '', holderName: '', cardExp: '', cardCVV: '' });

  // Plan limits indicators
  const limits = {
    free: { sedes: 1, vehicles: 2, drivers: 2, price: 'US$ 0 / mes' },
    business: { sedes: 5, vehicles: 10, drivers: 10, price: 'US$ 149 / mes' },
    enterprise: { sedes: 50, vehicles: 200, drivers: 200, price: 'US$ 599 / mes' }
  };

  const handleRenewalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutLoading(true);

    setTimeout(() => {
      setCheckoutLoading(false);
      onUpdatePlan(selectedPlan);
      setShowCheckout(false);
      onAddAlertLog(`[SAAS PLAN] Organización actualizó/renovó suscripción telemática a plan [${selectedPlan.toUpperCase()}]. Cuotas de flotas extendidas.`);
      alert(`🎉 ¡Suscripción Activa! Tu cuenta ha sido migrada a plan ${selectedPlan.toUpperCase()} de manera inmediata. Los límites de sub-unidades regladas se han habilitado.`);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      
      {/* Current quotas indicators */}
      <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <BarChart3 className="h-4.5 w-4.5 text-indigo-400" />
            <span>Facturación Activa & Control de Quotas SaaS</span>
          </h4>
          <p className="text-[10px] text-slate-400 mt-1">Supervisa tu escalabilidad y los techos de tus operaciones según tu plan activo.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Sedes count usage */}
          <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-2">
            <span className="text-[10px] text-slate-500 block uppercase font-mono font-bold">Cuota Sedes / Terminales</span>
            <div className="flex justify-between items-baseline text-white">
              <span className="text-xl font-bold font-mono">{sedesCount} <span className="text-xs text-slate-500">/ {limits[activePlan].sedes}</span></span>
              <span className="text-[10.5px] font-bold text-slate-400">{Math.round((sedesCount / limits[activePlan].sedes) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-850">
              <div 
                className={`h-full ${sedesCount >= limits[activePlan].sedes ? 'bg-amber-500 animate-pulse' : 'bg-indigo-600'}`} 
                style={{ width: `${Math.min((sedesCount / limits[activePlan].sedes) * 100, 100)}%` }} 
              />
            </div>
          </div>

          {/* Vehicles Count usage */}
          <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-2">
            <span className="text-[10px] text-slate-500 block uppercase font-mono font-bold">Unidades Telemáticas Placas</span>
            <div className="flex justify-between items-baseline text-white">
              <span className="text-xl font-bold font-mono">{vehiclesCount} <span className="text-xs text-slate-500">/ {limits[activePlan].vehicles}</span></span>
              <span className="text-[10.5px] font-bold text-slate-400">{Math.round((vehiclesCount / limits[activePlan].vehicles) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-850">
              <div 
                className={`h-full ${vehiclesCount >= limits[activePlan].vehicles ? 'bg-amber-500 animate-pulse' : 'bg-indigo-600'}`} 
                style={{ width: `${Math.min((vehiclesCount / limits[activePlan].vehicles) * 100, 100)}%` }} 
              />
            </div>
          </div>

          {/* Drivers Count usage */}
          <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-2">
            <span className="text-[10px] text-slate-500 block uppercase font-mono font-bold">Conductores Habilitados</span>
            <div className="flex justify-between items-baseline text-white">
              <span className="text-xl font-bold font-mono">{driversCount} <span className="text-xs text-slate-500">/ {limits[activePlan].drivers}</span></span>
              <span className="text-[10.5px] font-bold text-slate-400">{Math.round((driversCount / limits[activePlan].drivers) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-850">
              <div 
                className={`h-full ${driversCount >= limits[activePlan].drivers ? 'bg-amber-500 animate-pulse' : 'bg-indigo-600'}`} 
                style={{ width: `${Math.min((driversCount / limits[activePlan].drivers) * 100, 100)}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Plans Pricing Grid Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Plan FREE */}
        <div className={`bg-slate-950 border rounded-2xl p-5 flex flex-col justify-between shadow-lg relative ${
          activePlan === 'free' ? 'border-indigo-600 ring-2 ring-indigo-600/20' : 'border-slate-800'
        }`}>
          {activePlan === 'free' && (
            <span className="absolute top-3 right-3 text-[9px] uppercase font-mono font-bold bg-indigo-600/10 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full">Activo</span>
          )}
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Starter</span>
              <h4 className="text-lg font-black text-white mt-1">Chasqui PYME FREE</h4>
              <p className="text-slate-400 text-xs mt-1.5">{limits.free.price}</p>
            </div>
            
            <ul className="space-y-2 pt-2 text-[11px] text-slate-300">
              <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-500" /> 1 Terminal / Sede</li>
              <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-500" /> 2 Camiones máximo</li>
              <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-500" /> 2 Choferes</li>
              <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-500" /> Seguimiento GPS</li>
            </ul>
          </div>
          <button 
            disabled={activePlan === 'free'}
            onClick={() => { setSelectedPlan('free'); setShowCheckout(true); }}
            className="w-full bg-slate-900 hover:bg-slate-850 text-white font-bold py-2.5 rounded-xl text-xs mt-6 transition disabled:opacity-40"
          >
            {activePlan === 'free' ? 'Tu Plan Actual' : 'Downgrade Libre'}
          </button>
        </div>

        {/* Plan BUSINESS */}
        <div className={`bg-slate-950 border rounded-2xl p-5 flex flex-col justify-between shadow-lg relative ${
          activePlan === 'business' ? 'border-indigo-600 ring-2 ring-indigo-600/20' : 'border-slate-800'
        }`}>
          <div className="absolute -top-3 left-6 text-[9.5px] uppercase font-black tracking-widest bg-indigo-600 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
            <Sparkles className="h-3 w-3" /> Recomendado
          </div>
          {activePlan === 'business' && (
            <span className="absolute top-3 right-3 text-[9px] uppercase font-mono font-bold bg-indigo-600/10 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full">Activo</span>
          )}
          <div className="space-y-4 pt-1">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Corporativo</span>
              <h4 className="text-lg font-black text-white mt-1">SaaS BUSINESS PRO</h4>
              <p className="text-slate-400 text-xs mt-1.5">{limits.business.price}</p>
            </div>

            <ul className="space-y-2 pt-2 text-[11px] text-slate-300">
              <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-500" /> 5 Terminales / Sedes</li>
              <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-500" /> 10 Camiones frigoríficos</li>
              <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-500" /> 10 Choferes</li>
              <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-500" /> Gemini AI Copilot básico</li>
              <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-500" /> Offline Sync telemático</li>
            </ul>
          </div>
          <button 
            disabled={activePlan === 'business'}
            onClick={() => { setSelectedPlan('business'); setShowCheckout(true); }}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs mt-6 transition disabled:opacity-40 shadow-lg shadow-indigo-500/10"
          >
            {activePlan === 'business' ? 'Tu Plan Actual' : 'Adquirir Business'}
          </button>
        </div>

        {/* Plan ENTERPRISE */}
        <div className={`bg-slate-950 border rounded-2xl p-5 flex flex-col justify-between shadow-lg relative ${
          activePlan === 'enterprise' ? 'border-indigo-600 ring-2 ring-indigo-600/20' : 'border-slate-800'
        }`}>
          {activePlan === 'enterprise' && (
            <span className="absolute top-3 right-3 text-[9px] uppercase font-mono font-bold bg-indigo-600/10 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full">Activo</span>
          )}
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Consorcio</span>
              <h4 className="text-lg font-black text-white mt-1">Chasqui ENTERPRISE</h4>
              <p className="text-slate-400 text-xs mt-1.5">{limits.enterprise.price}</p>
            </div>

            <ul className="space-y-2 pt-2 text-[11px] text-slate-300">
              <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-500" /> 50 Terminales / Sedes</li>
              <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-500" /> 200 Camiones</li>
              <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-500" /> 200 Conductores</li>
              <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-500" /> Gemini AI SRE predictivo pro</li>
              <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-500" /> Geolocalización real multi-sala</li>
            </ul>
          </div>
          <button 
            disabled={activePlan === 'enterprise'}
            onClick={() => { setSelectedPlan('enterprise'); setShowCheckout(true); }}
            className="w-full bg-slate-900 hover:bg-slate-850 text-white font-bold py-2.5 rounded-xl text-xs mt-6 transition disabled:opacity-40"
          >
            {activePlan === 'enterprise' ? 'Tu Plan Actual' : 'Migrar a ILIMITADO'}
          </button>
        </div>
      </div>

      {/* Subscription Checkout Renewal Form */}
      {showCheckout && (
        <form onSubmit={handleRenewalSubmit} className="bg-slate-950 border border-slate-850 p-6 rounded-2xl shadow-xl space-y-4 max-w-lg mx-auto transition-all">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-indigo-400" />
                <span>Renovación / Upgrade Suscripción</span>
              </h4>
              <p className="text-[10.5px] text-indigo-400 mt-1">Plan seleccionado: <b>{selectedPlan.toUpperCase()}</b> ({limits[selectedPlan].price})</p>
            </div>
            <button type="button" onClick={() => setShowCheckout(false)} className="text-slate-500 hover:text-white px-2 py-1 text-xs font-bold">Cerrar</button>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-slate-900 p-1 rounded-lg text-xs font-black">
            <button 
              type="button" 
              onClick={() => setCheckoutMethod('card')}
              className={`py-1.5 rounded transition ${checkoutMethod === 'card' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              Tarjeta Crédito
            </button>
            <button 
              type="button" 
              onClick={() => setCheckoutMethod('bank')}
              className={`py-1.5 rounded transition ${checkoutMethod === 'bank' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              Transferencia
            </button>
            <button 
              type="button" 
              onClick={() => setCheckoutMethod('yape')}
              className={`py-1.5 rounded transition ${checkoutMethod === 'yape' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              Yape / Plin
            </button>
          </div>

          {checkoutMethod === 'card' ? (
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[9px] uppercase font-black text-slate-500 mb-1">Número de Tarjeta de Crédito</label>
                <input
                  type="text"
                  placeholder="4000 1234 5678 9010"
                  required
                  value={paymentForm.cardNum}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, cardNum: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs focus:ring-0 font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[9px] uppercase font-black text-slate-500 mb-1">Nombre Tarjetahabiente</label>
                  <input
                    type="text"
                    placeholder="Escribir Nombre Titular"
                    required
                    value={paymentForm.holderName}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, holderName: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs focus:ring-0 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-black text-slate-500 mb-1">CVV</label>
                  <input
                    type="password"
                    placeholder="•••"
                    maxLength={3}
                    required
                    value={paymentForm.cardCVV}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, cardCVV: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs focus:ring-0 font-mono"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 p-4 border border-slate-850 rounded-xl text-center font-mono text-[10.5px] text-slate-300">
              {checkoutMethod === 'yape' ? (
                <div>
                  <p>QR de Recargo Chasqui Telemático Activo</p>
                  <div className="w-24 h-24 bg-white rounded-lg mx-auto my-3 flex items-center justify-center text-black font-sans font-black">QR Yape</div>
                  <p className="text-slate-400">Escanea y transfiere el equivalente en Soles al tipo de cambio.</p>
                </div>
              ) : (
                <div className="text-left space-y-2.5">
                  <p className="border-b border-slate-800 pb-1 text-white uppercase font-black text-[9px]">Cuentas recaudadoras Chasqui SAC</p>
                  <p>BCP Corriente: 191-2060123-0-62<br />CCI: 00219100206012306211</p>
                  <p className="text-[9.5px] text-slate-500 font-sans">Sube el comprobante de depósito para auditoría manual.</p>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={checkoutLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2"
          >
            {checkoutLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Procesando pago en red bancaria pasarela...</span>
              </>
            ) : (
              <span>Confirmar renovación de cuotas</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
