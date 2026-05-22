pb_path = r"C:\Users\HP\.gemini\antigravity\conversations\f1d5107d-969e-47fa-b562-6e08d0b27016.pb"

with open(pb_path, 'rb') as f:
    content = f.read()

keyword = b'v2DestReviewPanel'
count = content.count(keyword)
print(f"Keyword count in raw bytes: {count}")

idx = 0
for i in range(count):
    idx = content.find(keyword, idx)
    print(f"Match {i} at index {idx}")
    # Print context
    start = max(0, idx - 100)
    end = min(len(content), idx + 200)
    context = content[start:end]
    print(f"  Context: {context}")
    idx += len(keyword)
