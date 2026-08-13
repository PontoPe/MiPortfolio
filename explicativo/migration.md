# Divergências das páginas antigas

Lista do que as páginas no ar têm hoje e que o sistema não aceita mais.
Ordenada por severidade. Nada aqui é opcional.

---

## Bloqueante — acessibilidade

| # | Onde | Problema | Correção |
|---|---|---|---|
| A1 | todo o CSS | **Nenhuma regra de `:focus-visible` com indicador visível existe.** Nav, botões, cards, links de footer e o handle do comparador são focáveis e invisíveis ao teclado. | Adicionar `:focus-visible` com `--color-focus-ring` em todo focável |
| A2 | `.lp-btn` | branco sobre `--purple-500` = 1.9:1 | Adotar `.btn` do sistema: texto `--color-text-body`, borda `--purple-600` |
| A3 | ~~tags do case~~ | **Cancelado.** Os degraus pastel foram mantidos por decisão de marca. Ver a exceção em `tokens.css`. | Nenhuma |
| A4 | chips | seguem a cor de tag do bloco em que estão | Nenhuma — mesma exceção |
| A5 | `.lp-jump` | `--gray-400` como texto, 2.15:1 | `--color-text-body` |
| A6 | `.ba-hint` | ~2.4:1 | `--color-text-body` |
| A7 | `--ink-soft` no chrome | `#9ca0b2` = 2.62:1, usado em `.nav-link`, footer e leads | Migrado para `--color-text-body` em `tokens.css` |
| A8 | `--ink` no chrome | `#777c95` = 4.28:1, reprova em texto normal | Migrado para `--color-text-body` |
| A9 | botão de menu mobile | sem `aria-label` em 4 páginas | Adicionar |
| A10 | `.ba-handle` | slider de teclado sem foco visível | Adicionar indicador e confirmar suporte a setas |

---

## Alto — coerência de sistema

| # | Onde | Problema | Correção |
|---|---|---|---|
| S1 | `page-style.css` | paleta inteira fora do design system (`--periwinkle`, `--violet`, `--ink`, `--pill-soft`, `--ticker-bg`) | Já redirecionada no bloco 11 de `tokens.css`. Confirmar visualmente e depois remover as declarações originais |
| S2 | `scripts/tailwind-theme.js` | ~50 cores de tema, nenhuma do design system | Reduzir ao mínimo usado ou remover |
| S3 | tag do case | altura 56 / fonte 24 / borda 3.9 em design-px — o componente ampliado que o design system já normalizou | Fixar em `--tag-height` / `--font-size-caption` / `--tag-border` |
| S4 | `.lp-btn` | escala proporcional | Fixar em `--btn-height` e `--font-size-body` |
| S5 | fontes | Poppins carregada em 300–800 | Reduzir a 400, 500, 700 |
| S6 | fontes | **Kalam carregada em 5 páginas e nunca usada** | Remover do `<link>` |
| S7 | `case-base.css`, `case-ludis.*`, `case-mosaico.*` | sistema paralelo morto, ~2.500 linhas | Não manter, não referenciar |
| S8 | `--shadow-300` | declarado no design system, não usado em lugar nenhum | Decidir: adotar ou remover do sistema |
| S9 | corpo de texto | 36 design-px no case vs 20px fixo no sistema | O sistema vence; a página nova terá densidade diferente do LUDIS |

---

## Médio — conteúdo e consistência

| # | Onde | Problema |
|---|---|---|
| C1 | footer, todas as páginas | Instagram, LinkedIn e Behance apontam para `#` |
| C2 | case | três botões apontam para `#`: design system, protocolo de entrevista, projeto de marketing |
| C3 | case, seção de validação | erro de digitação: "Bellow" → "Below" |
| C4 | `page-style.css` | cursor customizado global com `!important` em `html, body, body *` — não documentado, e sobrescreve o cursor de texto em campos |
| C5 | Tailwind CDN | uso em produção; o markup mistura utilitário e classe do sistema sem fronteira |
| C6 | nav | duas variantes coexistindo; a de categoria só aparece em 4 páginas |
| C7 | about | dois botões primários — exceção, decidir se normaliza |

---

## Ordem sugerida de execução

1. A1 a A10 — acessibilidade, tudo de uma vez.
2. S1 e S2 — a migração de paleta, com revisão visual página a página.
3. S3 a S6 — normalização de componente e fonte.
4. S7 — remoção do sistema morto.
5. C1 a C7 — conteúdo.

O item S1 é o de maior risco visual: a paleta do chrome muda em todas as páginas ao mesmo tempo. Revise home, categoria e sobre lado a lado antes de publicar.
