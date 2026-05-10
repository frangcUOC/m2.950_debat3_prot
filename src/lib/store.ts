import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Absence, Professional, Shift } from "./types";
import { generateSeed } from "./seed";

interface State {
  professionals: Professional[];
  shifts: Shift[];
  absences: Absence[];
  initialized: boolean;
  loadSeed: () => void;
  reset: () => void;
  upsertProfessional: (p: Professional) => void;
  removeProfessional: (id: string) => void;
  setData: (d: { professionals: Professional[]; shifts: Shift[]; absences: Absence[] }) => void;
  assignShift: (shiftId: string, profId: string | null) => void;
  addAbsence: (a: Absence) => void;
}

const seed = generateSeed();

export const useStore = create<State>()(
  persist(
    (set) => ({
      professionals: seed.professionals,
      shifts: seed.shifts,
      absences: seed.absences,
      initialized: true,
      loadSeed: () => {
        const s = generateSeed();
        set({ ...s, initialized: true });
      },
      reset: () => set({ professionals: [], shifts: [], absences: [], initialized: false }),
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
    }),
    { name: "tornai-store" }
  )
);
