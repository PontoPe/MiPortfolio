# Prompt para o Claude Code

Cole o texto abaixo. Troque `[NOME]` pelo slug do projeto (sem o `case-`) e
`[ARQUIVO]` pelo nome do rundown.

Exemplo: `[NOME]` = `mosaico-lp`, `[ARQUIVO]` = `rundown-mosaico.md`.

---

Construa a página de case `case-[NOME]` deste portfólio.

**Leia nesta ordem, antes de escrever qualquer linha:**

1. `CLAUDE.md`
2. `.claude/skills/mimiza-portfolio/SKILL.md`
3. `.claude/skills/mimiza-portfolio/references/rundown-contract.md`
4. `.claude/skills/mimiza-portfolio/references/components.md` — markup de cada componente
5. `[ARQUIVO]` — o rundown desta página
6. `components.css` — a implementação. É de lá que vem todo componente.
7. `styleguide.html` — o render, para conferir o resultado esperado

**Regras que não se negociam:**

- Todo valor de cor, fonte, espaço, raio e sombra vem de `tokens.css`. Nenhum
  literal em px, hex ou rem no CSS da página. Se falta um token, pare e pergunte.
- **Todo componente vem de `components.css`, pelo nome canônico e sem prefixo.**
  `.band`, `.wrap`, `.text-block`, `.tag`, `.btn`, `.steps`, `.band-card`,
  `.stat`, `.grid-gallery`. Não copie o CSS deles para a folha da página, não
  os redeclare, não os prefixe com o slug.
- A folha `case-[NOME].css` existe **só para o que é exclusivo desta página**, e
  essas classes sim levam o prefixo: `.case-[NOME]__hero-shot`. Se você escrever
  uma regra que a próxima página também vai querer, ela está no arquivo errado.
- Todo bloco usa um componente do vocabulário fechado do `rundown-contract.md`.
  Se o rundown pedir algo fora da lista, **não improvise**: deixe o bloco de fora
  e liste no fim.
- Texto do rundown é conteúdo final. Copie literalmente. Não reescreva, não
  resuma, não traduza, não "melhore".
- Linha iniciada por `>` no rundown é nota editorial. Não renderize.
- Não invente componente, não invente breakpoint, não invente valor.

**Imagens:**

- Use o caminho do inventário de assets quando existir.
- Quando não existir, ou quando o arquivo não estiver no repositório, use
  `<div class="ph-image" data-placeholder="true">` com a proporção declarada e o
  `alt` pretendido visível dentro. Nunca invente caminho, nunca use imagem de
  banco, nunca pule o bloco.

**Arquivos a criar:**

- `case-[NOME].html`
- `case-[NOME].css` — só o exclusivo da página, tudo prefixado com `case-[NOME]__`

`<body class="case-page case-[NOME]">`.

Ordem de carga no `<head>`, sem inverter:

```html
<link rel="stylesheet" href="page-style.css">
<link rel="stylesheet" href="tokens.css">
<link rel="stylesheet" href="components.css">
<link rel="stylesheet" href="case-[NOME].css">
```

**Ao terminar, responda com quatro listas:**

1. Checklist final do `SKILL.md`, item por item, com sim ou não.
2. Tabela de placeholders: bloco, proporção esperada, `alt` pretendido.
3. Blocos que ficaram de fora e o motivo — componente inexistente, asset
   ausente ou lacuna `[...]` no rundown.
4. Regras que você escreveu em `case-[NOME].css` e que talvez devessem estar em
   `components.css` — qualquer coisa que a próxima página vá querer.

Não preencha lacuna com valor plausível. Um item numa dessas listas vale mais
que uma página que parece pronta.
