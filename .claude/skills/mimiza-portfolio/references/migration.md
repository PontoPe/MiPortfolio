# Divergências das páginas antigas

Lista do que as páginas no ar têm hoje e que o sistema não aceita mais.
Ordenada por severidade. Nada aqui é opcional.

---

## Descoberta de 2026-08-17 — o bloco 11 nunca esteve ativo

`tokens.css` é carregado por **uma** página: `case-mosaico-lp.html`. Home,
sobre, as três categorias e `case-ludis-lp.html` carregam só `page-style.css`.

Consequência: toda a migração de paleta do bloco 11 — os remapeamentos de
`--ink`, `--ink-soft`, `--periwinkle` e companhia — **nunca valeu em nenhuma
página no ar.** O item S1 abaixo não estava "feito e por confirmar": estava
inteiramente por fazer.

Por isso as correções de contraste do chrome foram feitas **direto no
`page-style.css`**, o único arquivo que todas as páginas carregam, com tokens
novos (`--chrome-link`, `--chrome-link-strong`, `--chrome-link-rest`) que o
bloco 11.1 de `tokens.css` redireciona quando a página o carregar.

### Corrigido em 2026-08-17, em todas as cinco páginas

| Onde | Era | Virou |
|---|---|---|
| `.site-footer a` | `--periwinkle-deep`, 2.73 | `--chrome-link`, 4.81 |
| `.site-footer a:hover` | `--periwinkle`, 2.09 | `--chrome-link-strong` |
| `.site-footer` (texto) | `--ink-soft`, 2.45 | `--chrome-link-rest`, 6.06 |
| `.nav-link` repouso | `--ink-soft`, 2.49 | `--chrome-link-rest`, 6.06 |
| `.nav-link:hover` / `.is-active` | `--periwinkle-deep` | `--chrome-link`, 4.71 |
| `.section-eyebrow` | `--periwinkle-deep`, 2.08 | `--chrome-link-strong`, 6.87 |
| `.nav-link.is-active` sublinhado | `rgba(73,100,219,.6)` literal | `currentColor` |
| Alvo tocável de `.site-footer-links a`, `.nav-link`, `.nav-logo` | 23–32px | 44px |

Isso fecha **A7** e a parte de chrome de **A8**. Continuam abertos: A5 e A6
(são da folha do LUDIS, que não foi migrada), A10 no LUDIS (resolvido só na
página do MOSAICO, que traz script próprio de teclado), e os oito usos
restantes de `--ink-soft` em texto corrido — `.hero-meta`,
`.home-about-text`, `.project-media-caption`, `.project-carousel-counter`,
`.cta-block .cta-lead` e dois botões. Todos em 2.49 e todos **fora** do
chrome: mexer neles muda o tom do texto corrido do site inteiro.

---

## Estado de `case-ludis-lp.html` — leia antes de mexer nela

A página do LUDIS é a **origem** do sistema e **não foi migrada para ele**.
Decisão de 2026-08-17: ela fica como está.

- Carrega `page-style.css` + `case-ludis-lp.css`. **Não carrega `tokens.css`
  nem `components.css`.**
- Usa classes `.lp-*` e uma paleta em hex literal, amostrada do export do Figma.
- Os componentes dela foram **portados** para `components.css` com os nomes
  canônicos (`.steps`, `.chip`, `.flow-card`, `.ba-device`, `.carousel-*`), e é
  de lá que toda página nova consome. A folha do LUDIS não foi tocada.

Consequência prática: existem duas implementações dos mesmos componentes, e elas
vão divergir com o tempo. Enquanto a página do LUDIS não for migrada, **uma
correção de componente precisa ser aplicada nos dois lugares** — ou aceita-se
que só a versão nova recebe a correção.

A divergência mais visível é a S9 abaixo: o LUDIS tem corpo de texto em 36
design-px (36px a 1920 de largura), o sistema tem 16px fixo. **Uma página nova
não terá a mesma densidade de texto do LUDIS.** É consequência direta do modelo
híbrido, que tirou tipografia de `--s` para não ilegibilizar telas estreitas.
Para reverter, o lugar é o bloco 3 de `tokens.css` — não a folha da página.

---

## Bloqueante — acessibilidade

| # | Onde | Problema | Correção |
|---|---|---|---|
| A1 | todo o CSS | **Nenhuma regra de `:focus-visible` com indicador visível existe.** Nav, botões, cards, links de footer e o handle do comparador são focáveis e invisíveis ao teclado. | Adicionar `:focus-visible` com `--color-focus-ring` em todo focável |
| A2 | ~~`.lp-btn`~~ | **Cancelado.** O rótulo branco sobre `--purple-500` foi mantido por decisão de marca. A borda em `--purple-600` permanece obrigatória: ela dá 3.00 e é o que sustenta o limite do componente. | Só adicionar a borda |
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
