# MOSAICO — rundown

Transposto de `portfolio.md` (documento editorial) para o formato do
`rundown-template.md`. Regras de leitura: `references/rundown-contract.md`.

Convenções deste arquivo:
- `>` no início da linha = nota editorial, **não renderiza**
- `[...]` = lacuna. Não deixe nenhuma antes de mandar construir
- texto em bloco corrido = conteúdo final, copiado literalmente
- `contém:` lista os componentes internos de um bloco composto

---

## META

```yaml
slug:        case-mosaico-lp
title:       MOSAICO — A writing method that beginners actually finish | Milena Caldas
description: Mosaico turns design methodology into a writing process. 4/4 first-time writers finished a story, and a teacher took it into her classroom.
nav:         case
tipo:        case
cta-block:   não
prioridade:  [01, 02, 05, 06, 03, 04, 07, 08, 09, 10]
```

> `slug` é `case-mosaico-lp` e **não** `case-mosaico`: os arquivos
> `case-mosaico.html` e `case-mosaico.css` já existem e são o sistema morto
> descrito em `migration.md`. Mesma convenção que separou `case-ludis-lp` de
> `case-ludis`. Não toque nos antigos.

> `title` e `description` são proposta minha, seguindo o padrão do LUDIS.
> Troque à vontade — são as duas únicas linhas deste arquivo que não vieram do
> documento original.

## TAGS DO HERO

| Texto | Cor |
|---|---|
| LEARNING EXPERIENCE DESIGN | blue |
| UX RESEARCH | pink |
| 2023 → ONGOING | green |

> O documento original chama estes de "chips". No sistema são `tag` — metadado
> de página, grupo de 3, acima do título. `chip` é outro componente, de
> enumeração dentro de um passo.

## ASSETS

**Nenhum asset do MOSAICO existe no repositório hoje.** `imagesProjects/mosaico-case/`
contém só um `README.md`. Toda linha marcada `falta` vira `.ph-image` e entra na
tabela de placeholders do fim da entrega.

Os caminhos abaixo seguem a convenção do `README.md` que já está na pasta, para
que o arquivo real entre depois sem trocar o HTML.

| id | caminho | alt | proporção | uso | status |
|---|---|---|---|---|---|
| guide-hero | imagesProjects/mosaico-case/guide-hero.jpg | The printed Mosaico guide, open on a spread, photographed at scale | 4:3 | 01 | falta |
| obj-diagram | imagesProjects/mosaico-case/diagram-final.png | The final Mosaico diagram, in colour, after the study's adjustments | 4:3 | 02 | falta |
| obj-spread | imagesProjects/mosaico-case/guide-spread.jpg | A spread of the printed guide, showing an auxiliary tool beside its source | 4:3 | 02 | falta |
| obj-tools | imagesProjects/mosaico-case/tools-filled.jpg | Adapted design tools, filled in by a participant | 4:3 | 02 | falta |
| obj-arcs | imagesProjects/mosaico-case/arcs-shapes.png | The six emotional arcs drawn as graphic shapes | 16:9 | 02 | falta |
| obj-fanzine | imagesProjects/mosaico-case/fanzine-cover.jpg | The printed fanzine cover | 4:5 | 02 | falta |
| obj-notebook | imagesProjects/mosaico-case/notebook-page.jpg | A page from the structured field notebook | 4:5 | 02 | falta |
| obj-palette | imagesProjects/mosaico-case/palette-type.png | The guide's colour palette and typography | 4:3 | 02 | falta |
| method-diagram | imagesProjects/mosaico-case/method-diagram.png | The three phases and their sixteen steps, with the auxiliary tools attached to each | 16:10 | 04 | falta |
| arcs-oedipus | imagesProjects/mosaico-case/arcs-oedipus.png | The six emotional arcs as shapes, with the Oedipus arc marked as the one used in the study | 16:9 | 05a | falta |
| ba-base | imagesProjects/mosaico-case/steps-before.png | The step sequence before external validation was removed | 4:3 | 05c | falta |
| ba-after | imagesProjects/mosaico-case/steps-after.png | The step sequence after external validation was replaced by internal checkpoints | 4:3 | 05c | falta |
| notebook-open | imagesProjects/mosaico-case/notebook-open.jpg | The structured field notebook, open, showing the prompts tied to each step | 4:3 | 06c | falta |
| fanzine-cover | imagesProjects/mosaico-case/fanzine-cover.jpg | The printed fanzine cover | 4:5 | 08 | falta |
| fanzine-spread | imagesProjects/mosaico-case/fanzine-spread.jpg | An interior spread of the fanzine | 4:5 | 08 | falta |
| diary-01 | imagesProjects/mosaico-case/diary-01.jpg | A participant's notebook page, anonymized, used with permission | 4:5 | 08 | falta |
| diary-02 | imagesProjects/mosaico-case/diary-02.jpg | A second notebook page, anonymized, used with permission | 4:5 | 08 | falta |
| gal-01 … gal-12 | imagesProjects/mosaico-case/gallery-[nn].jpg | [...] uma por imagem, sempre na decisão | variada | 10 | falta |

