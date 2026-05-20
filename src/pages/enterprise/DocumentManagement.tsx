import React, { useState } from 'react';
import { 
  FileText, Upload, AlertCircle, ShieldAlert, Sparkles, 
  Trash2, ArrowUpRight, FolderOpen, CheckSquare, RefreshCw 
} from 'lucide-react';

interface LogisticsDoc {
  id: string;
  name: string;
  category: 'driver' | 'vehicle' | 'permits';
  ownerName: string;
  numberId: string;
  expirationDate: string;
  daysRemaining: number;
  status: 'conformidad' | 'revision' | 'vencido';
  ocrDetectedData?: string;
  previewUrl?: string;
}

export const DocumentManagement: React.FC = () => {
  const [docs, setDocs] = useState<LogisticsDoc[]>([
    { id: 'doc1', name: 'SOAT Pesado Nacional', category: 'vehicle', ownerName: 'F2W-894', numberId: 'LP-334204-51', expirationDate: '2026-11-20', daysRemaining: 182, status: 'conformidad' },
    { id: 'doc2', name: 'Licencia Especial AIIIB', category: 'driver', ownerName: 'Mario Lanza Espinoza', numberId: 'Q-49204421', expirationDate: '2026-06-12', daysRemaining: 22, status: 'revision' },
    { id: 'doc3', name: 'Certificación Técnica MTC Cat 2', category: 'vehicle', ownerName: 'C5X-611', numberId: 'MTC-C2-442', expirationDate: '2026-04-10', daysRemaining: -40, status: 'vencido' },
  ]);

  const [dragActive, setDragActive] = useState<boolean>(false);
  const [ocrLoading, setOcrLoading] = useState<boolean>(false);
  
  // Document entry form
  const [newDoc, setNewDoc] = useState({
    name: 'MTC Permiso Mercancías',
    category: 'permits' as 'driver' | 'vehicle' | 'permits',
    ownerName: 'Soporte Agrícola SAC',
    numberId: 'REG-90244',
    expirationDate: '2026-12-30'
  });

  const [previewFile, setPreviewFile] = useState<string>('');

  // Handle Drag & Drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcessing(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcessing(e.target.files[0]);
    }
  };

  const handleFileProcessing = (file: File) => {
    setOcrLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewFile(reader.result as string);
      
      // Simulate OCR Scanner
      setTimeout(() => {
        setOcrLoading(false);
        const parsedNumber = `OCR-${Math.floor(100000 + Math.random() * 900000)}`;
        
        // Add parsed document to state
        const docEntry: LogisticsDoc = {
          id: `doc_${Date.now()}`,
          name: newDoc.name,
          category: newDoc.category,
          ownerName: newDoc.ownerName,
          numberId: parsedNumber,
          expirationDate: newDoc.expirationDate,
          daysRemaining: Math.floor((new Date(newDoc.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
          status: 'revision',
          ocrDetectedData: `[AI OCR LECTURA COMPLETA] Detectado RUC: 20601234567, Registro Vial: ${parsedNumber}, Vence: ${newDoc.expirationDate}. Firma legal visible: OK.`,
          previewUrl: reader.result as string
        };

        setDocs(prev => [docEntry, ...prev]);
        setPreviewFile('');
        alert(`🤖 Chasqui OCR Escáner: ¡Documento leído con éxito! Identificación extraída: ${parsedNumber}. Registrado en revisión de conformidad técnica.`);
      }, 1800);
    };
    reader.readAsDataURL(file);
  };

  // Delete doc
  const handleDeleteDoc = (id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
  };

  // Conformity audit tick status
  const toggleDocCompliance = (id: string) => {
    setDocs(prev => prev.map(d => {
      if (d.id === id) {
        const nextStatus = d.status === 'conformidad' ? 'revision' : 'conformidad';
        return { ...d, status: nextStatus };
      }
      return d;
    }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      
      {/* Upload & Form Box (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* DRAG-AND-DROP FILE BOX (Compliance with usability mandates) */}
        <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase font-mono">
              <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
              <span>Chasqui AI-OCR Escáner</span>
            </h4>
            <p className="text-[10px] text-slate-400 mt-1">Carga licencias, revisiones técnicas pesadas o SOAT para lectura de datos satélite al instante.</p>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[9px] uppercase font-black text-slate-500 mb-1">Nombre Documento</label>
                <select
                  value={newDoc.name}
                  onChange={(e) => setNewDoc(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-900 text-white border border-slate-800 p-2.5 rounded-xl text-xs focus:ring-0"
                >
                  <option value="Constancia Pesos y Medidas">Permiso Pesos / Medidas MTC</option>
                  <option value="Licencia Chofer Especial">Licencia Chofer Especial</option>
                  <option value="Registro FitoSanitario Senasa">Registro FitoSenasa</option>
                  <option value="SOAT Certificado Flota">SOAT de Remolque</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] uppercase font-black text-slate-500 mb-1">Entidad Propietaria</label>
                <input
                  type="text"
                  value={newDoc.ownerName}
                  onChange={(e) => setNewDoc(prev => ({ ...prev, ownerName: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs focus:ring-0 font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] uppercase font-black text-slate-500 mb-1">Fecha Vencimiento Esperada</label>
              <input
                type="date"
                value={newDoc.expirationDate}
                onChange={(e) => setNewDoc(prev => ({ ...prev, expirationDate: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs focus:ring-0"
              />
            </div>

            {/* Drag Zone */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                dragActive 
                  ? 'border-indigo-500 bg-indigo-500/10' 
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
              }`}
            >
              <input 
                type="file" 
                id="digital-cabinet-file"
                multiple={false}
                accept="image/*,application/pdf"
                onChange={handleFileInput}
                className="hidden" 
              />
              <label htmlFor="digital-cabinet-file" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                <Upload className={`h-8 w-8 mb-3 transition-transform ${dragActive ? 'scale-110 text-indigo-400' : 'text-slate-500'}`} />
                {ocrLoading ? (
                  <div className="space-y-2 text-center">
                    <RefreshCw className="h-5 w-5 text-indigo-500 animate-spin mx-auto" />
                    <span className="text-xs font-mono text-indigo-400 block font-bold">🤖 Escaneando OCR y Certificaciones MTC...</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-bold text-white block">Arrastra PDF/JPEG o haz clic para subir</span>
                    <span className="text-[10px] text-slate-500 block mt-1">Lector de metadatos automático Chasqui AI</span>
                  </div>
                )}
              </label>
            </div>
          </form>
        </div>

        {previewFile && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
            <span className="text-[10px] text-slate-500 block mb-2 uppercase">Previsualización de documento</span>
            <img src={previewFile} alt="Preview file upload" className="rounded-lg object-contain h-32 w-full bg-black" referrerPolicy="no-referrer" />
          </div>
        )}
      </div>

      {/* Real Cabinet compliance list (7 cols) */}
      <div className="lg:col-span-7 bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-900 pb-3">
            <FolderOpen className="h-4.5 w-4.5 text-indigo-400" />
            <span>Gabinete de Cumplimiento Técnico Homologado</span>
          </h4>

          <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
            {docs.map(d => (
              <div key={d.id} className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 flex items-start justify-between relative overflow-hidden group">
                {d.status === 'vencido' && (
                  <div className="absolute top-0 inset-y-0 left-0 w-1 bg-rose-500" />
                )}
                {d.status === 'revision' && (
                  <div className="absolute top-0 inset-y-0 left-0 w-1 bg-amber-500 animate-pulse" />
                )}

                <div className="space-y-2 flex-1 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-xs">{d.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                      d.category === 'vehicle' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>{d.category}</span>
                  </div>

                  <p className="text-[10.5px] text-slate-400">Asociado: <b className="text-slate-300 font-bold">{d.ownerName}</b> | ID: {d.numberId}</p>
                  
                  {d.ocrDetectedData && (
                    <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-900 font-mono text-[9px] text-indigo-400">
                      {d.ocrDetectedData}
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-1 text-[10px] font-mono">
                    <span className="text-slate-500">Expira: {d.expirationDate}</span>
                    <span>•</span>
                    {d.daysRemaining < 0 ? (
                      <span className="text-rose-400 font-black flex items-center gap-0.5 animate-pulse">
                        <ShieldAlert className="h-3 w-3" /> VENCIDO HACE {-d.daysRemaining} DÍAS
                      </span>
                    ) : d.daysRemaining < 30 ? (
                      <span className="text-amber-400 font-bold flex items-center gap-0.5">
                        <AlertCircle className="h-3 w-3" /> POR VENCER: {d.daysRemaining} DÍAS
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-bold">Válido: {d.daysRemaining} días</span>
                    )}
                  </div>
                </div>

                {/* Audit Actions */}
                <div className="flex flex-col items-end gap-3 justify-between self-stretch">
                  <button
                    onClick={() => toggleDocCompliance(d.id)}
                    className={`px-3 py-1 rounded text-[10px] font-black uppercase border transition-all ${
                      d.status === 'conformidad'
                        ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-600/10 text-amber-400 border-amber-500/20 hover:bg-emerald-500/10'
                    }`}
                    title="Audit Verification compliance check"
                  >
                    {d.status === 'conformidad' ? '✓ Conforme' : '✎ Pendiente'}
                  </button>

                  <button
                    onClick={() => handleDeleteDoc(d.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded bg-slate-950 hover:bg-rose-500/20 border border-slate-850 hover:border-rose-500/30 text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total compliance report progress bar */}
        <div className="mt-5 pt-4 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span>Conformidad General de Auditoría:</span>
            <div className="w-24 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-850">
              <div 
                className="bg-emerald-500 h-full transition-all" 
                style={{ width: `${(docs.filter(d => d.status === 'conformidad').length / docs.length) * 100}%` }} 
              />
            </div>
            <span className="font-bold text-white">
              {Math.round((docs.filter(d => d.status === 'conformidad').length / docs.length) * 100) || 0}%
            </span>
          </div>
          <span>Sujeto a normas SUTRAN</span>
        </div>
      </div>
    </div>
  );
};
