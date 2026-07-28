"""Trace the "Welcome" artwork into centrelines for the 3D hero lettering.

The artwork is a continuous glass tube, so the medial axis of its alpha mask is
the path a swept tube has to follow and the distance transform at each skeleton
pixel is the tube's radius there. The skeleton is a graph rather than a single
path, because the word crosses over itself: chains between junction pixels
become edges, and edge ends that meet head-on at a junction are stitched back
together, which recovers the pen strokes running *through* each crossing.

Writes scripts/welcome-glass-path.js. Run check_coverage.py afterwards to see
how closely the swept tubes still cover the original artwork.

    python3 -m venv venv && ./venv/bin/pip install -r requirements.txt
    ./venv/bin/python trace_welcome.py
"""
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
DEST = ROOT / 'scripts' / 'welcome-glass-path.js'
PREVIEW = Path(sys.argv[1]) if len(sys.argv) > 1 else None

SRC = ROOT / 'assets' / 'ui' / 'welcome.png'

alpha = np.array(Image.open(SRC))[..., 3]
H, W = alpha.shape
mask = alpha > 140

# Clean specks / pinholes before skeletonising. The counters of e/o/l are real
# holes and must survive — only pinholes smaller than a few hundred px get filled.
mask = ndimage.binary_closing(mask, structure=np.ones((3, 3)), iterations=1)
holes, hn = ndimage.label(~mask)
hsizes = ndimage.sum(~mask, holes, range(1, hn + 1))
print('holes:', sorted(hsizes, reverse=True)[:12])
small = np.isin(holes, [i + 1 for i, s in enumerate(hsizes) if s < 300])
mask = mask | small
lbl, n = ndimage.label(mask)
sizes = ndimage.sum(mask, lbl, range(1, n + 1))
print('components:', n, sorted(sizes, reverse=True)[:10])
keep = np.isin(lbl, [i + 1 for i, s in enumerate(sizes) if s > 200])
mask = keep

dist = ndimage.distance_transform_edt(mask)
print('mask px', mask.sum(), 'max radius', dist.max())


def zhang_suen(img):
    """Vectorised Zhang-Suen thinning."""
    img = img.astype(np.uint8).copy()
    while True:
        changed = False
        for step in (0, 1):
            p = [np.roll(np.roll(img, dy, 0), dx, 1) for dy, dx in
                 ((-1, 0), (-1, 1), (0, 1), (1, 1), (1, 0), (1, -1), (0, -1), (-1, -1))]
            P2, P3, P4, P5, P6, P7, P8, P9 = p
            B = sum(p)
            seq = p + [P2]
            A = sum(((seq[i] == 0) & (seq[i + 1] == 1)).astype(np.uint8) for i in range(8))
            if step == 0:
                c1 = P2 * P4 * P6
                c2 = P4 * P6 * P8
            else:
                c1 = P2 * P4 * P8
                c2 = P2 * P6 * P8
            rm = (img == 1) & (B >= 2) & (B <= 6) & (A == 1) & (c1 == 0) & (c2 == 0)
            if rm.any():
                img[rm] = 0
                changed = True
        if not changed:
            return img.astype(bool)


skel = zhang_suen(mask)
print('skeleton px', skel.sum())

pts = {(int(y), int(x)) for y, x in zip(*np.nonzero(skel))}
NB = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]


def neighbours(p):
    y, x = p
    return [(y + dy, x + dx) for dy, dx in NB if (y + dy, x + dx) in pts]


# ---------------------------------------------------------------- spur pruning
def prune(min_len):
    """Drop short dead-end branches created by the rounded stroke caps."""
    removed = True
    while removed:
        removed = False
        for e in [p for p in pts if len(neighbours(p)) == 1]:
            if e not in pts:
                continue
            chain, cur, prev = [e], e, None
            while True:
                nb = [q for q in neighbours(cur) if q != prev]
                if len(nb) != 1:
                    break
                prev, cur = cur, nb[0]
                chain.append(cur)
                if len(chain) > min_len:
                    break
            if len(chain) <= min_len and len(neighbours(chain[-1])) > 2:
                for q in chain[:-1]:
                    pts.discard(q)
                removed = True


