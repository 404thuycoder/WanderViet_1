import re

pb_path = r"C:\Users\HP\.gemini\antigravity\conversations\f1d5107d-969e-47fa-b562-6e08d0b27016.pb"
out_path = r"d:\D_n_mới\WanderViet_1\scratch\recovered_pb_strings.txt"

print("Reading binary pb file...")
with open(pb_path, 'rb') as f:
    content = f.read()

print(f"Total size: {len(content)} bytes")

# We want to extract contiguous printable UTF-8 sequences that are long
# Let's find any sequences of bytes that match typical text
# We can use regex to find sequences of ASCII / UTF-8 chars
text_pattern = re.compile(rb'[\x20-\x7E\x0A\x0D\xC2-\xDF][\x80-\xBF\x20-\x7E\x0A\x0D]+')

matches = text_pattern.findall(content)
print(f"Found {len(matches)} potential text segments.")

# Let's filter segments that contain our target keyword 'v2DestReviewPanel'
# and write the longest ones to a file.
target_keyword = b'v2DestReviewPanel'
found_segments = []

for m in matches:
    if target_keyword in m:
        try:
            decoded = m.decode('utf-8', errors='ignore')
            found_segments.append(decoded)
        except Exception as e:
            pass

print(f"Found {len(found_segments)} segments containing the keyword.")
found_segments.sort(key=len, reverse=True)

if found_segments:
    print(f"Longest segment length: {len(found_segments[0])}")
    with open(out_path, 'w', encoding='utf-8') as out_f:
        # Write the top 3 longest segments
        for i, seg in enumerate(found_segments[:3]):
            out_f.write(f"--- SEGMENT {i} (Length: {len(seg)}) ---\n")
            out_f.write(seg)
            out_f.write("\n\n")
    print(f"Saved segments to {out_path}")
else:
    print("Keyword not found in any text segments.")
