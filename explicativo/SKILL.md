---
name: mimiza-portfolio
description: Sistema de design do portfólio da Milena Caldas (mimiza-portfolio). Use SEMPRE que o pedido envolver qualquer página, seção, bloco, componente, estilo, cor, espaçamento, tipografia, layout, grid, imagem, botão, tag, nav, footer, hero, CTA, card de projeto, case study ou landing page deste portfólio — inclusive pedidos curtos como "cria uma página nova", "adiciona uma seção", "ajusta esse espaçamento", "muda a cor disso", "deixa responsivo" ou "faz um case novo". Use também ao revisar, corrigir ou refatorar HTML/CSS existente do repositório. Não espere a expressão "design system" para acionar.
---

# Portfólio Milena Caldas — sistema de aplicação

Todo valor vem de `tokens.css`. Este documento define **regra de uso**, não número.
Se um valor não existe em `tokens.css`, ele não existe. Não crie um.

## Modelo de escala — leia antes de escrever qualquer CSS

O sistema é **híbrido**. Escolher errado quebra a página.

| O que | Como | Exemplos |
|---|---|---|
| **Layout** | proporcional, via `--s` | container, colunas de grid, gaps, padding de seção, ritmo vertical, largura de imagem, raio de card de banda |
| **Componente** | fixo, px/rem | tipografia, tag, botão, focus ring, alvo de toque, ícone |

`--s` é um pixel de design do artboard 1920. Escreva `calc(N * var(--s))` para layout — ou, melhor, use o token de ritmo já pronto. Congela em 1:1 acima de 1921px, fixa numa faixa legível abaixo de 900px. Não redefina `--s`.

Tipografia **nunca** entra em `--s`. Texto escala por `clamp()` dentro dos tokens de fonte, para não ficar ilegível em telas estreitas.

---

## 1. Escala tipográfica

Cada papel tem um token. Escolha pelo papel, nunca pelo tamanho que parece certo.

| Papel | Token |
|---|---|
| Título de página — um por página | `--font-size-h1` |
| Título de seção | `--font-size-h2` |
| Subtítulo dentro de seção | `--font-size-h3` |
| Título de bloco | `--font-size-h4` |
| Título de card | `--font-size-h5` |
| Rótulo de grupo | `--font-size-h6` |
| Parágrafo de abertura — no máximo um por bloco | `--font-size-body-lg` |
| Texto padrão, lista, campo | `--font-size-body` |
| Nota secundária, legenda, descrição de interface | `--font-size-body-sm` |
| Tag, rótulo, texto de apoio | `--font-size-caption` |
| Numeral de métrica | `--font-size-display` |

- Nunca pule um nível de título. `h1` → `h3` sem `h2` no meio está errado, mesmo que o tamanho pareça melhor.
- Nível de título é semântico. Se quer o tamanho sem a hierarquia, use a tag correta e aplique o token de tamanho.
- Pesos: 400 padrão, 500 rótulo e numeral, 700 título e destaque.
- Line-height acompanha o token de tamanho: corpo `--line-height-body`, nota `--line-height-body-sm`, apoio `--line-height-caption`, título `--line-height-heading`. Pílula de altura fixa usa `--line-height-tight`.
- Com corpo em 16px, `--gray-600` deixa de ser utilizável em quase todo texto: o limite de "texto grande" da WCAG é 24px regular ou 18.66px bold. Use `--color-text-body`.

---

## 2. Bloco de título + texto

É a unidade de composição mais usada do site. Monte sempre assim:

```html
<div class="text-block">
  <div class="tag-group">…</div>   <!-- opcional -->
  <h2>Título</h2>
  <p>Primeiro parágrafo.</p>
  <p>Segundo parágrafo.</p>
  <a class="btn btn--primary" href="…">Ação</a>   <!-- opcional -->
</div>
```

Espaçamentos, na ordem:

| Relação | Token |
|---|---|
| grupo de tags → título | `--rhythm-head-body` |
| título → primeiro parágrafo | `--rhythm-head-body` |
| parágrafo → parágrafo | `--rhythm-para` |
| último parágrafo → título seguinte | `--rhythm-block` |
| título → grid ou componente (não parágrafo) | `--rhythm-head-component` |
| conteúdo → botão | `--rhythm-action` |

Regras fechadas do bloco:

- Título **sempre alinhado à esquerda**. A única exceção do site é o bloco CTA de fechamento, que é centralizado.
- Largura máxima do corpo: `--measure`. Nunca deixe linha de texto correr a largura inteira do container.
- Destaque dentro do parágrafo: `<strong>`, peso 700, cor `--color-text-strong`, mesmo tamanho. **Nunca** itálico, nunca sublinhado, nunca outra cor. Sublinhado é exclusivo de link.
- Um bloco tem no máximo um botão.

---

## 3. Esqueleto de página

Quatro tipos. `nav` e `footer` são obrigatórios em todos.

### Case study — padrão canônico para páginas novas

