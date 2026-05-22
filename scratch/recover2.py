import json

log_path = r"C:\Users\HP\.gemini\antigravity\brain\f1d5107d-969e-47fa-b562-6e08d0b27016\.system_generated\logs\overview.txt"

print("Scanning log...")
with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        try:
            data = json.loads(line)
            step = data.get("step_index", idx)
            tcs = data.get("tool_calls", [])
            for tc in tcs:
                name = tc.get("name")
                args = tc.get("args", {})
                if isinstance(args, str):
                    try:
                        args = json.loads(args)
                    except:
                        pass
                
                print(f"Step {step} - Tool: {name}")
                if name in ["multi_replace_file_content", "replace_file_content"]:
                    chunks = args.get("ReplacementChunks", [])
                    if isinstance(chunks, str):
                        try:
                            chunks = json.loads(chunks)
                        except:
                            pass
                    
                    rep_content = args.get("ReplacementContent", "")
                    print(f"  ReplacementContent len: {len(rep_content)}")
                    if chunks:
                        print(f"  Chunks count: {len(chunks)}")
                        for c_idx, c in enumerate(chunks):
                            c_content = c.get("ReplacementContent", "")
                            print(f"    Chunk {c_idx} len: {len(c_content)}")
        except Exception as e:
            print(f"Line {idx} error: {e}")
