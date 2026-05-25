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
        continue

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update lucide-react import
    lucide_import_match = re.search(r'import\s+\{([^}]+)\}\s+from\s+["\']lucide-react["\'];', content)
    if lucide_import_match:
        imports_str = lucide_import_match.group(1)
        if not re.search(r'\b' + icon + r'\b', imports_str):
            new_imports = imports_str.strip()
            if new_imports and not new_imports.endswith(','):
                new_imports += ','
            new_imports += f' {icon}'
            content = content[:lucide_import_match.start(1)] + new_imports + content[lucide_import_match.end(1):]
    else:
        content = f'import {{ {icon} }} from "lucide-react";\n' + content

    # 2. Match <h1>...</h1> followed by <p>...</p> with possible intermediate spaces/divs
    pattern = r'(<h1[^>]*>.*?</h1>\s*(?:</div>\s*)?<p[^>]*>.*?</p>)'
    
    def replacer(match):
        block = match.group(1)
        h1_match = re.search(r'<h1(?:\s+className=["\']([^"\']*)["\'])?[^>]*>(.*?)</h1>', block, re.DOTALL)
        p_match = re.search(r'<p(?:\s+className=["\']([^"\']*)["\'])?[^>]*>(.*?)</p>', block, re.DOTALL)
        
        if not h1_match or not p_match:
            return block
            
        h1_class = h1_match.group(1) or ""
        h1_class = h1_class.replace('flex items-center gap-3', '').replace('flex items-center gap-2', '').strip()
        
        # In case the h1 already has the icon injected from an older run
        h1_text_raw = h1_match.group(2)
        h1_text = re.sub(r'<[A-Z][a-zA-Z0-9]*[^>]*/>', '', h1_text_raw).strip()
        h1_text = re.sub(r'<[^>]+>', '', h1_text).strip()
        if not h1_text:
            h1_text = title_text
            
        p_class = p_match.group(1) or ""
        p_text = p_match.group(2).strip()
        
        h1_class = h1_class.replace('text-4xl', 'text-3xl').replace('mb-2', 'mb-1')
        
        new_block = f'''<div className="flex gap-4 items-stretch">
            <div className="w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex flex-col items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/50 shadow-sm py-2">
              <{icon} className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex flex-col justify-center py-1">
              <h1 className="{h1_class}">{h1_text}</h1>
              <p className="{p_class}">{p_text}</p>
            </div>
          </div>'''
        return new_block

    new_content = re.sub(pattern, replacer, content, count=1, flags=re.DOTALL)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file_path}")
    else:
        print(f"No changes made to {file_path}")
