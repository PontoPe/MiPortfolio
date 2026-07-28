"""Silhouette check for the traced lettering.

Rasterises the tubes described by scripts/welcome-glass-path.js and compares
them with the alpha mask of the original artwork, so a change to the tracing
parameters can be judged on numbers instead of on a squint:

    recall     how much of the artwork the tubes cover
    precision  how much of the tubes lands on the artwork

Pass an output path to also write a map: red is artwork the tubes miss, yellow
is tube spilling outside it.

    ./venv/bin/python check_coverage.py [coverage.png]
"""
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
PREVIEW = Path(sys.argv[1]) if len(sys.argv) > 1 else None

alpha = np.array(Image.open(ROOT / 'assets' / 'ui' / 'welcome.png'))[..., 3]
H, W = alpha.shape
mask = ndimage.binary_closing(alpha > 140, structure=np.ones((3, 3)))

source = (ROOT / 'scripts' / 'welcome-glass-path.js').read_text()
strokes = [(np.fromstring(p, sep=',').reshape(-1, 2), np.fromstring(r, sep=','))
           for p, r in re.findall(r'p:\s*\[([^\]]*)\],\s*r:\s*\[([^\]]*)\]', source)]
print('strokes:', len(strokes))

yy, xx = np.mgrid[0:H, 0:W]
covered = np.zeros((H, W), bool)
for points, radii in strokes:
    px = points[:, 0] * W + W / 2
    py = H / 2 - points[:, 1] * W
    pr = radii * W
    for i in range(len(px) - 1):
        for t in np.linspace(0, 1, 8):
            cx = px[i] + (px[i + 1] - px[i]) * t
            cy = py[i] + (py[i + 1] - py[i]) * t
            cr = pr[i] + (pr[i + 1] - pr[i]) * t
            x0, x1 = int(max(0, cx - cr - 1)), int(min(W, cx + cr + 2))
            y0, y1 = int(max(0, cy - cr - 1)), int(min(H, cy + cr + 2))
            covered[y0:y1, x0:x1] |= ((xx[y0:y1, x0:x1] - cx) ** 2
                                      + (yy[y0:y1, x0:x1] - cy) ** 2 <= cr * cr)

hit = (covered & mask).sum()
print('recall    %.3f' % (hit / mask.sum()))
print('precision %.3f' % (hit / covered.sum()))

if PREVIEW:
    out = np.zeros((H, W, 3), np.uint8)
    out[mask & ~covered] = (255, 40, 40)      # artwork the tubes miss
    out[covered & ~mask] = (255, 220, 0)      # tube spilling outside the artwork
    out[covered & mask] = (40, 70, 140)
    Image.fromarray(out).save(PREVIEW)
    print('wrote', PREVIEW)
