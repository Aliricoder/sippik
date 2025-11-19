
export type Language = 'en' | 'tr';

export interface ActivityDef {
  id: string;
  label: { en: string; tr: string };
  color: string;
  icon: string; // string identifier for the icon
}

export interface BlockDef {
  id: string;
  name: string;
  size: number; // Size in Dönüm (Decares)
}

export interface LogEntry {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  type: string; // Changing from enum to string to support custom types
  blockId: string;
  section?: string; // Subsection / Zone of the block
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  details: string;
  quantity?: number;
  unit?: string;
  cost?: number; // New field for tracking expenses (e.g. wages)
  notes?: string;
  
  // Tillage specific fields
  tillageImplement?: 'cultivator' | 'disc_harrow' | 'plow' | 'rotovator' | 'other';
  tillageDirection?: 'lengthwise' | 'crosswise' | 'diagonal';
  
  createdAt: number;
}

export interface OrchardStats {
  totalIrrigationEvents: number;
  totalFertilizerEvents: number;
  lastActivityDate: string | null;
  activeBlocks: number;
}

export type ViewState = 'dashboard' | 'logs' | 'advisor' | 'settings';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
