import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, Circle, Info, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccessField } from "./AccessField";
import { loginSchema, registrationSchema, passwordCriteria, type LoginValues, type RegistrationValues } from "./validation";

function IntegrationNotice() {
  return <p className="mt-6 flex gap-2 border-t pt-5 text-xs leading-relaxed text-muted-foreground"><LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-accent" /> Protótipo independente. A conexão ao login real da FLOWA será feita na integração ao sistema existente. Nenhum dado é enviado ou salvo.</p>;
}

function FormHeading({ registration = false }: { registration?: boolean }) {
  return <div className="mb-7"><p className="flex items-center gap-2 font-mono text-[11px] text-accent"><span className="size-1.5 rounded-full bg-mint" /> MODO DEMONSTRAÇÃO</p><h2 className="mt-4 text-2xl font-semibold sm:text-3xl">{registration ? "Conheça seu próximo passo." : "Bem-vindo à FLOWA."}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{registration ? "Explore a experiência de cadastro, sem criar uma conta real." : "Explore a experiência de acesso, sem entrar em uma conta real."}</p></div>;
}

function Status({ message }: { message: string }) {
  return <div role="status" aria-live="polite">{message && <p className="mt-5 flex gap-2 rounded-lg border border-accent/25 bg-accent/5 p-3 text-sm leading-relaxed text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0 text-accent" />{message}</p>}</div>;
}

const submitClass = "group h-12 w-full rounded-full bg-brand font-medium text-primary-foreground shadow-elegant transition hover:bg-primary hover:brightness-110";

export function LoginForm() {
  const [message, setMessage] = useState("");
  const { register, handleSubmit, resetField, formState: { errors } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), mode: "onBlur", defaultValues: { email: "", password: "" } });
  return <>
    <FormHeading />
    <form noValidate onSubmit={handleSubmit(() => {
      resetField("password");
      setMessage("Validação local concluída. Nenhum login foi realizado. O acesso real estará disponível após a integração com o sistema existente.");
    }, () => setMessage(""))} className="space-y-5">
      <AccessField label="E-mail" id="login-email" type="email" autoComplete="off" placeholder="voce@empresa.com.br" maxLength={254} required {...register("email")} error={errors.email?.message} />
      <AccessField label="Senha" id="login-password" type="password" autoComplete="off" placeholder="Sua senha" maxLength={128} required {...register("password")} error={errors.password?.message} />
      <div className="flex justify-end"><Button type="button" variant="link" className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground" onClick={() => setMessage("A recuperação de senha não está disponível neste protótipo. Ela será conectada ao sistema real da FLOWA durante a integração.")}>Esqueceu sua senha?</Button></div>
      <Button type="submit" className={submitClass}>Testar login · demonstração <ArrowRight className="transition group-hover:translate-x-0.5" /></Button>
    </form>
    <Status message={message} />
    <Button asChild variant="outline" className="mt-5 h-12 w-full rounded-full">
      <Link to="/app/dashboard">Ver demonstração do painel <ArrowRight /></Link>
    </Button>
    <p className="mt-6 text-center text-sm text-muted-foreground">Ainda não tem uma conta? <Link to="/cadastro" className="font-medium text-primary-glow hover:underline">Conhecer o cadastro</Link></p>
    <IntegrationNotice />
  </>;
}

export function RegistrationForm() {
  const [message, setMessage] = useState("");
  const { register, handleSubmit, watch, resetField, formState: { errors } } = useForm<RegistrationValues>({ resolver: zodResolver(registrationSchema), mode: "onBlur", defaultValues: { name: "", company: "", email: "", password: "", confirmation: "" } });
  const password = watch("password");
  return <>
    <FormHeading registration />
    <form noValidate onSubmit={handleSubmit(() => {
      resetField("password");
      resetField("confirmation");
      setMessage("Validação local concluída. Nenhuma conta foi criada ou confirmação enviada. O cadastro real será conectado ao sistema existente.");
    }, () => setMessage(""))} className="space-y-4">
      <AccessField label="Seu nome" id="registration-name" autoComplete="off" placeholder="Como podemos chamar você?" maxLength={100} required {...register("name")} error={errors.name?.message} />
      <AccessField label="Nome da empresa" id="registration-company" autoComplete="off" placeholder="Sua empresa" maxLength={100} required {...register("company")} error={errors.company?.message} />
      <AccessField label="E-mail" id="registration-email" type="email" autoComplete="off" placeholder="voce@empresa.com.br" maxLength={254} required {...register("email")} error={errors.email?.message} />
      <AccessField label="Senha" id="registration-password" type="password" autoComplete="off" placeholder="Crie uma senha de exemplo" maxLength={128} hintId="password-criteria" required {...register("password")} error={errors.password?.message} />
      <ul id="password-criteria" className="flex flex-wrap gap-x-4 gap-y-2 text-[11px]">
        {passwordCriteria.map(criterion => <li key={criterion.label} className={`flex items-center gap-1.5 ${criterion.test(password) ? "text-accent" : "text-muted-foreground"}`}>{criterion.test(password) ? <Check className="size-3" /> : <Circle className="size-3" />}{criterion.label}</li>)}
      </ul>
      <AccessField label="Confirmar senha" id="registration-confirmation" type="password" autoComplete="off" placeholder="Repita a senha de exemplo" maxLength={128} required {...register("confirmation")} error={errors.confirmation?.message} />
      <p className="text-xs leading-relaxed text-muted-foreground">Use dados de exemplo. Esta demonstração não cria conta nem solicita aceite de termos.</p>
      <Button type="submit" className={submitClass}>Testar cadastro · demonstração <ArrowRight className="transition group-hover:translate-x-0.5" /></Button>
    </form>
    <Status message={message} />
    <p className="mt-6 text-center text-sm text-muted-foreground">Já conhece a FLOWA? <Link to="/entrar" className="font-medium text-primary-glow hover:underline">Voltar para entrar</Link></p>
    <IntegrationNotice />
  </>;
}