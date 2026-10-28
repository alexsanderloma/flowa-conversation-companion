import { describe, expect, it } from "vitest";
import { loginSchema, registrationSchema } from "@/components/flowa/access/validation";

const valid = { name: "Ana Silva", company: "Empresa Exemplo", email: "ana@example.com", password: "Exemplo123", confirmation: "Exemplo123" };

describe("Local access demonstration validation", () => {
  it("rejects invalid login email", () => {
    expect(loginSchema.safeParse({ email: "sem-email", password: "exemplo" }).success).toBe(false);
  });
  it("requires login password", () => {
    expect(loginSchema.safeParse({ email: valid.email, password: "" }).success).toBe(false);
  });
  it("accepts valid demonstration fields", () => {
    expect(registrationSchema.safeParse(valid).success).toBe(true);
  });
  it("requires a name and company", () => {
    expect(registrationSchema.safeParse({ ...valid, name: " " }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...valid, company: " " }).success).toBe(false);
  });
  it("requires matching password confirmation", () => {
    const result = registrationSchema.safeParse({ ...valid, confirmation: "Outro123" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(["confirmation"]);
  });
  it("requires at least eight password characters", () => {
    expect(registrationSchema.safeParse({ ...valid, password: "Ab12345", confirmation: "Ab12345" }).success).toBe(false);
  });
  it("requires a password letter", () => {
    expect(registrationSchema.safeParse({ ...valid, password: "12345678", confirmation: "12345678" }).success).toBe(false);
  });
  it("requires a password number", () => {
    expect(registrationSchema.safeParse({ ...valid, password: "abcdefgh", confirmation: "abcdefgh" }).success).toBe(false);
  });
  it("rejects oversized fields", () => {
    expect(registrationSchema.safeParse({ ...valid, name: "a".repeat(101) }).success).toBe(false);
    expect(loginSchema.safeParse({ email: valid.email, password: "a".repeat(129) }).success).toBe(false);
  });
});