> `ba-base` e `ba-after` **não** são molduras de aparelho: o comparador do bloco
> 05c compara dois diagramas, não duas telas. As quatro variáveis
> `--ba-screen-*` precisam ser sobrescritas no elemento para a proporção do
> diagrama. Ver `components.md`, seção do comparador.

> O `README.md` da pasta descreve o que cada imagem tem que mostrar e registra a
> restrição de consentimento das páginas de caderno e da fanzine. Leia antes de
> produzir os arquivos.

---

# BLOCOS

---

### 01 · HERO

```yaml
componente: grid-split
contém:     [tag-group, text-block, stat-group, link-jump, figure]
banda:      grid
padding:    tight
nível:      h1
assets:     [guide-hero]
```

Coluna de texto à esquerda; fotografia do guia impresso aberto à direita, em
escala, com sombra, tratada como produto e não como documento acadêmico.

**h1:**

Mosaico

**h2:**

A writing method that beginners actually finish

**lead:**

Four people who had never written a story finished one. A teacher in the study asked to take the method into her classroom — I hadn't designed for that, and it turned out to be the most important thing that happened.

**stat-group, modificador `--row`:**

| numeral | rótulo |
|---|---|
| 4/4 | completion,<br>first-time writers |
| 4.7/5 | satisfaction<br>(QUIS) |
| 1 | unsolicited<br>classroom adoption |

**link-jump:** `how it works` — âncora para o bloco 04, ícone `arrow_downward`.

> **Conflito com o sistema, resolvido a favor do sistema:** o documento original
> marca "A writing method that beginners actually finish" como `h3`. Pular de
> `h1` para `h3` é proibido (SKILL §1). Vira `h2`.

> Por quê o hero abre no resultado: pergunta pede paciência, resultado prende. E
> completion é a métrica de edtech — taxa de conclusão é o número que todo mundo
> persegue e quase ninguém entrega. A pergunta de pesquisa desce para o bloco 03.

---

### 02 · O OBJETO

```yaml
componente: grid-gallery
contém:     [stat-group]
banda:      lav
padding:    loose
assets:     [obj-diagram, obj-spread, obj-tools, obj-arcs, obj-fanzine, obj-notebook, obj-palette]
```

Grid full-bleed, sem texto dentro.

**stat-group, modificador `--row`, uma linha abaixo do grid:**

| numeral | rótulo |
|---|---|
| 3 | phases |
| 16 | steps |
| 10 | auxiliary tools |
| 6 | stories written |
| 1 | printed fanzine |

> Este bloco não existe na página no ar e é a maior perda dela. O artefato
> físico — guia impresso, sistema visual, fanzine — está espalhado como
> ilustração de apoio entre parágrafos. Junto e em escala, faz três trabalhos:
> prova que o projeto virou coisa, mostra competência visual sem reivindicá-la,
> e compra os 60 segundos seguintes de leitura.

> **Este é o bloco que mais depende de você.** Com sete placeholders ele não
> cumpre nenhuma das três funções. Se a fotografia não estiver pronta, considere
> segurar a publicação em vez de publicar o bloco vazio.

---

### 03 · O INSIGHT

```yaml
componente: text-block
contém:     [pull-quote, grid-2, band-card]
banda:      white
padding:    tight
nível:      h2
```

