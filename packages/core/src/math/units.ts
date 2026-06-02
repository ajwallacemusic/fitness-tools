import { z } from "zod";

export const LB_TO_KG = 0.45359237;
export const IN_TO_CM = 2.54;

const positive = z.number().positive().finite();

export const MassUnit = z.enum(["kg", "lb"]);
export const LengthUnit = z.enum(["cm", "in", "mm"]);

export const MassSchema = z.object({
  value: positive,
  unit: MassUnit.default("kg"),
});
export const LengthSchema = z.object({
  value: positive,
  unit: LengthUnit.default("cm"),
});

export type Mass = z.output<typeof MassSchema>;
export type Length = z.output<typeof LengthSchema>;

/** Normalize a {@link Mass} to kilograms. */
export function massKg(m: Mass): number {
  return m.unit === "lb" ? m.value * LB_TO_KG : m.value;
}

/** Normalize a {@link Length} to centimetres. */
export function lengthCm(l: Length): number {
  if (l.unit === "in") return l.value * IN_TO_CM;
  if (l.unit === "mm") return l.value / 10;
  return l.value;
}

/** Normalize a {@link Length} to millimetres. */
export function lengthMm(l: Length): number {
  return lengthCm(l) * 10;
}
