import re

# Fix payment.html
path1 = r'f:\WanderViet_1\WanderViet_1\apps\user-web\payment.html'
with open(path1, 'r', encoding='utf-8') as f:
    content = f.read()

# The zalopay image in payment.html starts with data:text/html;base64,... and ends with ">"
content = re.sub(
    r'<img src="data:text/html;base64,[^"]+">',
    r'<img src="https://www.google.com/s2/favicons?domain=zalopay.vn&sz=128" onerror="this.src=\'https://logo.clearbit.com/zalopay.vn\'" style="width:100%; height:100%; object-fit:cover; border-radius:14px;">',
    content
)
with open(path1, 'w', encoding='utf-8') as f:
    f.write(content)

# Fix place-detail.html
path2 = r'f:\WanderViet_1\WanderViet_1\apps\user-web\place-detail.html'
with open(path2, 'r', encoding='utf-8') as f:
    content2 = f.read()

content2 = content2.replace(
    'https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-MoMo-Transparent.png',
    'https://www.google.com/s2/favicons?domain=momo.vn&sz=128'
)
content2 = content2.replace(
    'https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-ZaloPay-Square.png',
    'https://www.google.com/s2/favicons?domain=zalopay.vn&sz=128'
)
with open(path2, 'w', encoding='utf-8') as f:
    f.write(content2)

print('Done')
