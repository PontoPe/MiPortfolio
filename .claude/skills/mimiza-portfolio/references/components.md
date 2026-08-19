# Componentes compostos

Anatomia interna e markup. **O CSS de todos eles já está em `components.css`** —
este documento explica a estrutura e a regra; não copie CSS daqui para a folha
da página.

Os valores vêm de `tokens.css`. A geometria interna destes compostos está no
bloco 8.1 (`--steps-*`, `--flow-card-media`, `--ba-*`, `--carousel-*`).

Histórico: até 2026-08-17 estes componentes existiam só em `case-ludis-lp.css`,
com prefixo `.lp-` e paleta em hex literal. Foram portados para `components.css`
com os nomes canônicos abaixo. A página do LUDIS **não** foi migrada — ver
`migration.md`.

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

## Passos numerados com trilho — `.steps`

Metodologia do case. Disco à esquerda, trilho tracejado ligando os discos.

```html
<div class="steps">
  <div class="step">
    <img src="…" alt="" aria-hidden="true" loading="lazy">
    <div>
      <h3><span>01 ·</span> Discover</h3>
      <ul><li>…</li></ul>
    </div>
  </div>
  <!-- repita .step -->
</div>
```

O trilho é um `::before` no `.step`, exceto no último; começa na base do disco e
é centrado por `calc(var(--steps-disc) / 2)`. O disco encolhe sozinho em ≤900px.

O numeral vive dentro do `<h3>`, num `<span>` de peso 500 e opacidade reduzida — é rótulo, não conteúdo à parte.

Use numeração **apenas quando a ordem carrega informação**. Se os itens são paralelos, não numere.

Sem imagem de disco, use `.ph-image` no lugar do `<img>` — o componente já
reserva a proporção quadrada.

---

## Card de banda — `.band-card`

Usado em validação (achados) e em prática (fluxo). Dentro de `.grid-2` ou
`.grid-3`, que colapsam para 1 coluna em ≤900px.

```html
<div class="band-card">
  <b>01</b>
  <h3>Título</h3>
  <p>Descrição.</p>
</div>
```

Fundo `--color-bg-card`, raio `--radius-band-card`. Só use dentro de banda lavanda ou branca — sobre a banda quadriculada o card some.

**Modificador `.band-card--flag`** — para o achado que contraria os outros da
mesma grade. Acrescenta um filete lateral em `--color-accent` e nada mais: mesmo
fundo, mesmo raio, mesmo tamanho de texto. O rótulo do estado vai no `<b>`, em
texto, porque cor não pode ser o único diferenciador. Regra de uso em SKILL §12.

---

## Card de fluxo — `.flow-card`

Variante de card com mídia: numeral à esquerda, imagem centralizada, legenda.
Sempre `<figure>` com `<figcaption>`.

```html
<figure class="flow-card">
  <b>01</b>
  <img src="…" alt="" aria-hidden="true" loading="lazy">
  <figcaption>A legenda explica a decisão, não o objeto.</figcaption>
</figure>
```

Largura da mídia: `--flow-card-media`. Fundo `--color-bg-subtle`, então use
sobre banda branca ou quadriculada — sobre a lavanda ele some.

---

## Grade de métricas — `.stat`

Fecha o case. Cada linha é numeral grande + rótulo de duas linhas.

```html
<div class="stat"><b>8</b><span>new teams created<br>in week one</span></div>
```

Alinhados por `align-items: center`. O numeral usa `--font-size-display` em peso 500.

**Modificador `.stat-group--row`** — a mesma métrica em fileira horizontal, para
a linha de números sob o lead do hero. Envolva os `.stat` num
`<div class="stat-group--row">`; ele reempilha o numeral sobre o rótulo e
distribui em linha.

Números soltos numa linha própria do rundown (`4/4 completion · 4.7/5`) são
isto, nunca parágrafo.

---

## Comparador antes/depois — `.ba-device`

```html
<div class="ba-device">
  <img class="ba-base" src="…" alt="Estado antes, na moldura do aparelho">
  <div class="ba-screen">
    <img class="ba-after" src="…" alt="O mesmo estado depois">
  </div>
  <button class="ba-handle" type="button" role="slider"
          aria-label="Comparar antes e depois"
          aria-valuenow="73" aria-valuemin="0" aria-valuemax="100">
    <img src="…" alt="" aria-hidden="true">
  </button>
</div>
<p class="ba-hint">← arraste para comparar</p>
```

A posição do divisor é a variável `--ba` no `.ba-device`; o script a atualiza e
acompanha com `aria-valuenow`.

**A geometria do recorte pertence ao PNG da moldura, não ao design system.**
`--ba-screen-top/left/width/height` em `tokens.css` §8.1 são os valores do export
do LUDIS. Outra moldura sobrescreve as quatro no próprio elemento.

Acessibilidade:

- `role="slider"` com `aria-valuenow`, `aria-valuemin`, `aria-valuemax` e `aria-label`. ✅
- `:focus-visible` — ✅ resolvido, a regra global de foco em `components.css` cobre `button`.
- Responder às setas do teclado. **Ainda pendente. Verificar no script antes de usar em página nova.**

