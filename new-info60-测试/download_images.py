import json
import os
import urllib.request

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.szwyi.com/',
    'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive'
}

with open('data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

img_dir = 'img'
os.makedirs(img_dir, exist_ok=True)

success_count = 0
fail_count = 0

for item in data:
    if 'img' in item and 'id' in item:
        img_url = item['img']
        img_id = item['id']
        ext = img_url.split('.')[-1]
        filename = f"{img_id}.{ext}"
        filepath = os.path.join(img_dir, filename)
        
        try:
            req = urllib.request.Request(img_url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as response:
                with open(filepath, 'wb') as f:
                    f.write(response.read())
            print(f"Downloaded: {filename}")
            success_count += 1
        except Exception as e:
            print(f"Failed to download {img_url}: {e}")
            fail_count += 1

print(f"\nDownload completed! Success: {success_count}, Failed: {fail_count}")