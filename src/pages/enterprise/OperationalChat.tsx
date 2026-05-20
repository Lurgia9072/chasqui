import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Camera, MapPin, Mic, Wifi, Volume2, 
  MessageSquare, User2, AlertCircle, Sparkles, Navigation, RefreshCw
} from 'lucide-react';
import { listenOperationalChat, 
  saveOperationalChatMessage, 
  EnterpriseChatMessage  } from '@/src/services/EnterpriseService';


interface OperationalChatProps {
  organizationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  onAddAlertLog: (log: string) => void;
}

interface ChatChannel {
  id: string;
  name: string;
  description: string;
  unread: boolean;
  onlineCount: number;
}

export const OperationalChat: React.FC<OperationalChatProps> = ({
  organizationId,
  senderId,
  senderName,
  senderRole,
  onAddAlertLog
}) => {
  const [channels, setChannels] = useState<ChatChannel[]>([
    { id: 'central-ops', name: '📢 #central_ops', description: 'Canal operativo principal de sedes y despachos', unread: false, onlineCount: 6 },
    { id: 'ruta-norte', name: '🚚 #ruta_norte_chimbote', description: 'Coordinación vial Piura - Lima - Chimbote', unread: true, onlineCount: 3 },
    { id: 'ruta-sur', name: '🇵🇪 #ruta_sur_ilo_puno', description: 'Transporte de carga pesada a puertos de Ilo/Moquegua', unread: false, onlineCount: 2 }
  ]);
  
  const [activeChannelId, setActiveChannelId] = useState<string>('central-ops');
  const [messages, setMessages] = useState<EnterpriseChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  
  // Audio notes simulator
  const [audioRecording, setAudioRecording] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time chat messages via Firestore stream!
  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenOperationalChat(activeChannelId, (updatedMessages) => {
      // If empty, hydrate with initial operational bulletins
      if (updatedMessages.length === 0) {
        setMessages([
          {
            id: 'init_1',
            organizationId,
            tripId: activeChannelId,
            senderId: 'SYSTEM_AI',
            senderName: 'Robot de Despachos',
            senderRole: 'operador',
            text: '🔔 Bienvenido al canal de comunicaciones operacionales en vivo de Chasqui. Toda la telemática del transporte y chat de camioneros se registra con trazabilidad permanente.',
            createdAt: Date.now() - 3600000
          }
        ]);
      } else {
        setMessages(updatedMessages);
      }
      setLoading(false);
      
      // Clear unread mark
      setChannels(prev => prev.map(c => c.id === activeChannelId ? { ...c, unread: false } : c));
    });

    return () => unsubscribe();
  }, [activeChannelId, organizationId]);

  // Handle messages autoscrolling
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Submit Text Message to Firestore
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textPayload = inputText;
    setInputText('');

    try {
      await saveOperationalChatMessage(organizationId, activeChannelId, {
        senderId,
        senderName,
        senderRole,
        text: textPayload
      });
      onAddAlertLog(`[CHAT] Mensaje transmitido en canal ${activeChannelId}: "${textPayload}"`);
    } catch (err) {
      console.error('Error saving operational chat:', err);
    }
  };

  // Share Real Location from navigator GPS
  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
      
      try {
        await saveOperationalChatMessage(organizationId, activeChannelId, {
          senderId,
          senderName,
          senderRole,
          text: `📍 Ubicación de supervisor compartida en tiempo real`,
          location: coords
        });
        onAddAlertLog(`[GPS CHAT] Compartidas coordenadas físicas Lat ${coords.lat.toFixed(4)}.`);
      } catch (err) {
        console.error('Error sharing chat location', err);
      }
    });
  };

  // Attach Simulated Photo
  const handleAttachPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          await saveOperationalChatMessage(organizationId, activeChannelId, {
            senderId,
            senderName,
            senderRole,
            text: '📷 Evidencia fotográfica de precinto de seguridad adjunta',
            photoUrl: reader.result as string
          });
          onAddAlertLog('[CHAT] Imagen cargada satisfactoriamente en canal operativo.');
        } catch (err) {
          console.error(err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Attaching Simulated Audio Note
  const handleRecordAudio = () => {
    setAudioRecording(true);
    setTimeout(async () => {
      setAudioRecording(false);
      try {
        await saveOperationalChatMessage(organizationId, activeChannelId, {
          senderId,
          senderName,
          senderRole,
          text: '🎤 Nota de voz telemática - Reporte de tráficos en caseta de peaje',
          audioUrl: 'https://codesandbox.io/mock_audio_rec.mp3'
        } as any);
        onAddAlertLog('[CHAT] Mensaje de voz transmitido en vivo.');
      } catch (err) {
        console.error(err);
      }
    }, 2000);
  };

  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];

  return (
    <div className="grid gap-6 lg:grid-cols-12 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden min-h-[500px] shadow-2xl">
      
      {/* Channels Sidebar List (4 cols) */}
      <div className="lg:col-span-4 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 space-y-4">
        <div className="space-y-4">
          <div className="border-b border-slate-850 pb-3 flex justify-between items-center text-xs">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Salas de Control #</h4>
              <p className="text-[10px] text-slate-400">Canales intra-empresariales</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          <div className="space-y-1.5">
            {channels.map(chan => (
              <button
                key={chan.id}
                onClick={() => setActiveChannelId(chan.id)}
                className={`w-full text-left p-3 rounded-xl border text-xs flex flex-col gap-1 transition-all ${
                  activeChannelId === chan.id 
                    ? 'bg-slate-950 border-indigo-500/50 shadow text-white' 
                    : 'bg-slate-90/50 border-transparent text-slate-300 hover:bg-slate-950/40 hover:text-white'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm tracking-tight">{chan.name}</span>
                  {chan.unread && (
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </div>
                <p className="text-[10.5px] text-slate-400 font-sans line-clamp-1">{chan.description}</p>
                <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono mt-1 border-t border-slate-950 pt-1">
                  <span>En Línea: {chan.onlineCount} operadores</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Diagnostic info footer */}
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850 text-[10.5px] text-slate-400">
          <p className="font-bold flex items-center gap-1 text-white">
            <Volume2 className="h-3.5 w-3.5 text-indigo-400" />
            <span>Codificación WebRTC</span>
          </p>
          <p className="mt-1 font-mono text-[9px]">Ancho de banda optimizado: 24kbps Opus.</p>
        </div>
      </div>

      {/* Actual Chat Window Box (8 cols) */}
      <div className="lg:col-span-8 flex flex-col justify-between bg-black/40 min-h-[460px]">
        
        {/* Active Channel Header */}
        <div className="bg-slate-900/60 p-4 border-b border-slate-850 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
              <MessageSquare className="h-4.5 w-4.5" />
            </div>
            <div>
              <h4 className="text-white text-sm font-black font-mono">{activeChannel.name}</h4>
              <p className="text-[10px] text-slate-400">{activeChannel.description}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
            <Wifi className="h-3 w-3 animate-pulse" /> LIVE STREAMING
          </span>
        </div>

        {/* Message Feeds Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[340px]">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <RefreshCw className="h-5 w-5 text-indigo-500 animate-spin" />
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.senderId === senderId;
              
              return (
                <div key={msg.id || i} className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                  {/* Badge */}
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                    <User2 className="h-3.5 w-3.5" />
                  </div>

                  <div className={`max-w-[70%] space-y-1.5 p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isMe 
                      ? 'bg-indigo-600/10 border border-indigo-500/20 text-slate-200 rounded-tr-none' 
                      : 'bg-slate-900 border border-slate-850 text-slate-300 rounded-tl-none'
                  }`}>
                    {/* Meta info */}
                    <div className="flex items-center gap-2 border-b border-slate-950 pb-1 mb-1 font-mono text-[9px] text-slate-500">
                      <b className="text-white text-[10px]">{msg.senderName}</b>
                      <span>•</span>
                      <span className="uppercase text-slate-400">[{msg.senderRole}]</span>
                    </div>

                    {msg.text && <p className="font-sans font-medium text-white">{msg.text}</p>}

                    {/* Render shared physical coordinates maps bridge */}
                    {msg.location && (
                      <div className="mt-2 bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                        <span className="text-[9.5px] uppercase font-bold text-indigo-400 block tracking-wider flex items-center gap-1">
                          <Navigation className="h-3 w-3" /> UBICACIÓN COMPARTIDA
                        </span>
                        <p className="mt-1 font-mono text-[10px] text-slate-400">Lat: {msg.location.lat.toFixed(5)}, Lng: {msg.location.lng.toFixed(5)}</p>
                        <a 
                          href={`https://maps.google.com/?q=${msg.location.lat},${msg.location.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9.5px] text-indigo-400 underline mt-1.5 block hover:text-indigo-300"
                        >
                          Ver en Google Maps →
                        </a>
                      </div>
                    )}

                    {/* Render Image previews natively from input attachments */}
                    {msg.photoUrl && (
                      <img 
                        src={msg.photoUrl} 
                        alt="Telematic proof" 
                        className="mt-2 max-w-full h-36 object-cover rounded-xl border border-slate-800" 
                        referrerPolicy="no-referrer" 
                      />
                    )}

                    {/* Render audio nodes speaker simulator */}
                    {msg.audioUrl && (
                      <div className="mt-2 bg-slate-950 border border-slate-850 p-2 rounded-xl flex items-center gap-2 font-mono text-[10px] text-slate-300">
                        <Volume2 className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
                        <span>Reproducir nota de voz telemática (2.4s)</span>
                      </div>
                    )}

                    <span className="block text-[8.5px] text-slate-500 text-right mt-1 font-mono">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>

        {/* Message Composer Bar */}
        <div className="bg-slate-900/60 p-4 border-t border-slate-850">
          <form onSubmit={handleSendMessage} className="flex gap-2.5">
            {/* Share coords */}
            <button
              type="button"
              onClick={handleShareLocation}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-indigo-400 transition"
              title="Compartir ubicación real actual"
            >
              <MapPin className="h-4.5 w-4.5" />
            </button>

            {/* Attach photo */}
            <label className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-indigo-400 cursor-pointer transition" title="Adjuntar foto de guía o precinto">
              <Camera className="h-4.5 w-4.5" />
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAttachPhoto} 
                className="hidden" 
              />
            </label>

            {/* Record voice notes */}
            <button
              type="button"
              onClick={handleRecordAudio}
              className={`p-2.5 rounded-xl bg-slate-950 border transition ${
                audioRecording 
                  ? 'border-rose-500 text-rose-500 bg-rose-500/10 animate-pulse' 
                  : 'border-slate-850 hover:border-slate-700 text-slate-400 hover:text-rose-400'
              }`}
              title="Grabar nota de voz operativa"
            >
              <Mic className="h-4.5 w-4.5" />
            </button>

            {/* Actual text input box */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escribe un boletín de despacho o consulta en vivo..."
              className="flex-1 bg-slate-950 border border-slate-850 text-white rounded-xl px-4 text-xs focus:ring-0 focus:border-indigo-500 font-sans"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl flex items-center justify-center transition disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
