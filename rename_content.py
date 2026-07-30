import os
import re

base_path = r"d:\Projects\project-maintanance\foreign-emporium-dashboard\app\app"

mappings = {
    "clients": [
        ("Customers", "Clients"), ("customers", "clients"),
        ("Customer", "Client"), ("customer", "client")
    ],
    "projects": [
        ("Products", "Projects"), ("products", "projects"),
        ("Product", "Project"), ("product", "project")
    ],
    "vps": [
        ("Categories", "VPS Hosting"), ("categories", "vps"),
        ("Category", "VPS"), ("category", "vps")
    ],
    "domains": [
        ("Sub Categories", "Domains"), ("Sub-Categories", "Domains"),
        ("sub-categories", "domains"), ("Subcategory", "Domain"),
        ("subcategory", "domain"), ("SubCategory", "Domain"),
        ("subCategory", "domain")
    ],
    "licenses": [
        ("Brands", "Licenses"), ("brands", "licenses"),
        ("Brand", "License"), ("brand", "license")
    ],
    "renewals": [
        ("Orders", "Renewals"), ("orders", "renewals"),
        ("Order", "Renewal"), ("order", "renewal")
    ],
    "alerts": [
        ("Reviews", "Alert Logs"), ("reviews", "alerts"),
        ("Review", "Alert"), ("review", "alert")
    ],
    "support": [
        ("Contacts", "Support Tickets"), ("contacts", "support"),
        ("Contact", "Support Ticket"), ("contact", "support_ticket"),
        ("Inquiries", "Support Tickets"), ("inquiries", "support_tickets"),
        ("Inquiry", "Support Ticket"), ("inquiry", "support_ticket")
    ]
}

def process_directory():
    for folder, replacements in mappings.items():
        folder_path = os.path.join(base_path, folder)
        if not os.path.exists(folder_path):
            print(f"Skipping {folder_path}, not found.")
            continue
        
        for root, _, files in os.walk(folder_path):
            for file in files:
                if file.endswith('.jsx') or file.endswith('.js'):
                    file_path = os.path.join(root, file)
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    new_content = content
                    for old, new in replacements:
                        new_content = new_content.replace(old, new)
                    
                    # Restore API endpoints that might have been accidentally changed
                    new_content = new_content.replace("/admin/clients", "/admin/customers")
                    new_content = new_content.replace("/admin/projects", "/admin/products")
                    new_content = new_content.replace("/admin/vps", "/admin/categories")
                    new_content = new_content.replace("/admin/domains", "/admin/sub-categories")
                    new_content = new_content.replace("/admin/licenses", "/admin/brands")
                    new_content = new_content.replace("/admin/renewals", "/admin/orders")
                    new_content = new_content.replace("/admin/alerts", "/admin/reviews")
                    new_content = new_content.replace("/admin/support_tickets", "/admin/contacts") 
                    new_content = new_content.replace("/admin/support", "/admin/contacts")
                    
                    if new_content != content:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"Updated {file_path}")

process_directory()
print("Done bulk renaming.")
