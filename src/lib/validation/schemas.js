import { z } from "zod";

export const SignUpSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
});

export const SignInSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

export const ProfileSchema = z.object({
  full_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  age: z.number().int().min(13).max(120),
  gender: z.enum(["M", "F"]),
  weight: z.number().positive("Peso deve ser positivo"),
  height: z.number().positive("Altura deve ser positiva"),
  activity_level: z.enum(["1.2", "1.375", "1.55", "1.725", "1.9"]),
  goal: z.enum(["cutting", "maintain", "bulking"]),
});

export const ScanRequestSchema = z.object({
  imageBase64: z.string(),
  mediaType: z.string(),
  userId: z.string().uuid().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

export const ScanResponseSchema = z.object({
  food_name: z.string(),
  emoji: z.string(),
  category: z.enum(["proteina", "carboidrato", "gordura", "fruta", "vegetal", "bebida", "misto"]),
  portion: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  fiber: z.number(),
  sugar: z.number(),
  sodium: z.number(),
  glycemic_index: z.enum(["baixo", "medio", "alto"]),
  satiety_score: z.number().int().min(1).max(10),
  cutting_score: z.number().int().min(1).max(10),
  confidence: z.enum(["alta", "media", "baixa"]),
  benefits: z.array(z.string()).max(2),
  watch_out: z.string().nullable(),
  ai_tip: z.string(),
});
