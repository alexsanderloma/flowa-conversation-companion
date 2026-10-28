import { z } from "zod";

export const passwordCriteria = [
  { label: "Pelo menos 8 caracteres", test: (value: string) => value.length >= 8 },
  { label: "Uma letra", test: (value: string) => /[a-zA-Z]/.test(value) },
  { label: "Um número", test: (value: string) => /\d/.test(value) },
];

const email = z.string().trim().min(1, "Informe seu e-mail.").max(254, "Use até 254 caracteres.").email("Informe um e-mail válido.");
const name = (label: string) => z.string().trim().min(2, `${label} deve ter pelo menos 2 caracteres.`).max(100, "Use até 100 caracteres.").refine(value => !/[\u0000-\u001f\u007f]/.test(value), "Remova caracteres inválidos.");
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Informe sua senha.").max(128, "Use até 128 caracteres."),
});
export const registrationSchema = z.object({
  name: name("O nome"),
  company: name("O nome da empresa"),
  email,
  password: z.string().min(8, "Use pelo menos 8 caracteres.").max(128, "Use até 128 caracteres.")
    .refine(value => /[a-zA-Z]/.test(value), "Inclua pelo menos uma letra.")
    .refine(value => /\d/.test(value), "Inclua pelo menos um número."),
  confirmation: z.string().min(1, "Confirme sua senha.").max(128, "Use até 128 caracteres."),
}).refine(value => value.password === value.confirmation, { message: "As senhas não coincidem.", path: ["confirmation"] });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegistrationValues = z.infer<typeof registrationSchema>;