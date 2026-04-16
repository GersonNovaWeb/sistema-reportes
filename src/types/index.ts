export interface User {
  id: string;
  username: string;
  password?: string;
  role: 'admin' | 'job';
  name: string;
}

export interface Section {
  id: string;
  name: string;
  client?: string;
  direccion?: string;
  contrato?: string;
  partida?: string;
  equipo?: string;
  marca?: string;
  modelo?: string;
  numSerieEq?: string;
  folioSsm?: string;
  ubicacion?: string;
  createdAt?: string;
}

export interface Report {
  id: string;
  serial: string;
  type: string;
  sectionId: string;
  jobId: string;
  jobName: string;
  date: string;
  client: string;
  description?: string;
  createdAt?: string;
}

export interface Message {
  id: number | string;
  senderId: string;
  receiverId: string;
  text: string;
  time: string;
  createdAt?: string;
}

export interface NotificationMsg {
  id: number;
  message: string;
  time: string;
}