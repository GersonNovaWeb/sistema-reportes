"use client";

import React, { useState, useRef } from 'react';
import { Send, ChevronLeft, MessageSquare } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Message } from '../types';

interface ChatProps {
  messages: Message[];
  setMessages?: React.Dispatch<React.SetStateAction<Message[]>>;
  currentUser: User;
  allUsers: User[];
  isJobView?: boolean;
}

export default function ChatSystem({ messages, currentUser, allUsers, isJobView = false }: ChatProps) {
  const [selectedChatUser, setSelectedChatUser] = useState<User | null>(null);
  const [text, setText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeChatUser = isJobView ? (allUsers.length > 0 ? allUsers[0] : null) : selectedChatUser;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!text.trim() || !activeChatUser) return;
    try {
      await addDoc(collection(db, 'messages'), {
        senderId: currentUser.id,
        receiverId: activeChatUser.id,
        text,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        createdAt: new Date().toISOString()
      });
      setText('');
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (error) { console.error("Error enviando mensaje:", error); }
  };

  const currentChat = messages.filter((m: Message) => 
    (m.senderId === currentUser.id && m.receiverId === activeChatUser?.id) ||
    (m.receiverId === currentUser.id && m.senderId === activeChatUser?.id)
  );

  return (
    <div className="flex h-[650px] border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-inner">
      {/* Lista de Contactos - Se oculta en móvil si hay un chat abierto (y no es JobView) */}
      {!isJobView && (
        <div className={`w-full md:w-1/3 border-r border-slate-200 bg-slate-50 flex-col ${selectedChatUser ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-5 border-b border-slate-200 bg-white">
            <h3 className="font-black text-slate-800 text-lg">Trabajadores</h3>
          </div>
          <div className="overflow-y-auto flex-1 custom-scrollbar p-2">
            {allUsers.filter((u: User) => u.role === 'job').map((u: User) => (
              <button 
                key={u.id} 
                onClick={() => setSelectedChatUser(u)} 
                className={`w-full text-left p-4 mb-2 rounded-2xl flex items-center gap-4 transition-all ${selectedChatUser?.id === u.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white text-slate-700 border border-slate-100 hover:border-indigo-200 hover:shadow-sm'}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-inner ${selectedChatUser?.id === u.id ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                  {(u.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-sm truncate">{u.name}</p>
                  <p className={`text-xs mt-0.5 font-medium ${selectedChatUser?.id === u.id ? 'text-indigo-200' : 'text-emerald-500'}`}>Activo</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Área de Mensajes */}
      <div className={`w-full ${!isJobView ? 'md:w-2/3' : ''} flex-col bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50 relative ${!isJobView && !selectedChatUser ? 'hidden md:flex' : 'flex'}`}>
        {activeChatUser ? (
          <>
            <div className="p-4 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center gap-4 shadow-sm z-10 relative">
               {!isJobView && (
                 <button onClick={() => setSelectedChatUser(null)} className="md:hidden p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200">
                   <ChevronLeft className="w-6 h-6"/>
                 </button>
               )}
               <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center font-black shadow-sm border border-indigo-200">
                 {(activeChatUser.name || 'U').charAt(0).toUpperCase()}
               </div>
               <div>
                 <h3 className="font-black text-slate-800 text-lg leading-tight">{activeChatUser.name}</h3>
                 <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                   <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span> En línea
                 </p>
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
              {currentChat.length === 0 ? (
                <div className="text-center bg-white/80 backdrop-blur border border-slate-200 p-4 rounded-2xl mx-auto w-3/4 md:w-1/2 shadow-sm mt-10">
                  <MessageSquare className="w-8 h-8 text-indigo-300 mx-auto mb-2"/>
                  <p className="text-slate-500 font-bold text-sm">Este es el inicio del chat seguro.</p>
                </div>
              ) : (
                currentChat.map((m: Message) => {
                  const isMe = m.senderId === currentUser.id;
                  return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-md ${isMe ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white text-slate-800 rounded-bl-sm border border-slate-100'}`}>
                        <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                        <span className={`text-[10px] block text-right mt-2 font-bold tracking-wider ${isMe ? 'text-indigo-300' : 'text-slate-400'}`}>{m.time}</span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 flex gap-3 relative z-10 shadow-[0_-10px_20px_rgb(0,0,0,0.02)]">
              <input 
                type="text" 
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Escribe tu mensaje aquí..." 
                className="flex-1 bg-slate-100 border-transparent rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none font-medium text-sm shadow-inner"
              />
              <button 
                type="submit" 
                disabled={!text.trim()} 
                className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/20 group"
              >
                <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-slate-100">
              <MessageSquare className="w-10 h-10 text-indigo-300" />
            </div>
            <p className="font-black text-xl text-slate-700">Comunicaciones</p>
            <p className="text-sm font-medium mt-2 max-w-[200px]">Selecciona a un trabajador en la lista de la izquierda para iniciar el chat.</p>
          </div>
        )}
      </div>
    </div>
  );
}