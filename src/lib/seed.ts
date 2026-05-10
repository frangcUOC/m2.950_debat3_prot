import type { Absence, Professional, Role, Shift, ShiftSlot } from "./types";
import { ROLES, SLOTS } from "./types";

const NAMES = [
  "Marta Puig", "Joan Ribera", "Núria Vidal", "Pere Soler", "Aina Roca",
  "Xavier Mas", "Laia Ferrer", "Ramon Coll", "Clara Bosch", "Oriol Camps",
  "Mireia Vila", "Toni Garrido", "Helena Pons", "Jordi Lluch", "Sara Esteve",
  "Marc Rovira", "Eva Salas", "Bernat Quer", "Anna Tort", "Roger Mir",
];

const CENTERS = ["Centre Sant Pau", "Centre Sant Joan", "Residència Pinar"];

let seedCounter = 0;
const id = (p: string) => `${p}-${++seedCounter}`;

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // dl=0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function getWeekDates(ref = new Date()): string[] {
  const start = startOfWeek(ref);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export function generateSeed() {
  seedCounter = 0;
  const professionals: Professional[] = NAMES.map((name, i) => {
    const role = ROLES[i % ROLES.length] as Role;
    const avail: ShiftSlot[] =
      i % 4 === 0 ? ["Matí", "Tarda"] :
      i % 4 === 1 ? ["Tarda", "Nit"] :
      i % 4 === 2 ? ["Matí", "Nit"] :
      ["Matí", "Tarda", "Nit"];
    return {
      id: id("p"),
      name,
      role,
      availability: avail,
      hoursAccrued: 100 + Math.floor(Math.random() * 80),
      status: i === 3 || i === 9 ? "baixa" : i === 14 ? "vacances" : "actiu",
      center: CENTERS[i % CENTERS.length],
    };
  });

  const dates = getWeekDates();
  const shifts: Shift[] = [];
  for (const date of dates) {
    for (const slot of SLOTS) {
      for (const center of CENTERS) {
        for (const role of ROLES) {
          // 1 torn per role/slot/center
          const candidates = professionals.filter(
            (p) => p.role === role && p.center === center && p.status === "actiu" && p.availability.includes(slot)
          );
          // alguns descoberts
          const assign = candidates.length && Math.random() > 0.18 ? candidates[Math.floor(Math.random() * candidates.length)].id : null;
          shifts.push({
            id: id("s"),
            date,
            slot,
            role,
            center,
            professionalId: assign,
          });
        }
      }
    }
  }

  const absences: Absence[] = professionals
    .filter((p) => p.status === "baixa")
    .map((p) => ({
      id: id("a"),
      professionalId: p.id,
      startDate: dates[0],
      endDate: dates[6],
      reason: "Baixa mèdica",
      resolvedHours: 4 + Math.floor(Math.random() * 12),
    }));

  return { professionals, shifts, absences };
}
