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
  // Limite de 7MB base64 (~5MB binario real) para prevenir envio de payloads enormes
  imageBase64: z.string().min(1, "Imagem obrigatoria").max(7 * 1024 * 1024, "Imagem muito grande (maximo 5MB)"),
  mediaType: z.enum(
    ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"],
    { errorMap: () => ({ message: "Tipo de imagem nao suportado. Use JPEG, PNG, WebP ou GIF." }) }
  ),
  userId: z.string().uuid().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

export const ScanResponseSchema = z.object({
  food_name: z.string(),
  emoji: z.string(),
  category: z.enum(["proteina", "carboidrato", "gordura", "fruta", "vegetal", "bebida", "misto"]),
  portion: z.string(),
  // Usa coerce para aceitar tanto inteiros quanto floats vindos da IA (arredonda implicitamente no display)
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  fiber: z.number().nonnegative(),
  sugar: z.number().nonnegative(),
  sodium: z.number().nonnegative(),
  glycemic_index: z.enum(["baixo", "medio", "alto"]),
  satiety_score: z.number().int().min(1).max(10),
  cutting_score: z.number().int().min(1).max(10),
  confidence: z.enum(["alta", "media", "baixa"]),
  benefits: z.array(z.string()).max(4), // backend permite 2, mas deixamos margem no frontend
  watch_out: z.string().nullable(),
  ai_tip: z.string(),
  // Veredicto contextual — opcionais para backward compatibility
  verdict: z.string().optional().nullable(),
  next_action: z.string().optional().nullable(),
});