Writing a story is a project. But unlike a design project, it arrives with no process — no steps, no checkpoints, no way to know you're doing it right. So beginners face the blank page and read their own paralysis as a lack of talent.

Design methodologies exist to solve exactly that: they turn ambiguous creative work into navigable steps. The bet was that the scaffolding is transferable — that what helps a designer ship a product could help a writer finish a story.

**pull-quote:**

The problem isn't that beginners can't write. It's that nobody hands them a process.

**grid-2 de `band-card`, dois cards de público:**

| Título | Texto |
|---|---|
| Learner | beginners who start stories and abandon them. |
| Teacher | educators who teach writing and have no process to hand a student. |

> Em edtech, professor é usuário, não canal — quem trata professor como canal de
> distribuição constrói produto que morre na adoção, e recrutador sabe disso. E
> mecanicamente: com o professor mapeado como público desde o começo, a adoção
> espontânea do bloco 07 lê como previsão confirmada, não como sorte.

> O `pull-quote` sem itálico e sem aspas decorativas — o sistema marca com
> filete e tamanho. SKILL §12.

---

### 04 · COMO FUNCIONA

```yaml
componente: grid-split
contém:     [figure, text-block, disclosure]
banda:      grid
padding:    tight
nível:      h2
assets:     [method-diagram]
```

Diagrama grande e legível, com as três fases em colunas ao lado.

Mosaico borrows its shape from the thing it teaches — three phases named after narrative structure itself.

**Exposition** — goal, arc, reader, references. **Action** — character, setting, constraints, internal checkpoint. **Resolution** — argument alternatives, timeline, writing, refinement.

Every step hands the writer a design tool with the abstraction removed. A persona turns *"write for your reader"* into a filled-in sheet. An empathy map turns *"make the character believable"* into six questions with answers. **The method never asks for talent it can't scaffold.**

**note — linha de proveniência, discreta:**

Built from 9 documented methodologies filtered by four criteria — documented, user-centered, iterative, outcome-driven — plus the six emotional arcs from Reagan et al. (2016), a computational study of 1,327 works of fiction.

**disclosure:**

`the ten tools and where each came from`

Conteúdo de dentro: `[...] a tabela das 10 ferramentas com a fonte de cada uma, transcrita do GuiaDigital_Mosaico.pdf. Ver FORA DO ESCOPO.`

> Na página no ar isto ocupa cinco seções — "the foundation", "the tool", "the
> guide", "the toolkit" e o worked example. É onde a página perde o leitor.
> Comprimido, o rigor continua visível sem cobrar leitura.

> **1.327, não 1.737.** A página no ar tem os dígitos trocados. Num case cujo
> argumento é "estrutura respaldada por dados", um dado errado custa
> desproporcionalmente caro.

> A frase **"never asks for talent it can't scaffold"** é a melhor linha do case
> e hoje está enterrada num parágrafo de apoio. É a definição de scaffolding
> pedagógico dita em linguagem de designer. Mantenha em destaque com `<strong>`.

> As aspas em *"write for your reader"* e *"make the character believable"* são
> citação de fala, não ênfase — mantenha as aspas e **não** aplique itálico: o
> sistema proíbe itálico como destaque (SKILL §2).

---

### 05a · TRÊS DECISÕES — 01: Where the six arcs came from

```yaml
componente: band-card
contém:     [figure, note]
banda:      lav
padding:    tight
nível:      h3
assets:     [arcs-oedipus]
```

Narrative structure has plenty of established taxonomies. I chose the six emotional arcs from Reagan et al. (2016) instead — a study from the University of Vermont's Computational Story Lab that classified the emotional trajectories of **1,327 works of fiction** from the Project Gutenberg corpus.

What made it usable wasn't just that it was quantitative. It was that **three independent methods — matrix decomposition, supervised and unsupervised learning — converged on the same six shapes.** Convergence from separate methods is the same reason I trusted my own foundation analysis: nine methodologies, different authors, overlapping steps. Structure that survives being found more than once.

There's a symmetry in the source, too. The hypothesis was Kurt Vonnegut's, in a master's thesis the University of Chicago rejected. The paper is a literary intuition finally tested against data — roughly what I was attempting with design methods and writing.

