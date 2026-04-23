
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  X, 
  Send, 
  HelpCircle, 
  AlertTriangle, 
  Bug, 
  ChevronLeft,
  User,
  Headphones
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { Button } from '../components/ui/Button';


type SupportTopic = 'consulta' | 'fallo' | 'queja';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  isAdmin: boolean;
  createdAt: any;
}

export const SupportWidget = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isTripPage = location.pathname.startsWith('/trip/');

  // Content for the widget...
  const [step, setStep] = useState<'options' | 'chat'>('options');
  const [selectedTopic, setSelectedTopic] = useState<SupportTopic | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat messages when in chat step
  useEffect(() => {
    if (step === 'chat' && user && selectedTopic) {
      const q = query(
        collection(db, 'support_chats'),
        where('userId', '==', user.uid),
        limit(50)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Message));
        
        // Manual sort by createdAt
        msgs.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || (typeof a.createdAt === 'number' ? a.createdAt : Date.now());
          const timeB = b.createdAt?.toMillis?.() || (typeof b.createdAt === 'number' ? b.createdAt : Date.now());
          return timeA - timeB;
        });

        setMessages(msgs);
        
        // Scroll to bottom
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 100);
      }, (error) => {
        console.error("Error in support chat listener:", error);
      });

      return () => unsubscribe();
    }
  }, [step, user, selectedTopic]);

  const handleStartChat = (topic: SupportTopic) => {
    setSelectedTopic(topic);
    setStep('chat');
    
    // If no messages yet, add a welcome message from "system" locally
    if (messages.length === 0) {
      // We don't save this to DB yet, just UI feedback
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user || !selectedTopic) return;

    const textToSend = message;
    setMessage('');

    try {
      // 1. Send the message
      await addDoc(collection(db, 'support_chats'), {
        userId: user.uid,
        userName: user.nombre,
        text: textToSend,
        topic: selectedTopic,
        senderId: user.uid,
        senderName: user.nombre,
        isAdmin: false,
        createdAt: serverTimestamp()
      });
      
      // 2. Ensure an open ticket exists
      const ticketRef = collection(db, 'support_tickets');
      const q = query(
        ticketRef, 
        where('userId', '==', user.uid), 
        where('status', '==', 'open'),
        limit(1)
      );
      
      // In a real app, we'd check if one exists. For now, let's keep it simple: 
      // if it's the very first message or they changed topic, create/update.
      // Better: Always update the 'lastMessage' and 'updatedAt' of the ticket.
      
      if (messages.filter(m => !m.isAdmin).length === 0) {
        await addDoc(collection(db, 'support_tickets'), {
          userId: user.uid,
          userName: user.nombre,
          topic: selectedTopic,
          lastMessage: textToSend,
          status: 'open',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Error sending support message:", err);
    }
  };

  if (!user) return null;

  return (
    <div className={`fixed bottom-6 z-[9999] flex flex-col ${isTripPage ? 'left-6 items-start' : 'right-6 items-end'}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-80 sm:w-96 h-[500px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-indigo-600 text-white flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                {step === 'chat' && (
                  <Button 
                    onClick={() => setStep('options')}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                <div>
                  <h3 className="font-bold text-sm">Soporte Chasqui</h3>
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] font-medium text-indigo-100 italic">Asesores en línea</span>
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
              <AnimatePresence mode="wait">
                {step === 'options' ? (
                  <motion.div
                    key="options"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-6 space-y-6"
                  >
                    <div className="text-center space-y-2">
                      <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center">
                        <Headphones className="h-6 w-6" />
                      </div>
                      <h4 className="font-black text-gray-900 tracking-tight">¿Cómo podemos ayudarte hoy?</h4>
                      <p className="text-xs text-gray-500">Selecciona una categoría para iniciar:</p>
                    </div>

                    <div className="grid gap-3">
                      <Button
                        onClick={() => handleStartChat('consulta')}
                        className="flex items-center gap-4 p-4 bg-white hover:bg-indigo-50 border border-gray-100 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 text-left group"
                      >
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <HelpCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="block font-bold text-sm text-gray-900">Consulta</span>
                          <span className="text-[10px] text-gray-400">Dudas generales del app</span>
                        </div>
                      </Button>

                      <Button
                        onClick={() => handleStartChat('fallo')}
                        className="flex items-center gap-4 p-4 bg-white hover:bg-indigo-50 border border-gray-100 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 text-left group"
                      >
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
                          <Bug className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="block font-bold text-sm text-gray-900">Fallo Técnico</span>
                          <span className="text-[10px] text-gray-400">Problemas con el GPS o carga</span>
                        </div>
                      </Button>

                      <Button
                        onClick={() => handleStartChat('queja')}
                        className="flex items-center gap-4 p-4 bg-white hover:bg-indigo-50 border border-gray-100 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 text-left group"
                      >
                        <div className="p-2 bg-red-100 text-red-600 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-colors">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="block font-bold text-sm text-gray-900">Queja / Reclamo</span>
                          <span className="text-[10px] text-gray-400">Incidentes graves en ruta</span>
                        </div>
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-1 flex flex-col h-full overflow-hidden"
                  >
                    <div 
                      ref={scrollRef}
                      className="flex-1 p-4 overflow-y-auto space-y-4"
                    >
                      <div className="flex justify-center">
                        <span className="px-3 py-1 bg-gray-200 text-gray-500 rounded-full text-[10px] font-bold uppercase">
                          Asunto: {selectedTopic}
                        </span>
                      </div>
                      
                      {messages.length === 0 && (
                        <div className="flex gap-2">
                           <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                            <Headphones className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 text-sm font-medium text-gray-700">
                            ¡Hola {user.nombre}! 👋<br/>
                            Cuéntanos detalladamente tu {selectedTopic}. Un asesor se unirá pronto.
                          </div>
                        </div>
                      )}

                      {messages.map((msg) => (
                        <div 
                          key={msg.id} 
                          className={`flex gap-2 ${msg.senderId === user.uid ? 'flex-row-reverse' : ''}`}
                        >
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.isAdmin ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-500'}`}>
                            {msg.isAdmin ? <Headphones className="h-4 w-4" /> : <User className="h-4 w-4" />}
                          </div>
                          <div 
                            className={`
                              p-3 rounded-2xl shadow-sm text-sm max-w-[80%]
                              ${msg.senderId === user.uid 
                                ? 'bg-indigo-600 text-white rounded-tr-none' 
                                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                              }
                            `}
                          >
                            <p className="font-medium whitespace-pre-wrap">{msg.text}</p>
                            <span className={`text-[9px] block mt-1 opacity-70 ${msg.senderId === user.uid ? 'text-right' : 'text-left'}`}>
                              {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <form 
                      onSubmit={handleSendMessage}
                      className="p-3 bg-white border-t border-gray-100 flex gap-2"
                    >
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Escribe tu mensaje..."
                        className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      />
                      <Button
                        type="submit"
                        disabled={!message.trim()}
                        className="h-10 w-10 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95"
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300
          ${isOpen ? 'bg-gray-100 text-gray-800 rotate-90' : 'bg-indigo-600 text-white hover:bg-indigo-700 rotate-0'}
        `}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        {!isOpen && (
           <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500"></span>
          </span>
        )}
      </motion.button>
    </div>
  );
};
