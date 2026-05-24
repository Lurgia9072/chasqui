import React, { useState, useEffect } from 'react';
import { Settings, Building2, Save, Sparkles, Check, Info } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface EnterpriseSettingsProps {
  organizationId: string;
  orgData: any;
  onRefreshOrg?: () => void;
}

export const EnterpriseSettings: React.FC<EnterpriseSettingsProps> = ({
  organizationId,
  orgData,
  onRefreshOrg
}) => {
  const [profile, setProfile] = useState({
    name: '',
    ruc: '',
    razonSocial: '',
    direccion: '',
    telefono: '',
    contacto_nombre: '',
    rubroSector: 'Agroindustrial',
    plan: 'enterprise'
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (orgData) {
      setProfile({
        name: orgData.name || '',
        ruc: orgData.ruc || '',
        razonSocial: orgData.razonSocial || orgData.name || '',
        direccion: orgData.direccion || 'Av. Camino Real 456, San Isidro, Lima',
        telefono: orgData.telefono || '01-4402928',
        contacto_nombre: orgData.contacto_nombre || 'Gerente de Cadena de Suministro',
        rubroSector: orgData.rubroSector || 'Agroindustrial',
        plan: orgData.plan || 'enterprise'
      });
    }
  }, [orgData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;

    setSaving(true);
    setSuccess(false);

    try {
      const orgRef = doc(db, 'organizations', organizationId);
      await updateDoc(orgRef, {
        name: profile.name,
        razonSocial: profile.razonSocial,
        ruc: profile.ruc,
        direccion: profile.direccion,
        telefono: profile.telefono,
        contacto_nombre: profile.contacto_nombre,
        rubroSector: profile.rubroSector ?? profile.rubroSector,
        updatedAt: Date.now()
      });

      setSuccess(true);
      if (onRefreshOrg) onRefreshOrg();
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving organization settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800/80 p-6 rounded-2xl shadow-xl max-w-2xl">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-4 mb-6">
        <div>
          <h3 className="text-base font-black text-white flex items-center gap-1.5">
            <Settings className="h-5 w-5 text-indigo-400" />
            <span>Configuración de Cuenta Corporativa</span>
          </h3>
          <p className="text-slate-450 text-xs mt-0.5">Actualice datos tributarios, domicilio fiscal y rubro operacional de la empresa.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4 text-xs font-sans">
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500">Razón Social Legal</label>
            <input
              type="text"
              required
              value={profile.razonSocial}
              onChange={e => setProfile({ ...profile, razonSocial: e.target.value })}
              className="w-full bg-slate-905 border border-slate-800 bg-slate-900 rounded-xl px-3 py-2 text-white font-medium focus:border-indigo-650 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500">Nombre Comercial (Alias)</label>
            <input
              type="text"
              required
              value={profile.name}
              onChange={e => setProfile({ ...profile, name: e.target.value })}
              className="w-full bg-slate-905 border border-slate-800 bg-slate-900 rounded-xl px-3 py-2 text-white font-medium focus:border-indigo-650 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500">RUC Legal (SUNAT)</label>
            <input
              type="text"
              required
              maxLength={11}
              value={profile.ruc}
              onChange={e => setProfile({ ...profile, ruc: e.target.value })}
              className="w-full bg-slate-905 border border-slate-800 bg-slate-900 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500">Sector / Rubro Logístico</label>
            <select
              value={profile.rubroSector}
              onChange={e => setProfile({ ...profile, rubroSector: e.target.value })}
              className="w-full bg-slate-905 border border-slate-800 bg-slate-900 rounded-xl px-3 py-2 text-slate-300 focus:outline-none"
            >
              <option value="Agroindustrial">Agroindustrial / Agroexportación</option>
              <option value="Retail & Consumo">Retail & Distribución de Consumo</option>
              <option value="Minería">Minería y Siderurgia Pesada</option>
              <option value="Farmacéutica">Farmacéutica / Temperatura Controlada</option>
              <option value="Construcción">Construcción & Infraestructura</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-500">Domicilio Fiscal / Oficina Principal</label>
          <input
            type="text"
            required
            value={profile.direccion}
            onChange={e => setProfile({ ...profile, direccion: e.target.value })}
            className="w-full bg-slate-905 border border-slate-800 bg-slate-900 rounded-xl px-3 py-2 text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500">Persona de Contacto Autorizada</label>
            <input
              type="text"
              value={profile.contacto_nombre}
              onChange={e => setProfile({ ...profile, contacto_nombre: e.target.value })}
              className="w-full bg-slate-905 border border-slate-800 bg-slate-900 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500">Teléfono Corporativo</label>
            <input
              type="text"
              value={profile.telefono}
              onChange={e => setProfile({ ...profile, telefono: e.target.value })}
              className="w-full bg-slate-905 border border-slate-800 bg-slate-900 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>
        </div>

        {/* Subscription Info Banner */}
        <div className="bg-indigo-950/20 border border-indigo-950/40 p-3 rounded-lg flex items-start gap-2.5 mt-2">
          <Info className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-300">Licencia Multi-Empresa SasS Activa</span>
            <span className="block text-[10px] text-slate-450 mt-0.5">Suscrito al plan <b>Chasqui Pro Core</b>. Siguientes renovaciones automáticas mediante link corporativo.</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-900 flex justify-end gap-3 items-center">
          {success && (
            <span className="text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
              <Check className="h-4 w-4" />
              <span>Configuración guardada con éxito</span>
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition disabled:opacity-45"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
