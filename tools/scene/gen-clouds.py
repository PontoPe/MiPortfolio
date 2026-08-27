"""
Gera os PNGs de nuvem usados pelo protótipo.

Por que gerar o asset em vez de usar `filter: blur()` no CSS:
o blur do CSS é reaplicado pela GPU a cada frame nas camadas animadas e
derruba o frame rate justamente durante o scroll. Aqui o desfoque já vem
"assado" no canal alpha do PNG, então em runtime só rolam transform e
opacity — que a GPU compõe sem repintar.

uso: python3 tools/gen-clouds.py
"""
import math, os, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), "..", "assets")
os.makedirs(OUT, exist_ok=True)


def silhouette(w, h, seed, puffs, arch_h, base_y, slab, jitter, size):
    """Silhueta da nuvem: puffs compostos por MÁXIMO (não sobrescrita),
    senão um puff desenhado depois abre buraco no anterior."""
    rng = random.Random(seed)
    acc = np.zeros((h, w), dtype=np.float32)

    def stamp(box, value=1.0):
        m = Image.new("L", (w, h), 0)
        ImageDraw.Draw(m).ellipse(box, fill=255)
        np.maximum(acc, np.asarray(m, dtype=np.float32) / 255.0 * value, out=acc)

    if slab > 0:  # base achatada, dá "chão" pra nuvem
        sy = h * base_y
        stamp([-w * 0.12, sy - h * slab, w * 1.12, sy + h * 0.6], 1.0)

    for i in range(puffs):
        t = min(1.0, max(0.0, (i + rng.uniform(-0.45, 0.45)) / puffs))
        x = t * w
        arch = math.sin(math.pi * t) ** 0.7
        cy = h * base_y - arch * h * arch_h * rng.uniform(0.5, 1.2)
        cy += rng.uniform(-1, 1) * h * jitter
        r = h * size * rng.uniform(0.75, 1.25) * (0.45 + 0.9 * arch)
        rx = r * rng.uniform(1.0, 1.75)
        ry = r * rng.uniform(0.62, 1.0)
        stamp([x - rx, cy - ry, x + rx, cy + ry], 1.0)
    return acc


def curve(a, lo, hi):
    """smoothstep: define a borda sem deixar dura."""
    t = np.clip((a - lo) / (hi - lo), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def blur(a, radius):
    img = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8), "L")
    return np.asarray(img.filter(ImageFilter.GaussianBlur(radius)), np.float32) / 255.0


def falloff(w, h, edge=0.15, top=0.05, bottom=0.34):
    """Janela suave nas bordas pra camada não mostrar recorte retangular."""
    x = np.ones(w, np.float32)
    e = max(1, int(w * edge))
    ramp = 0.5 - 0.5 * np.cos(np.pi * np.arange(e) / e)
    x[:e] = ramp
    x[-e:] = ramp[::-1]
    ty = np.linspace(0, 1, h, dtype=np.float32)
    y = np.ones(h, np.float32)
    y = np.where(ty < top, ty / top, y)
    y = np.where(ty > 1 - bottom, np.clip((1 - ty) / bottom, 0, 1), y)
    y = y * y * (3 - 2 * y)
    return y[:, None] * x[None, :]


def make_cloud(name, w, h, soften, edge_lo, edge_hi, opacity=1.0, **kw):
    s = silhouette(w, h, **kw)
    s = blur(s, soften)                 # arredonda os puffs
    a = curve(s, edge_lo, edge_hi)      # recupera a definição da borda
    a = blur(a, soften * 0.45)          # sopro final de suavidade
    a *= falloff(w, h)
    a *= opacity

    # sombreamento: branco no topo, azul-cinza discreto na barriga
    ty = np.linspace(0, 1, h, dtype=np.float32)[:, None] ** 0.8
    shade = np.repeat(ty, w, axis=1)
    # a barriga escurece onde a nuvem é espessa (usa a própria silhueta)
    depth = np.clip(s, 0, 1) * shade
    r = 255 - 34 * depth - 6 * shade
    g = 255 - 26 * depth - 4 * shade
    b = 255 - 11 * depth - 1 * shade

    rgba = np.stack([r, g, b, a * 255], axis=-1).clip(0, 255).astype(np.uint8)
    path = os.path.join(OUT, name)
    Image.fromarray(rgba, "RGBA").save(path, optimize=True)
    print(f"{name}  {w}x{h}  {os.path.getsize(path)/1024:.0f} KB")


