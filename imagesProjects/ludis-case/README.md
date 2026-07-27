# LUDIS case page — expected media

`case-ludis.html` references these filenames. Every `<img>` on that page has an
`onerror` that swaps it for a dashed placeholder showing the expected path, so the
page works with none of them present and fills in as files land here. Just drop a
file with the matching name — no code change needed.

| File | Screen | What it should show |
| --- | --- | --- |
| `appstore-listing.png` | 1 · Hero | Screenshot of the real App Store page (or App Store Connect / TestFlight if the app is down). Portrait, 9:19.5. |
| `research-empathy-map.png` | 3 · Research | A filled empathy map or the Value Proposition Canvas. Real material, not a stock diagram. |
| `mascot-in-context.png` | 4 · Decisions | Goatie inside a real screen — empty state or first run. |
| ~~`accessibility-palette.png`~~ | 4 · Decisions | **Done** — `design-system-colors.jpg`, from the Figma export. |
| ~~`hig-screens.png`~~ | 4 · Decisions | **Done** — `design-system-components.jpg`, from the Figma export. Still worth adding real app screens later. |
| `testing-before-after.png` | 5 · Testing | Before / after of one screen that changed because of testing. |
| `campaign-01.png` | 6 · Launch | Paid ad creative, campaign one. |
| `campaign-02.png` | 6 · Launch | Paid ad creative, campaign two. |
| `meta-ads-dashboard.png` | 6 · Launch | Meta Ads dashboard with the launch numbers. |

Already wired from elsewhere: the organic social piece on screen 6 uses
`imagesProjects/ludis-social/8.jpg`.

Source of truth for the page's palette and the two design-system images:
`assets/reference/ludis-27_7-exp/` (Milena's Figma export, 2026-07-27). The page
skin uses the product's own tokens — dark `#1A202C`, purple `#6B46C1`, pink
`#F5419E`, green `#48BB78` — not the lime of the LUDIS social posts.

Copy still to write is marked in the HTML with `class="todo"` — grep for it.
