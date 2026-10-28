import { useState, type FormEvent } from "react";
import { z } from "zod";
import { ArrowRight, Mail } from "lucide-react";
import { siteConfig } from "@/config/site";

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(100, "Máximo de 100 caracteres"),
  email: z.string().trim().email("E-mail inválido").max(255),
  company: z.string().trim().min(2, "Informe a empresa").max(120),
  phone: z
    .string()
    .trim()
    .regex(/^[\d\s()+-]{10,20}$/, "WhatsApp inválido (ex.: (11) 91234-5678)"),
  segment: z.string().max(60).optional(),
  message: z.string().trim().max(1000, "Máximo de 1000 caracteres").optional(),
});

type Errors = Partial<Record<keyof z.infer<typeof schema>, string>>;

const field =
  "w-full rounded-lg border bg-background/60 px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/70 transition focus:border-primary-glow focus:outline-none aria-[invalid=true]:border-destructive";

export function DemoForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [ready, setReady] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      const errs: Errors = {};
      for (const issue of parsed.error.issues) errs[issue.path[0] as keyof Errors] ??= issue.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    const v = parsed.data;
    const body = [
      `Nome: ${v.name}`,
      `E-mail: ${v.email}`,
      `Empresa: ${v.company}`,
      `WhatsApp: ${v.phone}`,
      v.segment ? `Segmento: ${v.segment}` : "",
      v.message ? `\nMensagem:\n${v.message}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    const href = `mailto:${siteConfig.contactEmail}?subject=${encodeURIComponent(
      `Pedido de demonstração FLOWA — ${v.company}`,
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
    setReady(true);
  }

  const err = (k: keyof Errors) =>
    errors[k] ? (
      <p id={`${k}-err`} className="mt-1 text-xs text-destructive">
        {errors[k]}
      </p>
    ) : null;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      {(
        [
          ["name", "Nome", "text", "Seu nome"],
          ["email", "E-mail", "email", "voce@empresa.com.br"],
          ["company", "Empresa", "text", "Nome da empresa"],
          ["phone", "WhatsApp", "tel", "(11) 91234-5678"],
        ] as const
      ).map(([k, label, type, ph]) => (
        <div key={k}>
          <label htmlFor={k} className="mb-1.5 block text-xs font-medium text-muted-foreground">
            {label} <span aria-hidden>*</span>
          </label>
          <input
            id={k}
            name={k}
            type={type}
            placeholder={ph}
            className={field}
            aria-invalid={!!errors[k]}
            aria-describedby={errors[k] ? `${k}-err` : undefined}
            autoComplete={k === "name" ? "name" : k === "email" ? "email" : k === "phone" ? "tel" : "organization"}
          />
          {err(k)}
        </div>
      ))}
      <div className="sm:col-span-2">
        <label htmlFor="segment" className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Segmento
        </label>
        <select id="segment" name="segment" className={field} defaultValue="">
          <option value="">Selecione (opcional)</option>
          {["Varejo e e-commerce", "Saúde e clínicas", "Serviços", "Educação", "Imobiliário", "Alimentação", "Outro"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="message" className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Como podemos ajudar?
        </label>
        <textarea id="message" name="message" rows={3} maxLength={1000} className={field} placeholder="Conte um pouco sobre seu atendimento hoje (opcional)" />
        {err("message")}
      </div>
      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Mail className="size-3.5" /> Abre seu aplicativo de e-mail com a mensagem pronta.
        </p>
        <button type="submit" className="group inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-medium text-primary-foreground shadow-elegant transition hover:brightness-110">
          Solicitar demonstração <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
        </button>
      </div>
      {ready && (
        <p role="status" className="rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm sm:col-span-2">
          Seu aplicativo de e-mail foi aberto com a mensagem preenchida. Basta enviar para{" "}
          <strong>{siteConfig.contactEmail}</strong>.
        </p>
      )}
    </form>
  );
}