def make_edge(name, w, h, soften, edge_lo, edge_hi, **kw):
    """Nuvem de ACABAMENTO: topo reto e totalmente opaco, base arredondada.

    É a peça que fecha o fim do About. As nuvens normais têm esmaecimento
    nas laterais e na base — viradas de ponta-cabeça, esse esmaecimento
    vira um topo transparente e o céu aparece por trás. Aqui não há
    falloff nenhum: a faixa cobre a largura inteira, do topo até a
    silhueta, e só a borda de baixo é recortada.
    """
    sil = silhouette(w, h, **kw)
    sil = blur(sil, soften)
    a = curve(sil, edge_lo, edge_hi)
    a = blur(a, soften * 0.45)

    # Folga vertical garantida: se algum puff encosta na borda de cima,
    # depois de virado ele é cortado embaixo e o corte vira uma linha
    # reta atravessando a nuvem — que é justamente o que se quer evitar.
    rows = np.where(a.max(axis=1) > 0.5)[0]
    if len(rows):
        want = int(h * 0.14)
        if rows[0] < want:
            k = want - rows[0]
            a = np.vstack([np.zeros((k, w), np.float32), a[:-k]])

    a = a[::-1]                                  # puffs passam a apontar pra baixo
    a[:int(h * 0.22)] = 1.0                      # topo reto, sem vão em coluna nenhuma
    # preenche cada coluna do topo até o ponto mais baixo da silhueta
    a = np.maximum.accumulate(a[::-1], axis=0)[::-1]

    # branco no topo, azul-cinza discreto na barriga dos puffs
    ty = (np.linspace(0, 1, h, dtype=np.float32) ** 1.4)[:, None]
    shade = np.repeat(ty, w, axis=1)
    r = 255 - 26 * shade
    g = 255 - 20 * shade
    b = 255 - 8 * shade

    rgba = np.stack([r, g, b, a * 255], axis=-1).clip(0, 255).astype(np.uint8)
    path = os.path.join(OUT, name)
    Image.fromarray(rgba, "RGBA").save(path, optimize=True)
    print(f"{name}  {w}x{h}  {os.path.getsize(path)/1024:.0f} KB")


# frente: silhueta alta, cheia, borda mais definida
make_cloud("cloud-dense.png", 1600, 760, soften=14, edge_lo=0.30, edge_hi=0.62,
           seed=7, puffs=22, arch_h=0.30, base_y=0.66, slab=0.15,
           jitter=0.025, size=0.17)
# meio: um pouco mais aberta e macia
make_cloud("cloud-soft.png", 1600, 700, soften=20, edge_lo=0.26, edge_hi=0.66,
           seed=21, puffs=17, arch_h=0.27, base_y=0.70, slab=0.09,
           jitter=0.04, size=0.16)
# fundo: esgarçada, quase véu
make_cloud("cloud-wisp.png", 1600, 620, soften=30, edge_lo=0.18, edge_hi=0.72,
           seed=44, puffs=12, arch_h=0.21, base_y=0.74, slab=0.03,
           jitter=0.06, size=0.15, opacity=0.85)

# acabamento do About: topo reto pra dentro da seção, base arredondada
# slab=0 de propósito: o slab é largo demais e a borda dele, depois de
# virada, vira uma linha reta atravessando a nuvem. Quem desenha o
# recorte de baixo são só os puffs; a cobertura total já vem da faixa
# sólida do topo.
make_edge("cloud-edge.png", 1600, 560, soften=12, edge_lo=0.32, edge_hi=0.60,
          seed=13, puffs=28, arch_h=0.22, base_y=0.72, slab=0,
          jitter=0.06, size=0.15)
