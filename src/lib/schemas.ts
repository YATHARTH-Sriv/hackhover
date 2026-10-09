import { z } from "zod";

export const createPlaceSchema = z.object({
  nickname: z.string().trim().min(2).max(80),
  setting: z.enum(["tree", "planter", "garden", "other"]),
});

export const createVisitSchema = z.object({
  durationMinutes: z.union([z.literal(10), z.literal(15)]).default(10),
});

export const observationSchema = z.object({
  noteText: z.string().trim().min(5).max(2000),
  inputMethod: z.enum(["speech", "typed"]),
});

export const fieldCardSchema = z.object({
  title: z.string().trim().min(3).max(80),
  focus: z.string().trim().min(8).max(180),
  actions: z.tuple([
    z.string().trim().min(8).max(180),
    z.string().trim().min(8).max(180),
  ]),
  spokenScript: z.string().trim().min(80).max(700),
  durationMinutes: z.union([z.literal(10), z.literal(15)]),
});