**Trade-off:** six shapes is a coarse instrument. It gives a beginner something choosable — pick the shape your story should trace — at the cost of nuance a literary taxonomy would preserve. For someone who has never finished a story, choosable beat precise.

**figure:** os seis arcos como formas, com o Oedipus marcado `used in the study`.

**note, no fim do card:**

Reagan, A. J.; Mitchell, L.; Kiley, D.; Danforth, C. M.; Dodds, P. S. *The emotional arcs of stories are dominated by six basic shapes.* EPJ Data Science, v. 5, n. 31, 2016. DOI: 10.1140/epjds/s13688-016-0093-1

> O documento original pede "nota de rodapé". Não existe componente de nota de
> rodapé e não precisa existir: citação bibliográfica é `<p class="note">` no fim
> do bloco. Ver `rundown-contract.md`.

---

### 05b · TRÊS DECISÕES — 02: Designing for deviation

```yaml
componente: band-card
banda:      lav
padding:    tight
nível:      h3
```

I wrote an explicit escape clause into the guide: adjust or simplify the process according to your project.

**Trade-off:** a method that permits deviation can't claim its results came from being followed exactly. That's why 2 of 8 participants reordering the steps counted as the tool working rather than as a protocol violation — but I gave up the cleaner claim to get it.

---

### 05c · TRÊS DECISÕES — 03: Removing the users from a user-centered tool

```yaml
componente: grid-split
contém:     [band-card, ba-device]
banda:      lav
padding:    tight
nível:      h3
assets:     [ba-base, ba-after]
```

**6 of 8 participants pushed back on the external validation steps** — recruiting a focus group of readers mid-process. The friction was real: a solo writer will never assemble a focus group, and steps nobody runs aren't steps, they're decoration.

So I cut external validation from a method whose entire philosophy was user-centered design, and replaced it with internal checkpoints — the writer reviewing their earlier decisions against the goal and audience they set in phase one.

**Trade-off, unresolved:** listening to users meant removing the users. The method got completed more and validated less. v2 puts real readers back in the loop by design — that's the whole reason it exists.

**ba-device:** sequência de etapas antes / depois. Rótulo do controle: `slide for before and after`.

> Hoje esta decisão aparece na seção 10 de 14, depois do toolkit inteiro. As
> decisões 01 e 02 existem no texto mas não estão nomeadas como decisões — a do
> escape clause está num parágrafo explicativo sobre o guia. Reunidas e com
> trade-off declarado, viram o bloco pelo qual você é triada. O padrão é sempre
> o mesmo: *considerei A e B, escolhi B por X, e paguei Y por isso.*

> Os 6 de 8 atravessam os dois grupos — é um sinal muito mais forte do que 6
> dentro de um grupo só.

> **Pendência de acessibilidade herdada:** o `ba-device` ainda não responde às
> setas do teclado (ver `components.md`). Se não for resolvido antes de publicar,
> o comparador vira duas `figure` lado a lado — não publique um slider que só
> funciona no mouse.

---

### 06a · COMO EU SEI QUE FUNCIONOU — a pergunta que o estudo tinha que poder responder com "não"

```yaml
componente: text-block
contém:     [data-table]
banda:      white
padding:    tight
nível:      h2
```

I designed the study around one question: **does the method reduce the experience gap?**

That phrasing matters. It meant the study had to be able to answer no — that the method might do nothing for beginners, or work only for people who already knew how to write. A study designed to confirm a method isn't a study.

Success was defined before anyone started writing. I operationalized each dimension using **Goals-Signals-Metrics** (Rodden, Hutchinson & Fu, Google) — for every goal, the observable signal that would indicate it, and the metric that would capture the signal. Deciding what counts as working *after* seeing the data is where most method evaluations quietly fail.

**data-table:**

`[...] LACUNA BLOQUEANTE — as linhas reais da tabela Goals-Signals-Metrics do TCC.`

As três linhas abaixo são **exemplo do documento original** e não podem ir para
a página:

| Goal | Signal | Metric |
|---|---|---|
| Beginners can complete a story | They reach the end without abandoning it | Completion rate |
| The method is learnable | They recall and describe the steps unaided | Unaided recall, one week later |
| The method is usable alone | They don't need to re-read the guide to proceed | Number of consultations |

