"""Export the round Pacifico "Welcome" tube from GLB to a printable STL.

The GLB contains the genuinely round tube geometry.  The reference STL is used
only for its physical width and placement, so the conversion never stretches
the tube cross-section into an oval.
"""

from __future__ import annotations

import argparse
import json
import math
import struct
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE = ROOT / "3d" / "Welcome.glb"
DEFAULT_REFERENCE = ROOT / "assets" / "reference" / "welcome.stl"
DEFAULT_OUTPUT = ROOT / "3d" / "welcome-tube-round.stl"
DEFAULT_PREVIEW = ROOT / "3d" / "welcome-tube-round-preview.png"

MAX_INPUT_BYTES = 250 * 1024 * 1024
MAX_ACCESSOR_ITEMS = 20_000_000

COMPONENT_DTYPES = {
    5120: np.dtype("<i1"),
    5121: np.dtype("<u1"),
    5122: np.dtype("<i2"),
    5123: np.dtype("<u2"),
    5125: np.dtype("<u4"),
    5126: np.dtype("<f4"),
}
TYPE_WIDTHS = {
    "SCALAR": 1,
    "VEC2": 2,
    "VEC3": 3,
    "VEC4": 4,
    "MAT2": 4,
    "MAT3": 9,
    "MAT4": 16,
}


class ModelError(ValueError):
    """Raised when an input model is invalid or unsupported."""


def checked_bytes(path: Path) -> bytes:
    if not path.is_file():
        raise ModelError(f"Input file does not exist: {path}")
    size = path.stat().st_size
    if size <= 0 or size > MAX_INPUT_BYTES:
        raise ModelError(f"Input file size is outside the supported range: {size}")
    return path.read_bytes()


