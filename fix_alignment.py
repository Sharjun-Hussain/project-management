import os
import re

files = [
    'app/app/page.jsx',
    'app/app/products/page.jsx',
    'app/app/categories/page.jsx',
    'app/app/sub-categories/page.jsx',
    'app/app/brand/page.jsx',
    'app/app/orders/page.jsx',
    'app/app/reviews/page.jsx',
    'app/app/contacts/page.jsx',
    'app/app/coupons/page.jsx',
    'app/app/customers/page.jsx',
    'app/app/users/page.jsx',
    'app/app/settings/page.jsx',
    'app/app/logs/page.jsx',
    'app/app/roles/page.jsx',
    'app/app/permissions/page.jsx'
]

base_dir = '/home/joon/foreign Emporium/dashboard'

for rel_path in files:
    file_path = os.path.join(base_dir, rel_path)
    if not os.path.exists(file_path):
        continue

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Reduce h1 text size from text-3xl to text-2xl
    def h1_replacer(match):
        h1_tag = match.group(0)
        return h1_tag.replace('text-3xl', 'text-2xl')
    
    new_content = re.sub(r'<h1[^>]*>.*?</h1\s*>', h1_replacer, content, flags=re.DOTALL)

    # 2. Change md:items-end / md:items-start to md:items-center in the header row
    # The header row looks like <div className="... flex flex-col md:flex-row md:items-end justify-between ...">
    # We can just replace md:items-end and md:items-start with md:items-center everywhere in the file if we are careful,
    # or specifically look for md:flex-row
    
    def row_replacer(match):
        row_tag = match.group(0)
        row_tag = row_tag.replace('md:items-end', 'md:items-center').replace('md:items-start', 'md:items-center')
        return row_tag

    new_content = re.sub(r'<div[^>]*className=["\'][^"\']*md:flex-row[^"\']*["\'][^>]*>', row_replacer, new_content)

    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file_path}")
    else:
        print(f"No changes made to {file_path}")
