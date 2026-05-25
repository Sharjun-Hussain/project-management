import os
import re

files_and_icons = {
    'app/app/page.jsx': ('LayoutDashboard', 'Dashboard'),
    'app/app/products/page.jsx': ('Package', 'Products'),
    'app/app/categories/page.jsx': ('Layers', 'Category Manager'),
    'app/app/sub-categories/page.jsx': ('Layers', 'Sub Category Manager'),
    'app/app/brand/page.jsx': ('Tag', 'Brand Manager'),
    'app/app/orders/page.jsx': ('ShoppingCart', 'Orders'),
    'app/app/reviews/page.jsx': ('MessageSquare', 'Reviews'),
    'app/app/contacts/page.jsx': ('Mail', 'Customer Inquiries'),
    'app/app/coupons/page.jsx': ('Tag', 'Coupons'),
    'app/app/customers/page.jsx': ('Users', 'Customers'),
    'app/app/users/page.jsx': ('ShieldCheck', 'Users'),
    'app/app/settings/page.jsx': ('Settings', 'Settings'),
    'app/app/logs/page.jsx': ('History', 'Activity Logs'),
    'app/app/roles/page.jsx': ('ShieldCheck', 'Roles Management'),
    'app/app/permissions/page.jsx': ('Lock', 'Permissions Management')
}

base_dir = '/home/joon/foreign Emporium/dashboard'

for rel_path, (icon, title_text) in files_and_icons.items():
    file_path = os.path.join(base_dir, rel_path)
    if not os.path.exists(file_path):
        print(f"Skipping {file_path}, does not exist")
        continue

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update lucide-react import
    # Look for import { ... } from "lucide-react";
    lucide_import_match = re.search(r'import\s+\{([^}]+)\}\s+from\s+["\']lucide-react["\'];', content)
    if lucide_import_match:
        imports_str = lucide_import_match.group(1)
        # Check if icon is already imported
        if not re.search(r'\b' + icon + r'\b', imports_str):
            new_imports = imports_str.strip()
            if new_imports and not new_imports.endswith(','):
                new_imports += ','
            new_imports += f' {icon}'
            content = content[:lucide_import_match.start(1)] + new_imports + content[lucide_import_match.end(1):]
    else:
        # add import at the top
        content = f'import {{ {icon} }} from "lucide-react";\n' + content

    # 2. Find <h1> tag
    # Using regex to match <h1>...</h1> including across newlines
    # We want to match: <h1 className="...">\n  Title\n</h1>
    # And replace with: <h1 className="... flex items-center gap-3">\n  <Icon className="w-8 h-8 text-indigo-600" />\n  Title\n</h1>
    
    # We will use a regex that finds <h1 className="([^"]*)">
    
    def replacer(match):
        class_name = match.group(1)
        if "flex items-center" not in class_name:
            class_name += " flex items-center gap-3"
        inner_html = match.group(2)
        
        # If the icon is already present, don't add it again
        if f'<{icon}' in inner_html:
            return match.group(0)
            
        new_inner = f'\n              <{icon} className="w-8 h-8 text-indigo-600" />{inner_html}'
        return f'<h1 className="{class_name}">{new_inner}</h1>'

    # Match <h1 className="...">...</h1>
    # Notice we use (.*?) for the inner content to be non-greedy
    new_content = re.sub(r'<h1\s+className=["\']([^"\']+)["\']>(.*?)</h1>', replacer, content, flags=re.DOTALL)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file_path}")
    else:
        print(f"No changes made to {file_path}")

