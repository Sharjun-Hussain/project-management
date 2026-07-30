import os

base_path = r"d:\Projects\project-maintanance\foreign-emporium-dashboard\app\app"

def fix_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    # Fix JSX elements
    new_content = new_content.replace("<VPS Hosting", "<VPSHosting")
    new_content = new_content.replace("<Alert Logs", "<AlertLogs")
    new_content = new_content.replace("<Support Tickets", "<SupportTickets")
    new_content = new_content.replace("<Support Ticket", "<SupportTicket")
    new_content = new_content.replace("<Sub Categories", "<SubCategories")
    
    # Fix functions
    new_content = new_content.replace("function VPS Hosting", "function VPSHosting")
    new_content = new_content.replace("function Alert Logs", "function AlertLogs")
    new_content = new_content.replace("function Support Tickets", "function SupportTickets")
    new_content = new_content.replace("function Support Ticket", "function SupportTicket")
    new_content = new_content.replace("function Sub Categories", "function SubCategories")
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {file_path}")

for root, _, files in os.walk(base_path):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            fix_file(os.path.join(root, file))
