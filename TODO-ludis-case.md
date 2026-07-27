# LUDIS case — what's still missing

Everything the page needs before it can be published. Two kinds of gap, both
visible on the page itself so nothing gets forgotten:

- **Copy** — yellow dashed slots reading `FILL: …`. Markup: `<span class="todo">`.
- **Media** — dashed frames showing the expected file path.

Find them in the source:

```bash
grep -n 'class="todo"' case-ludis.html
```

Line numbers below were correct on 2026-07-27 and will drift as slots get filled
— the grep is the source of truth.

---

## Copy — 15 slots

### Screen 1 · Hero (`#ship`)

| Line | Slot | Note |
| --- | --- | --- |
| 56 | `year` | Which year LUDIS shipped. Goes in the eyebrow next to "iOS product · Sports management". |

### Screen 3 · Research (`#research`)

| Line | Slot | Note |
| --- | --- | --- |
| 142 | `N` | How many athletes and team organizers were interviewed. |
| 143 | `N` | How many sports and communication apps were benchmarked. |
| 169 | **the finding** | The big one — see below. |

**The finding is the most important gap on the page.** The question to answer
first, in writing, before touching the HTML:

> From the interviews, what was the one piece of information without which LUDIS
> would be a different app?

Prompts if it's hard to recall: where did their team management live before —
WhatsApp? paper? Which professional tool did they envy most? What did the
benchmarking show existing apps get wrong?

If a real answer exists, this screen is the heart of the case. If it doesn't,
shrink the screen rather than padding it — never list research tools as if they
were findings.

### Screen 4 · Decisions (`#decisions`)

| Line | Slot | Note |
| --- | --- | --- |
| 221 | Accessibility example | One concrete colour or contrast choice that changed because of the colourblind check. Without an example the claim reads as a checkbox. |
| 238 | HIG trade-off | Something the team wanted to do that Apple's pattern wouldn't allow. A constraint with no cost isn't a constraint. |

### Screen 5 · Testing (`#testing`)

Three observed → changed pairs, six slots:

| Line | Slot |
| --- | --- |
| 273 / 275 | Usability test 1 — behaviour observed / what changed |
| 280 / 282 | Usability test 2 — behaviour observed / what changed |
| 287 / 289 | TestFlight beta — what the beta caught / the fix that shipped |

**Rule:** if fewer than two concrete changes can be named, delete this screen and
fold one paragraph into Screen 4. Testing that changed nothing is not case
content.

### Screen 6 · Launch (`#launch`)

| Line | Slot | Note |
| --- | --- | --- |
| 326 | Post-launch learning | What the first users did that wasn't predicted, or which campaign metric surprised you. Even an anecdote is worth a lot here. |

### Screen 7 · Looking back (`#retro`)

| Line | Slot | Note |
| --- | --- | --- |
| 391 | Current state | What happened after week one — retention? Is the app still live? **Needs a true answer**: an interviewer will open the App Store while reading this. If LUDIS died after graduation, saying so plainly ("the team moved on after graduation; the launch remains the proof of concept") beats implying a live product that isn't. |
| 395 | Third retrospective | Something you'd do differently, in your own words. |

---

## Media — 7 slots

Drop a file with the matching name into `imagesProjects/ludis-case/` and the
placeholder fills itself — no code change. Full table in that folder's README.

| File | Screen |
| --- | --- |
| `appstore-listing.png` | 1 · Hero — the real App Store page. The single most valuable image on the page. |
| `research-empathy-map.png` | 3 · Research |
| `mascot-in-context.png` | 4 · Decisions — Goatie inside a real screen |
| `testing-before-after.png` | 5 · Testing — before/after of one screen |
| `campaign-01.png` | 6 · Launch |
| `campaign-02.png` | 6 · Launch |
| `meta-ads-dashboard.png` | 6 · Launch — real numbers in a real interface |

Already filled: `design-system-colors.jpg`, `design-system-components.jpg` (from
the Figma export) and `imagesProjects/ludis-social/8.jpg`.

`mascot-in-context.png` needs a fresh export — `goatie.svg` in the Figma export is
a contact sheet of six poses with embedded bitmaps, not a usable single asset.

---

## The 90-second test

Someone reads Screens 1 and 6 only. Do they come away knowing she shipped a
product and ran the acquisition? If yes, the case works.
