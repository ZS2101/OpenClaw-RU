---
name: yandex-disk
description: "Яндекс Диск — список файлов, загрузка, скачивание, копирование, удаление, общий доступ. OAuth-токен."
metadata:
  openclaw:
    emoji: "💾"
    requires:
      env: ["YANDEX_DISK_TOKEN"]
      note: "Get OAuth token at https://oauth.yandex.ru/authorize?response_type=token&client_id=<app-id> with scope cloud_api:disk"
---

# Yandex Disk Skill

## Verified API

All endpoints confirmed working (API base: `https://cloud-api.yandex.net/v1/disk`).

Auth: `Authorization: OAuth <token>` header.

## Prerequisites

### Get an OAuth token

1. Register an app at https://oauth.yandex.ru (or use any existing app)
2. Authorize with scope `cloud_api:disk`:
   ```
   https://oauth.yandex.ru/authorize?response_type=token&client_id=<your-app-id>
   ```
3. After redirect, the token is in the URL fragment: `#access_token=<token>`
4. Set it:
   ```bash
   export YANDEX_DISK_TOKEN="y0_AgAAAA..."
   ```

## Disk Info

```bash
curl -s -H "Authorization: OAuth $YANDEX_DISK_TOKEN" \
  "https://cloud-api.yandex.net/v1/disk/" | python3 -m json.tool
```

Response includes: `total_space`, `used_space`, `trash_size`, `user.login`, `system_folders`

## List Files (Root)

```bash
curl -s -H "Authorization: OAuth $YANDEX_DISK_TOKEN" \
  "https://cloud-api.yandex.net/v1/disk/resources?path=%2F&limit=20" | python3 -m json.tool
```

`%2F` = encoded `/` (root folder). Use Python's `urllib.parse.quote()` for paths.

### List with details

```bash
curl -s -H "Authorization: OAuth $YANDEX_DISK_TOKEN" \
  "https://cloud-api.yandex.net/v1/disk/resources?path=%2F&limit=20&fields=name,size,modified,type,public_url" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for item in d['_embedded']['items']:
    name = item['name']
    size = item.get('size', 0)
    mtype = item['type']
    mod = item.get('modified', '')[:10]
    print(f'{mtype:4s} {size:>10,}  {mod}  {name}')
" 2>/dev/null
```

### List with offset (pagination)

```bash
curl -s -H "Authorization: OAuth $YANDEX_DISK_TOKEN" \
  "https://cloud-api.yandex.net/v1/disk/resources?path=%2F&limit=5&offset=5"
```

### List subfolder

```bash
curl -s -H "Authorization: OAuth $YANDEX_DISK_TOKEN" \
  "https://cloud-api.yandex.net/v1/disk/resources?path=%2FPhotos%2F2024&limit=50"
```

## Search Files

```bash
# Search by name
curl -s -H "Authorization: OAuth $YANDEX_DISK_TOKEN" \
  "https://cloud-api.yandex.net/v1/disk/resources?path=%2F&limit=1000" | python3 -c "
import sys, json
d = json.load(sys.stdin)
query = 'report'  # change this
for item in d['_embedded']['items']:
    if query.lower() in item['name'].lower():
        print(f'{item[\"type\"]:4s}  {item[\"name\"]}')
"
```

For deeper search, use `/v1/disk/resources/search?path=%2F&name=query`:

```bash
curl -s -H "Authorization: OAuth $YANDEX_DISK_TOKEN" \
  "https://cloud-api.yandex.net/v1/disk/resources/search?path=%2F&name=report&limit=20" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for item in d['_embedded']['items']:
    print(f'{item[\"path\"]}')
"
```

## Download File

```bash
# Step 1: Get download URL
FILE_PATH="/Documents/report.pdf"
ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$FILE_PATH'))")
DOWNLOAD_URL=$(curl -s -H "Authorization: OAuth $YANDEX_DISK_TOKEN" \
  "https://cloud-api.yandex.net/v1/disk/resources/download?path=$ENCODED" | python3 -c "import sys,json; print(json.load(sys.stdin)['href'])")
echo "Download URL: $DOWNLOAD_URL"

# Step 2: Download
curl -L "$DOWNLOAD_URL" -o "$(basename "$FILE_PATH")"
```

## Upload File

```bash
# Step 1: Get upload URL
LOCAL_FILE="document.pdf"
REMOTE_PATH="/Documents/document.pdf"
ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$REMOTE_PATH'))")
UPLOAD_URL=$(curl -s -H "Authorization: OAuth $YANDEX_DISK_TOKEN" \
  "https://cloud-api.yandex.net/v1/disk/resources/upload?path=$ENCODED&overwrite=true" | python3 -c "import sys,json; print(json.load(sys.stdin)['href'])")

# Step 2: Upload
curl -T "$LOCAL_FILE" "$UPLOAD_URL"
echo "✅ Uploaded to $REMOTE_PATH"
```

