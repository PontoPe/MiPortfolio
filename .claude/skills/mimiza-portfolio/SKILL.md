---
name: mimiza-portfolio
description: Sistema de design do portfólio da Milena Caldas (mimiza-portfolio). Use SEMPRE que o pedido envolver qualquer página, seção, bloco, componente, estilo, cor, espaçamento, tipografia, layout, grid, imagem, botão, tag, nav, footer, hero, CTA, card de projeto, case study ou landing page deste portfólio — inclusive pedidos curtos como "cria uma página nova", "adiciona uma seção", "ajusta esse espaçamento", "muda a cor disso", "deixa responsivo" ou "faz um case novo". Use também ao revisar, corrigir ou refatorar HTML/CSS existente do repositório. Não espere a expressão "design system" para acionar.
---

# Portfólio Milena Caldas — sistema de aplicação

Três autoridades, cada uma com um escopo:

- `tokens.css` — **valores**. Se um valor não existe lá, ele não existe. Não crie um.
- `components.css` — **implementação**. O CSS canônico de todo componente. Não
  redeclare um componente do sistema na folha da página; se ele precisa mudar,
  mude aqui e mude para todo mundo.
- este documento — **regra de uso**. Não traz número nem CSS.

`styleguide.html` não é autoridade: ele consome `components.css` e serve para
você ver o render e copiar o markup.

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

Página nova só se constrói a partir de um **rundown**. Sem rundown, pergunte por um em vez de inferir a estrutura do pedido. As regras de leitura, o vocabulário fechado de componentes e os campos obrigatórios estão em `references/rundown-contract.md`.

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
- Rótulo do primário: `--color-text-on-accent` (branco). Rótulo do secundário: `--color-text-body`. **Nunca troque um pelo outro.** O branco é uma exceção de contraste declarada, registrada em `tokens.css`, e vale só para `.btn--primary`.
- Estados obrigatórios: `:hover`, `:active`, `:focus-visible`, `:disabled`. Nenhum é opcional.
- `:active` remove a sombra em vez de escurecer o fundo.

Ícone dentro de botão: sempre depois do texto, exceto seta de retorno, que vem antes.

---

## 6. Tags

Três cores: `--color-tag-pink`, `--color-tag-green`, `--color-tag-blue`. Sempre outline, fundo transparente, texto e borda no mesmo token.

**Estes três tokens são uma exceção de contraste declarada.** Ficam nos degraus pastel do Figma e reprovam em WCAG AA. Foi decisão de marca, está registrada em `tokens.css`, e não deve ser "corrigida" sem pedido. Nenhum outro componente pode herdar estes degraus.

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
- Legenda (`<figcaption>`) fica abaixo, em `--font-size-body-sm`, cor
  `--color-text-body`. Era `--color-text-heading` até 2026-08-17: dava 3.90
  sobre a banda lavanda e reprovava em texto normal.

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

## 12. Conteúdo denso — citação, tabela e expansível

Três componentes para material que não cabe em parágrafo. Todos aprovados pela
Milena em 2026-08-17; nenhum existia no sistema antes disso.

**Citação em destaque** (`.pull-quote`) — uma frase que carrega o argumento do
bloco, tirada do corpo para respirar.

- No máximo **uma por bloco**. Duas viram decoração.
- Sem itálico e sem aspas decorativas. O filete e o tamanho já marcam.
- A frase precisa estar em algum lugar do argumento — a citação destaca, não
  introduz informação nova.

**Tabela de dados** (`.data-table`) — só para dado que **é** tabular, com
cabeçalho de coluna real.

- Nunca para layout. Nunca para forçar duas colunas de texto.
- Não converta em cards: a relação entre as colunas é o conteúdo, e o card a
  esconde.
- Sempre dentro de `.data-table-scroll`. Em tela estreita a tabela **rola dentro
  da própria caixa** — não colapsa, não some, e a página não ganha rolagem
  horizontal.
- `<th scope="col">` obrigatório.

**Expansível** (`.disclosure`) — `<details>`/`<summary>` nativo, sem JS.

- Para material de apoio que provaria rigor mas custaria o leitor: tabela de
  fontes, exemplo trabalhado, anexo metodológico.
- **Nunca esconda aqui conteúdo de que o argumento da página depende.** Se o
  leitor precisa daquilo para entender o bloco, aquilo é corpo.
- O rótulo do `<summary>` diz o que tem dentro, não "leia mais".

**Card de contraste** (`.band-card--flag`) — modificador, não componente novo.
Para o achado que contraria os outros de uma mesma grade.

- **Mesmo peso visual dos irmãos**: mesmo fundo, mesmo raio, mesmo padding,
  mesmo tamanho de texto. Só o filete lateral muda.
- Um card de contraste que parece mais importante lê como confissão; um que
  parece menos, lê como rodapé. Os dois erros custam o mesmo.
- O rótulo do estado (*"below target"*) vai **no texto**, não só no filete —
  cor nunca é o único diferenciador.
- No meio da grade, nunca no fim da página.

---

## 13. Modo escuro

