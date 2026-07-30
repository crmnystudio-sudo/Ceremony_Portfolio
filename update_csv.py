import csv
import os
from pathlib import Path

# Read CSV (handle BOM)
csv_file = 'data/projects.csv'
rows = []
with open(csv_file, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

# Build project mapping
projects_webprepped = Path('Projects_WebPrepped')
cerem_projects = {p.name: f"Projects_WebPrepped/CeremonyStudio/{p.name}" 
                  for p in projects_webprepped.glob('CeremonyStudio/*') if p.is_dir()}
cp_projects = {p.name: f"Projects_WebPrepped/CreativePipeline/{p.name}" 
               for p in projects_webprepped.glob('CreativePipeline/*') if p.is_dir()}

all_projects = {**cerem_projects, **cp_projects}

print(f"Found {len(all_projects)} projects in Projects_WebPrepped")

# Update rows
updated = 0
for row in rows:
    title = row.get('title', '').strip()
    
    # Try to match by looking for P#### pattern
    for proj_code, proj_path in all_projects.items():
        if proj_code[:5] in title or proj_code[:4] in title:
            row['thumbnail_path'] = f"{proj_path}/ProjectThumb/"
            row['gallery_path'] = f"{proj_path}/Gallery/"
            row['video_link'] = f"{proj_path}/Video/"
            updated += 1
            print(f"  ✓ {proj_code}: {title}")
            break

# Write back
with open(csv_file, 'w', encoding='utf-8', newline='') as f:
    fieldnames = list(rows[0].keys())
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"\n✅ Updated {updated} projects in CSV")