Sem JS, `--ba` fica no valor inicial e a tela aparece parcialmente revelada.
Nunca deixe a tela vazia.

---

## Galeria de screenshots — `.grid-gallery`

Grid de 5 colunas, 2 em ≤900px. Gap `--gap-gallery`.

Imagens com proporção fixa de tela de celular, `object-fit: cover`, `--radius-image`, `loading="lazy"`.

Aceita `.ph` e `.ph-image` como filhos — os dois herdam a proporção da grade.

Só use em fechamento de case. Não é componente de página de conteúdo.

---

## Carrossel full-bleed — `.carousel-fullbleed`

Faixa de imagens que sangra até a borda — a única exceção à regra de imagem
respeitar o gutter. Fica **fora** do `.wrap`, como filho direto da `.band`.

O loop não precisa de script: autore **dois conjuntos idênticos**, o segundo com
`aria-hidden="true"`. Cada conjunto carrega o próprio gap à direita, e o trilho
anda exatamente 50% da própria largura — sem emenda.

```html
<div class="carousel-fullbleed">
  <div class="carousel-track">
    <div class="carousel-set">
      <img class="carousel-item" src="…" alt="Descrição real" loading="lazy">
      <!-- … -->
    </div>
    <div class="carousel-set" aria-hidden="true">
      <img class="carousel-item" src="…" alt="" loading="lazy">
      <!-- cópia idêntica, alt vazio -->
    </div>
  </div>
  <button class="carousel-toggle" type="button" aria-pressed="false" aria-label="Pausar carrossel">
    <span class="material-symbols-outlined" aria-hidden="true">pause</span>
  </button>
</div>
```

O botão de pausa é o **único JS do sistema**. Não é opcional: a WCAG 2.2.2 exige
um controle para movimento que dura mais de cinco segundos, e pausar no hover não
serve para teclado nem para toque.

```js
document.querySelectorAll('.carousel-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
        var paused = btn.closest('.carousel-fullbleed').classList.toggle('is-paused');
        btn.setAttribute('aria-pressed', String(paused));
        btn.setAttribute('aria-label', paused ? 'Retomar carrossel' : 'Pausar carrossel');
        btn.querySelector('.material-symbols-outlined').textContent = paused ? 'play_arrow' : 'pause';
    });
});
```

Em `prefers-reduced-motion` a animação para de vez e o botão some — está tratado
em `components.css`.

---

## Ticker

Exclusivo da home. Faixa full-bleed, três grupos idênticos, o segundo e o terceiro com `aria-hidden`. O trilho desliza metade da própria largura, então o loop não tem emenda e não usa JS.

Não replique em página nova.

---

## Chips — `.chip-group` / `.chip`

Pílula outline menor que a tag, usada em lista de ferramentas ou métodos dentro de um passo.

```html
<div class="chip-group">
  <span class="chip">Personas</span>
  <span class="chip">Journey map</span>
</div>
```

Diferença para a tag: chip é enumeração de conteúdo e pode aparecer em grupo de seis. Tag é metadado de página e vem em grupo de 2 ou 3.

A cor vive no **grupo**, não no chip: `.chip-group` define `color` e cada `.chip`
herda por `currentColor`. Variantes `--green` e `--blue`; o default é rosa.
Também não é interativo.

---

## Citação em destaque — `.pull-quote`

```html
<blockquote class="pull-quote">
  The problem isn't that beginners can't write. It's that nobody hands them a process.
  <cite>Fonte, se houver</cite>
</blockquote>
```

Filete lateral em `--rule-accent`, texto em `--font-size-h3` peso 500. Sem
itálico e sem aspas decorativas. `<cite>` é opcional e vem sem itálico.

Regra de uso — uma por bloco, e a frase precisa pertencer ao argumento: SKILL §12.

---

## Tabela de dados — `.data-table`

```html
<div class="data-table-scroll">
  <table class="data-table">
    <caption>Legenda opcional, acima da tabela.</caption>
    <thead>
      <tr><th scope="col">Goal</th><th scope="col">Signal</th><th scope="col">Metric</th></tr>
    </thead>
    <tbody>
      <tr><td>…</td><td>…</td><td>…</td></tr>
    </tbody>
  </table>
</div>
```

O invólucro `.data-table-scroll` **não é opcional**: é ele que segura a rolagem
horizontal dentro da própria caixa em tela estreita, para a página não ganhar
rolagem lateral. Cabeçalho em caption uppercase com borda forte; linhas
separadas por `--color-border`.

Nunca use para layout, e nunca converta em cards — a relação entre as colunas é
o conteúdo.

---

## Expansível — `.disclosure`

```html
<details class="disclosure">
  <summary>
    the ten tools and where each came from
    <span class="material-symbols-outlined" aria-hidden="true">expand_more</span>
  </summary>
  <p>…</p>
</details>
```

`<details>` nativo: sem JS, e teclado e leitor de tela funcionam de graça. O
marcador padrão é escondido e o chevron gira em `[open]`.

Vários `.disclosure` seguidos são apenas isso — **não** são um acordeão, e não
devem se fechar entre si.

Nunca esconda aqui conteúdo de que o argumento da página depende: SKILL §12.