def read_glb(path: Path) -> tuple[dict[str, Any], bytes]:
    payload = checked_bytes(path)
    if len(payload) < 20:
        raise ModelError("GLB header is incomplete")

    magic, version, declared_size = struct.unpack_from("<4sII", payload, 0)
    if magic != b"glTF" or version != 2 or declared_size != len(payload):
        raise ModelError("File is not a valid glTF 2.0 binary")

    json_chunk: bytes | None = None
    bin_chunk: bytes | None = None
    cursor = 12
    while cursor < len(payload):
        if cursor + 8 > len(payload):
            raise ModelError("GLB chunk header is incomplete")
        chunk_size, chunk_type = struct.unpack_from("<I4s", payload, cursor)
        cursor += 8
        end = cursor + chunk_size
        if end > len(payload):
            raise ModelError("GLB chunk exceeds the declared file size")
        if chunk_type == b"JSON":
            json_chunk = payload[cursor:end]
        elif chunk_type == b"BIN\x00":
            bin_chunk = payload[cursor:end]
        cursor = end

    if json_chunk is None or bin_chunk is None:
        raise ModelError("GLB must contain JSON and BIN chunks")

    try:
        document = json.loads(json_chunk.rstrip(b" \x00").decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ModelError("GLB JSON metadata is invalid") from exc
    if not isinstance(document, dict):
        raise ModelError("GLB JSON root must be an object")
    return document, bin_chunk


def read_accessor(
    document: dict[str, Any], bin_chunk: bytes, accessor_index: int
) -> np.ndarray:
    accessors = document.get("accessors", [])
    views = document.get("bufferViews", [])
    if not isinstance(accessor_index, int) or not 0 <= accessor_index < len(accessors):
        raise ModelError("Accessor index is out of range")

    accessor = accessors[accessor_index]
    if "sparse" in accessor:
        raise ModelError("Sparse accessors are not supported")
    if accessor.get("normalized", False):
        raise ModelError("Normalized accessors are not supported")

    count = accessor.get("count")
    width = TYPE_WIDTHS.get(accessor.get("type"))
    dtype = COMPONENT_DTYPES.get(accessor.get("componentType"))
    view_index = accessor.get("bufferView")
    if (
        not isinstance(count, int)
        or count < 0
        or count > MAX_ACCESSOR_ITEMS
        or width is None
        or dtype is None
        or not isinstance(view_index, int)
        or not 0 <= view_index < len(views)
    ):
        raise ModelError("Accessor metadata is invalid or unsupported")

    view = views[view_index]
    if view.get("buffer", 0) != 0:
        raise ModelError("Only the embedded GLB buffer is supported")
    view_offset = view.get("byteOffset", 0)
    accessor_offset = accessor.get("byteOffset", 0)
    if not isinstance(view_offset, int) or not isinstance(accessor_offset, int):
        raise ModelError("Accessor offsets must be integers")

    packed_size = dtype.itemsize * width
    stride = view.get("byteStride", packed_size)
    if not isinstance(stride, int) or stride < packed_size:
        raise ModelError("Accessor byte stride is invalid")

    start = view_offset + accessor_offset
    required = 0 if count == 0 else (count - 1) * stride + packed_size
    view_length = view.get("byteLength")
    if (
        not isinstance(view_length, int)
        or start < view_offset
        or required > view_length - accessor_offset
        or start + required > len(bin_chunk)
    ):
        raise ModelError("Accessor data exceeds its buffer view")

    shape = (count,) if width == 1 else (count, width)
    strides = (stride,) if width == 1 else (stride, dtype.itemsize)
    return np.ndarray(
        shape=shape,
        dtype=dtype,
        buffer=bin_chunk,
        offset=start,
        strides=strides,
    ).copy()


def node_matrix(node: dict[str, Any]) -> np.ndarray:
    if "matrix" in node:
        values = np.asarray(node["matrix"], dtype=np.float64)
        if values.shape != (16,) or not np.isfinite(values).all():
            raise ModelError("Node matrix must contain 16 finite numbers")
        return values.reshape((4, 4), order="F")

    translation = np.asarray(node.get("translation", [0, 0, 0]), dtype=np.float64)
    rotation = np.asarray(node.get("rotation", [0, 0, 0, 1]), dtype=np.float64)
    scale = np.asarray(node.get("scale", [1, 1, 1]), dtype=np.float64)
    if (
        translation.shape != (3,)
        or rotation.shape != (4,)
        or scale.shape != (3,)
        or not np.isfinite(np.concatenate((translation, rotation, scale))).all()
    ):
        raise ModelError("Node transform is invalid")

    quaternion_length = np.linalg.norm(rotation)
    if quaternion_length <= 1e-12:
        raise ModelError("Node quaternion has zero length")
    x, y, z, w = rotation / quaternion_length
    rotation_matrix = np.array(
        [
            [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
            [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
            [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
        ],
        dtype=np.float64,
    )
    result = np.eye(4, dtype=np.float64)
    result[:3, :3] = rotation_matrix @ np.diag(scale)
    result[:3, 3] = translation
    return result


def glb_triangles(path: Path) -> tuple[np.ndarray, np.ndarray]:
    document, bin_chunk = read_glb(path)
    nodes = document.get("nodes", [])
    meshes = document.get("meshes", [])
    scenes = document.get("scenes", [])
    scene_index = document.get("scene", 0)
    if (
        not isinstance(nodes, list)
        or not isinstance(meshes, list)
        or not isinstance(scenes, list)
        or not isinstance(scene_index, int)
        or not 0 <= scene_index < len(scenes)
    ):
        raise ModelError("GLB scene metadata is invalid")

    vertices_parts: list[np.ndarray] = []
    face_parts: list[np.ndarray] = []

    def visit(node_index: int, parent: np.ndarray, ancestors: frozenset[int]) -> None:
        if not isinstance(node_index, int) or not 0 <= node_index < len(nodes):
            raise ModelError("Scene references an invalid node")
        if node_index in ancestors:
            raise ModelError("Scene graph contains a cycle")

        node = nodes[node_index]
        world = parent @ node_matrix(node)
        mesh_index = node.get("mesh")
        if mesh_index is not None:
            if not isinstance(mesh_index, int) or not 0 <= mesh_index < len(meshes):
                raise ModelError("Node references an invalid mesh")
            mesh = meshes[mesh_index]
            accessor_offsets: dict[int, int] = {}
            for primitive in mesh.get("primitives", []):
                if primitive.get("mode", 4) != 4:
                    raise ModelError("Only triangle primitives are supported")
                attributes = primitive.get("attributes", {})
                position_accessor = attributes.get("POSITION")
                if not isinstance(position_accessor, int):
                    raise ModelError("Triangle primitive has no POSITION accessor")

                if position_accessor not in accessor_offsets:
                    positions = read_accessor(document, bin_chunk, position_accessor)
                    if (
                        positions.ndim != 2
                        or positions.shape[1] != 3
                        or not np.issubdtype(positions.dtype, np.floating)
                        or not np.isfinite(positions).all()
                    ):
                        raise ModelError("POSITION accessor must contain finite VEC3 floats")
                    transformed = (
                        positions.astype(np.float64) @ world[:3, :3].T + world[:3, 3]
                    )
                    accessor_offsets[position_accessor] = sum(
                        part.shape[0] for part in vertices_parts
                    )
                    vertices_parts.append(transformed)

                if "indices" in primitive:
                    indices = read_accessor(document, bin_chunk, primitive["indices"])
                    if indices.ndim != 1 or not np.issubdtype(
                        indices.dtype, np.unsignedinteger
                    ):
                        raise ModelError("Triangle indices must be unsigned scalar values")
                    indices = indices.astype(np.int64)
                else:
                    positions_count = vertices_parts[-1].shape[0]
                    indices = np.arange(positions_count, dtype=np.int64)

                if indices.size % 3 != 0:
                    raise ModelError("Triangle index count must be divisible by three")
                local_vertex_count = read_accessor(
                    document, bin_chunk, position_accessor
                ).shape[0]
                if indices.size and (
                    int(indices.min()) < 0 or int(indices.max()) >= local_vertex_count
                ):
                    raise ModelError("Triangle index is outside the POSITION accessor")
                faces = indices.reshape((-1, 3))
                if np.linalg.det(world[:3, :3]) < 0:
                    faces = faces[:, [0, 2, 1]]
                face_parts.append(faces + accessor_offsets[position_accessor])

        next_ancestors = ancestors | {node_index}
        for child in node.get("children", []):
            visit(child, world, next_ancestors)

    scene_nodes = scenes[scene_index].get("nodes", [])
    for root_node in scene_nodes:
        visit(root_node, np.eye(4, dtype=np.float64), frozenset())

    if not vertices_parts or not face_parts:
        raise ModelError("GLB scene does not contain triangle geometry")
    vertices = np.concatenate(vertices_parts)
    faces = np.concatenate(face_parts)

    distinct = (
        (faces[:, 0] != faces[:, 1])
        & (faces[:, 1] != faces[:, 2])
        & (faces[:, 0] != faces[:, 2])
    )
    faces = faces[distinct]
    cross = np.cross(
        vertices[faces[:, 1]] - vertices[faces[:, 0]],
        vertices[faces[:, 2]] - vertices[faces[:, 0]],
    )
    faces = faces[np.linalg.norm(cross, axis=1) > 1e-12]
    if faces.size == 0:
        raise ModelError("GLB contains no non-degenerate triangles")
    return vertices, faces


def binary_stl_bounds(path: Path) -> tuple[np.ndarray, np.ndarray]:
    payload = checked_bytes(path)
    if len(payload) < 84:
        raise ModelError("Reference STL header is incomplete")
    triangle_count = struct.unpack_from("<I", payload, 80)[0]
    expected_size = 84 + triangle_count * 50
    if expected_size != len(payload) or triangle_count == 0:
        raise ModelError("Reference STL must be a non-empty binary STL")
    record_type = np.dtype(
        [("normal", "<f4", 3), ("vertices", "<f4", (3, 3)), ("attribute", "<u2")]
    )
    records = np.frombuffer(payload, dtype=record_type, offset=84, count=triangle_count)
    vertices = records["vertices"].reshape((-1, 3)).astype(np.float64)
    if not np.isfinite(vertices).all():
        raise ModelError("Reference STL contains non-finite coordinates")
    return vertices.min(axis=0), vertices.max(axis=0)


def fit_to_reference_width(
    vertices: np.ndarray, reference_min: np.ndarray, reference_max: np.ndarray
) -> tuple[np.ndarray, float]:
    source_min = vertices.min(axis=0)
    source_max = vertices.max(axis=0)
    source_width = source_max[0] - source_min[0]
    target_width = reference_max[0] - reference_min[0]
    if source_width <= 0 or target_width <= 0:
        raise ModelError("Source and reference models must have positive width")

    scale = target_width / source_width
    fitted = (vertices - source_min) * scale
    fitted[:, 0] += reference_min[0]
    fitted[:, 1] += reference_min[1]
    fitted[:, 2] -= fitted[:, 2].min()
    return fitted, scale


def orient_faces_outward(vertices: np.ndarray, faces: np.ndarray) -> np.ndarray:
    triangles = vertices[faces]
    signed_volume = np.einsum(
        "ij,ij->i", triangles[:, 0], np.cross(triangles[:, 1], triangles[:, 2])
    ).sum() / 6.0
    if signed_volume < 0:
        return faces[:, [0, 2, 1]]
    return faces


def topology_report(
    vertices: np.ndarray, faces: np.ndarray, tolerance: float = 1e-5
) -> dict[str, int]:
    quantized = np.rint(vertices / tolerance).astype(np.int64)
    _, welded = np.unique(quantized, axis=0, return_inverse=True)
    welded_faces = welded[faces]
    edges = np.concatenate(
        (
            welded_faces[:, [0, 1]],
            welded_faces[:, [1, 2]],
            welded_faces[:, [2, 0]],
        )
    )
    edges.sort(axis=1)
    _, counts = np.unique(edges, axis=0, return_counts=True)
    return {
        "welded_vertices": int(welded.max()) + 1,
        "boundary_edges": int(np.count_nonzero(counts == 1)),
        "nonmanifold_edges": int(np.count_nonzero(counts > 2)),
    }


def write_binary_stl(path: Path, vertices: np.ndarray, faces: np.ndarray) -> None:
    triangles = vertices[faces]
    normals = np.cross(
        triangles[:, 1] - triangles[:, 0], triangles[:, 2] - triangles[:, 0]
    )
    lengths = np.linalg.norm(normals, axis=1)
    normals /= lengths[:, None]

    record_type = np.dtype(
        [("normal", "<f4", 3), ("vertices", "<f4", (3, 3)), ("attribute", "<u2")]
    )
    records = np.empty(faces.shape[0], dtype=record_type)
    records["normal"] = normals.astype(np.float32)
    records["vertices"] = triangles.astype(np.float32)
    records["attribute"] = 0

    path.parent.mkdir(parents=True, exist_ok=True)
    header = b"Round Pacifico Welcome tube; millimetres".ljust(80, b"\x00")
    with path.open("wb") as stream:
        stream.write(header)
        stream.write(struct.pack("<I", faces.shape[0]))
        stream.write(records.tobytes())


def render_preview(
    path: Path, vertices: np.ndarray, faces: np.ndarray, width: int = 1400
) -> None:
    triangles = vertices[faces]
    face_normals = np.cross(
        triangles[:, 1] - triangles[:, 0], triangles[:, 2] - triangles[:, 0]
    )
    face_normals /= np.linalg.norm(face_normals, axis=1)[:, None]

    screen_x = vertices[:, 0]
    screen_y = 0.86 * vertices[:, 1] + 0.50 * vertices[:, 2]
    depth = -0.50 * vertices[:, 1] + 0.86 * vertices[:, 2]
    projected = np.column_stack((screen_x, screen_y))

    bounds_min = projected.min(axis=0)
    bounds_max = projected.max(axis=0)
    span = bounds_max - bounds_min
    margin = 55
    height = max(360, int((width - 2 * margin) * span[1] / span[0] + 2 * margin))
    scale = min((width - 2 * margin) / span[0], (height - 2 * margin) / span[1])
    pixels = (projected - bounds_min) * scale
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
    order = np.argsort(face_depth)
    for face_index in order:
        if not visible[face_index]:
            continue
        brightness = float(
            np.clip(0.32 + 0.68 * np.dot(face_normals[face_index], light), 0.20, 1)
        )
        colour = (
            int(255 * brightness),
            int(139 * brightness),
            int(0 * brightness),
        )
        polygon = [tuple(pixels[index]) for index in faces[face_index]]
        draw.polygon(polygon, fill=colour)

    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, optimize=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export the round Welcome GLB at the width of a reference STL."
    )
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--reference", type=Path, default=DEFAULT_REFERENCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--preview", type=Path, default=DEFAULT_PREVIEW)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    vertices, faces = glb_triangles(args.source.resolve())
    reference_min, reference_max = binary_stl_bounds(args.reference.resolve())
    vertices, scale = fit_to_reference_width(vertices, reference_min, reference_max)
    faces = orient_faces_outward(vertices, faces)
    report = topology_report(vertices, faces)
    if report["boundary_edges"] or report["nonmanifold_edges"]:
        raise ModelError(
            "Tube mesh is not closed and manifold "
            f"(boundary={report['boundary_edges']}, "
            f"nonmanifold={report['nonmanifold_edges']})"
        )

    write_binary_stl(args.output.resolve(), vertices, faces)
    render_preview(args.preview.resolve(), vertices, faces)
    size = vertices.max(axis=0) - vertices.min(axis=0)
    print(
        json.dumps(
            {
                "output": str(args.output.resolve()),
                "preview": str(args.preview.resolve()),
                "triangles": int(faces.shape[0]),
                "size_mm": [round(float(value), 3) for value in size],
                "uniform_scale": round(float(scale), 6),
                **report,
            },
            indent=2,
        )
    )

    # TODO: If a different final print size is wanted later, add a --width-mm
    # option and keep the scaling uniform so the tube remains perfectly round.
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except ModelError as error:
        raise SystemExit(f"Export failed: {error}") from None
