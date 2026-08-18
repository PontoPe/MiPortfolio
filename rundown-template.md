# [PROJETO] — rundown

Modelo de entrada para o Claude Code. Preencha e entregue junto com o pedido.
Regras de leitura: `references/rundown-contract.md`.

Convenções deste arquivo:
- `>` no início da linha = nota editorial, não renderiza
- `[...]` = lacuna. Não deixe nenhuma antes de mandar construir
- texto em bloco corrido = conteúdo final, copiado literalmente

---

## META

```yaml
slug:        case-[nome]
title:       [título da aba]
description: [uma frase, 150 caracteres]
nav:         case          # case | categoria
tipo:        case          # case | categoria | conteúdo
cta-block:   não           # case nunca leva
prioridade:  [01, 02, 05, 06, resto]   # ordem de construção, opcional
```

## TAGS DO HERO

Duas ou três. Cor declarada por tag. Ordem: disciplina → ano → status.

| Texto | Cor |
|---|---|
| [DISCIPLINA] | blue |
| [ANO] | pink |
| [STATUS] | green |

## ASSETS

Toda imagem citada nos blocos precisa estar aqui, com caminho real e `alt`.
Bloco sem asset listado é construído com placeholder e reportado no fim.

| id | caminho | alt | uso |
|---|---|---|---|
| hero-1 | assets/[...] | [...] | 01 |
| [...] | | | |

---

## BLOCOS

Repita o padrão abaixo para cada bloco. `componente:` sai do vocabulário fechado
do contrato — nunca invente um nome.

### 01 · [NOME DO BLOCO]

```yaml
componente: text-block
contém:     [tag-group, stat-group]   # opcional — o que vai dentro do invólucro
banda:      grid          # grid | lav | white | auto
padding:    tight         # tight | loose
nível:      h1
assets:     [hero-1]
```

[Conteúdo final, copiado literalmente.]

> Nota editorial: por que este bloco existe e o que ele não pode virar.

---

### 02 · [NOME DO BLOCO]

```yaml
componente: grid-gallery
banda:      lav
padding:    loose
assets:     [obj-1, obj-2, obj-3]
```

[Linha de apoio, se houver.]

---

## FORA DO ESCOPO

Liste aqui o que existe no projeto e **não** entra na página. Sem isso, o
material acaba voltando por conta própria.

- [...]

## PENDÊNCIAS

O que ainda falta você preencher antes de mandar construir.

- [...]