O site tem dois temas. Todo token semântico do `tokens.css` é um par
`light-dark(claro, escuro)` — uma declaração por token, não dois blocos
espelhados. Sem atributo, o site segue o sistema operacional;
`data-theme="light"` ou `"dark"` no `<html>` força um dos dois e vence o SO.

**A paleta primitiva não muda.** Nenhum degrau novo entrou para o escuro. Onde
faltava um passo de superfície, ele foi derivado por `color-mix` de dois
degraus existentes — nunca escolhido a olho.

Três coisas invertem, e não são simetria automática:

| No claro | No escuro |
|---|---|
| A superfície **desce** de branco para lavanda conforme aproxima do conteúdo | A superfície **sobe**: quanto mais elevado, mais claro |
| O hover **escurece** o fundo | O hover **clareia** — escurecer sumiria com o botão |
| `text-strong` é o mais **escuro** dos três | `text-strong` é o mais **claro** |
| A sombra é roxa translúcida | A sombra é preta e quase dobra de alfa |

Regras fechadas:

- Nunca escreva cor literal para o escuro. Se um token não tem par
  `light-dark()`, ele não muda de tema — e se precisava mudar, o lugar é
  `tokens.css`.
- **Nunca use `@media (prefers-color-scheme)` numa folha de página.** O tema é
  resolvido inteiro na camada de token. Página que testa a preferência do
  sistema ignora a escolha manual do usuário.
- Nunca remova `color-scheme` do `:root`. É ele que liga o `light-dark()` e o
  que faz o navegador pintar barra de rolagem e campo de formulário no tema
  certo.
- Imagem com fundo branco chapado precisa de versão escura ou de fundo próprio.
  `filter: invert()` em fotografia continua proibido.
- O script que aplica o tema salvo é **inline no `<head>`**. Externo, a página
  pinta no claro e pisca para o escuro.

**As duas exceções de contraste do sistema existem só no tema claro.** No
escuro, o rótulo do `.btn--primary` (9.59) e os três degraus de `.tag`
(pink 10.12 · green 6.75 · blue 7.36) passam com folga, sem trocar nenhum
degrau — foi o fundo que mudou. Isso **não** autoriza usar os degraus 500 como
texto no claro: a exceção continua valendo só para `.tag`.

`.theme-switch` é o componente do seletor. Três estados, não dois: "sistema" é
o padrão e precisa ser alcançável de volta. São `<input type="radio">` reais
dentro de um `<fieldset>` — as setas do teclado navegam de graça. O input fica
visualmente oculto mas **continua focável**; `display: none` o tiraria da ordem
de foco.

---

## 14. Tailwind

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
- Nunca use um degrau 500 como texto sobre fundo claro. São pastéis. Piso de texto colorido é o 700. **Única exceção: `.tag`**, que usa os degraus pastel do Figma por decisão de marca — a exceção não se estende a nenhum outro componente.
- Nunca use `--gray-600` como texto normal. Só texto grande, ícone ou borda.
- Nunca use `--gray-900` como texto. Os textos do sistema são `--color-text-heading` e `--color-text-body`.
- Nunca use a escala `red`. Ela não aparece em nenhuma página. `green` só existe em tag e no rótulo do nav.
- Nunca ponha título ou corpo sobre um degrau 500 ou mais claro da mesma família.
- Nunca use a paleta antiga do chrome (`--periwinkle`, `--violet`, `--ink` com valores próprios). Ela foi migrada.

**Componente**
- Nunca torne a tag interativa.
- Nunca crie uma terceira variação de botão.
- Nunca crie um componente que não está neste documento. Se falta um, pergunte.
- Nunca redeclare um componente do sistema na folha da página. Se `.band-card`
  precisa mudar, mude em `components.css`.
- Nunca prefixe um componente do sistema com o slug da página. `.case-x__band`
  é o sintoma de que o sistema foi copiado em vez de usado.
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
3. Todo par de texto/fundo confere **nos dois temas**: 4.5:1 normal, 3:1 grande e limite de componente? As únicas falhas aceitas são `.tag` e o rótulo de `.btn--primary`, ambas registradas em `tokens.css` e ambas **só no tema claro**. Nenhum componente novo pode repetir esses padrões.
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
16. A folha do case não redeclara nenhum componente de `components.css`?
17. As quatro folhas carregam na ordem certa: `page-style` → `tokens` → `components` → case?
18. O `<body>` tem `.case-page` mais a classe do slug?
19. Toda tabela está dentro de `.data-table-scroll`, e a página não ganhou rolagem horizontal?
20. Nenhum conteúdo de que o argumento depende ficou dentro de um `.disclosure`?
21. A página foi vista **nos dois temas**, e nenhuma cor literal escapou do `light-dark()`?
22. Nenhuma folha de página testa `prefers-color-scheme` por conta própria?

---

## Referências

- `references/rundown-contract.md` — como ler um rundown e o vocabulário fechado de componentes. **Leia antes de construir qualquer página nova.**
- `references/page-skeletons.md` — markup completo de cada tipo de página
- `references/components.md` — anatomia interna dos componentes compostos
- `references/migration.md` — divergências das páginas antigas e ordem de correção
- `components.css` — a implementação. Fonte da verdade do CSS.
- `styleguide.html` — render de tudo, para copiar markup pronto
