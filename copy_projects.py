import shutil, os

src = r'd:\Projects\project-maintanance\foreign-emporium-dashboard\app\app\products'
dst = r'd:\Projects\project-maintanance\foreign-emporium-dashboard\app\app\projects'

if not os.path.exists(dst):
    shutil.copytree(src, dst)
    print(f"Copied {src} to {dst}")

try:
    shutil.rmtree(src)
    print(f"Deleted {src}")
except Exception as e:
    print('Could not remove src:', e)

exec(open('rename_content.py').read())
