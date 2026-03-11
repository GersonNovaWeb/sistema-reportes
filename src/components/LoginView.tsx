"use client";

import React, { useState } from 'react';
import { FileSpreadsheet, ArrowRight, ShieldCheck } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (_err) {
      setError('Credenciales incorrectas. Intenta de nuevo.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Círculos decorativos de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob animation-delay-2000"></div>

      <div className="bg-slate-800/50 backdrop-blur-2xl border border-slate-700/50 p-8 md:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-[440px] relative z-10">
        <div className="text-center mb-10">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/30">
             <FileSpreadsheet className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">ReportSys</h1>
          <p className="text-slate-400 mt-2 text-sm font-medium flex items-center justify-center gap-1">
            <ShieldCheck className="w-4 h-4"/> Acceso Seguro
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-2xl text-center font-bold">
              {error}
            </div>
          )}
          <div>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-5 py-4 text-white placeholder-slate-500 focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              placeholder="Correo Electrónico"
            />
          </div>
          <div>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-5 py-4 text-white placeholder-slate-500 focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              placeholder="Contraseña"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white font-bold rounded-2xl px-5 py-4 mt-4 hover:bg-indigo-500 focus:ring-4 focus:ring-indigo-500/50 transition-all flex justify-center items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-70 group"
          >
            {isLoading ? (
               <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>Ingresar al Sistema <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform"/></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}