```
nav (com status-tag "Available")
main
  ├ hero            → logo/título, tag-group, lead, link âncora "how"
  ├ seção de bandas × N
  └ galeria         → grid de screenshots
footer
```

O CTA global **não** entra em case. O fechamento do case é um link para projeto relacionado, vindo do conteúdo.

### Página de categoria

```
nav (sem status-tag) → main > section-panel [eyebrow, h1, lead, grid de projetos] → cta-block → footer
```

### Home e Sobre

Estruturas fixas, já construídas. Ver `references/page-skeletons.md` antes de alterar.

**Detalhe completo de cada esqueleto, com o markup real:** `references/page-skeletons.md`.

---

## 4. Bandas de seção

Toda seção de case é uma banda com um dos três fundos: quadriculada, lavanda ou branca.

- **Nunca use a mesma banda em duas seções consecutivas.** Regra imperativa.
- A ordem de abertura é livre.
- Padding vertical: use `--section-pad-tight-*` como padrão. Use `--section-pad-loose-*` só em seção de respiro — galeria, carrossel de imagens, fechamento. **Não crie um terceiro par.**
- Banda escura (`--color-bg-inverse`) não é usada em nenhuma página. Não introduza uma sem pedido explícito.

---

## 5. Botões

Duas variações, só. `.btn--primary` e `.btn--secondary`.

- **Um botão primário por página.** Se a página já tem um, o próximo é secundário.
- O primário fica no CTA de fechamento, ou no bloco de ação principal do hero.
- O secundário só aparece **ao lado** de um primário, nunca sozinho, sempre à direita dele.
- Botão é `<a>` quando navega e `<button>` quando executa. A classe é a mesma nos dois casos — **não crie variante de link**.
- Estados obrigatórios: `:hover`, `:active`, `:focus-visible`, `:disabled`. Nenhum é opcional.
- `:active` remove a sombra em vez de escurecer o fundo.

Ícone dentro de botão: sempre depois do texto, exceto seta de retorno, que vem antes.

---

## 6. Tags

Três cores: `--color-tag-pink`, `--color-tag-green`, `--color-tag-blue`. Sempre outline, fundo transparente, texto e borda no mesmo token.

