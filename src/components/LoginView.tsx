"use client";

import React, { useState } from 'react';
import { ArrowRight, Mail, Lock, Zap, FileText, Users, FileSpreadsheet } from 'lucide-react';
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

  const features = [
    { icon: <FileText className="w-5 h-5" />, title: 'Reportes Digitales', desc: 'Genera reportes técnicos en segundos' },
    { icon: <Users className="w-5 h-5" />, title: 'Control de Técnicos', desc: 'Gestiona tu equipo de trabajo' },
    { icon: <FileSpreadsheet className="w-5 h-5" />, title: 'Documentación Automática', desc: 'Excel y PDF generados automáticamente' },
  ];

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>

      {/* LEFT PANEL */}
      <div
        className="hidden md:flex md:w-[55%] relative flex-col items-center justify-center p-16"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #172554 50%, #0f172a 100%)',
          backgroundImage: `
            linear-gradient(135deg, #0f172a 0%, #172554 50%, #0f172a 100%),
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 40px 40px, 40px 40px',
        }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 w-full max-w-sm">
          {/* Logo */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl" style={{ backgroundColor: 'rgba(59,130,246,0.25)', border: '1px solid rgba(59,130,246,0.3)' }}>
                <Zap className="w-7 h-7" style={{ color: '#93C5FD' }} />
              </div>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-3">
              EspecialistasHVAC
            </h1>
            <p className="text-lg font-medium" style={{ color: '#93C5FD' }}>
              Plataforma de Gestión de Servicios Técnicos
            </p>
          </div>

          {/* Feature cards */}
          <div className="flex flex-col gap-3">
            {features.map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-2xl"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div
                  className="p-2.5 rounded-xl shrink-0"
                  style={{ backgroundColor: 'rgba(59,130,246,0.2)' }}
                >
                  <span style={{ color: '#93C5FD' }}>{feature.icon}</span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">{feature.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#93C5FD' }}>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div
        className="w-full md:w-[45%] flex items-center justify-center p-8"
        style={{ backgroundColor: 'var(--bg-primary)', borderLeft: '1px solid var(--border)' }}
      >
        <div className="w-full max-w-sm">
          {/* Logo pequeño */}
          <div className="flex items-center gap-3 mb-8">
            <div
              className="p-2.5 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-border)' }}
            >
              <Zap className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>EspecialistasHVAC</span>
          </div>

          {/* Card */}
          <div
            className="p-8 rounded-2xl"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div className="mb-7">
              <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Iniciar Sesión</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Accede a tu cuenta</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div
                  className="p-3 rounded-xl text-sm font-medium text-center"
                  style={{ backgroundColor: 'var(--danger-light)', border: '1px solid var(--danger)', color: 'var(--danger)' }}
                >
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="usuario@empresa.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 mt-2"
                style={{ backgroundColor: 'var(--accent)', color: '#fff', opacity: isLoading ? 0.7 : 1 }}
                onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--accent-hover)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--accent)'; }}
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Ingresar al Sistema
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
            EspecialistasHVAC © 2024 — Acceso Restringido
          </p>
        </div>
      </div>
    </div>
  );
}
