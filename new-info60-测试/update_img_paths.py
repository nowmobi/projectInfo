import json

with open('data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for item in data:
    if 'img' in item and 'id' in item:
        item['img'] = f"./img/{item['id']}.webp"

with open('data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=4)

print("Update completed!")