> Se a tabela real não chegar, **deixe o bloco de fora e reporte** — não publique
> as linhas de exemplo. O argumento de 6.1 é justamente que o critério foi
> definido antes; publicar um exemplo inventado no lugar do critério real
> destrói exatamente a credibilidade que o bloco existe para construir.

---

### 06b · COMO EU SEI QUE FUNCIONOU — dois grupos, um mesmo ponto de partida

```yaml
componente: grid-2
contém:     [band-card]
banda:      white
padding:    tight
nível:      h3
```

**Group A — 4 participants, Gen-Z, no writing experience.** The people the method is for. If scaffolding works, it shows here first.

**Group B — 4 educators experienced in professional writing.** The contrast group. Their friction with the method is a different signal from a beginner's: when an experienced writer resists a step, it usually means the step is redundant. When a beginner resists, it usually means it's unclear.

**One controlled prompt for everyone** — horror genre, Oedipus arc — so variation between participants could be attributed to the method rather than to the assignment.

> O site diz que os grupos existem, mas não diz o que a diferença entre eles
> permite concluir. A frase sobre redundância vs. falta de clareza mostra que o
> desenho foi pensado, não copiado.

---

### 06c · COMO EU SEI QUE FUNCIONOU — os instrumentos

```yaml
componente: grid-2
contém:     [band-card, figure, btn]
banda:      white
padding:    tight
nível:      h3
assets:     [notebook-open]
```

**Card 1 — During: the field notebook**

Each participant received a **structured field notebook** to fill as they wrote, over one week, on their own time. Not a free journal — a designed instrument, with prompts tied to each step of the method: what they did, what they decided, where they got stuck, what they skipped.

Async and individual, by design. I wanted the friction recorded **at the moment it happened**, not reconstructed a week later in front of a researcher who would inevitably lead the answer. Nobody performs competence to a notebook the way they do to an interviewer.

The notebook also produced something an interview can't: **evidence of the order people actually worked in.** The two participants who reordered steps didn't report reordering them — I found it in the logs.

**Card 2 — After: the evaluation interview**

Once the story was finished, each participant sat for an evaluation interview built on a fixed script, so the eight sessions would be comparable. It covered four things in the same order for everyone: what they did at each step, what they remembered of the method unaided, where they got stuck, and satisfaction — **measured with QUIS** (Chin, Diehl & Norman, University of Maryland), a validated instrument, chosen so the satisfaction number wouldn't be one I'd invented.

The notebook and the interview were designed to check each other. The notebook records what happened; the interview records what stayed. **The gap between the two is where the most important finding of the study lives** — people had written down the steps and could no longer say why they existed.

**btn secundário:** `view the interview script` → `[...] destino do link`

> **Lacuna que trava este bloco:** o documento original diz "fixed script" aqui,
> e nas pendências pede para você decidir entre *structured* e *semi-structured*.
> Roteiro fixo e igual para todos = structured. Roteiro base com liberdade de
> aprofundar = semi-structured. Escolha uma palavra e use a mesma no case, no CV
> e na conversa. Enquanto não escolher, este parágrafo não está pronto.

> Triangulação entre dois instrumentos com propósitos distintos é competência de
> pesquisa sênior, e você fez isso — mas a página no ar menciona os instrumentos
> de passagem, como detalhe logístico. A frase final conecta o desenho da
> pesquisa ao achado de transferência: ele não apareceu por sorte, apareceu
> porque a coleta foi montada para expor essa diferença.

---

### 06d · COMO EU SEI QUE FUNCIONOU — os resultados

```yaml
componente: grid-3
contém:     [band-card, band-card--flag]
banda:      white
padding:    tight
nível:      h3
```

**band-card, cinco resultados:**

| Rótulo | Numeral | Texto |
|---|---|---|
| Completion | 4/4 | Every first-time writer finished a full story. |
| Self-efficacy | inverted | Beginners reported *more* enthusiasm at the end than the experienced group. The people with least reason to feel capable finished feeling most capable. |
| Retention | 7/8 | Recalled the method's steps by name a week later. 5/8 needed the guide only once. |
| Flexibility | 2/8 | Reordered the steps to fit their own process, as the guide explicitly permits — visible in the notebooks, not in the interviews. |
| Satisfaction | 4.7/5 | Measured with QUIS. |