prune(16)
print('skeleton px after prune:', len(pts))

# ------------------------------------------------------------------ graph edges
nodes = {p for p in pts if len(neighbours(p)) != 2}
edges, visited = [], set()
for n in nodes:
    for start in neighbours(n):
        if (n, start) in visited:
            continue
        chain, prev, cur = [n, start], n, start
        visited.add((n, start))
        while cur not in nodes:
            nb = [q for q in neighbours(cur) if q != prev]
            if not nb:
                break
            prev, cur = cur, nb[0]
            chain.append(cur)
        visited.add((cur, prev))
        edges.append(chain)

seen = {p for e in edges for p in e}
for p in pts - seen:                      # closed loops with no junction on them
    if p in seen:
        continue
    chain, prev, cur = [p], p, neighbours(p)[0]
    while cur != p:
        chain.append(cur)
        nb = [q for q in neighbours(cur) if q != prev]
        if not nb:
            break
        prev, cur = cur, nb[0]
    chain.append(p)
    seen.update(chain)
    edges.append(chain)

edges = [e for e in edges if len(e) >= 3]
print('edges:', len(edges), 'lengths:', sorted(len(e) for e in edges)[-10:])


# ------------------------------------------- stitch edges through the crossings
def direction(chain, at_start, span=18):
    """Unit direction pointing away from the given end, in (dx, dy)."""
    seg = chain[:span] if at_start else chain[::-1][:span]
    (y0, x0), (y1, x1) = seg[0], seg[-1]
    dy, dx = y1 - y0, x1 - x0
    n = math.hypot(dx, dy) or 1.0
    return dx / n, dy / n


ends = [(i, s) for i in range(len(edges)) for s in (True, False)]
pos = {e: (edges[e[0]][0] if e[1] else edges[e[0]][-1]) for e in ends}
dirs = {e: direction(edges[e[0]], e[1]) for e in ends}

JOIN_RADIUS = 22.0          # junction clusters are a few px wide, plus overlap
cand = []
for ia, a in enumerate(ends):
    for b in ends[ia + 1:]:
        if a[0] == b[0]:
            continue
        (ya, xa), (yb, xb) = pos[a], pos[b]
        d = math.hypot(xa - xb, ya - yb)
        if d > JOIN_RADIUS:
            continue
        da, db = dirs[a], dirs[b]
        score = -(da[0] * db[0] + da[1] * db[1])      # 1.0 == perfectly collinear
        # Only near-straight continuations: a sharp stitch would put a corner
        # tighter than the tube radius into the path, and the sweep folds there.
        if score > 0.55:
            cand.append((score - d / 400.0, a, b))
cand.sort(key=lambda t: -t[0])

partner = {}
for _, a, b in cand:
    if a in partner or b in partner:
        continue
    partner[a], partner[b] = b, a
