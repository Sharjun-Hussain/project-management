import os
import re

files_and_icons = [
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

for rel_path in files_and_icons:
    file_path = os.path.join(base_dir, rel_path)
    if not os.path.exists(file_path):
        print(f"Skipping {file_path}, does not exist")
        continue

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # The regex to find:
    # <h1 className="... flex items-center gap-3">
    #   <Icon className="w-8 h-8 text-indigo-600" />
    #   Title
    # </h1>
    # <p className="...">
    #   Subtitle
    # </p>
    
    # We will use re.sub with a custom replacer
    
    pattern = r'<h1\s+className=["\']([^"\']+)["\']>\s*<([A-Z][a-zA-Z0-9]*)\s+className=["\'][^"\']+["\']\s*/>\s*([^<]+?)\s*</h1>\s*<p\s+className=["\']([^"\']+)["\']>\s*([^<]+?)\s*</p>'

    def replacer(match):
        h1_class = match.group(1)
        icon_name = match.group(2)
        title_text = match.group(3).strip()
        p_class = match.group(4)
        subtitle_text = match.group(5).strip()
        
        # Remove the flex items-center gap-3 from h1
        h1_class = h1_class.replace('flex items-center gap-3', '').strip()
        # Adjust text size
        h1_class = re.sub(r'text-4xl', 'text-3xl', h1_class)
        
        # Build the new structure
        new_struct = f'''<div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/50 shadow-sm mt-0.5">
                <{icon_name} className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="{h1_class}">{title_text}</h1>
                <p className="{p_class}">{subtitle_text}</p>
              </div>
            </div>'''
            
        # We need to maintain the indentation if possible, but for JSX it's fine.
        return new_struct

    new_content = re.sub(pattern, replacer, content)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file_path}")
    else:
        print(f"No changes made to {file_path}")

