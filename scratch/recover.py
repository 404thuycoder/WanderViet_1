import json

log_path = r"C:\Users\HP\.gemini\antigravity\brain\f1d5107d-969e-47fa-b562-6e08d0b27016\.system_generated\logs\overview.txt"
out_path = r"d:\D_n_mới\WanderViet_1\scratch\recovered_code.txt"

# Keep stdout plain ASCII
print("Reading logs...")
with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if "tool_calls" in data:
                for tc in data["tool_calls"]:
                    if tc.get("name") == "multi_replace_file_content":
                        args = tc.get("args", {})
                        if isinstance(args, str):
                            args = json.loads(args)
                        chunks = args.get("ReplacementChunks")
                        if isinstance(chunks, str):
                            chunks = json.loads(chunks)
                        for i, chunk in enumerate(chunks):
                            content = chunk.get("ReplacementContent")
                            print("Found chunk! Length:", len(content))
                            with open(out_path, 'w', encoding='utf-8') as out_f:
                                out_f.write(content)
                            print("Successfully recovered to", out_path)
        except Exception as e:
            pass
