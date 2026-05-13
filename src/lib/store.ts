import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Absence, ConsentRecord, Incident, IncidentComment, Professional, Shift, SubstitutionDecision } from "./types";
import { generateSeed } from "./seed";

interface State {
  professionals: Professional[];
  shifts: Shift[];
  absences: Absence[];
  incidents: Incident[];
  consent: ConsentRecord;
  isPremium: boolean;
  initialized: boolean;
  loadSeed: () => void;
  reset: () => void;
  upsertProfessional: (p: Professional) => void;
  removeProfessional: (id: string) => void;
  setData: (d: { professionals: Professional[]; shifts: Shift[]; absences: Absence[] }) => void;
  assignShift: (shiftId: string, profId: string | null) => void;
  addAbsence: (a: Absence) => void;
  // consent
  acceptConsent: (user: string) => void;
  revokeConsent: () => void;
  // premium
  setPremium: (v: boolean) => void;
  // incidents
  upsertIncident: (i: Incident) => void;
  removeIncident: (id: string) => void;
  addIncidentComment: (incidentId: string, comment: IncidentComment) => void;
}

const seed = generateSeed();

export const useStore = create<State>()(
  persist(
    (set) => ({
      professionals: seed.professionals,
      shifts: seed.shifts,
      absences: seed.absences,
      incidents: [],
      consent: { accepted: false, acceptedAt: null, user: null },
      isPremium: false,
      initialized: true,
      loadSeed: () => {
        const s = generateSeed();
        set({ ...s, initialized: true });
      },
      reset: () =>
        set({
          professionals: [],
          shifts: [],
          absences: [],
          incidents: [],
          initialized: false,
        }),
      upsertProfessional: (p) =>
        set((st) => {
          const exists = st.professionals.find((x) => x.id === p.id);
          return {
            professionals: exists
              ? st.professionals.map((x) => (x.id === p.id ? p : x))
              : [...st.professionals, p],
          };
        }),
      removeProfessional: (id) =>
        set((st) => ({ professionals: st.professionals.filter((p) => p.id !== id) })),
      setData: (d) => set({ ...d, initialized: true }),
      assignShift: (shiftId, profId) =>
        set((st) => ({
          shifts: st.shifts.map((s) =>
            s.id === shiftId
              ? { ...s, originalProfessionalId: s.originalProfessionalId ?? s.professionalId, professionalId: profId }
              : s
          ),
        })),
      addAbsence: (a) => set((st) => ({ absences: [...st.absences, a] })),
      acceptConsent: (user) =>
        set({ consent: { accepted: true, acceptedAt: new Date().toISOString(), user } }),
      revokeConsent: () => set({ consent: { accepted: false, acceptedAt: null, user: null } }),
      setPremium: (v) => set({ isPremium: v }),
      upsertIncident: (i) =>
        set((st) => {
          const exists = st.incidents.find((x) => x.id === i.id);
          return {
            incidents: exists
              ? st.incidents.map((x) => (x.id === i.id ? i : x))
              : [i, ...st.incidents],
          };
        }),
      removeIncident: (id) =>
        set((st) => ({ incidents: st.incidents.filter((i) => i.id !== id) })),
      addIncidentComment: (incidentId, comment) =>
        set((st) => ({
          incidents: st.incidents.map((i) =>
            i.id === incidentId ? { ...i, comments: [...i.comments, comment] } : i
          ),
        })),
    }),
    { name: "tornai-store" }
  )
);
