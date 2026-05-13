export type Role = "Metge/ssa" | "Infermer/a" | "Auxiliar" | "Zelador/a";
export type ShiftSlot = "Matí" | "Tarda" | "Nit";
export type ProfessionalStatus = "actiu" | "baixa" | "vacances";

export interface Professional {
  id: string;
  name: string;
  role: Role;
  availability: ShiftSlot[]; // franges en què pot treballar
  hoursAccrued: number;
  status: ProfessionalStatus;
  center: string;
}

export interface Shift {
  id: string;
  date: string; // YYYY-MM-DD
  slot: ShiftSlot;
  role: Role;
  center: string;
  professionalId: string | null; // null = descobert
  originalProfessionalId?: string | null; // si hi ha hagut substitució
}

export interface Absence {
  id: string;
  professionalId: string;
  startDate: string;
  endDate: string;
  reason: string;
  resolvedHours?: number; // temps fins a cobrir
}

export const SLOTS: ShiftSlot[] = ["Matí", "Tarda", "Nit"];
export const ROLES: Role[] = ["Metge/ssa", "Infermer/a", "Auxiliar", "Zelador/a"];
export const SLOT_HOURS: Record<ShiftSlot, number> = { "Matí": 8, "Tarda": 8, "Nit": 10 };

export type IncidentPriority = "Baixa" | "Mitjana" | "Alta" | "Crítica";
export type IncidentStatus = "Oberta" | "En curs" | "Resolta";
export type IncidentType = "Torn" | "Baixa" | "Conflicte horari" | "Altres";

export interface IncidentComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Incident {
  id: string;
  type: IncidentType;
  description: string;
  professionalId: string | null;
  shiftId: string | null;
  priority: IncidentPriority;
  status: IncidentStatus;
  assigneeId: string | null;
  createdAt: string;
  comments: IncidentComment[];
}

export interface ConsentRecord {
  accepted: boolean;
  acceptedAt: string | null;
  user: string | null;
}

export type DecisionAction = "acceptada" | "rebutjada";

export interface SubstitutionDecision {
  id: string;
  createdAt: string;
  shiftId: string;
  shiftLabel: string;
  affectedProfessionalId: string | null;
  affectedProfessionalName: string | null;
  proposedProfessionalId: string;
  proposedProfessionalName: string;
  reason: string; // justificació de la recomanació
  action: DecisionAction;
  rejectReason?: string;
}

export const REJECT_REASONS = [
  "No té experiència suficient",
  "Conflicte personal/horari",
  "Càrrega de treball elevada",
  "Preferència de l'equip",
  "Altres",
] as const;

export const INCIDENT_PRIORITIES: IncidentPriority[] = ["Baixa", "Mitjana", "Alta", "Crítica"];
export const INCIDENT_STATUSES: IncidentStatus[] = ["Oberta", "En curs", "Resolta"];
export const INCIDENT_TYPES: IncidentType[] = ["Torn", "Baixa", "Conflicte horari", "Altres"];
