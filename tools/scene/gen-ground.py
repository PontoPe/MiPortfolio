"""
Gera o PNG do chão de grama usado na transição About → my work.

Mesma lógica dos PNGs de nuvem: o detalhe fica assado na imagem, e em
runtime a camada só recebe transform e opacity.

O topo do arquivo é transparente (acima da linha do horizonte), pra
grama poder subir por cima do céu/nuvens sem borda reta aparecendo.

uso: python3 tools/gen-ground.py
"""
import math, os, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), "..", "assets")
os.makedirs(OUT, exist_ok=True)

W, H = 1900, 1290
SEED = 11
rng = random.Random(SEED)
nprng = np.random.default_rng(SEED)

# ---------------------------------------------------------------
# linha do horizonte: soma de senoides, pra colina não ficar reta
# ---------------------------------------------------------------
xs = np.arange(W, dtype=np.float32)
horizon = (H * 0.135
           + np.sin(xs / W * math.pi * 1.3 + 0.7) * H * 0.030
           + np.sin(xs / W * math.pi * 3.1 + 2.2) * H * 0.012
           + np.sin(xs / W * math.pi * 6.7 + 4.1) * H * 0.005)

yy = np.arange(H, dtype=np.float32)[:, None]
# profundidade 0 = horizonte (longe), 1 = base do quadro (perto)
depth = np.clip((yy - horizon[None, :]) / (H - horizon[None, :]), 0, 1)

# ---------------------------------------------------------------
# cor base: oliva no fundo, verde-limão vivo na frente
# ---------------------------------------------------------------
def ramp(stops, t):
    out = np.zeros_like(t)
    for i in range(len(stops) - 1):
        (t0, v0), (t1, v1) = stops[i], stops[i + 1]
        m = (t >= t0) & (t <= t1)
        k = np.where(m, (t - t0) / (t1 - t0), 0)
        out = np.where(m, v0 + (v1 - v0) * (k * k * (3 - 2 * k)), out)
    return out

t = depth
r = ramp([(0, 108), (0.30, 104), (0.65, 116), (1, 132)], t)
g = ramp([(0, 148), (0.30, 172), (0.65, 192), (1, 208)], t)
b = ramp([(0, 82),  (0.30, 58),  (0.65, 56),  (1, 68)],  t)

# faixas do plantio: ruído de baixa frequência ao longo de linhas inclinadas
def bands(scale_y, scale_x, tilt, amp, seed):
    n = nprng.normal(0, 1, (int(H / scale_y) + 2, int(W / scale_x) + 2)).astype(np.float32)
    n = np.asarray(Image.fromarray(((n * 40) + 128).clip(0, 255).astype(np.uint8), "L")
                   .resize((W, H), Image.BICUBIC), np.float32)
    n = (n - 128) / 40
    shift = (xs[None, :] * tilt).astype(np.float32)
    return 1 + amp * n * (0.35 + 0.65 * depth)

field = bands(70, 260, 0.08, 0.16, 1) * bands(26, 90, -0.05, 0.09, 2)
r, g, b = r * field, g * field, b * field

# perspectiva atmosférica: sutil, só o suficiente pra dar profundidade.
# Forte demais vira uma faixa cinza e mata a silhueta da colina.
haze = np.clip(1 - depth / 0.11, 0, 1) ** 1.8 * 0.45
r = r * (1 - haze) + 186 * haze
g = g * (1 - haze) + 222 * haze
b = b * (1 - haze) + 150 * haze

rgb = np.stack([r, g, b], -1).clip(0, 255).astype(np.uint8)
img = Image.fromarray(rgb, "RGB")
d = ImageDraw.Draw(img)

# ---------------------------------------------------------------
# lâminas de grama: mais longas, mais densas e mais separadas
# conforme se aproximam da base do quadro
# ---------------------------------------------------------------
BLADES = 95000
for _ in range(BLADES):
    # amostra enviesada pra frente do campo (onde o detalhe é visível)
    dt = rng.random() ** 0.55
    x = rng.uniform(-10, W + 10)
    hz = horizon[max(0, min(W - 1, int(x)))]
    y = hz + dt * (H - hz)
    if dt < 0.06:
        continue                                   # longe demais: vira textura, não lâmina
    ln = 3 + dt * dt * 30 * rng.uniform(0.55, 1.5)
    tilt = rng.gauss(0, 0.30) * (0.4 + dt)
    k = 0.72 + 0.62 * rng.random()
    yellow = rng.random() < 0.16
    col = (int(min(255, (118 + 40 * dt) * k + (48 if yellow else 0))),
           int(min(255, (176 + 34 * dt) * k + (34 if yellow else 0))),
           int(min(255, (58 + 14 * dt) * k)))
    d.line([(x, y), (x + tilt * ln, y - ln)], fill=col, width=1 if dt < 0.55 else 2)

# flores amarelas espalhadas
for _ in range(2700):
    dt = rng.random() ** 0.7
    if dt < 0.10:
        continue
    x = rng.uniform(0, W)
    hz = horizon[max(0, min(W - 1, int(x)))]
    y = hz + dt * (H - hz)
    rr = 0.7 + dt * 3.2
    d.ellipse([x - rr, y - rr, x + rr, y + rr],
              fill=(int(216 + 30 * rng.random()), int(206 + 34 * rng.random()), int(70 + 40 * rng.random())))

# ---------------------------------------------------------------
# alpha: transparente acima do horizonte, com a borda irregular
# (a serrilha das pontas de capim, não um corte reto)
# ---------------------------------------------------------------
mask = Image.new("L", (W, H), 0)
md = ImageDraw.Draw(mask)
md.polygon([(0, H), (0, float(horizon[0]))]
           + [(float(x), float(horizon[int(x)])) for x in range(0, W, 2)]
           + [(W, float(horizon[-1])), (W, H)], fill=255)
# pontas de capim quebrando a silhueta do horizonte
for _ in range(3600):
    x = rng.uniform(0, W)
    hz = horizon[max(0, min(W - 1, int(x)))]
    ln = rng.uniform(1.5, 9)
    md.line([(x, hz + 2), (x + rng.gauss(0, 0.5) * ln, hz - ln)], fill=255, width=1)
mask = mask.filter(ImageFilter.GaussianBlur(0.6))

img.putalpha(mask)

# Grama é ruído puro: em RGBA o PNG passa de 1 MB. Quantizar a paleta
# corta ~70% do peso e a diferença não aparece numa camada que está
# sempre em movimento.
img = img.quantize(colors=224, method=Image.FASTOCTREE)
path = os.path.join(OUT, "ground-grass.png")
img.save(path, optimize=True)
print(f"ground-grass.png  {W}x{H}  {os.path.getsize(path)/1024:.0f} KB")
