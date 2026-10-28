import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string | undefined; hintId?: string | undefined };

export const AccessField = forwardRef<HTMLInputElement, Props>(function AccessField({ label, error, hintId, type = "text", id, ...props }, ref) {
  const [visible, setVisible] = useState(false);
  const password = type === "password";
  const errorId = `${id}-error`;
  const describedBy = [hintId, error ? errorId : undefined].filter(Boolean).join(" ") || undefined;
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      <div className="relative">
        <input {...props} ref={ref} id={id} type={password && visible ? "text" : type} aria-invalid={Boolean(error)} aria-describedby={describedBy}
          className={`h-12 w-full rounded-xl border bg-background/50 px-4 text-sm text-foreground placeholder:text-muted-foreground/60 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${password ? "pr-14" : ""} ${error ? "border-destructive" : "border-input"}`} />
        {password && <Button type="button" variant="ghost" size="icon" onClick={() => setVisible(value => !value)} aria-label={`${visible ? "Ocultar" : "Mostrar"} ${label.toLowerCase()}`} title={`${visible ? "Ocultar" : "Mostrar"} ${label.toLowerCase()}`} aria-pressed={visible} className="absolute top-1.5 right-2 rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground">{visible ? <EyeOff /> : <Eye />}</Button>}
      </div>
      {error && <p id={errorId} className="text-xs text-destructive">{error}</p>}
    </div>
  );
});