# Contrato de rundown

Um rundown é o único input aceito para construir uma página nova. Este documento
define como lê-lo. O modelo em branco está em `rundown-template.md`.

---

## Vocabulário fechado de componentes

Todo bloco do rundown declara um `componente:`. O valor tem que sair desta lista.
Se um bloco pedir algo fora dela, **pare e pergunte**. Não improvise com `div`.

| Nome | O que é | Onde está documentado |
|---|---|---|
| `text-block` | título + parágrafos + botão opcional | SKILL §2 |
| `tag-group` | 2 ou 3 tags | SKILL §6 |
| `chip-group` | pílulas de enumeração dentro de um passo | components.md |
| `btn` | primário ou secundário | SKILL §5 |
| `link-jump` | link com ícone, âncora interna | styleguide |
| `grid-split` | duas colunas, `--gap-column` | styleguide |
| `grid-2` / `grid-3` | grade de cards | styleguide |
| `band-card` | card com numeral, título e texto | components.md |
| `band-card--flag` | o mesmo card, marcado como achado que contraria os outros | SKILL §12 |
| `steps` | passos numerados com trilho tracejado | components.md |
| `flow-card` | numeral + imagem + legenda | components.md |
| `stat-group` | numeral grande + rótulo | components.md |
| `figure` | imagem + legenda | SKILL §7 |
| `grid-gallery` | grade densa de screenshots | components.md |
| `carousel-fullbleed` | imagem larga que sangra | components.md |
| `ba-device` | comparador antes/depois | components.md |
| `pull-quote` | citação em destaque, uma por bloco | SKILL §12 |
| `data-table` | tabela de dados com cabeçalho de coluna | SKILL §12 |
| `disclosure` | expansível `<details>`, material de apoio | SKILL §12 |
| `cta-block` | fechamento com um botão | page-skeletons.md |

Componentes que **não existem** no sistema: acordeão (vários `disclosure` que se
fecham entre si), aba, carrossel de cards, modal, formulário, nota de rodapé
numerada. Um rundown que peça qualquer um deles está pedindo trabalho de
sistema, não de página. Pergunte antes.

**Nota de rodapé** não tem componente e não precisa de um: citação bibliográfica
e observação de fonte são um `<p class="note">` no fim do bloco. Só peça
componente se o rundown exigir marcador numerado com âncora de ida e volta.

**Fileira de números no hero** também não é componente novo: é `stat-group` com
o modificador `.stat-group--row`.

---

## Campos obrigatórios do rundown

Sem qualquer um destes, **não comece**. Pergunte.

| Campo | Por quê |
|---|---|
| `slug` | nome do arquivo e da folha de estilo |
| `title` / `description` | `<head>` |
| `nav` | qual variante — case ou categoria |
| `tags` | 2 ou 3, cada uma com cor declarada |
| Inventário de assets | caminho real e `alt` de cada imagem. Faltando, vira placeholder |
| `componente:` em cada bloco | escolha do vocabulário |

---

## Imagem que ainda não existe

Se um bloco pede imagem e o asset não está no inventário, ou o caminho não existe
no repositório, **use placeholder**. Nunca pule o bloco, nunca invente um caminho,
nunca use imagem de banco.

O placeholder é uma `<div class="ph-image" data-placeholder="true">` com a
proporção declarada, fundo `--color-bg-surface`, borda tracejada em
`--color-border` e o `alt` pretendido visível como texto dentro dela.

No fim da entrega, liste todos os placeholders em tabela — bloco, proporção,
`alt` pretendido — para a imagem real entrar depois sem caçar no HTML.

## Campos opcionais e o que fazer sem eles

| Campo | Default se ausente |
|---|---|
| `banda:` | atribua alternando, respeitando "nunca duas iguais seguidas" |
| `padding:` | `tight`. Use `loose` só em galeria, carrossel e fechamento |
| `nível:` do título | `h2` para bloco de seção, `h1` só no hero |
| `contém:` | nada — o bloco é o componente declarado, e só |
| `cta-block` | **não** inclua em case. Só em home, categoria e sobre |

### `contém:` — blocos compostos

Bloco real quase nunca é um componente só: um hero é `grid-split` com
`tag-group`, `text-block`, `stat-group` e `link-jump` dentro. `componente:`
declara o **invólucro**; `contém:` lista o que vai dentro.

```yaml
componente: grid-split
contém:     [tag-group, text-block, stat-group, link-jump]
```

Todo nome em `contém:` sai da mesma lista fechada acima. Um nome fora dela é o
mesmo erro que em `componente:` — **pare e pergunte**.

Um bloco longo demais para um invólucro só se divide em sub-blocos numerados
(`05a`, `05b`, `05c`), cada um com o próprio `componente:`. Sub-blocos do mesmo
número compartilham a banda.

---

## Como ler o corpo de um bloco

- Texto entre aspas ou em bloco corrido é **conteúdo final**. Copie literalmente,
  não reescreva, não "melhore", não traduza.
- Linha iniciada por `>` é nota editorial. **Não renderize.** Existe para explicar
  a intenção e evitar que você tome a decisão errada.
- Texto entre colchetes é lacuna. Se sobrar um `[...]` no fim, a página não está
  pronta — liste as lacunas em vez de preenchê-las.
- Números soltos numa linha própria (`4/4 completion · 4.7/5`) são `stat-group`,
  não parágrafo.

---

## Ordem de construção

1. Estrutura completa com todos os blocos vazios, na ordem do rundown.
2. Atribuição de bandas e verificação de que nenhuma se repete em seguida.
3. Conteúdo, bloco a bloco, na ordem que o rundown declarar em `prioridade:`.
   Sem `prioridade:`, siga a ordem da página.
4. Imagens, com `alt` do inventário.
5. Checklist final do SKILL.md, item por item.

Nunca entregue uma página parcial sem dizer quais blocos ficaram vazios e por quê.

---

## O que o rundown não decide

Estas coisas vêm do sistema e o rundown não pode sobrescrever. Se ele tentar,
siga o sistema e registre o conflito na resposta:

- valor de cor, fonte, espaço, raio ou sombra
- número de breakpoints
- se a tag é interativa
- quantidade de botões primários por página
- alinhamento do título