## Create Folder

```bash
FOLDER="/Documents/NewFolder"
ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$FOLDER'))")
curl -X PUT -H "Authorization: OAuth $YANDEX_DISK_TOKEN" \
  "https://cloud-api.yandex.net/v1/disk/resources?path=$ENCODED"
echo "✅ Created $FOLDER"
```

## Copy / Move

```bash
# Copy
curl -X POST -H "Authorization: OAuth $YANDEX_DISK_TOKEN" \
  "https://cloud-api.yandex.net/v1/disk/resources/copy?from=/Documents/file.pdf&path=/Backup/file.pdf"

# Move
curl -X POST -H "Authorization: OAuth $YANDEX_DISK_TOKEN" \
  "https://cloud-api.yandex.net/v1/disk/resources/move?from=/Documents/file.pdf&path=/Archive/file.pdf"
```

## Delete

```bash
# Move to trash
curl -X DELETE -H "Authorization: OAuth $YANDEX_DISK_TOKEN" \
  "https://cloud-api.yandex.net/v1/disk/resources?path=/Documents/old-file.pdf"

# Permanently delete
curl -X DELETE -H "Authorization: OAuth $YANDEX_DISK_TOKEN" \
  "https://cloud-api.yandex.net/v1/disk/resources?path=/Documents/old-file.pdf&permanently=true"
```

## Trash

```bash
curl -s -H "Authorization: OAuth $YANDEX_DISK_TOKEN" \
  "https://cloud-api.yandex.net/v1/disk/trash/resources?limit=20"

# Restore from trash
curl -X PUT -H "Authorization: OAuth $YANDEX_DISK_TOKEN" \
  "https://cloud-api.yandex.net/v1/disk/trash/resources/restore?path=/Documents/deleted-file.pdf"

# Empty trash
curl -X DELETE -H "Authorization: OAuth $YANDEX_DISK_TOKEN" \
  "https://cloud-api.yandex.net/v1/disk/trash/resources"
```

## Publish / Share

```bash
# Publish a file (get public link)
ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote('/Documents/file.pdf'))")
curl -X PUT -H "Authorization: OAuth $YANDEX_DISK_TOKEN" \
  "https://cloud-api.yandex.net/v1/disk/resources/publish?path=$ENCODED"

# Unpublish
curl -X PUT -H "Authorization: OAuth $YANDEX_DISK_TOKEN" \
  "https://cloud-api.yandex.net/v1/disk/resources/unpublish?path=$ENCODED"
```

## Disk Summary Script

```bash
echo "=== Yandex Disk Summary ==="

# Disk info
curl -s -H "Authorization: OAuth $YANDEX_DISK_TOKEN" \
  "https://cloud-api.yandex.net/v1/disk/" | python3 -c "
import sys, json
d = json.load(sys.stdin)
total = d.get('total_space', 0)
used = d.get('used_space', 0)
pct = (used / total * 100) if total else 0
print(f'User: {d[\"user\"][\"login\"]}')
print(f'Used: {used/1e9:.1f} GB / {total/1e9:.1f} GB ({pct:.1f}%)')
trash = d.get('trash_size', 0)
print(f'Trash: {trash/1e9:.2f} GB')
print()
print('System folders:')
for name, path in d.get('system_folders', {}).items():
    print(f'  {name}: {path}')
" 2>/dev/null

echo ""

# Recent files
curl -s -H "Authorization: OAuth $YANDEX_DISK_TOKEN" \
  "https://cloud-api.yandex.net/v1/disk/resources?path=%2F&limit=10&sort=modified&fields=name,size,modified,type" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('Recent files:')
for item in d['_embedded']['items']:
    name = item['name']
    size = item.get('size', 0)
    mtype = item['type']
    mod = item.get('modified', '')[:10]
    if size > 0:
        if size > 1e9: sizestr = f'{size/1e9:.1f} GB'
        elif size > 1e6: sizestr = f'{size/1e6:.1f} MB'
        else: sizestr = f'{size/1e3:.1f} KB'
    else:
        sizestr = '—'
    print(f'  {mod}  {sizestr:>8s}  {name}')
" 2>/dev/null
```

## Important Notes

- Auth header: `Authorization: OAuth <token>` (not Bearer!)
- Path encoding: use `urllib.parse.quote()` for all path parameters
- Upload: two-step — get upload URL, then PUT file to it
- Download: two-step — get download URL, then GET it
- Copy/Move: POST with `from` and `path` query params
- Delete: DELETE request, `permanently=true` to skip trash
- Trash: separate endpoint `/v1/disk/trash/resources`
- Rate limits: ~1000 requests/hour for free accounts
- Max file size: 50 GB (upload), 10 GB (web)
- Token scope must include `cloud_api:disk`
- OAuth token expires in 1 year (refreshable)
- All paths are relative to /disk/ root (e.g., `/Photos/img.jpg`)
