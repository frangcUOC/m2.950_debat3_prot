import type { Professional, Shift } from "./types";

export interface SubstituteSuggestion {
  professional: Professional;
  score: number;
  reason: string;
}

export function findSubstitutes(shift: Shift, professionals: Professional[], excludeId?: string): SubstituteSuggestion[] {
  return professionals
    .filter((p) => p.id !== excludeId && p.status === "actiu")
    .map<SubstituteSuggestion | null>((p) => {
      const sameRole = p.role === shift.role;
      const available = p.availability.includes(shift.slot);
      const sameCenter = p.center === shift.center;
      if (!sameRole || !available) return null;
      // menys hores acumulades = millor (puntuació més alta)
      const score = 1000 - p.hoursAccrued + (sameCenter ? 50 : 0);
      const parts = [
        sameRole ? "mateix rol" : null,
        available ? `disponible a ${shift.slot.toLowerCase()}` : null,
        sameCenter ? "mateix centre" : "altre centre",
        `${p.hoursAccrued}h acumulades`,
      ].filter(Boolean);
      return { professional: p, score, reason: parts.join(" · ") };
    })
    .filter((x): x is SubstituteSuggestion => x !== null)
    .sort((a, b) => b.score - a.score);
}
