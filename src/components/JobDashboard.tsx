"use client";

import React, { useState } from 'react';
import { FileSpreadsheet, Camera, Save, FolderPlus, CheckSquare, Users, MessageSquare } from 'lucide-react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { generarExcel } from '../utils/excelGenerator';
import ChatSystem from './ChatSystem';
import { User, Section, Message } from '../types';

interface JobProps {
  sections: Section[];
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  currentUser: User;
  adminUsers: User[];
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
}

interface InputRowProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  span?: number;
}

const InputRow = ({ label, value, onChange, span = 1 }: InputRowProps) => (
  <div className={`col-span-${span}`}>
    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">{label}</label>
    <input type="text" value={value} onChange={onChange} className="w-full border-gray-300 rounded p-3 bg-gray-50 focus:bg-white border shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" />
  </div>
);

export default function JobDashboard({ sections, messages, setMessages, currentUser, adminUsers, activeTab, setActiveTab }: JobProps) {
  const [reportType, setReportType] = useState('');

  const startReport = (type: string) => {
    setReportType(type);
    setActiveTab('form');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-8 min-h-[600px]">
      {activeTab === 'menu' && (
        <div className="text-center py-16">
          <h2 className="text-3xl font-black mb-2 text-gray-900">Formato de Servicio</h2>
          <p className="text-gray-500 mb-12">Haz clic abajo para comenzar a llenar el reporte y generar el Excel.</p>
          <div className="max-w-md mx-auto">
            <button onClick={() => startReport('Preventivo')} className="w-full flex flex-col items-center justify-center p-10 border-2 border-green-200 bg-green-50 hover:bg-green-100 rounded-3xl shadow-sm transition-all hover:scale-105 hover:shadow-lg">
              <div className="bg-white p-5 rounded-full mb-4 shadow-sm"><FileSpreadsheet className="w-12 h-12 text-green-600" /></div>
              <span className="text-2xl font-black text-green-800">Reporte Preventivo</span>
              <span className="text-sm font-bold text-green-600 mt-2 bg-white px-3 py-1 rounded-full">Automático a Excel</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'form' && <JobWizard type={reportType} sections={sections} currentUser={currentUser} onCancel={() => setActiveTab('menu')} />}
      {activeTab === 'chat' && <ChatSystem messages={messages} setMessages={setMessages} currentUser={currentUser} allUsers={adminUsers} isJobView={true} />}
    </div>
  );
}

interface JobWizardProps {
  type: string;
  sections: Section[];
  currentUser: User;
  onCancel: () => void;
}

function JobWizard({ type, sections, currentUser, onCancel }: JobWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  const [data, setData] = useState({
    sectionId: '', client: '', direccion: '', contrato: '', partida: '',
    equipo: '', marca: '', modelo: '', numSerieEq: '', folioSsm: '', ubicacion: '',
    falla: '', condiciones: '', trabajos: '',
    refacciones: ['', '', '', ''],
    medicion: [{equipo:'', marca:'', modelo:'', serie:''}, {equipo:'', marca:'', modelo:'', serie:''}, {equipo:'', marca:'', modelo:'', serie:''}],
    checklist: Array(28).fill(false),
    firmaEntrega: '', firmaRecibe: '', firmaValida: '',
    fotos: { antes1:'', antes2:'', antes3:'', durante1:'', durante2:'', despues1:'', despues2:'', etiqueta:'' } as Record<string, string>
  });

  const LISTA_CHECKLIST = [
    "Aire de 1 y 2 Toneladas", "Verificación visual", "Pruebas previas", "Alarmas y control", "Conexión a tierra",
    "Limpieza gabinete", "Mant. condensador", "Retirar materiales", "Alineación serpentín", "Lavado con químicos",
    "Tableta charola", "Mant. compresor", "Mant. ventilador", "Mant. evaporador", "Válvula expansión",
    "Carga refrigerante", "Arranque compresor", "Sensor temperatura", "Calibración control", "Amperaje y sobrecarga",
    "Limpieza general", "Reemplazo filtros", "Motores extractores", "Motores inyectores", "Bandas y aspiradores",
    "Puesta en marcha", "Verificar funcionamiento", "Pruebas de esfuerzo"
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, fotoKey: string) => {
    const file = e.target.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600; const MAX_HEIGHT = 600;
        let width = img.width; let height = img.height;
        if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
        else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          const base64Content = dataUrl.split(',')[1];
          setData(prev => ({ ...prev, fotos: { ...prev.fotos, [fotoKey]: base64Content } }));
        }
      };
      if (event.target && typeof event.target.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if(!data.sectionId || !data.client) return alert("Llena al menos la Carpeta y el Cliente en la Página 1");
    setIsSaving(true);
    try {
      const snapshot = await getDocs(collection(db, 'reports'));
      const count = snapshot.size + 1;
      const serial = `MHOS-SSM-EL-${String(count).padStart(4, '0')}`;

      const finalReport = {
        serial,
        type: type || 'Preventivo',
        jobId: currentUser.id,
        jobName: currentUser.name || currentUser.username,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        ...data
      };

      await addDoc(collection(db, 'reports'), finalReport);
      await generarExcel(finalReport);

      alert(`¡Reporte Creado Exitosamente!\nFolio: ${serial}\nEl Excel se ha descargado.`);
      onCancel();
    } catch (_err) {
      alert("Error al guardar en la nube. Intenta de nuevo.");
    }
    setIsSaving(false);
  };

  const pageTitles = ["Página 1: Generales y Equipo", "Página 2: Rutina Anexo Técnico (Checklist)", "Página 3: Evidencia Fotográfica"];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-4 gap-4">
        <div>
          <h2 className="text-3xl font-black text-indigo-900">{pageTitles[step - 1]}</h2>
          <p className="text-gray-500 text-sm font-bold mt-1">Paso {step} de 3 del formato Excel</p>
        </div>
        <button onClick={onCancel} className="text-red-600 font-bold text-sm bg-red-50 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors">Cancelar Formato</button>
      </div>

      <div className="space-y-8 min-h-[500px]">
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in">
            <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-200 shadow-sm">
              <label className="block text-sm font-black text-indigo-900 mb-3 flex items-center gap-2"><FolderPlus className="w-5 h-5"/>1. ¿En qué Carpeta del sistema se guardará? (Obligatorio)</label>
              <select value={data.sectionId} onChange={e => setData({...data, sectionId: e.target.value})} className="w-full border p-3 rounded-xl bg-white shadow-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">-- Despliega para elegir la carpeta --</option>
                {sections.map((s: Section) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <h3 className="font-black text-gray-800 border-b-2 border-gray-100 pb-2 mb-4 text-xl">Datos Generales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputRow label="Cliente (Obligatorio)" value={data.client} onChange={e => setData({...data, client: e.target.value})} span={2} />
                <InputRow label="Dirección" value={data.direccion} onChange={e => setData({...data, direccion: e.target.value})} span={2} />
                <InputRow label="N° Contrato" value={data.contrato} onChange={e => setData({...data, contrato: e.target.value})} />
                <InputRow label="Partida" value={data.partida} onChange={e => setData({...data, partida: e.target.value})} />
              </div>
            </div>

            <div>
              <h3 className="font-black text-gray-800 border-b-2 border-gray-100 pb-2 mb-4 text-xl">Datos del Equipo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputRow label="Equipo" value={data.equipo} onChange={e => setData({...data, equipo: e.target.value})} span={2} />
                <InputRow label="Marca" value={data.marca} onChange={e => setData({...data, marca: e.target.value})} />
                <InputRow label="Modelo" value={data.modelo} onChange={e => setData({...data, modelo: e.target.value})} />
                <InputRow label="N° Serie Equipo" value={data.numSerieEq} onChange={e => setData({...data, numSerieEq: e.target.value})} />
                <InputRow label="Folio SSM" value={data.folioSsm} onChange={e => setData({...data, folioSsm: e.target.value})} />
                <InputRow label="Ubicación" value={data.ubicacion} onChange={e => setData({...data, ubicacion: e.target.value})} span={2} />
              </div>
            </div>

            <div>
              <h3 className="font-black text-gray-800 border-b-2 border-gray-100 pb-2 mb-4 text-xl">Reporte de Servicio</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Falla Reportada</label>
                  <textarea rows={2} value={data.falla} onChange={e => setData({...data, falla: e.target.value})} className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 text-sm shadow-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Condiciones Iniciales</label>
                  <textarea rows={2} value={data.condiciones} onChange={e => setData({...data, condiciones: e.target.value})} className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 text-sm shadow-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Trabajos Realizados / Observaciones</label>
                  <textarea rows={4} value={data.trabajos} onChange={e => setData({...data, trabajos: e.target.value})} className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 text-sm shadow-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"></textarea>
                </div>
                <div className="pt-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Refacciones Utilizadas (Máximo 4)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.refacciones.map((ref, i) => (
                      <input key={i} type="text" value={ref} onChange={e => { const newRef = [...data.refacciones]; newRef[i] = e.target.value; setData({...data, refacciones: newRef}); }} className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 text-sm shadow-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500" placeholder={`Refacción ${i+1}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-black text-gray-800 border-b-2 border-gray-100 pb-2 mb-4 text-xl">Equipo de Medición Utilizado</h3>
              <div className="space-y-3">
                {data.medicion.map((med, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="text" placeholder="Equipo" value={med.equipo} onChange={e => { const nM=[...data.medicion]; nM[i].equipo=e.target.value; setData({...data, medicion:nM})}} className="w-1/4 border border-gray-300 p-2 text-xs rounded-lg shadow-sm bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"/>
                    <input type="text" placeholder="Marca" value={med.marca} onChange={e => { const nM=[...data.medicion]; nM[i].marca=e.target.value; setData({...data, medicion:nM})}} className="w-1/4 border border-gray-300 p-2 text-xs rounded-lg shadow-sm bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"/>
                    <input type="text" placeholder="Modelo" value={med.modelo} onChange={e => { const nM=[...data.medicion]; nM[i].modelo=e.target.value; setData({...data, medicion:nM})}} className="w-1/4 border border-gray-300 p-2 text-xs rounded-lg shadow-sm bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"/>
                    <input type="text" placeholder="N° Serie" value={med.serie} onChange={e => { const nM=[...data.medicion]; nM[i].serie=e.target.value; setData({...data, medicion:nM})}} className="w-1/4 border border-gray-300 p-2 text-xs rounded-lg shadow-sm bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"/>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200">
               <h3 className="font-black text-slate-800 mb-4 text-lg"><Users className="w-5 h-5 inline mr-2 text-slate-500"/>Nombres y Firmas (Se aplicarán a las 3 hojas del Excel)</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <InputRow label="Nombre y Firma (Entrega)" value={data.firmaEntrega} onChange={e => setData({...data, firmaEntrega: e.target.value})} />
                  <InputRow label="Recibe / Autoriza" value={data.firmaRecibe} onChange={e => setData({...data, firmaRecibe: e.target.value})} />
                  <InputRow label="Valida" value={data.firmaValida} onChange={e => setData({...data, firmaValida: e.target.value})} />
               </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in space-y-6">
            <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-200 mb-6">
              <p className="text-indigo-900 font-bold">Marca las casillas de las acciones que realizaste. En el Excel aparecerá automáticamente una &quot;X&quot; en negritas.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
               {LISTA_CHECKLIST.map((item, index) => (
                 <label key={index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-gray-200">
                    <input type="checkbox" checked={data.checklist[index]} onChange={e => {
                       const newChecks = [...data.checklist]; newChecks[index] = e.target.checked;
                       setData({...data, checklist: newChecks});
                    }} className="w-6 h-6 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 mt-0.5" />
                    <span className="text-sm text-gray-800 font-medium leading-tight pt-1">{item}</span>
                 </label>
               ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in">
             <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200 shadow-sm">
               <h3 className="text-orange-900 font-black text-lg mb-2">Evidencia Fotográfica</h3>
               <p className="text-orange-800 text-sm font-medium">Sube las fotos desde tu celular. El sistema las comprimirá solas y las acomodará perfectamente en las celdas de la Página 3 del Excel.</p>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {[
                  { key: 'antes1', label: 'Antes 1' }, { key: 'antes2', label: 'Antes 2' }, { key: 'antes3', label: 'Antes 3' },
                  { key: 'durante1', label: 'Durante 1' }, { key: 'durante2', label: 'Durante 2' }, { key: 'etiqueta', label: 'Foto Etiqueta' },
                  { key: 'despues1', label: 'Después 1' }, { key: 'despues2', label: 'Después 2' }
                ].map((fotoInfo) => (
                   <div key={fotoInfo.key} className="border-2 border-dashed border-gray-300 bg-gray-50 p-6 rounded-2xl text-center hover:bg-white relative transition-colors h-36 flex flex-col justify-center items-center shadow-sm">
                     {data.fotos[fotoInfo.key] ? (
                       <div className="text-green-600 font-bold text-sm flex flex-col items-center">
                         <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3 shadow-sm"><CheckSquare className="w-6 h-6"/></div>
                         ¡Foto Lista!
                       </div>
                     ) : (
                       <div className="text-gray-500 font-bold text-sm flex flex-col items-center">
                         <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-200"><Camera className="w-6 h-6 text-gray-400"/></div>
                         {fotoInfo.label}
                       </div>
                     )}
                     <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, fotoInfo.key)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                   </div>
                ))}
             </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-8 border-t mt-8">
        <button onClick={() => setStep(step - 1)} disabled={step === 1} className="px-6 py-3 bg-gray-100 text-gray-600 font-black rounded-xl disabled:opacity-0 hover:bg-gray-200 transition-colors shadow-sm">
          Atrás
        </button>
        
        {step < 3 ? (
          <button onClick={() => setStep(step + 1)} className="px-10 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all">
            Siguiente Página
          </button>
        ) : (
          <button onClick={handleSave} disabled={isSaving} className="px-8 py-4 bg-green-600 text-white font-black text-lg rounded-xl hover:bg-green-700 shadow-lg shadow-green-600/30 flex items-center gap-2 transition-all">
            {isSaving ? 'Guardando Reporte...' : <><Save className="w-6 h-6"/> Terminar y Descargar Excel</>}
          </button>
        )}
      </div>
    </div>
  );
}