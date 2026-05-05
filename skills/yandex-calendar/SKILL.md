---
name: yandex-calendar
description: "Яндекс Календарь — события, встречи, доступность через CalDAV. Пароль приложения."
metadata:
  openclaw:
    emoji: "📅"
    requires:
      env: ["YANDEX_CALENDAR_LOGIN", "YANDEX_CALENDAR_PASSWORD"]
      note: "Uses CalDAV protocol (XML). App password recommended. Endpoint verified: caldav.yandex.ru (401 → auth required)"
---

# Yandex Calendar Skill

## Verified Endpoint

```
caldav.yandex.ru → 401 (auth required) ✅ active
```

Uses **CalDAV** protocol (RFC 4791) — XML-based, not REST JSON.

## Prerequisites

```bash
export YANDEX_CALENDAR_LOGIN="your-login@yandex.ru"
export YANDEX_CALENDAR_PASSWORD="your-app-password"
# Recommended: Yandex app password (Settings → Security → App passwords)
```

## Calendar ID

Your default calendar URL:
```
https://caldav.yandex.ru/calendars/<login>@yandex.ru/events-<uid>/
```

Find your calendar ID with the list command below.

## List Calendars

```python
import requests, os, xml.etree.ElementTree as ET

url = "https://caldav.yandex.ru/"
auth = (os.environ["YANDEX_CALENDAR_LOGIN"], os.environ["YANDEX_CALENDAR_PASSWORD"])

headers = {"Depth": "1", "Content-Type": "application/xml"}
body = """<?xml version="1.0" encoding="utf-8"?>
<propfind xmlns="DAV:">
  <prop>
    <displayname/>
    <resourcetype/>
    <calendar-description xmlns="urn:ietf:params:xml:ns:caldav"/>
  </prop>
</propfind>"""

resp = requests.request("PROPFIND", url, auth=auth, headers=headers, data=body)
resp.encoding = "utf-8"
root = ET.fromstring(resp.text)

for response in root.findall("{DAV:}response"):
    href = response.find("{DAV:}href")
    displayname = response.find(".//{DAV:}displayname")
    if href is not None:
        name = displayname.text if displayname is not None and displayname.text else href.text
        print(f"{name}")
        print(f"  URL: {href.text}")
        print()
```

## Today's Events

```python
import requests, os, xml.etree.ElementTree as ET
from datetime import datetime, timezone

login = os.environ["YANDEX_CALENDAR_LOGIN"]
password = os.environ["YANDEX_CALENDAR_PASSWORD"]
auth = (login, password)

# Your calendar URL — replace with actual from list-calendars
cal_url = f"https://caldav.yandex.ru/calendars/{login}/events-default/"

now = datetime.now(timezone.utc)
start = now.strftime("%Y%m%dT000000Z")
end = now.strftime("%Y%m%dT235959Z")

headers = {"Depth": "1", "Content-Type": "application/xml"}
body = f"""<?xml version="1.0" encoding="utf-8"?>
<calendar-query xmlns="urn:ietf:params:xml:ns:caldav" xmlns:D="DAV:">
  <D:prop>
    <D:getetag/>
    <D:getcontenttype/>
  </D:prop>
  <filter>
    <comp-filter name="VCALENDAR">
      <comp-filter name="VEVENT">
        <time-range start="{start}" end="{end}"/>
      </comp-filter>
    </comp-filter>
  </filter>
</calendar-query>"""

resp = requests.request("REPORT", cal_url, auth=auth, headers=headers, data=body)
resp.encoding = "utf-8"
root = ET.fromstring(resp.text)

for response in root.findall("{DAV:}response"):
    href = response.find("{DAV:}href")
    for propstat in response.findall("{DAV:}propstat"):
        prop = propstat.find("{DAV:}prop")
        if prop is None:
            continue
        cal_data = prop.find("{urn:ietf:params:xml:ns:caldav}calendar-data")
        if cal_data is None or not cal_data.text:
            continue
        # Parse iCalendar
        for line in cal_data.text.split("\n"):
            if line.startswith("SUMMARY:"):
                print(f"📅 {line[8:]}")
            elif line.startswith("DTSTART"):
                dt = line.split(":")[1]
                if len(dt) >= 15:
                    t = dt[9:11] + ":" + dt[11:13]
                else:
                    t = "all day"
                print(f"   Start: {dt[:8]} {t}")
            elif line.startswith("DTEND"):
                dt = line.split(":")[1]
                if len(dt) >= 15:
                    t = dt[9:11] + ":" + dt[11:13]
                print(f"   End:   {dt[:8]} {t}")
            elif line.startswith("LOCATION:"):
                print(f"   📍 {line[9:]}")
            elif line.startswith("DESCRIPTION:"):
                desc = line[12:].replace("\\n", "\n").replace("\\,", ",")
                print(f"   {desc[:200]}")
        print()
```

## Week View

