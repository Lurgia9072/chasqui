import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { ChatMessage, OperationType } from '../../types';
import { Button } from './Button';
import { Input } from './Input';
import { Send, Mic, Square, Play, Pause, User, Truck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { es } from 'date-fns/locale';
import { format as dateFnsFormat } from 'date-fns';

interface AudioPlayerProps {
  url: string;
  isMe: boolean;
  messageId: string;
  playingId: string | null;
  setPlayingId: (id: string | null) => void;
}

const AudioPlayer = ({ url, isMe, messageId, playingId, setPlayingId }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const isPlaying = playingId === messageId;

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;

    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleTimeUpdate = () => setProgress((audio.currentTime / audio.duration) * 100);
    const handleEnded = () => {
      setPlayingId(null);
      setProgress(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audioRef.current = null;
    };
  }, [url]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const togglePlay = () => {
    if (isPlaying) {
      setPlayingId(null);
    } else {
      setPlayingId(messageId);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = (Number(e.target.value) / 100) * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(Number(e.target.value));
    }
  };

  return (
    <div className="flex items-center space-x-3 min-w-[200px]">
      <button
        className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-all",
          isMe 
            ? "bg-white/20 hover:bg-white/30 text-white" 
            : "bg-blue-100 text-blue-600 hover:bg-blue-200"
        )}
        onClick={togglePlay}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5 fill-current" />
        ) : (
          <Play className="h-5 w-5 fill-current ml-0.5" />
        )}
      </button>
      
      <div className="flex-1 space-y-1">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeek}
          className={cn(
            "w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-current",
            isMe ? "bg-white/30" : "bg-gray-200"
          )}
          style={{
            background: isMe 
              ? `linear-gradient(to right, white ${progress}%, rgba(255,255,255,0.3) ${progress}%)`
              : `linear-gradient(to right, #2563eb ${progress}%, #e5e7eb ${progress}%)`
          }}
        />
        <div className="flex justify-between text-[9px] opacity-70">
          <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

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
  const [playingId, setPlayingId] = useState<string | null>(null);
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

    const messageToSend = newMessage;
    setNewMessage('');

    try {
      await addDoc(collection(db, 'trips', tripId, 'messages'), {
        senderId: user.uid,
        senderName: user.nombre,
        senderPhotoUrl: user.photoUrl || null,
        text: messageToSend,
        type: 'text',
        createdAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `trips/${tripId}/messages`);
      // Optional: restore message if failed? Usually users prefer it staying gone if they already moved on.
      // But for better UX maybe we should restore it if it fails.
      // For now, clearing it immediately is what the user asked for "debe ser rapido".
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
              senderPhotoUrl: user!.photoUrl || null,
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

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.uid;
          return (
            <div
              key={msg.id}
              className={cn(
                "flex items-end space-x-2 max-w-[85%]",
                isMe ? "ml-auto flex-row-reverse space-x-reverse" : "mr-auto"
              )}
            >
              <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border border-gray-100 mb-1">
                {msg.senderPhotoUrl ? (
                  <img src={msg.senderPhotoUrl} alt={msg.senderName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-100 text-[10px] font-bold text-gray-400">
                    {msg.senderName[0]}
                  </div>
                )}
              </div>
              <div
                className={cn(
                  "flex flex-col",
                  isMe ? "items-end" : "items-start"
                )}
              >
                <span className="text-[9px] font-bold text-gray-400 mb-0.5 px-1">
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
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  ) : (
                    <AudioPlayer 
                      url={msg.audioUrl!} 
                      isMe={isMe} 
                      messageId={msg.id}
                      playingId={playingId}
                      setPlayingId={setPlayingId}
                    />
                  )}
                </div>
                <span className="text-[8px] text-gray-400 mt-0.5 px-1">
                  {dateFnsFormat(msg.createdAt, 'HH:mm', { locale: es })}
                </span>
              </div>
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
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