print('stitched joins:', len(partner) // 2)

used, strokes = set(), []
for i in range(len(edges)):
    if i in used:
        continue
    head, guard, back = (i, True), 0, {i}
    while head in partner and partner[head][0] not in back and guard < 400:
        nxt = partner[head]
        back.add(nxt[0])
        head = (nxt[0], not nxt[1])
        guard += 1

    chain, cur, guard = [], head, 0
    while cur[0] not in used and guard < 400:
        used.add(cur[0])
        chain.extend(edges[cur[0]] if cur[1] else edges[cur[0]][::-1])
        tail = (cur[0], not cur[1])
        if tail not in partner:
            break
        cur = partner[tail]
        guard += 1
    if len(chain) >= 8:
        strokes.append(chain)

print('strokes:', len(strokes), 'lengths:', sorted(len(s) for s in strokes)[::-1])


# --------------------------------------------------------- smooth and resample
def smooth(poly, passes=5):
    a = np.array(poly, float)
    for _ in range(passes):
        b = a.copy()
        b[1:-1] = (a[:-2] + 2 * a[1:-1] + a[2:]) / 4.0
        a = b
    return a


def resample(a, step=10.0):
    seg = np.linalg.norm(np.diff(a, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    if s[-1] < step * 1.5:
        return a
    t = np.append(np.arange(0, s[-1], step), s[-1])
    return np.stack([np.interp(t, s, a[:, 0]), np.interp(t, s, a[:, 1])], 1)


lo, hi = np.percentile(dist[skel], [14, 97])
RADIUS_SCALE = 1.12     # the medial axis under-reads on a smoothed centreline
print('radius clamp', round(lo, 1), round(hi, 1))


def extend(a, at_start, amount):
    """Push a real tip out along its own direction, so its rounded cap lands
    where the painted tip does — spur pruning trimmed the skeleton short of
    it."""
    a = np.asarray(a, float)
    if len(a) < 3:
        return a
    d = (a[0] - a[1]) if at_start else (a[-1] - a[-2])
    d = d / (np.linalg.norm(d) or 1) * amount
    return np.vstack([a[0] + d, a]) if at_start else np.vstack([a, a[-1] + d])


def radii_along(a):
    ri = np.clip(np.rint(a[:, 0]).astype(int), 0, H - 1)
    ci = np.clip(np.rint(a[:, 1]).astype(int), 0, W - 1)
    # A crossing inflates the medial-axis distance for a few samples; the median
    # filter rejects those spikes while letting genuinely thicker strokes stay
    # thick, which a flat clamp could not.
    r = dist[ri, ci]
    if len(r) > 9:
        r = ndimage.median_filter(r, size=9, mode='nearest')
    r = np.clip(r, lo, hi)
    if len(r) > 7:
        r = np.convolve(np.pad(r, 3, mode='edge'), np.ones(7) / 7, 'same')[3:-3]
    return r * RADIUS_SCALE


TIP_EXTEND = 7.0        # px, so the hemisphere reaches the painted tip


def curvature_radius(a):
    """Radius of the circle through each consecutive triple of points."""
    out = np.full(len(a), np.inf)
    if len(a) < 3:
        return out
    p0, p1, p2 = a[:-2], a[1:-1], a[2:]
    area = np.abs((p1[:, 0] - p0[:, 0]) * (p2[:, 1] - p0[:, 1])
                  - (p1[:, 1] - p0[:, 1]) * (p2[:, 0] - p0[:, 0])) / 2
    sides = (np.linalg.norm(p1 - p0, axis=1) * np.linalg.norm(p2 - p1, axis=1)
             * np.linalg.norm(p2 - p0, axis=1))
    out[1:-1] = np.where(area > 1e-6, sides / (4 * area + 1e-9), np.inf)
    return out


def fit_to_curvature(a, r):
    """Keep the tube from turning inside out on a tight bend.

    Sweeping a circle of radius r along a curve whose radius of curvature is
    smaller than r everts the surface on the inside of the bend and pushes fins
    out through the glass. Thinning the tube there is the one fix that leaves
    the traced letterform itself untouched — and the artwork thins at those
    turns anyway."""
    limit = curvature_radius(a) * 0.9
    limit = ndimage.minimum_filter(limit, size=3, mode='nearest')
    r = np.minimum(r, limit)
    if len(r) > 5:
        r = np.convolve(np.pad(r, 2, mode='edge'), np.ones(5) / 5, 'same')[2:-2]
    return r


paths = []
for st in strokes:
    a = resample(smooth(st), 10.0)         # a[:,0]=row(y), a[:,1]=col(x)
    r = fit_to_curvature(a, radii_along(a))
    closed = np.linalg.norm(a[0] - a[-1]) < 12
    length = np.linalg.norm(np.diff(a, axis=0), axis=1).sum()
    # Tiny closed loops are scraps of skeleton left at a crossing or inside a
    # rounded terminal. A ring shorter than its own circumference (2*pi*r)
    # sweeps into a self-intersecting knot of spikes, so collapse it to the
    # capsule it is really describing: a blob of glass filling that spot.
    blob = closed and length < 6.5 * r.mean()
    if blob:
        centre = a.mean(axis=0)
        offsets = a - centre
        axis = np.linalg.svd(offsets, full_matrices=False)[2][0]
        span = offsets @ axis
        ends = np.array([centre + axis * span.min() * 0.5,
                         centre + axis * span.max() * 0.5])
        a = np.vstack([ends[0], ends.mean(axis=0), ends[1]])
        r = np.full(3, r.mean())
        closed = False
    paths.append((a, r, closed, blob))
print('paths:', len(paths), 'of which blobs:', sum(1 for p in paths if p[3]))


def buried(point, skip):
    """True when a stroke end already lies inside another stroke's tube, which
    is what happens at a crossing. Such an end is left exactly where the trace
    put it — on the neighbour's centreline, where its rounded cap fits inside
    the neighbour. Pushing it any further out would spear the cap through the
    far wall of the tube it runs into."""
    for j, (a, r, _, _) in enumerate(paths):
        if j == skip:
            continue
        d = np.linalg.norm(a - point, axis=1) - r
        if d.min() < -4.0:
            return True
    return False


out = []
for i, (a, r, closed, blob) in enumerate(paths):
    # Every open end is rounded off: an uncapped mouth reads as a torn sail
    # wherever it is not perfectly buried, which a hemisphere never does.
    caps = [not closed, not closed]
    if not closed and not blob:
        if not buried(a[0], i):
            a = extend(a, True, TIP_EXTEND)
        if not buried(a[-1], i):
            a = extend(a, False, TIP_EXTEND)
        r = fit_to_curvature(a, radii_along(a))
    out.append({
        'closed': bool(closed),
        'caps': caps,
        'points': [[round((x - W / 2) / W, 5), round((H / 2 - y) / W, 5)]
                   for y, x in a],
        'radii': [round(v / W, 5) for v in r],
    })
print('capped ends:', sum(s['caps'].count(True) for s in out),
      'of', sum(0 if s['closed'] else 2 for s in out))


out.sort(key=lambda s: -len(s['points']))

# ------------------------------------------------------------- emit the module
lines = []
for s in out:
    pts, rad = s['points'], s['radii']
    if s['closed'] and len(pts) > 3:
        pts, rad = pts[:-1], rad[:-1]      # CatmullRom closes the loop itself
    lines.append('    { closed: %s, caps: [%s, %s], p: [%s], r: [%s] }' % (
        'true' if s['closed'] else 'false',
        'true' if s['caps'][0] else 'false',
        'true' if s['caps'][1] else 'false',
        ', '.join('%g, %g' % (x, y) for x, y in pts),
        ', '.join('%g' % v for v in rad),
    ))

module = """/**
 * Centreline of the "Welcome" glass lettering, traced from the original
 * artwork (assets/ui/welcome.png) by taking the medial axis of its alpha mask.
 * Per stroke: `p` is a flat [x, y, x, y, ...] list of centreline points, `r`
 * the tube radius at each of them, and `caps` says whether each end gets a
 * rounded cap. Units are fractions of the artwork width, x centred on 0 and y
 * pointing up, so the word spans x = -0.5 .. 0.5.
 *
 * Generated by tools/welcome-trace/trace_welcome.py — regenerate rather than
 * hand-edit.
 */
export const WELCOME_ASPECT = %.5f;

export const WELCOME_STROKES = [
%s,
];
""" % (W / H, ',\n'.join(lines))

DEST.write_text(module)
print('wrote', DEST, len(module), 'bytes,', len(lines), 'strokes')

if PREVIEW:
    prev = np.zeros((H, W, 3), np.uint8)
    prev[mask] = (38, 56, 110)
    palette = [(255, 90, 0), (0, 220, 160), (255, 220, 0), (255, 0, 160),
               (0, 160, 255), (180, 120, 255), (255, 255, 255), (255, 60, 60)]
    for k, s in enumerate(out):
        col = palette[k % len(palette)]
        for nx, ny in s['points']:
            x, y = int(nx * W + W / 2), int(H / 2 - ny * W)
            prev[max(0, y - 2):y + 3, max(0, x - 2):x + 3] = col
    Image.fromarray(prev).save(PREVIEW)
    print('wrote', PREVIEW)
