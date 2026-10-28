# FLOWA — preparação para Hostinger Node.js

Esta pasta é a adaptação do export do Lovable para execução em Node.js.

## Produção
- Build: `npm run build`
- Start: `npm start`
- Hostinger: configure a aplicação Node.js para executar `npm start`.
- Defina as variáveis de ambiente pelo painel da Hostinger; não envie arquivos `.env`.

## Antes de apontar flowa.store
1. Configurar todas as variáveis do arquivo `HOSTINGER-RUNTIME-VARIABLES.txt`.
2. Configurar os segredos ativos: Supabase, Evolution API, Asaas e IA.
3. Atualizar os webhooks da Evolution e do Asaas para a URL da Hostinger.
4. Testar login, pagamento, conexão WhatsApp e uma mensagem real em ambiente de teste.
5. Só então apontar `flowa.store` para a Hostinger.
