const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("en-IN");

export const money = (n: number) => inr.format(n);
export const count = (n: number) => num.format(n);

export const fmtTime = (d: Date) =>
  d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
export const fmtDay = (d: Date) =>
  d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
export const fmtShortDay = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
export const monthShort = (m: number) =>
  new Date(2017, m, 1).toLocaleDateString("en-IN", { month: "short" });
export const monthLong = (m: number) =>
  new Date(2017, m, 1).toLocaleDateString("en-IN", { month: "long" });

export function partOfDay(h: number) {
  if (h < 5) return "night";
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 21) return "evening";
  return "night";
}

export function gap(a: Date, b: Date) {
  const mins = Math.round(Math.abs(b.getTime() - a.getTime()) / 60000);
  if (mins < 1) return "same time";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
