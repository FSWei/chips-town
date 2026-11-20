#!/usr/bin/env python3
"""
将 tile-map-editor 整理好的布局转换为整齐的 tileset 图。
用法: python3 map/scripts/build_tileset.py
"""

import json
from PIL import Image

# Paths
TILE_MAP_JSON = "tools/tile-map.json"
ORIGINAL_TILESET = "map/tilesets/cleancity-tilemap.png"
OUTPUT_IMAGE = "map/tilesets/cleancity-organized.png"
OUTPUT_TSX = "map/tilesets/cleancity-organized.tsx"

TILE = 16  # tile size in pixels
ORIG_COLS = 40  # original tileset columns

# Load the organized layout
with open(TILE_MAP_JSON) as f:
    data = json.load(f)

grid = data["grid"]
tsW = data["mapWidth"]   # 40
tsH = data["mapHeight"]  # 30

print(f"Layout: {tsW}x{tsH}, tile size: {data['tileSize']}")

# Load original tileset
orig = Image.open(ORIGINAL_TILESET)
print(f"Original tileset: {orig.size}")

# Create new image
new_img = Image.new("RGBA", (tsW * TILE, tsH * TILE), (0, 0, 0, 0))

# Copy tiles according to the organized layout
filled = 0
for r in range(tsH):
    for c in range(tsW):
        idx = grid[r][c]
        if idx < 0:
            continue
        # Source tile position in original tileset
        src_c = idx % ORIG_COLS
        src_r = idx // ORIG_COLS
        # Crop from original
        tile = orig.crop((src_c * TILE, src_r * TILE, (src_c + 1) * TILE, (src_r + 1) * TILE))
        # Paste into new image at organized position
        new_img.paste(tile, (c * TILE, r * TILE))
        filled += 1

new_img.save(OUTPUT_IMAGE)
print(f"Saved organized tileset: {OUTPUT_IMAGE} ({tsW*TILE}x{tsH*TILE}, {filled} tiles)")

# Generate TSX file for Tiled
tsx = f"""<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.10" tiledversion="1.10.2" name="cleancity-organized" tilewidth="{TILE}" tileheight="{TILE}" tilecount="{tsW * tsH}" columns="{tsW}">
 <image source="cleancity-organized.png" width="{tsW * TILE}" height="{tsH * TILE}"/>
</tileset>
"""
with open(OUTPUT_TSX, "w") as f:
    f.write(tsx)
print(f"Saved tileset definition: {OUTPUT_TSX}")

# Also copy into maps/tilesets/ for Tiled project
import shutil
shutil.copy2(OUTPUT_IMAGE, "map/maps/tilesets/cleancity-organized.png")
shutil.copy2(OUTPUT_TSX, "map/maps/tilesets/cleancity-organized.tsx")
print("Copied to maps/tilesets/ for Tiled project")