**band-card--flag, sexto card, mesmo peso visual dos outros:**

Rótulo: `Transfer — below target` · Numeral: `4/8`

Only half could explain *why* each step existed. They could run the process; they couldn't reason with it. That's the difference between a method someone follows and a method someone learns — and following doesn't survive contact with a project the method didn't anticipate.

The notebooks showed the steps being executed. The interviews showed the reasoning hadn't come with them. This is the finding the entire next version is built on.

> Um recrutador de edtech lê "transfer" e sabe imediatamente que você entende a
> diferença entre uso e aprendizagem — distinção que separa produto educacional
> de produto com conteúdo dentro. O achado negativo **com peso visual igual aos
> positivos, no meio do bloco**, lê como rigor; no fim da página, leria como
> confissão.

> O `--flag` marca com filete lateral e nada mais. O rótulo "below target" está
> no texto porque cor não pode ser o único diferenciador. SKILL §12.

> O *more* em "reported *more* enthusiasm" é ênfase. O sistema proíbe itálico
> para isso — use `<strong>`.

---

### 07 · O SINAL QUE EU NÃO PROJETEI

```yaml
componente: text-block
banda:      grid
padding:    loose
nível:      h2
```

Largura total, quase vazio. Bloco de respiro depois do bloco mais denso.

During the evaluation interviews, something happened I hadn't designed for.

**h2:**

One of the teachers asked permission to use Mosaico with her own students.

Nobody recruited her. In product terms: unsolicited adoption. In education specifically: **teacher pull** — a professional deciding, unprompted, that something is worth the scarcest resource she has, which is class time.

At the time I filed it in a subsection of my thesis. It took me two years to understand it was the most important result in the study.

> Para edtech este é o parágrafo mais valioso da página. Distribuição em educação
> é o problema não resolvido do setor — produtos bons morrem porque professor não
> adota. Um professor adotando sem ser pedido é o sinal que fundos de edtech
> procuram em due diligence.

> **Mantenha a última frase intacta.** Admitir que você não reconheceu o sinal na
> época é a coisa mais crível do case, e conta crescimento de olhar de produto
> sem dizer "eu cresci".

> O documento original marca a frase da professora em negrito e itálico. Como
> `h2` ela já tem o peso; **sem itálico**.

---

### 08 · O QUE SAIU

```yaml
componente: text-block
contém:     [grid-2, figure]
banda:      lav
padding:    tight
nível:      h2
assets:     [fanzine-cover, fanzine-spread, diary-01, diary-02]
```

The study didn't produce opinions about writing. It produced writing — six complete stories, five of them published anonymously in a printed fanzine.

The output of a method study should be the thing the method makes.

**figure × 4**, com legenda sempre na decisão. Exemplo do documento original:

A participant's notebook — where the friction with the validation steps first appeared.

> **Toda legenda explica uma decisão, não o objeto.**
> Errado: *"The final Mosaico diagram."*
> Certo: *"The diagram was reading as a technical document — the audience was
> people who had never finished a story."*
> As legendas de `diary-01` e `diary-02` ainda não existem: `[...]`

> As páginas de caderno e a fanzine contêm trabalho de participantes. Publique só
> o que o consentimento cobre e mantenha nomes fora do enquadramento — as
> legendas dizem "anonymized, used with permission", então as imagens têm que
> corresponder à afirmação.

---

### 09 · LIMITES, E O QUE ELES VIRARAM

```yaml
componente: text-block
contém:     [btn]
banda:      white
padding:    tight
nível:      h2
```

Um bloco só, não dois.

**What this study couldn't claim.** n=8 is a qualitative signal, not statistical validation. I measured completion and satisfaction — not whether the stories were *better* than they'd have been without the tool: no control group, no quality rubric. And the notebooks produced thinner entries than I hoped from several participants.

Each of those became a requirement for what came next.

**Mosaico didn't end in 2023.** The problem it was solving — scaffolding thinking instead of replacing it — is now the central problem in education, because students have AI that writes *for* them. I'm rebuilding Mosaico as an AI writing companion that refuses to write: it asks the questions the method used to ask, and never produces the sentence. Piloting with a real classroom, measured against Brazil's national essay rubric (ENEM) — a quality rubric, which the first study didn't have, and a control condition, which it also didn't have.

