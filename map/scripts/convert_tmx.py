#!/usr/bin/env python3
"""
Convert Tiled TMX → game map-data.ts (direct, no JSON export needed).
Reads TMX XML + CSV layers, generates TypeScript with raw GIDs.

Walkability rules (2026-08-04 user-confirmed):
  - Ground layer: default walkable (100%)
  - Overlay layer: default blocked (lamps, signs, trees — all solid)
  - Objects layer: BOTTOM-EDGE DETECTION — only the bottom row is blocked
    - objects[y][x] exists AND no object below → bottom edge → blocked
    - objects[y][x] exists AND object below → upper part → walkable (walk behind)
  - Tile walkable property: overrides layer default (highest priority)

Usage: python3 convert_tmx.py [input.tmx] [output.ts]
Defaults: input=map/maps/town.tmx, output=client/src/game/map-data.ts
"""

import xml.etree.ElementTree as ET
import os
import sys

TMX_PATH = sys.argv[1] if len(sys.argv) > 1 else "map/maps/town.tmx"
OUTPUT = sys.argv[2] if len(sys.argv) > 2 else "client/src/game/map-data.ts"

tree = ET.parse(TMX_PATH)
root = tree.getroot()

map_w = int(root.get("width"))
map_h = int(root.get("height"))
tile_w = int(root.get("tilewidth"))
tile_h = int(root.get("tileheight"))
tmx_dir = os.path.dirname(os.path.abspath(TMX_PATH))

print(f"Map: {map_w}x{map_h}, tile: {tile_w}x{tile_h}")

# Collect walkable tile GIDs from inline tileset properties
walkable_gids = set()
for ts_elem in root.findall("tileset"):
    firstgid = int(ts_elem.get("firstgid", 1))
    for tile_elem in ts_elem.findall("tile"):
        tile_id = int(tile_elem.get("id"))
        gid = firstgid + tile_id
        props = {}
        for p in tile_elem.findall(".//property"):
            props[p.get("name")] = p.get("value")
        if props.get("walkable") == "true":
            walkable_gids.add(gid)

# Also check external TSX files
for ts_elem in root.findall("tileset"):
    source = ts_elem.get("source")
    if not source:
        continue
    firstgid = int(ts_elem.get("firstgid", 1))
    tsx_path = os.path.normpath(os.path.join(tmx_dir, source))
    if os.path.exists(tsx_path):
        tsx_tree = ET.parse(tsx_path)
        tsx_root = tsx_tree.getroot()
        for tile_elem in tsx_root.findall("tile"):
            tile_id = int(tile_elem.get("id"))
            gid = firstgid + tile_id
            props = {}
            for p in tile_elem.findall(".//property"):
                props[p.get("name")] = p.get("value")
            if props.get("walkable") == "true":
                walkable_gids.add(gid)

print(f"Walkable GIDs: {len(walkable_gids)}")


def parse_csv_layer(data_elem):
    csv_text = data_elem.text.strip()
    rows = []
    for line in csv_text.split("\n"):
        line = line.strip().rstrip(",")
        if line:
            row = [int(x.strip()) for x in line.split(",") if x.strip()]
            rows.append(row)
    return rows


# Parse layers
layers = {}
for layer_elem in root.findall("layer"):
    name = layer_elem.get("name")
    data_elem = layer_elem.find("data")
    encoding = data_elem.get("encoding", "")
    if encoding == "csv":
        layers[name] = parse_csv_layer(data_elem)
    else:
        rows = []
        row = []
        for tile in data_elem.findall("tile"):
            row.append(int(tile.get("gid", 0)))
            if len(row) == map_w:
                rows.append(row)
                row = []
        layers[name] = rows
    filled = sum(1 for r in layers[name] for v in r if v != 0)
    print(f"  Layer '{name}': {len(layers[name])} rows, {filled} tiles placed")

ground = layers.get("ground", [[0] * map_w for _ in range(map_h)])
objects = layers.get("objects", [[0] * map_w for _ in range(map_h)])
overlay = layers.get("overlay", [[0] * map_w for _ in range(map_h)])

# Generate collision data with bottom-edge detection
collision = []
blocked_count = 0
walkable_count = 0

for y in range(map_h):
    collision.append([])
    for x in range(map_w):
        g = ground[y][x]
        o = objects[y][x]
        v = overlay[y][x]

        # Empty cell → walkable
        if g == 0 and o == 0 and v == 0:
            collision[y].append(0)
            walkable_count += 1
            continue

        # Check tile walkable property (highest priority)
        active_gid = v if v != 0 else (o if o != 0 else g)
        if active_gid in walkable_gids:
            collision[y].append(0)
            walkable_count += 1
            continue

        # Overlay layer → blocked (lamps, signs, trees, cars)
        if v != 0:
            collision[y].append(1)
            blocked_count += 1
            continue

        # Objects layer → bottom edge detection
        if o != 0:
            has_object_below = (y + 1 < map_h) and (objects[y + 1][x] != 0)
            if has_object_below:
                # Upper part → walkable (player walks behind, z-sort handles occlusion)
                collision[y].append(0)
                walkable_count += 1
            else:
                # Bottom edge → blocked (collision boundary)
                collision[y].append(1)
                blocked_count += 1
            continue

        # Ground only → walkable
        collision[y].append(0)
        walkable_count += 1

print(f"\nCollision: {walkable_count} walkable, {blocked_count} blocked")


# Generate TypeScript
def fmt_grid(name, data):
    lines = [f"export const {name}: number[][] = ["]
    for row in data:
        lines.append("  [" + ",".join(str(v) for v in row) + "],")
    lines.append("]")
    return "\n".join(lines)


ts = f"""// Auto-generated by map/scripts/convert_tmx.py — DO NOT EDIT
// Source: {os.path.basename(TMX_PATH)}
// Tile indices are raw GIDs (0 = empty, positive = global tile ID)

export const MAP_WIDTH = {map_w}
export const MAP_HEIGHT = {map_h}
export const TILE_SIZE = {tile_w}

{fmt_grid("GROUND_DATA", ground)}

{fmt_grid("OBJECT_DATA", objects)}

{fmt_grid("OVERLAY_DATA", overlay)}

{fmt_grid("COLLISION_DATA", collision)}

export function isWalkable(tileX: number, tileY: number): boolean {{
  if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) return false
  return COLLISION_DATA[tileY]?.[tileX] === 0
}}
"""

os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
with open(OUTPUT, "w") as f:
    f.write(ts)

print(f"\nWritten: {OUTPUT}")
print(f"Size: {os.path.getsize(OUTPUT)} bytes")
