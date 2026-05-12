import re

path1 = r'f:\WanderViet_1\WanderViet_1\apps\user-web\payment.html'
with open(path1, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(r"this.src=\'https://logo.clearbit.com/zalopay.vn\'", "this.src='https://logo.clearbit.com/zalopay.vn'")

with open(path1, 'w', encoding='utf-8') as f:
    f.write(content)
