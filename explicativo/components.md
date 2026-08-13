# Componentes compostos

Anatomia interna. Todos os valores vêm de `tokens.css`; onde aparece um número
abaixo, ele é a proporção do artboard e deve ser escrita como `calc(N * var(--s))`.

---

## Card de projeto

Renderizado por `scripts/portfolio-render.js`. Aparece em: home (carrossel) e nas três páginas de categoria.

```
article.project-card
 └ a
    └ div.project-frame            quadrado, raio 2rem, overflow hidden
       └ img.project-visual        object-fit cover
 └ div
    ├ p                            meta, --font-size-caption, --color-accent-hover
    └ div.project-card-row
       ├ h2/h3                     título
       └ a.project-arrow           círculo 3rem, ícone arrow_forward
```

Hover: o frame sobe 4px e ganha sombra; a imagem escala 1.04; a seta rotaciona −45°.
Todas as transições em `--duration-slow` / `--easing-emphasis`.

A seta é um `<a>` real e precisa de `:focus-visible`. Hoje não tem — corrigir.

---

## Passos numerados com trilho

Metodologia do case. Três passos, disco à esquerda, trilho tracejado ligando os discos.

```
div.steps
 └ div.step  (× N)
    ├ img                       disco, 119 no desktop / 90 em ≤900px
    └ div
       ├ h3   → <span>01 ·</span> Rótulo
       └ ul | p (+ chips)
```

O trilho é um `::before` no `.step`, exceto no último. Começa na base do disco.

O numeral vive dentro do `<h3>`, num `<span>` de peso 500 e opacidade reduzida — é rótulo, não conteúdo à parte.

Use numeração **apenas quando a ordem carrega informação**. Se os itens são paralelos, não numere.

---

## Card numerado

Usado em validação (achados) e em prática (fluxo). Grid de 3, colapsa para 1 em ≤900px.

```
div.card
 ├ b        numeral, --color-text-heading
 ├ h3       título
 └ p        descrição
```

Fundo `--color-bg-card`, raio `--radius-band-card`. Só use dentro de banda lavanda ou branca — sobre a banda quadriculada o card some.

Variante de fluxo: numeral, imagem centralizada, `<figcaption>` — usa `<figure>`.

---

## Grade de métricas

Fecha o case. Cada linha é numeral grande + rótulo de duas linhas.

```
div.stat  (× 3)
 ├ b       --font-size-display, peso 500
 └ span    rótulo, duas linhas via <br>
```

Alinhados por `align-items: center`. O numeral tem `line-height` fixado à altura do rótulo para as linhas passarem em passo regular.

---

## Comparador antes/depois

Um único uso, mas documentado a pedido.

```
div.ba-device            posição relativa
 ├ img.ba-base           moldura do aparelho
 ├ div.ba-screen         recorte da tela, overflow hidden
 │   └ img.ba-after      clip-path inset com a variável de posição
 └ button.ba-handle      role="slider", tabindex 0
p.ba-hint                SVG + rótulo
```

Requisitos de acessibilidade — o site hoje falha em dois:

- `role="slider"` precisa de `aria-valuenow`, `aria-valuemin`, `aria-valuemax` e `aria-label`. Já tem.
- Precisa responder às setas do teclado. **Verificar no script.**
- Precisa de `:focus-visible` visível. **Não tem. Corrigir.**

Sem JS, mostre o estado "depois" completo. Nunca deixe a tela vazia.

---

## Galeria de screenshots

Grid de 5 colunas, 2 em ≤900px. Gap `--gap-gallery`.

Imagens com proporção fixa de tela de celular, `object-fit: cover`, `--radius-image`, `loading="lazy"`.

Só use em fechamento de case. Não é componente de página de conteúdo.

---

## Carrossel full-bleed

Uma imagem larga que ultrapassa o container e rola horizontalmente em telas estreitas. Barra de rolagem oculta.

Sangra até a borda — a única exceção à regra de imagem respeitar o gutter.

---

## Ticker

Exclusivo da home. Faixa full-bleed, três grupos idênticos, o segundo e o terceiro com `aria-hidden`. O trilho desliza metade da própria largura, então o loop não tem emenda e não usa JS.

Não replique em página nova.

---

## Chips

Pílula outline menor que a tag, usada em lista de ferramentas ou métodos dentro de um passo.

Diferença para a tag: chip é enumeração de conteúdo e pode aparecer em grupo de seis. Tag é metadado de página e vem em grupo de 2 ou 3.

Chip usa a mesma cor de tag do bloco em que está. Também não é interativo.
