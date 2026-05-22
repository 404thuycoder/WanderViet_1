import subprocess

print("Scanning stashes...")
for i in range(10):
    stash_name = f"stash@{{{i}}}"
    try:
        # Run git show stash@{i}:apps/user-web/planner.html
        res = subprocess.run(
            ["git", "show", f"{stash_name}:apps/user-web/planner.html"],
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='ignore'
        )
        if res.returncode == 0:
            content = res.stdout
            lines_count = len(content.splitlines())
            has_keyword = 'v2DestReviewPanel' in content
            print(f"{stash_name}: planner.html lines={lines_count}, has_v2DestReviewPanel={has_keyword}")
        else:
            # Maybe stash index doesn't exist
            pass
    except Exception as e:
        print(f"Error checking {stash_name}: {e}")
