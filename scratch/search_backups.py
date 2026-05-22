import os

appdata = os.environ.get('APPDATA', '')
localappdata = os.environ.get('LOCALAPPDATA', '')

search_dirs = []
if appdata:
    search_dirs.append(os.path.join(appdata, "Code", "Backups"))
    search_dirs.append(os.path.join(appdata, "Cursor", "Backups"))
if localappdata:
    search_dirs.append(os.path.join(localappdata, "Programs", "cursor", "Backups"))

print("Searching in backup directories:")
for d in search_dirs:
    print(f" - {d}")

keyword = "v2DestReviewPanel"
found = False

for d in search_dirs:
    if os.path.exists(d):
        for root, dirs, files in os.walk(d):
            for file in files:
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        if keyword in content:
                            print(f"FOUND KEYWORD IN BACKUP: {filepath}!")
                            print(f"File size: {len(content)} characters.")
                            out_path = r"d:\D_n_mới\WanderViet_1\scratch\recovered_editor_backup.txt"
                            with open(out_path, 'w', encoding='utf-8') as out_f:
                                out_f.write(content)
                            print(f"Successfully recovered to {out_path}!")
                            found = True
                except Exception as e:
                    pass

if not found:
    print("Keyword not found in any editor backups.")
