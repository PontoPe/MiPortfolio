# Esqueletos de página

Todos extraídos do repositório. Ordem de blocos é regra; valores vêm de `tokens.css`.

---

## Chrome — obrigatório em toda página

### Nav

Duas variantes reais. Para **página nova, use a variante de case** (decisão fechada).

**Variante case** — com pílula de disponibilidade, links por âncora:

```html
<nav class="site-nav">
  <div class="site-nav-inner">
    <div class="site-nav-brand">
      <a class="nav-logo" href="index.html"><img alt="Milena Caldas" src="assets/ui/logoAMC.png"></a>
      <span class="status-tag status-tag-green">Available</span>
    </div>
    <div class="hidden md:flex items-center">
      <div class="site-nav-links">
        <a class="nav-link" href="index.html#work">work</a>
        <a class="nav-link" href="index.html#about">about</a>
        <a class="nav-link" href="about.html">resume</a>
        <a class="nav-link" href="index.html#contact">contact</a>
      </div>
    </div>
    <button class="md:hidden p-2" aria-label="Menu">
      <span class="material-symbols-outlined" aria-hidden="true">menu</span>
    </button>
  </div>
</nav>
```

**Variante categoria** — sem pílula, links por página, item corrente com `.is-active`. Use só nas quatro páginas que já a têm.

A nav é fixa. Toda página reserva `--nav-clearance` no topo do `main`.

### Footer

Idêntico nas cinco páginas. Copie sem alterar.

```html
<footer class="site-footer">
  <div class="site-footer-links">
    <a href="#">Instagram</a>
    <a href="#">LinkedIn</a>
    <a href="#">Behance</a>
    <a href="…" target="_blank" rel="noopener noreferrer">View CV</a>
  </div>
  <p>© 2026 Milena Caldas. All rights reserved.<br>
     Designed by Milena Caldas. Developed by Pedro Gradowski.</p>
</footer>
```

Os três primeiros `href` ainda são `#`. Preencher quando os perfis existirem.

---

## Tipo 1 — Case study

Padrão canônico. Fonte: `case-ludis-lp.html`.

```
nav
main
  1  hero            banda A   → logo/título · tag-group (3) · lead · link âncora
  2  responsabilidades banda B → h2 · grid 2 col · botão
  3  metodologia     banda C   → h2 · intro · passos numerados com trilho tracejado
  4  problema        banda A   → grid 2 col (texto | ilustração) · cards de usuário
  5  solução         banda B   → grid 2 col (texto | before/after)
  6  carrossel       banda A   → imagem full-bleed
  7  validação       banda B   → h2 · texto · 3 cards numerados · botão
  8  prática         banda C   → h2 · texto · 3 cards de fluxo
  9  resultado       banda A   → h2 · grid 2 col (métricas | reflexão) · botão
 10  galeria         banda C   → grid 5 col de screenshots
footer
```

Bandas A/B/C são as três disponíveis. A sequência acima nunca repete a mesma em seguida — mantenha essa propriedade, a ordem de abertura é livre.

**Obrigatório:** hero, ao menos uma seção de conteúdo, footer.
**Opcional:** metodologia, before/after, carrossel, galeria, cards de métrica.
**Ausente por regra:** bloco CTA global.

Ordem das tags do hero: disciplina → ano → status.

---

## Tipo 2 — Página de categoria

Fonte: `ux-ui.html`, `design-grafico.html`, `ilustracao.html` — as três são idênticas em estrutura. Regra confirmada.

```html
<main>
  <section class="section-panel">
    <div class="text-block">
      <p class="section-eyebrow">nome da categoria</p>
      <h1>Frase de posicionamento.</h1>
      <p>Uma linha de apoio.</p>
    </div>
    <div class="project-grid" data-category-projects="slug"></div>
  </section>

  <div class="cta-block" id="contact">…</div>
</main>
```

O grid é populado em runtime por `scripts/portfolio-render.js` a partir de `data/projects-data.js`. Não escreva cards à mão: acrescente o projeto ao arquivo de dados.

Grid: 1 coluna, 2 em `sm`, 3 em `lg`.

---

## Tipo 3 — Home

Fonte: `index.html`.

```
loader → nav → main
  hero (WebGL + lettering)
  ticker  ← full-bleed, três grupos duplicados, loop em CSS
  about   → retrato · tag-group (2) · texto · par de botões
  work    → section-panel com uma subseção por categoria, cada uma com carrossel
  cta-block
footer
```

Único lugar do site com loader, ticker e hero 3D. Não replique em página nova.

---

## Tipo 4 — Sobre

Fonte: `about.html`.

```
nav → main
  about-hero  → retrato quadrado · h1 · lead · par de botões
  dois parágrafos
  Work Experience  → entradas [período · cargo · empresa · bullets]
  Education        → entradas [período · curso · instituição]
  Languages        → pares [idioma · nível]
  contato
  cta-block
footer
```

Única página com dois botões primários. É exceção conhecida, não padrão a seguir.

---

## Bloco CTA de fechamento

Presente em home, categoria e sobre. Ausente em case.

```html
<div class="cta-block" id="contact">
  <p class="cta-lead">Wanna work together?</p>
  <h2>Let's build something <br>extraordinary!</h2>
  <a class="btn btn--primary" href="mailto:…">Send a message</a>
</div>
```

Centralizado — única exceção à regra de título alinhado à esquerda. Exatamente um botão.
