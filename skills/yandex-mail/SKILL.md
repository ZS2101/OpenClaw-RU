---
name: yandex-mail
description: "Яндекс Почта — чтение, поиск, отправка писем через IMAP/SMTP. Пароль приложения."
metadata:
  openclaw:
    emoji: "📧"
    requires:
      env: ["YANDEX_MAIL_LOGIN", "YANDEX_MAIL_PASSWORD"]
      note: "Use Yandex app password (Settings → Security → App passwords). NOT your main Yandex password."
---

# Yandex Mail Skill

## Overview

Read, search, and send emails through your Yandex Mail account using standard IMAP/SMTP.

**No API key needed.** Uses IMAP (read) and SMTP (send) with an **app password**.

## Setup

### 1. Create an app password

```
Yandex Mail → Settings (⚙) → Security → App passwords
→ Select "Mail" → "Other" → name it "Rurik"
→ Copy the generated password (looks like: abcdefghijklmnop)
```

**Never use your main Yandex password.** App passwords are limited to email only and can be revoked.

### 2. Set environment variables

```bash
export YANDEX_MAIL_LOGIN="your-login@yandex.ru"
export YANDEX_MAIL_PASSWORD="abcdefghijklmnop"  # app password, not main!
```

## IMAP Settings

| Setting | Value |
|---|---|
| Server | `imap.yandex.ru` |
| Port | 993 |
| Encryption | SSL/TLS |
| Login | Your full email |
| Password | App password |

## SMTP Settings

| Setting | Value |
|---|---|
| Server | `smtp.yandex.ru` |
| Port | 465 |
| Encryption | SSL/TLS |
| Login | Your full email |
| Password | App password |

## Read Emails (Python)

### Check inbox count

```python
import imaplib, os
mail = imaplib.IMAP4_SSL("imap.yandex.ru")
mail.login(os.environ["YANDEX_MAIL_LOGIN"], os.environ["YANDEX_MAIL_PASSWORD"])
mail.select("INBOX")
status, messages = mail.search(None, "ALL")
count = len(messages[0].split())
print(f"Inbox: {count} messages")
status, unseen = mail.search(None, "UNSEEN")
unread = len(unseen[0].split()) if unseen[0] else 0
print(f"Unread: {unread}")
mail.logout()
```

### List recent unread emails

```python
import imaplib, email, os
from email.header import decode_header

mail = imaplib.IMAP4_SSL("imap.yandex.ru")
mail.login(os.environ["YANDEX_MAIL_LOGIN"], os.environ["YANDEX_MAIL_PASSWORD"])
mail.select("INBOX")
_, messages = mail.search(None, "UNSEEN")
ids = messages[0].split()[-10:]  # last 10 unread

for msg_id in reversed(ids):
    _, data = mail.fetch(msg_id, "(RFC822)")
    msg = email.message_from_bytes(data[0][1])
    subject, enc = decode_header(msg["Subject"])[0]
    if isinstance(subject, bytes):
        subject = subject.decode(enc or "utf-8", errors="replace")
    sender = msg["From"]
    date = msg["Date"]
    print(f"From: {sender}")
    print(f"Date: {date}")
    print(f"Subject: {subject}")
    print("---")

mail.logout()
```

### Get full email body

```python
import imaplib, email, os
from email.header import decode_header

def get_body(msg):
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                return part.get_payload(decode=True).decode("utf-8", errors="replace")
    return msg.get_payload(decode=True).decode("utf-8", errors="replace")

mail = imaplib.IMAP4_SSL("imap.yandex.ru")
mail.login(os.environ["YANDEX_MAIL_LOGIN"], os.environ["YANDEX_MAIL_PASSWORD"])
mail.select("INBOX")
_, messages = mail.search(None, "UNSEEN")
ids = messages[0].split()

if ids:
    _, data = mail.fetch(ids[-1], "(RFC822)")  # latest unread
    msg = email.message_from_bytes(data[0][1])
    subject, enc = decode_header(msg["Subject"])[0]
    if isinstance(subject, bytes):
        subject = subject.decode(enc or "utf-8", errors="replace")
    print(f"Subject: {subject}")
    print(f"From: {msg['From']}")
    print(f"Date: {msg['Date']}")
    print()
    print(get_body(msg)[:2000])  # first 2000 chars

mail.logout()
```

### Search emails

