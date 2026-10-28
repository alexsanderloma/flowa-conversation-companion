import { createFileRoute } from "@tanstack/react-router";
import { AccessLayout } from "@/components/flowa/access/AccessLayout";
import { RegistrationForm } from "@/components/flowa/access/AccessForm";

const title = "Cadastro — FLOWA AI | Demonstração de cadastro";
const description = "Conheça a experiência de cadastro da FLOWA AI em um protótipo demonstrativo, sem criar contas reais ou enviar dados.";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [
    { title }, { name: "description", content: description },
    { property: "og:title", content: title }, { property: "og:description", content: description },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: RegistrationPage,
});

function RegistrationPage() { return <AccessLayout registration><RegistrationForm /></AccessLayout>; }