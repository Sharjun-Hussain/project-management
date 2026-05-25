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

    # The tagline is directly after the h1.
    # We find: </h1> followed by spaces, then <p className="
    # and insert `text-sm ` if it doesn't have it already.
    
    def replacer(match):
        h1_closing = match.group(1)
        spaces = match.group(2)
        p_start = match.group(3)
        class_str = match.group(4)
        
        if 'text-sm' not in class_str and 'text-xs' not in class_str:
            class_str = 'text-sm ' + class_str
            
        return f'{h1_closing}{spaces}{p_start}{class_str}'

    pattern = r'(</h1>)(\s*)(<p\s+className=["\'])([^"\']*)'
    
    new_content = re.sub(pattern, replacer, content)

    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file_path}")
    else:
        print(f"No changes made to {file_path}")
