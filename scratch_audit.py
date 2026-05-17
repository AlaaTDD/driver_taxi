import os
import re

def find_hardcoded_colors(dir_path):
    hardcoded_pattern = re.compile(r'(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))')
    ignore_files = ['globals.css']
    results = []
    
    for root, dirs, files in os.walk(dir_path):
        for file in files:
            if file.endswith(('.tsx', '.ts', '.css')) and file not in ignore_files:
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                        for i, line in enumerate(lines):
                            matches = hardcoded_pattern.findall(line)
                            if matches:
                                results.append(f"{file_path}:{i+1} -> {matches}")
                except Exception as e:
                    pass
    return results

if __name__ == "__main__":
    colors = find_hardcoded_colors("/Volumes/alaaMac/driverr/taxi_web/src")
    with open("/Volumes/alaaMac/driverr/taxi_web/color_audit.txt", "w") as f:
        for c in colors:
            f.write(c + "\n")
    print(f"Found {len(colors)} lines with hardcoded colors.")
