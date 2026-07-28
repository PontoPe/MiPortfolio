# welcome-trace

Turns `assets/ui/welcome.png` — the original "Welcome" lettering — into the
centreline data the 3D hero renders, `scripts/welcome-glass-path.js`.

The artwork is a continuous glass tube, so the medial axis of its alpha mask is
exactly the path a swept tube has to follow, and the distance transform at each
skeleton pixel is the tube's radius there. That keeps the 3D lettering on the
original drawing, proportions and stroke weight instead of re-drawing it by hand.

## Running it

```bash
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/python trace_welcome.py           # rewrites scripts/welcome-glass-path.js
./venv/bin/python check_coverage.py          # recall / precision against the artwork
```

Both scripts take an optional output path and will write a diagnostic image
there — the traced centrelines over the artwork, and a coverage map where red is
artwork the tubes miss and yellow is tube spilling outside it.

Only re-run this if the artwork changes or the tube shape needs adjusting. The
generated module is committed; nothing at build or request time depends on
Python.

## What to watch when tuning

`check_coverage.py` currently reports **recall 0.90 / precision 0.95**. Recall
below that means the lettering has gone visibly thinner than the artwork;
precision below it means tubes are bleeding into the counters of `e`, `o` and
`l`.

The recall that is missing is deliberate. A tube swept along a bend tighter than
its own radius turns inside out and pushes fins through the surface, so
`fit_to_curvature` thins the tube at the tightest turns — the artwork paints
those as filled blobs, which a sweep cannot reproduce. `RADIUS_SCALE` trades the
two metrics off against each other if it ever needs revisiting.
