import os
import re
import json
from collections import defaultdict
import math

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    if len(hex_color) == 3:
        hex_color = ''.join([c*2 for c in hex_color])
    if len(hex_color) == 4:
        hex_color = ''.join([c*2 for c in hex_color])[:6]
    if len(hex_color) == 8:
        hex_color = hex_color[:6]
    try:
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    except ValueError:
        return None

def color_distance(rgb1, rgb2):
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(rgb1, rgb2)))

def analyze_colors(src_dir):
    color_pattern = re.compile(r'#([0-9a-fA-F]{3,8})\b')
    colors = defaultdict(list)

    for root, _, files in os.walk(src_dir):
        for file in files:
            if file.endswith(('.tsx', '.ts', '.css')):
                file_path = os.path.join(root, file)
                with open(file_path, 'r', encoding='utf-8') as f:
                    try:
                        content = f.read()
                        matches = color_pattern.findall(content)
                        for match in matches:
                            hex_val = '#' + match.lower()
                            colors[hex_val].append(file_path)
                    except Exception as e:
                        print(f"Error reading {file_path}: {e}")

    unique_colors = list(colors.keys())
    groups = []
    threshold = 30  # Adjust as needed for "similarity"

    visited = set()
    for c1 in unique_colors:
        if c1 in visited:
            continue
        group = [c1]
        visited.add(c1)
        rgb1 = hex_to_rgb(c1)
        if not rgb1: continue
        
        for c2 in unique_colors:
            if c2 not in visited:
                rgb2 = hex_to_rgb(c2)
                if rgb2 and color_distance(rgb1, rgb2) < threshold:
                    group.append(c2)
                    visited.add(c2)
        groups.append(group)

    result = {
        "total_unique_colors": len(unique_colors),
        "suggested_groups": [],
        "color_locations": {k: list(set(v)) for k, v in colors.items()}
    }

    for i, group in enumerate(groups):
        if not group: continue
        # Calculate an average color for the group
        r, g, b = 0, 0, 0
        valid_count = 0
        for c in group:
            rgb = hex_to_rgb(c)
            if rgb:
                r += rgb[0]
                g += rgb[1]
                b += rgb[2]
                valid_count += 1
        if valid_count > 0:
            avg_hex = f"#{int(r/valid_count):02x}{int(g/valid_count):02x}{int(b/valid_count):02x}"
            result["suggested_groups"].append({
                "variable_name": f"--color-group-{i+1}",
                "average_hex": avg_hex,
                "original_colors": group,
                "occurrences": sum(len(colors[c]) for c in group)
            })

    result["suggested_groups"].sort(key=lambda x: x["occurrences"], reverse=True)

    with open('.agents/scratch/color_analysis_grouped.json', 'w') as f:
        json.dump(result, f, indent=2)

if __name__ == "__main__":
    analyze_colors('src')