```python
import requests, os, xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone

login = os.environ["YANDEX_CALENDAR_LOGIN"]
cal_url = f"https://caldav.yandex.ru/calendars/{login}/events-default/"
auth = (login, os.environ["YANDEX_CALENDAR_PASSWORD"])

now = datetime.now(timezone.utc)
start = now.strftime("%Y%m%dT000000Z")
end = (now + timedelta(days=7)).strftime("%Y%m%dT235959Z")

headers = {"Depth": "1", "Content-Type": "application/xml"}
body = f"""<?xml version="1.0" encoding="utf-8"?>
<calendar-query xmlns="urn:ietf:params:xml:ns:caldav" xmlns:D="DAV:">
  <D:prop><D:getetag/></D:prop>
  <filter>
    <comp-filter name="VCALENDAR">
      <comp-filter name="VEVENT">
        <time-range start="{start}" end="{end}"/>
      </comp-filter>
    </comp-filter>
  </filter>
</calendar-query>"""

resp = requests.request("REPORT", cal_url, auth=auth, headers=headers, data=body)
resp.encoding = "utf-8"

from collections import defaultdict
days = defaultdict(list)
root = ET.fromstring(resp.text)
for response in root.findall("{DAV:}response"):
    cal_data = response.find(".//{urn:ietf:params:xml:ns:caldav}calendar-data")
    if cal_data is None or not cal_data.text:
        continue
    event = {}
    for line in cal_data.text.split("\n"):
        if line.startswith("SUMMARY:"): event["summary"] = line[8:]
        elif line.startswith("DTSTART"): event["start"] = line.split(":")[1]
        elif line.startswith("DTEND"): event["end"] = line.split(":")[1]
    if "start" in event:
        day = event["start"][:8]
        days[day].append(event)

for day in sorted(days.keys()):
    dt = datetime.strptime(day, "%Y%m%d")
    print(f"\n=== {dt.strftime('%A, %d %B')} ===")
    for e in sorted(days[day], key=lambda x: x.get("start", "")):
        summary = e.get("summary", "(no title)")
        st = e.get("start", "")[9:13] if len(e.get("start", "")) >= 13 else "all day"
        start_time = f"{st[:2]}:{st[2:]}" if st != "all day" else st
        print(f"  {start_time}  {summary}")
```

## Create Event

```python
import requests, os
from datetime import datetime, timezone, timedelta

login = os.environ["YANDEX_CALENDAR_LOGIN"]
cal_url = f"https://caldav.yandex.ru/calendars/{login}/events-default/"
auth = (login, os.environ["YANDEX_CALENDAR_PASSWORD"])

now = datetime.now(timezone.utc)
start = now + timedelta(hours=1)  # 1 hour from now
end = start + timedelta(hours=1)

ics = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Rurik//Yandex Calendar//EN
BEGIN:VEVENT
SUMMARY:Team Meeting
DTSTART:{start.strftime('%Y%m%dT%H%M%SZ')}
DTEND:{end.strftime('%Y%m%dT%H%M%SZ')}
LOCATION:Office 3rd Floor
DESCRIPTION:Weekly sync-up.\\nBring laptop.
END:VEVENT
END:VCALENDAR"""

headers = {"Content-Type": "text/calendar; charset=utf-8"}
uid = f"rurik-{int(datetime.now().timestamp())}"
event_url = f"{cal_url}{uid}.ics"

resp = requests.put(event_url, auth=auth, headers=headers, data=ics.encode("utf-8"))
if resp.status_code in (201, 204):
    print(f"✅ Event created: {event_url}")
else:
    print(f"❌ Error {resp.status_code}: {resp.text[:200]}")
```

## Delete Event

```python
event_url = "https://caldav.yandex.ru/calendars/<login>/events-default/<uid>.ics"
resp = requests.delete(event_url, auth=auth)
if resp.status_code in (200, 204):
    print("✅ Deleted")
```

## Quick Check (Today's Summary)

```bash
python3 -c "
import requests, os, xml.etree.ElementTree as ET
from datetime import datetime, timezone

login = os.environ['YANDEX_CALENDAR_LOGIN']
cal = f'https://caldav.yandex.ru/calendars/{login}/events-default/'
auth = (login, os.environ['YANDEX_CALENDAR_PASSWORD'])
now = datetime.now(timezone.utc)
start = now.strftime('%Y%m%dT000000Z')
end = now.strftime('%Y%m%dT235959Z')

headers = {'Depth':'1','Content-Type':'application/xml'}
body = f'<?xml version=\"1.0\"?><calendar-query xmlns=\"urn:ietf:params:xml:ns:caldav\" xmlns:D=\"DAV:\"><D:prop><D:getetag/></D:prop><filter><comp-filter name=\"VCALENDAR\"><comp-filter name=\"VEVENT\"><time-range start=\"{start}\" end=\"{end}\"/></comp-filter></comp-filter></filter></calendar-query>'

resp = requests.request('REPORT', cal, auth=auth, headers=headers, data=body)
resp.encoding = 'utf-8'
root = ET.fromstring(resp.text)
events = []
for r in root.findall('{DAV:}response'):
    cd = r.find('.//{urn:ietf:params:xml:ns:caldav}calendar-data')
    if cd is None: continue
    ev = {}
    for l in cd.text.split('\n'):
        if l.startswith('SUMMARY:'): ev['s'] = l[8:]
        elif l.startswith('DTSTART'): ev['t'] = l.split(':')[1]
    if 's' in ev: events.append(ev)

if events:
    print(f'📅 Today: {len(events)} events')
    for e in sorted(events, key=lambda x: x.get('t','')):
        t = e.get('t','')[9:13]
        print(f'  {t[:2]}:{t[2:]} — {e[\"s\"]}')
else:
    print('📅 No events today')
" 2>/dev/null
```

## Important Notes

- **Protocol:** CalDAV (XML-based, not REST JSON)
- **Auth:** Basic auth with login + app password
- **Methods:** PROPFIND (list), REPORT (query), PUT (create), DELETE
- **Namespaces:** `DAV:` for WebDAV, `urn:ietf:params:xml:ns:caldav` for CalDAV
- **iCalendar format:** events use standard `BEGIN:VEVENT...END:VEVENT`
- **UID:** unique ID per event (e.g., `rurik-<timestamp>.ics`)
- **Recurrence:** Yandex Calendar supports RRULE (standard iCalendar)
- **Python deps:** `requests` (pip install requests) — needed for REPORT method
- **Calendar URL:** `/calendars/<login>/events-default/` — find yours with list command
