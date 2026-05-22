import json

log_path = r"C:\Users\HP\.gemini\antigravity\brain\f1d5107d-969e-47fa-b562-6e08d0b27016\.system_generated\logs\overview.txt"
out_path = r"d:\D_n_mới\WanderViet_1\scratch\step52_args.json"

print("Parsing step 52...")
with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        try:
            data = json.loads(line)
            step = data.get("step_index")
            if step == 52:
                print("Found step 52!")
                tcs = data.get("tool_calls", [])
                for tc in tcs:
                    if tc.get("name") == "multi_replace_file_content":
                        args = tc.get("args", {})
                        if isinstance(args, str):
                            args = json.loads(args)
                        with open(out_path, 'w', encoding='utf-8') as out_f:
                            json.dump(args, out_f, indent=2, ensure_ascii=False)
                        print("Saved args of step 52 to step52_args.json")
        except Exception as e:
            print("Error parsing line:", e)