**btn primário:** `follow the v2 pilot` → `[...] destino do link`

> Fundidos, cada limitação vira requisito e a v2 deixa de ser teaser para virar
> consequência. A menção explícita de que a v2 corrige a ausência de rubrica e de
> grupo de controle fecha o argumento: você não está repetindo o estudo, está
> respondendo a ele.

> **"An AI writing companion that refuses to write"** é a frase mais empregável
> do seu portfólio. Toda edtech está discutindo isso agora e a maioria dos
> candidatos tem opinião, não posição. Você tem um produto e uma medição.

> **Este é o único botão primário da página** (SKILL §5). O `view the interview
> script` do bloco 06c é secundário. Não inverta.

---

### 10 · GALERIA

```yaml
componente: grid-gallery
banda:      grid
padding:    loose
assets:     [gal-01 … gal-12]
```

Grid denso, sem texto: guia página a página, variações do diagrama, fanzine
completa, cadernos anonimizados, ferramentas preenchidas, registro de impressão
se houver.

É também onde vive tudo que saiu do corpo — o toolkit com fontes, o worked
example completo.

---

## RODAPÉ DO CASE

Uma frase discreta, como já está na página no ar:

Mosaico began as my undergraduate thesis in Design, 2023.

> Não esconda e não abra com isso. Origem acadêmica com execução de produto é
> combinação boa; o inverso — case de produto que se revela TCC no meio — queima
> confiança.

---

## FORA DO ESCOPO

O que existe no projeto e **não** entra no corpo da página. Desce para
`disclosure`, para a galeria do bloco 10, ou para PDF.

- A tabela das 10 ferramentas com citação bibliográfica → `disclosure` do bloco 04
- O worked example de 20 passos → galeria do bloco 10
- O grid descritivo das 9 metodologias → galeria do bloco 10
- A lista dos 6 arcos com formato → substituída pela `figure` do bloco 05a
- O bloco CTA global — case nunca leva
- Estrutura cronológica do case atual — a página nova é argumentativa:
  resultado → objeto → insight → decisões → evidência → limites

---

## ORDEM DE BANDAS

Verificada: nenhuma se repete em seguida.

| Bloco | Banda |
|---|---|
| 01 | grid |
| 02 | lav |
| 03 | white |
| 04 | grid |
| 05a–05c | lav |
| 06a–06d | white |
| 07 | grid |
| 08 | lav |
| 09 | white |
| 10 | grid |

`padding: loose` só em 02, 07 e 10 — os três blocos de respiro. Nenhum deles é
vizinho de outro `loose`.

---

## PENDÊNCIAS

Ordenadas por quanto travam a construção.

**Bloqueiam o bloco inteiro:**

1. **A tabela Goals-Signals-Metrics real do TCC** (bloco 06a). As três linhas do
   documento original são exemplo e não podem ir para a página.
2. **Structured ou semi-structured** (bloco 06c). Escolha uma e use a mesma
   palavra no case, no CV e na conversa.
3. **Detalhes do caderno de campo** (bloco 06c): quantos prompts, por etapa ou
   por dia, campo livre ou não.

**Bloqueiam a qualidade do bloco, não a construção:**

4. **Fotografia do guia impresso e da fanzine.** O bloco 02 depende inteiramente
   disso, e o hero também. Com sete placeholders o bloco 02 não faz nenhum dos
   três trabalhos que justificam a existência dele.
5. **Os 17 assets da tabela.** Nenhum existe. Tudo vira placeholder.
6. **Legendas de `diary-01` e `diary-02`** (bloco 08) — cada uma tem que explicar
   uma decisão, não o objeto.
7. **Destino dos dois links:** `view the interview script` (06c) e
   `follow the v2 pilot` (09).

**Fora desta página:**

8. **Correção 1.737 → 1.327 na página no ar** (`case-mosaico.html`, o arquivo
   antigo). A página nova já nasce com 1,327 no bloco 04.

---

## TESTE DE HIERARQUIA

Alguém que não conhece o projeto lê por 5 minutos e conta de volta. **Se não
mencionar completion 4/4 e a professora, a hierarquia ainda está errada.**
