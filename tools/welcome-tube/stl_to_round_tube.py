"""Rebuild a flat extruded STL as round tubing from its exact 2D footprint.

The source mesh is projected to a binary mask, reduced to its medial axis, and
reconstructed as the union of spheres whose radii reach the original outline.
That produces a circular cross-section instead of merely beveling flat faces.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import struct
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage, sparse
from skimage import measure, morphology


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE = ROOT / "3d" / "welcome-correct.stl"
DEFAULT_OUTPUT = ROOT / "3d" / "welcome-correct-tube-round.stl"
DEFAULT_PREVIEW = ROOT / "3d" / "welcome-correct-tube-round-preview.png"

MAX_INPUT_BYTES = 250 * 1024 * 1024
MAX_VOXELS = 80_000_000


class TubeError(ValueError):
    """Raised when the input or generated tube is invalid."""


def read_binary_stl(path: Path) -> tuple[np.ndarray, str]:
    if not path.is_file():
        raise TubeError(f"Input STL does not exist: {path}")
    size = path.stat().st_size
    if size < 84 or size > MAX_INPUT_BYTES:
        raise TubeError("Input STL size is outside the supported range")

    payload = path.read_bytes()
    triangle_count = struct.unpack_from("<I", payload, 80)[0]
    if triangle_count == 0 or 84 + triangle_count * 50 != len(payload):
        raise TubeError("Input must be a non-empty binary STL")

    record_type = np.dtype(
        [("normal", "<f4", 3), ("vertices", "<f4", (3, 3)), ("attribute", "<u2")]
    )
    records = np.frombuffer(payload, dtype=record_type, offset=84, count=triangle_count)
    triangles = records["vertices"].astype(np.float64)
    if not np.isfinite(triangles).all():
        raise TubeError("Input STL contains non-finite coordinates")
    return triangles, hashlib.sha256(payload).hexdigest()


def rasterize_footprint(
    triangles: np.ndarray, pitch_mm: float, padding: int = 5
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    points = triangles.reshape((-1, 3))
    source_min = points.min(axis=0)
    source_max = points.max(axis=0)
    size = source_max - source_min
    if size[0] <= 0 or size[1] <= 0 or size[2] <= 0:
        raise TubeError("Input STL must have positive width, height, and thickness")

    width = int(np.ceil(size[0] / pitch_mm)) + 2 * padding + 1
    height = int(np.ceil(size[1] / pitch_mm)) + 2 * padding + 1
    if width * height > MAX_VOXELS:
        raise TubeError("Requested footprint resolution is too large")

    image = Image.new("1", (width, height), 0)
    draw = ImageDraw.Draw(image)
    flat_triangle_count = 0
    for triangle in triangles:
        xy = triangle[:, :2]
        edge_a = xy[1] - xy[0]
        edge_b = xy[2] - xy[0]
        doubled_area = abs(edge_a[0] * edge_b[1] - edge_a[1] * edge_b[0])
        if doubled_area <= 1e-10:
            continue
        pixels = [
            (
                (float(x) - source_min[0]) / pitch_mm + padding,
                (source_max[1] - float(y)) / pitch_mm + padding,
            )
            for x, y in xy
        ]
        draw.polygon(pixels, fill=1)
        flat_triangle_count += 1

    if flat_triangle_count == 0:
        raise TubeError("Input STL has no planar footprint")
    mask = np.asarray(image, dtype=bool)

    labels, component_count = ndimage.label(mask, structure=np.ones((3, 3)))
    if component_count == 0:
        raise TubeError("Projected STL footprint is empty")
    component_sizes = np.bincount(labels.ravel())[1:]
    largest_label = int(np.argmax(component_sizes)) + 1
    mask = labels == largest_label
    return mask, source_min, source_max


def medial_spheres(mask: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    skeleton, distance = morphology.medial_axis(
        mask, return_distance=True, rng=np.random.default_rng(0)
    )
    coordinates = np.argwhere(skeleton)
    if coordinates.shape[0] < 2:
        raise TubeError("Could not extract a usable medial axis")

    # The distance transform measures between pixel centres. Subtracting half a
    # pixel places the reconstructed surface at the footprint's pixel boundary.
    radii = np.maximum(distance[skeleton] - 0.5, 0.5)
    return coordinates, radii


def sphere_union_volume(
    mask: np.ndarray,
    coordinates: np.ndarray,
    radii: np.ndarray,
    pitch_mm: float,
) -> tuple[np.ndarray, int, float, float]:
    mask_shape = mask.shape
    max_radius = float(radii.max())
    z_padding = 4
    z_half = int(np.ceil(max_radius)) + z_padding
    z_samples = np.arange(-z_half, z_half + 1, dtype=np.float64)
    voxel_count = len(z_samples) * mask_shape[0] * mask_shape[1]
    if voxel_count > MAX_VOXELS:
        raise TubeError(
            f"Tube volume would require {voxel_count:,} voxels; "
            "increase --pitch-mm"
        )

    volume = np.zeros((len(z_samples), *mask_shape), dtype=np.uint8)
    height, width = mask_shape
    for layer_index, z_value in enumerate(z_samples):
        effective_squared = radii * radii - z_value * z_value
        active = effective_squared > 0.04
        if not active.any():
            continue

        layer = Image.new("1", (width, height), 0)
        draw = ImageDraw.Draw(layer)
        effective_radii = np.sqrt(effective_squared[active])
        for (row, column), radius in zip(
            coordinates[active], effective_radii, strict=True
        ):
            draw.ellipse(
                (
                    float(column - radius),
                    float(row - radius),
                    float(column + radius),
                    float(row + radius),
                ),
                fill=1,
            )
        volume[layer_index] = np.asarray(layer, dtype=np.uint8)

    centre_layer = volume[z_half].astype(bool)
    footprint_recall = float((centre_layer & mask).sum() / max(mask.sum(), 1))
    footprint_precision = float(
        (centre_layer & mask).sum() / max(centre_layer.sum(), 1)
    )

    labels, component_count = ndimage.label(
        volume, structure=np.ones((3, 3, 3), dtype=np.uint8)
    )
    if component_count == 0:
        raise TubeError("Generated tube volume is empty")
    if component_count > 1:
        component_sizes = np.bincount(labels.ravel())[1:]
        volume = (labels == int(np.argmax(component_sizes)) + 1).astype(np.uint8)

    return volume, z_half, footprint_recall, footprint_precision


def volume_to_mesh(
    volume: np.ndarray,
    z_half: int,
    pitch_mm: float,
    smooth_sigma: float,
    smooth_iterations: int,
    source_min: np.ndarray,
    source_max: np.ndarray,
    xy_padding: int = 5,
) -> tuple[np.ndarray, np.ndarray]:
    field = ndimage.gaussian_filter(
        volume.astype(np.float32),
        sigma=smooth_sigma,
        mode="constant",
        cval=0,
    )
    if field.max() <= 0.5:
        raise TubeError("Smoothed tube volume has no extractable surface")

    vertices_zyx, faces, _, _ = measure.marching_cubes(
        field,
        level=0.5,
        spacing=(pitch_mm, pitch_mm, pitch_mm),
        allow_degenerate=False,
        method="lewiner",
    )
    vertices = np.empty_like(vertices_zyx)
    vertices[:, 0] = (
        source_min[0] + vertices_zyx[:, 2] - xy_padding * pitch_mm
    )
    vertices[:, 1] = (
        source_max[1] - vertices_zyx[:, 1] + xy_padding * pitch_mm
    )
    vertices[:, 2] = vertices_zyx[:, 0] - z_half * pitch_mm
    faces = faces.astype(np.int64)
    vertices = taubin_smooth(vertices, faces, smooth_iterations)

    # Marching cubes moves the isosurface by a fraction of one voxel. Restore
    # the exact source width with a uniform scale so every tube stays circular.
    generated_min = vertices.min(axis=0)
    generated_max = vertices.max(axis=0)
    target_width = source_max[0] - source_min[0]
    generated_width = generated_max[0] - generated_min[0]
    if generated_width <= 0:
        raise TubeError("Generated mesh has zero width")
    uniform_scale = target_width / generated_width
    vertices = (vertices - generated_min) * uniform_scale
    vertices[:, 0] += source_min[0]
    vertices[:, 1] += source_min[1]
    vertices[:, 2] -= vertices[:, 2].min()

    triangles = vertices[faces]
    signed_volume = np.einsum(
        "ij,ij->i", triangles[:, 0], np.cross(triangles[:, 1], triangles[:, 2])
    ).sum() / 6.0
    if signed_volume < 0:
        faces = faces[:, [0, 2, 1]]
    return vertices, faces


def taubin_smooth(
    vertices: np.ndarray, faces: np.ndarray, iterations: int
) -> np.ndarray:
    """Remove voxel-scale ripples without the shrinkage of plain smoothing."""
    if iterations <= 0:
        return vertices
    edges = np.concatenate(
        (faces[:, [0, 1]], faces[:, [1, 2]], faces[:, [2, 0]])
    )
    edges.sort(axis=1)
    edges = np.unique(edges, axis=0)
    rows = np.concatenate((edges[:, 0], edges[:, 1]))
    columns = np.concatenate((edges[:, 1], edges[:, 0]))
    adjacency = sparse.csr_matrix(
        (np.ones(rows.shape[0]), (rows, columns)),
        shape=(vertices.shape[0], vertices.shape[0]),
    )
    degree = np.asarray(adjacency.sum(axis=1)).ravel()
    if np.any(degree == 0):
        raise TubeError("Generated mesh contains isolated vertices")

    smoothed = vertices.copy()
    for _ in range(iterations):
        for factor in (0.50, -0.53):
            neighbour_average = adjacency @ smoothed / degree[:, None]
            smoothed += factor * (neighbour_average - smoothed)
    return smoothed


def topology_report(vertices: np.ndarray, faces: np.ndarray) -> dict[str, int]:
    if faces.shape[0] == 0:
        raise TubeError("Generated mesh contains no triangles")
    edges = np.concatenate(
        (faces[:, [0, 1]], faces[:, [1, 2]], faces[:, [2, 0]])
    )
    edges.sort(axis=1)
    _, counts = np.unique(edges, axis=0, return_counts=True)
    triangles = vertices[faces]
    areas = np.linalg.norm(
        np.cross(
            triangles[:, 1] - triangles[:, 0],
            triangles[:, 2] - triangles[:, 0],
        ),
        axis=1,
    )
    return {
        "vertices": int(vertices.shape[0]),
        "triangles": int(faces.shape[0]),
        "boundary_edges": int(np.count_nonzero(counts == 1)),
        "nonmanifold_edges": int(np.count_nonzero(counts > 2)),
        "degenerate_triangles": int(np.count_nonzero(areas <= 1e-12)),
    }


def write_binary_stl(path: Path, vertices: np.ndarray, faces: np.ndarray) -> None:
    triangles = vertices[faces]
    normals = np.cross(
        triangles[:, 1] - triangles[:, 0], triangles[:, 2] - triangles[:, 0]
    )
    normals /= np.linalg.norm(normals, axis=1)[:, None]

    record_type = np.dtype(
        [("normal", "<f4", 3), ("vertices", "<f4", (3, 3)), ("attribute", "<u2")]
    )
    records = np.empty(faces.shape[0], dtype=record_type)
    records["normal"] = normals.astype(np.float32)
    records["vertices"] = triangles.astype(np.float32)
    records["attribute"] = 0

    path.parent.mkdir(parents=True, exist_ok=True)
    header = b"Round tube rebuilt from welcome-correct.stl; millimetres".ljust(
        80, b"\x00"
    )
    with path.open("wb") as stream:
        stream.write(header)
        stream.write(struct.pack("<I", faces.shape[0]))
        stream.write(records.tobytes())


def render_trace(
    path: Path, mask: np.ndarray, coordinates: np.ndarray, scale: int = 2
) -> None:
    pixels = np.zeros((*mask.shape, 3), dtype=np.uint8)
    pixels[mask] = (40, 58, 112)
    pixels[coordinates[:, 0], coordinates[:, 1]] = (255, 105, 0)
    image = Image.fromarray(pixels).resize(
        (mask.shape[1] * scale, mask.shape[0] * scale),
        Image.Resampling.NEAREST,
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, optimize=True)


def render_preview(
    path: Path, vertices: np.ndarray, faces: np.ndarray, width: int = 1400
) -> None:
    triangles = vertices[faces]
    face_cross = np.cross(
        triangles[:, 1] - triangles[:, 0], triangles[:, 2] - triangles[:, 0]
    )
    face_normals = face_cross / np.linalg.norm(face_cross, axis=1)[:, None]
    vertex_normals = np.zeros_like(vertices)
    for corner in range(3):
        np.add.at(vertex_normals, faces[:, corner], face_cross)
    vertex_normals /= np.linalg.norm(vertex_normals, axis=1)[:, None]
    shading_normals = vertex_normals[faces].mean(axis=1)
    shading_normals /= np.linalg.norm(shading_normals, axis=1)[:, None]

    screen_x = vertices[:, 0]
    screen_y = 0.86 * vertices[:, 1] + 0.50 * vertices[:, 2]
    depth = -0.50 * vertices[:, 1] + 0.86 * vertices[:, 2]
    projected = np.column_stack((screen_x, screen_y))
    projected_min = projected.min(axis=0)
    projected_span = projected.max(axis=0) - projected_min

    margin = 55
    height = max(
        360,
        int((width - 2 * margin) * projected_span[1] / projected_span[0])
        + 2 * margin,
    )
    image_scale = min(
        (width - 2 * margin) / projected_span[0],
        (height - 2 * margin) / projected_span[1],
    )
    pixels = (projected - projected_min) * image_scale
    pixels[:, 0] += margin
    pixels[:, 1] = height - margin - pixels[:, 1]

    image = Image.new("RGB", (width, height), "#c9cbce")
    draw = ImageDraw.Draw(image)
    for x in range(0, width, 70):
        draw.line((x, 0, x, height), fill="#dadcde", width=1)
    for y in range(0, height, 70):
        draw.line((0, y, width, y), fill="#dadcde", width=1)

    camera = np.array([0.0, -0.50, 0.86])
    light = np.array([-0.25, -0.35, 0.90])
    light /= np.linalg.norm(light)
    visible = np.einsum("ij,j->i", face_normals, camera) > -0.08
    face_depth = depth[faces].mean(axis=1)
    for face_index in np.argsort(face_depth):
        if not visible[face_index]:
            continue
        brightness = float(
            np.clip(
                0.32 + 0.68 * np.dot(shading_normals[face_index], light),
                0.20,
                1,
            )
        )
        colour = (int(255 * brightness), int(139 * brightness), 0)
        polygon = [tuple(pixels[index]) for index in faces[face_index]]
        draw.polygon(polygon, fill=colour)

    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, optimize=True)


def bounded_float(minimum: float, maximum: float):
    def convert(value: str) -> float:
        parsed = float(value)
        if not np.isfinite(parsed) or not minimum <= parsed <= maximum:
            raise argparse.ArgumentTypeError(
                f"value must be between {minimum} and {maximum}"
            )
        return parsed

    return convert


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Rebuild a flat STL footprint as genuinely round tubing."
    )
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--preview", type=Path, default=DEFAULT_PREVIEW)
    parser.add_argument("--trace-preview", type=Path)
    parser.add_argument(
        "--pitch-mm", type=bounded_float(0.10, 0.50), default=0.20
    )
    parser.add_argument(
        "--smooth-sigma", type=bounded_float(0.0, 1.5), default=0.65
    )
    parser.add_argument(
        "--smooth-iterations", type=int, choices=range(0, 13), default=6
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    source = args.source.resolve()
    triangles, source_sha256 = read_binary_stl(source)
    mask, source_min, source_max = rasterize_footprint(
        triangles, args.pitch_mm
    )
    coordinates, radii = medial_spheres(mask)
    if args.trace_preview:
        render_trace(args.trace_preview.resolve(), mask, coordinates)

    volume, z_half, recall, precision = sphere_union_volume(
        mask, coordinates, radii, args.pitch_mm
    )
    vertices, faces = volume_to_mesh(
        volume,
        z_half,
        args.pitch_mm,
        args.smooth_sigma,
        args.smooth_iterations,
        source_min,
        source_max,
    )
    report = topology_report(vertices, faces)
    if (
        report["boundary_edges"]
        or report["nonmanifold_edges"]
        or report["degenerate_triangles"]
    ):
        raise TubeError(f"Generated mesh failed topology validation: {report}")

    output = args.output.resolve()
    preview = args.preview.resolve()
    write_binary_stl(output, vertices, faces)
    render_preview(preview, vertices, faces)

    generated_size = vertices.max(axis=0) - vertices.min(axis=0)
    print(
        json.dumps(
            {
                "source": str(source),
                "source_sha256": source_sha256,
                "output": str(output),
                "preview": str(preview),
                "size_mm": [round(float(value), 3) for value in generated_size],
                "maximum_tube_diameter_mm": round(
                    float(radii.max() * args.pitch_mm * 2), 3
                ),
                "footprint_recall": round(recall, 5),
                "footprint_precision": round(precision, 5),
                **report,
            },
            indent=2,
        )
    )

    # TODO: Expose optional uniform-radius tubing if a future print should
    # ignore Pacifico's original thick/thin stroke variation.
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except TubeError as error:
        raise SystemExit(f"Tube conversion failed: {error}") from None
