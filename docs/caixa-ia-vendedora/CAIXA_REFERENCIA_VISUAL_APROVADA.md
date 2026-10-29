# Caixa — referência visual aprovada

Status: **referência oficial aprovada para a próxima reformulação do Caixa.**

Imagem de referência fornecida pelo cliente em 29/10/2026:

`C:\Users\alezi\.codex\codex-remote-attachments\01a166c1-35f6-7451-b532-2997798fa34b\codex-clipboard-498e520f-bdf8-42b3-b3fc-d603cfc4dcb9.png`

## Resultado esperado

A tela `/app/caixa` deve reproduzir fielmente a composição, hierarquia e acabamento da referência:

- Tema azul-marinho escuro, cartões azulados, bordas sutis azul/roxo e destaques em gradiente roxo.
- Faixa superior **Experiência de Caixa**, título “Vender ficou simples. Controlar, melhor ainda.” e filtros de período à direita.
- Quatro cartões de indicadores: vendas confirmadas, lucro líquido, despesas diárias e margem média.
- Área principal dividida em lançamento da venda à esquerda e resumo da venda à direita.
- Lançamento de venda organizado em campos independentes: quantidade, produto, valor da venda, custo, forma de pagamento, funcionário e observação; botão **Adicionar**.
- Quadro **Itens da venda** em formato de tabela, com colunas de quantidade, produto, vendedor, forma de pagamento, lucro, custo, total e ações.
- Resumo da venda com subtotal, custo total, despesas diárias, lucro estimado, margem, total a receber e botão **Confirmar venda**.
- Área **Vendas** inferior com pesquisa, exportação e tabela de histórico.

## Regras de implementação

- Manter a segurança multiempresa e a estrutura financeira já implementada.
- Não substituir a referência por um layout simplificado ou por componentes de seleção de catálogo.
- Preservar o comportamento responsivo; no celular, a composição deve reorganizar cartões e tabelas sem descaracterizar o visual.
- Esta referência é visual. Campos, cálculos, permissões e integrações devem ser conectados aos dados reais existentes antes de publicar.
- Não alterar nem publicar a tela atual até o cliente retomar e autorizar esta etapa.
