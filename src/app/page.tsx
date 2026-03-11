"use client";

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, getDoc, query, onSnapshot, orderBy, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Menu } from 'lucide-react';

import { User, Section, Report, Message } from '../types';
import LoginView from '../components/LoginView';
import Sidebar from '../components/Sidebar';
import AdminDashboard from '../components/AdminDashboard';
import JobDashboard from '../components/JobDashboard';

// 🔴 MODO RESCATE ACTIVADO: 
// Forzará a que la cuenta que inicie sesión tenga permisos de Administrador absolutos.
const FORZAR_ADMIN_SIEMPRE = true; 

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  
  const [activeTab, setActiveTab] = useState<string>('buzon'); 
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const [users, setUsers] = useState<User[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          let userData: any = null;
          let docId = firebaseUser.uid;
          
          // Buscamos al usuario en la base de datos
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            userData = userDoc.data();
          } else if (firebaseUser.email) {
            const q = query(collection(db, 'users'), where('username', '==', firebaseUser.email));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              userData = querySnapshot.docs[0].data();
              docId = querySnapshot.docs[0].id;
            }
          }

          // APLICAMOS EL MODO RESCATE AQUÍ
          if (userData || FORZAR_ADMIN_SIEMPRE) {
            const safeUserData = userData || { name: 'Admin Maestro', username: firebaseUser.email, role: 'admin' };
            
            let finalRole = safeUserData.role ? String(safeUserData.role).toLowerCase() : 'job';
            
            // Si el Modo Rescate está activo, aplastamos el rol a Admin automáticamente
            if(FORZAR_ADMIN_SIEMPRE) {
               finalRole = 'admin';
            } else {
               finalRole = finalRole === 'admin' ? 'admin' : 'job';
            }

            setCurrentUser({ 
              id: docId, 
              name: safeUserData.name || firebaseUser.email?.split('@')[0] || 'Usuario', 
              username: safeUserData.username || firebaseUser.email || '',
              role: finalRole as 'admin' | 'job'
            });
            setActiveTab(finalRole === 'admin' ? 'buzon' : 'menu');
          } else {
            // Esto ya no debería ejecutarse gracias al modo rescate, pero se deja por seguridad
            setCurrentUser({ 
              id: firebaseUser.uid, 
              name: firebaseUser.email?.split('@')[0] || 'Usuario', 
              role: 'job', 
              username: firebaseUser.email || '' 
            });
            setActiveTab('menu');
          }
        } catch (error) { 
          console.error("Error leyendo usuario:", error); 
        }
      } else {
        setCurrentUser(null);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    
    const unsubUsers = onSnapshot(query(collection(db, 'users')), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
    });
    
    const unsubSections = onSnapshot(query(collection(db, 'sections')), (snapshot) => {
      setSections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Section)));
    });
    
    const unsubReports = onSnapshot(query(collection(db, 'reports'), orderBy('createdAt', 'desc')), (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report)));
    });
    
    const unsubMessages = onSnapshot(query(collection(db, 'messages'), orderBy('createdAt', 'asc')), (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    });
    
    return () => { unsubUsers(); unsubSections(); unsubReports(); unsubMessages(); };
  }, [currentUser]);

  if (loadingAuth) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin shadow-lg"></div>
    </div>
  );
  
  if (!currentUser) return <LoginView />;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 overflow-hidden">
      
      <Sidebar 
        currentUser={currentUser} 
        onLogout={() => signOut(auth)} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="flex justify-between items-center bg-white/80 backdrop-blur-md px-6 py-5 border-b border-slate-200 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">
                Bienvenido, {(currentUser.name || 'Usuario').split(' ')[0]}
              </h1>
              <p className="text-xs md:text-sm text-indigo-600 font-bold uppercase tracking-widest mt-1">Panel de {currentUser.role}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {currentUser.role === 'admin' ? (
              <AdminDashboard sections={sections} reports={reports} messages={messages} setMessages={setMessages} currentUser={currentUser} users={users} activeTab={activeTab} setActiveTab={setActiveTab} />
            ) : (
              <JobDashboard sections={sections} messages={messages} setMessages={setMessages} currentUser={currentUser} adminUsers={users.filter(u => u.role === 'admin')} activeTab={activeTab} setActiveTab={setActiveTab} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}