**Estes três tokens são uma exceção de contraste declarada.** São `--pink-500` (#E2AAFD), `--green-600` (#66AC55) e `--blue-600` (#72ABBE) — os valores do Figma — e reprovam em WCAG AA. Foi decisão de marca, está registrada em `tokens.css`, e não deve ser "corrigida" sem pedido. Nenhum outro componente pode herdar estes degraus.

Por isso, a tag nunca carrega informação que exista só nela: o que a tag diz precisa estar no texto da página também.

- **A tag não é interativa.** Use `<span>`. Sem hover, sem cursor pointer, sem `<a>`, sem `<button>`.
- Tags aparecem **acima do título**, nunca abaixo, nunca no meio do corpo.
- Grupo de **2 ou 3 tags**. Nunca uma sozinha, nunca quatro ou mais.
- Num grupo, cores diferentes entre si.
- Largura é hug: o conteúdo define. Nunca fixe largura.
- Ordem no case: disciplina → ano → status.

`.status-tag` (a pílula com ponto, no nav) é outro componente: só o nav a usa, e só com o rótulo de disponibilidade.

---

## 7. Imagens

- `object-fit: cover` sempre. `display: block` sempre. `alt` sempre — vazio com `aria-hidden="true"` se for decorativa.
- Raio: `--radius-image` em grade de galeria. Imagem de conteúdo dentro de banda vai **sem raio**.
- Sem overlay, sem filtro, sem borda. O site não usa nenhum dos três.
- Imagem respeita o gutter do container. A única exceção é o carrossel de tela cheia, que sangra até a borda.
- `loading="lazy"` em toda imagem abaixo da dobra.
- Legenda (`<figcaption>`) fica abaixo, em `--font-size-body-sm`, cor `--color-text-heading`.

---

## 8. Links no corpo de texto

Cor `--color-text-heading`, sublinhado sempre visível, `text-underline-offset` folgado. Hover troca para `--color-accent-hover`. `:focus-visible` obrigatório.

Link nunca se distingue só por cor.

---

## 9. Responsivo

Dois breakpoints. **Não introduza um terceiro.**

**≤ 900px**
- Todo grid de conteúdo vira uma coluna, com `--gap-stack`.
- Galeria vai a duas colunas.
- Container usa o gutter reduzido.
- Nada some. Não esconda conteúdo por breakpoint.

**≤ 768px**
- A lista de links da nav some e o botão de menu assume. Este é o único BP do chrome.

Alvo tocável mínimo: `--touch-target` em tudo que é clicável no mobile.

---

## 10. Movimento

O site **não** é estático. Padrão:

- Hover de link e botão: `--duration-base` com `--easing-standard`.
- Card de projeto: `--duration-slow` com `--easing-emphasis`, elevação e leve zoom na imagem.
- Botão e card sobem no hover (`--hover-lift`).
- `prefers-reduced-motion` já é tratado em `tokens.css`. Não reimplemente.

Não adicione animação de entrada, parallax ou reveal em página nova sem pedido explícito. Os que existem são de páginas específicas.

---

## 11. Ícones

Material Symbols Outlined, via ligadura. Configuração no token de ícone — não sobrescreva os eixos.

- Tamanho `--icon-size`; `--icon-size-lg` só em ícone de destaque.
- Cor herda de `currentColor`. Nunca pinte um ícone com cor própria.
- Alinhe com o texto por `inline-flex` + `align-items: center`, nunca por margem manual.
- Ícone decorativo leva `aria-hidden="true"`.

---

## 12. Tailwind

Tailwind CDN continua no projeto. A fronteira é rígida:

| Permitido em utilitário | Proibido em utilitário |
|---|---|
| display, flex, grid, posição, ordem | cor de qualquer tipo |
| gap e spacing de layout auxiliar | tamanho e peso de fonte |
| prefixos responsivos (`md:`, `lg:`) | border-radius |
| `hidden`, `sr-only` | sombra |

Cor, tipografia, raio e sombra vêm **sempre** de classe do sistema ou de token. Se você escreveu `text-`, `bg-`, `rounded-` ou `shadow-` como utilitário, está errado.

---

## NUNCA FAÇA

**Cor**
- Nunca use um degrau 500 como texto sobre fundo claro. São pastéis. Piso de texto colorido é o 700. **Única exceção: `.tag`**, que usa os valores de tag do Figma por decisão de marca (`--pink-500`; `--green-600` e `--blue-600`) — a exceção não se estende a nenhum outro componente.
- Nunca use `--gray-600` como texto normal. Só texto grande, ícone ou borda.
- Nunca use `--gray-900` como texto. Os textos do sistema são `--color-text-heading` e `--color-text-body`.
- Nunca use a escala `red`. Ela não aparece em nenhuma página. `green` só existe em tag e no rótulo do nav.
- Nunca ponha título ou corpo sobre um degrau 500 ou mais claro da mesma família.
- Nunca use a paleta antiga do chrome (`--periwinkle`, `--violet`, `--ink` com valores próprios). Ela foi migrada.

**Componente**
- Nunca torne a tag interativa.
- Nunca crie uma terceira variação de botão.
- Nunca crie um componente que não está neste documento. Se falta um, pergunte.
- Nunca use `case-base.css` nem os arquivos `case-ludis.*` / `case-mosaico.*`. Sistema morto.

**Layout**
- Nunca escreva um valor de espaçamento direto no CSS. Use token.
- Nunca crie um terceiro par de padding de seção.
- Nunca repita a mesma banda em seções consecutivas.
- Nunca use `--s` em tipografia.
- Nunca crie um breakpoint novo.

**Acessibilidade**
- Nunca entregue elemento focável sem `:focus-visible` visível.
- Nunca remova `outline` sem repor um indicador.
- Nunca use cor como único diferenciador.
- Nunca deixe um par de contraste abaixo de 4.5:1 em texto normal, 3:1 em texto grande e em limite de componente.

**Fonte**
- Nunca carregue Kalam. Foi removida.
- Nunca use peso fora de 400, 500 e 700.
- Nunca escolha tamanho de fonte pelo aspecto. Escolha pelo papel, na tabela da seção 1.
- Nunca use Caveat fora do loader.

---

## CHECKLIST FINAL

Rode antes de dar qualquer página por pronta. Todos precisam ser sim.

1. Todo valor de cor, espaço, fonte, raio e sombra veio de `tokens.css`? Nenhum literal no CSS?
2. Layout usa `--s`, tipografia e componentes usam px/rem? Sem mistura invertida?
3. Todo par de texto/fundo confere: 4.5:1 normal, 3:1 grande e limite de componente? A única falha aceita é `.tag`, e nenhum componente novo pode repetir esse padrão.
4. Os dois breakpoints estão cobertos e nenhum terceiro foi criado?
5. Em ≤900px todos os grids colapsam e nenhum conteúdo some?
6. Todo elemento focável tem `:focus-visible` visível?
7. Todo alvo tocável tem ao menos `--touch-target`?
8. Nenhum componente novo foi inventado?
9. Nenhuma banda se repete em seções consecutivas?
10. No máximo um botão primário na página?
11. Toda tag é `<span>` não interativa, em grupo de 2 ou 3?
12. Toda imagem tem `alt`, `object-fit: cover` e `loading="lazy"` abaixo da dobra?
13. Nav e footer presentes, com o container e o gutter do chrome?
14. Nenhum utilitário Tailwind de cor, fonte, raio ou sombra?
15. Nenhum valor com `??` sobrou no arquivo?

---

## Referências

- `references/page-skeletons.md` — markup completo de cada tipo de página
- `references/components.md` — anatomia interna dos componentes compostos
- `references/migration.md` — divergências das páginas antigas e ordem de correção
- `styleguide.html` — render de tudo, para copiar markup pronto
