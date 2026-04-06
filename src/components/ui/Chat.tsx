import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { ChatMessage, OperationType } from '../../types';
import { Button } from './Button';
import { Input } from './Input';
import { Send, Mic, Square, Play, Pause, User, Truck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChatProps {
  tripId: string;
  isCarrier: boolean;
  onClose?: () => void;
}

export const Chat = ({ tripId, isCarrier, onClose }: ChatProps) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'trips', tripId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatMessage));
      setMessages(msgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `trips/${tripId}/messages`);
    });

    return () => unsubscribe();
  }, [tripId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      await addDoc(collection(db, 'trips', tripId, 'messages'), {
        senderId: user.uid,
        senderName: user.nombre,
        text: newMessage,
        type: 'text',
        createdAt: Date.now()
      });
      setNewMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `trips/${tripId}/messages`);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        
        // Convert to base64 to store in Firestore (Workaround for no Storage)
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          if (base64Audio.length > 1000000) {
             alert("El audio es demasiado largo. Por favor, envía uno más corto.");
             return;
          }
          
          try {
            await addDoc(collection(db, 'trips', tripId, 'messages'), {
              senderId: user!.uid,
              senderName: user!.nombre,
              audioUrl: base64Audio,
              type: 'audio',
              createdAt: Date.now()
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, `trips/${tripId}/messages`);
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
      <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-full">
            {isCarrier ? <Truck className="h-5 w-5" /> : <User className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="font-bold">Chat del Viaje</h3>
            <p className="text-xs text-blue-100">En línea</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <Square className="h-5 w-5 rotate-45" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.uid;
          return (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col max-w-[80%]",
                isMe ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <span className="text-[10px] font-bold text-gray-400 mb-1 px-2">
                {isMe ? 'Tú' : msg.senderName}
              </span>
              <div
                className={cn(
                  "p-3 rounded-2xl shadow-sm",
                  isMe 
                    ? "bg-blue-600 text-white rounded-tr-none" 
                    : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                )}
              >
                {msg.type === 'text' ? (
                  <p className="text-sm">{msg.text}</p>
                ) : (
                  <div className="flex items-center space-x-2 min-w-[150px]">
                    <button 
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center",
                        isMe ? "bg-white/20 hover:bg-white/30" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                      )}
                      onClick={() => {
                        const audio = new Audio(msg.audioUrl);
                        audio.play();
                      }}
                    >
                      <Play className="h-4 w-4 fill-current" />
                    </button>
                    <div className="flex-1 h-1.5 bg-current opacity-20 rounded-full overflow-hidden">
                       <div className="h-full bg-current w-1/3" />
                    </div>
                    <span className="text-[10px] opacity-70">Audio</span>
                  </div>
                )}
              </div>
              <span className="text-[9px] text-gray-400 mt-1 px-2">
                {format(msg.createdAt, 'HH:mm', { locale: es })}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center space-x-2">
          {isRecording ? (
            <div className="flex-1 flex items-center justify-between bg-red-50 px-4 py-2 rounded-xl border border-red-100">
              <div className="flex items-center space-x-2 text-red-600 animate-pulse">
                <div className="h-2 w-2 bg-red-600 rounded-full" />
                <span className="text-sm font-bold">Grabando {formatTime(recordingTime)}</span>
              </div>
              <button 
                onClick={stopRecording}
                className="h-8 w-8 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700"
              >
                <Square className="h-4 w-4 fill-current" />
              </button>
            </div>
          ) : (
            <>
              <button 
                onClick={startRecording}
                className="h-10 w-10 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              >
                <Mic className="h-5 w-5" />
              </button>
              <Input
                placeholder="Escribe un mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 border-none bg-gray-100 focus:ring-0 rounded-xl"
              />
              <Button 
                size="sm" 
                className="h-10 w-10 rounded-full p-0"
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                <Send className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
