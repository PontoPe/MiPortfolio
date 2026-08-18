# CLAUDE.md

Portfólio da Milena Caldas. Site estático, sem build step, publicado na Vercel.

## Antes de qualquer coisa

Leia `.claude/skills/mimiza-portfolio/SKILL.md`. Ele é a autoridade sobre
composição, componentes e regras de uso. `tokens.css` é a autoridade sobre
valores. Nenhum dos dois se negocia com o pedido do usuário.

Se o pedido envolve construir uma página nova, o input é um rundown. Leia
`.claude/skills/mimiza-portfolio/references/rundown-contract.md` antes de abrir
o rundown.

## Layout do repositório

```
index.html                  home
about.html                  sobre
ux-ui.html                  categoria — product design
design-grafico.html         categoria — design gráfico
ilustracao.html             categoria — ilustração
case-[nome].html            um arquivo por case
case-[nome].css             uma folha por case, escopada por classe

tokens.css                  fonte única de valores
components.css              implementação canônica dos componentes
page-style.css              chrome: nav, footer, CTA, card de projeto
styleguide.html             render de referência — consome components.css

data/projects-data.js       catálogo de projetos
scripts/portfolio-render.js renderiza os grids de categoria
assets/                     imagens
```

## Ordem de carga do CSS

```html
<link rel="stylesheet" href="page-style.css">
<link rel="stylesheet" href="tokens.css">
<link rel="stylesheet" href="components.css">
<link rel="stylesheet" href="case-[nome].css">
```

`tokens.css` vem **depois** de `page-style.css`: o bloco 11 dele sobrescreve a
paleta antiga do chrome. Inverter a ordem desfaz a migração de cor.

`components.css` vem depois dos dois porque redefine o que `page-style.css`
impõe no corpo da página. A folha do case vem por último e só existe para o que
é exclusivo daquela página.

## Nomes de classe

O sistema tem duas camadas, e a regra de nome depende de qual delas você está
tocando.

**Componente do sistema** — usa o nome canônico, **sem prefixo**: `.band`,
`.wrap`, `.text-block`, `.tag`, `.chip`, `.btn`, `.steps`, `.band-card`,
`.stat`, `.figure`, `.grid-gallery`. Está em `components.css`, é compartilhado
por todas as páginas, e **não se redeclara na folha do case**. Se o componente
precisa mudar para todo mundo, mude em `components.css`. Se precisa mudar só
aqui, você quer a segunda camada.

**Exclusivo da página** — prefixado com o slug: `.case-mosaico-lp__arcs`,
`.case-mosaico-lp__guide-shot`. Layout que só existe nesta página, posição de
uma ilustração específica, uma grade que não se repete em lugar nenhum.

O `<body>` leva as duas: `<body class="case-page case-mosaico-lp">`.
`.case-page` neutraliza o fundo e o gutter que `page-style.css` impõe; a classe
do slug é o gancho de escopo da folha da página.

Regra prática: **se você escreveu na folha do case uma regra que a próxima
página também vai querer, ela está no arquivo errado.** Suba para
`components.css` e documente em `references/components.md`.

## Convenções

- Uma folha de estilo por case, só para o que é exclusivo daquela página.
- Não edite a folha de outro case para reaproveitar uma regra. Se a regra serve
  aos dois, ela é componente e sobe para `components.css`.
- Nenhum valor literal em CSS de página. Se falta um token, pare e pergunte.
- Não toque em `case-base.css`, `case-ludis.*` nem `case-mosaico.*` antigos:
  sistema morto, ver `references/migration.md`.
- Projeto novo no grid de categoria entra por `data/projects-data.js`. Não
  escreva card à mão.

## Ao terminar

Rode a checklist final do SKILL.md, item por item, e reporte o resultado.
Liste toda lacuna que sobrou em vez de preenchê-la com valor plausível.
