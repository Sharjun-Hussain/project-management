import os
import re

base_path = r"d:\Projects\project-maintanance\foreign-emporium-dashboard\app\app"

def fix_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find export default function (Name)
    def replacer(match):
        # Remove spaces and hyphens from the component name
        func_name = match.group(1).replace(" ", "").replace("-", "")
        return f"export default function {func_name}("
        
    # Match something like "export default function VPS HostingLayout("
    new_content = re.sub(r"export default function\s+([A-Za-z0-9\- ]+?)\s*\(", replacer, content)
    
    def replacer2(match):
        func_name = match.group(1).replace(" ", "").replace("-", "")
        return f"function {func_name}("
        
    # Match standard functions just in case
    new_content = re.sub(r"function\s+([A-Za-z0-9\- ]+?)\s*\(", replacer2, new_content)

    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {file_path}")

for root, _, files in os.walk(base_path):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            fix_file(os.path.join(root, file))
