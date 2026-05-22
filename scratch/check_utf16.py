pb_path = r"C:\Users\HP\.gemini\antigravity\conversations\f1d5107d-969e-47fa-b562-6e08d0b27016.pb"

with open(pb_path, 'rb') as f:
    content = f.read()

# Try searching both UTF-8 and UTF-16-LE
kw_utf8 = b'v2DestReviewPanel'
kw_utf16 = 'v2DestReviewPanel'.encode('utf-16-le')

print(f"UTF-8 matches: {content.count(kw_utf8)}")
print(f"UTF-16-LE matches: {content.count(kw_utf16)}")

# Also try case insensitive search for a common word like 'html' or 'script'
# by scanning all printable ASCII
import re
ascii_strings = re.findall(b'[\x20-\x7E]{10,}', content)
print(f"Found {len(ascii_strings)} ASCII strings of length >= 10")
for s in ascii_strings[:10]:
    print(f"  {s}")