```python
import imaplib, email, os
from email.header import decode_header

mail = imaplib.IMAP4_SSL("imap.yandex.ru")
mail.login(os.environ["YANDEX_MAIL_LOGIN"], os.environ["YANDEX_MAIL_PASSWORD"])
mail.select("INBOX")

# Search by sender
_, messages = mail.search(None, 'FROM', '"ozon"')
# Search by subject
_, messages = mail.search(None, 'SUBJECT', '"заказ"')
# Search by date (since yesterday)
_, messages = mail.search(None, 'SINCE', '01-May-2026')
# Combine: FROM + SINCE
_, messages = mail.search(None, 'FROM', '"ozon"', 'SINCE', '01-May-2026')

ids = messages[0].split()
print(f"Found: {len(ids)} messages")

for msg_id in reversed(ids[-5:]):  # last 5
    _, data = mail.fetch(msg_id, "(RFC822)")
    msg = email.message_from_bytes(data[0][1])
    subject, enc = decode_header(msg["Subject"])[0]
    if isinstance(subject, bytes):
        subject = subject.decode(enc or "utf-8", errors="replace")
    print(f"{msg['Date']} | {msg['From']} | {subject}")

mail.logout()
```

## Send Email (Python)

```python
import smtplib, os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

msg = MIMEMultipart()
msg["From"] = os.environ["YANDEX_MAIL_LOGIN"]
msg["To"] = "recipient@example.com"
msg["Subject"] = "Test from Rurik"

body = "Hello! This email was sent by Rurik AI assistant."
msg.attach(MIMEText(body, "plain", "utf-8"))

server = smtplib.SMTP_SSL("smtp.yandex.ru", 465)
server.login(os.environ["YANDEX_MAIL_LOGIN"], os.environ["YANDEX_MAIL_PASSWORD"])
server.send_message(msg)
server.quit()
print("Sent!")
```

## Quick Checks (One-liners)

### Inbox stats
```bash
python3 -c "
import imaplib, os
m = imaplib.IMAP4_SSL('imap.yandex.ru')
m.login(os.environ['YANDEX_MAIL_LOGIN'], os.environ['YANDEX_MAIL_PASSWORD'])
m.select('INBOX')
_, all = m.search(None, 'ALL')
_, unread = m.search(None, 'UNSEEN')
all_n = len(all[0].split()) if all[0] else 0
unread_n = len(unread[0].split()) if unread[0] else 0
print(f'📧 Inbox: {all_n} total, {unread_n} unread')
m.logout()
"
```

### Latest unread subject
```bash
python3 -c "
import imaplib, email, os
from email.header import decode_header
m = imaplib.IMAP4_SSL('imap.yandex.ru')
m.login(os.environ['YANDEX_MAIL_LOGIN'], os.environ['YANDEX_MAIL_PASSWORD'])
m.select('INBOX')
_, msgs = m.search(None, 'UNSEEN')
if msgs[0]:
    _, data = m.fetch(msgs[0].split()[-1], '(RFC822)')
    msg = email.message_from_bytes(data[0][1])
    subj, enc = decode_header(msg['Subject'])[0]
    if isinstance(subj, bytes): subj = subj.decode(enc or 'utf-8', errors='replace')
    print(f'📨 {subj}')
    print(f'   From: {msg[\"From\"]}')
m.logout()
"
```

### Quick reply
```bash
python3 -c "
# Draft and send a quick reply
import smtplib, os
from email.mime.text import MIMEText
msg = MIMEText('Да, всё верно. Спасибо!', 'plain', 'utf-8')
msg['From'] = os.environ['YANDEX_MAIL_LOGIN']
msg['To'] = '$RECIPIENT'
msg['Subject'] = 'Re: $ORIGINAL_SUBJECT'
msg['In-Reply-To'] = '$MESSAGE_ID'
s = smtplib.SMTP_SSL('smtp.yandex.ru', 465)
s.login(os.environ['YANDEX_MAIL_LOGIN'], os.environ['YANDEX_MAIL_PASSWORD'])
s.send_message(msg)
s.quit()
print('✅ Reply sent')
"
```

## Typical Workflows

### "Any important emails?"
1. Connect via IMAP
2. Search UNSEEN from last 24h
3. Filter by known important senders (clients, banks, government)
4. Summarize subjects and senders
5. Offer to read full body of any

### "Find my Ozon delivery confirmation"
1. IMAP search: `FROM "ozon" SUBJECT "доставк"`
2. Show matching subjects
3. Read full body of selected match

### "Reply to the latest email from Sber"
1. IMAP search: `FROM "sber"`
2. Get latest match
3. Show subject + body
4. Ask: "What should I reply?"
5. Send via SMTP

### "Delete all marketing from last month"
1. IMAP search: `FROM "newsletter" SINCE 01-Apr-2026`
2. Show count: "Found 47 messages. Delete?"
3. If confirmed: mark as deleted + expunge

## Important Notes

- Use **app password**, never your main Yandex password
- App passwords are email-only, can be revoked anytime
- IMAP reads are read-only (safe)
- SMTP sends actually send email (be careful)
- Python's `imaplib` and `smtplib` are built-in — no pip install needed
- Yandex limits: ~500 IMAP commands per hour
- Delete = mark `\\Deleted` + `expunge()` (two steps)
- Spam folder: `mail.select("[Gmail]/Spam")` (Yandex uses Gmail-like naming)
- Yandex uses Cyrillic folder names: `mail.select('INBOX|Отправленные')` for Sent
