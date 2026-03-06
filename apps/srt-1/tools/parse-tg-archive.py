#!/usr/bin/env python3
"""Parse Telegram chat archive HTML to extract SRT Stage 1 proposals.

Finds the Stage 1 start message for a given period, extracts all TP/CR
proposals posted after it, and outputs structured JSON.

Usage:
    python3 parse-tg-archive.py --archive messages.html --period 135
    python3 parse-tg-archive.py --archive messages.html --period 135 --out proposals.json
"""

import argparse
import json
import re
import sys
from html.parser import HTMLParser
from datetime import datetime, timezone, timedelta


# ---------------------------------------------------------------------------
# HTML → Markdown converter
# ---------------------------------------------------------------------------

class TgHtmlToMarkdown(HTMLParser):
    """Convert Telegram export HTML fragment to markdown."""

    def __init__(self):
        super().__init__()
        self._md = []
        self._href = None
        self._link_text = []
        self._in_link = False
        self._in_pre = False
        self._in_strong = False
        self._in_em = False

    def handle_starttag(self, tag, attrs):
        attrs_d = dict(attrs)
        if tag == 'br':
            self._md.append('\n')
        elif tag == 'a':
            self._in_link = True
            self._href = attrs_d.get('href', '')
            self._link_text = []
        elif tag == 'strong':
            self._in_strong = True
            self._md.append('**')
        elif tag == 'em':
            self._in_em = True
            self._md.append('*')
        elif tag == 'pre':
            self._in_pre = True
            self._md.append('\n```\n')

    def handle_endtag(self, tag):
        if tag == 'a':
            text = ''.join(self._link_text)
            href = self._href or ''
            # If text == href or text is empty, just show the URL
            if not text.strip() or text.strip() == href.strip():
                self._md.append(href)
            else:
                self._md.append(f'[{text}]({href})')
            self._in_link = False
            self._href = None
            self._link_text = []
        elif tag == 'strong':
            self._in_strong = True
            self._md.append('**')
        elif tag == 'em':
            self._in_em = False
            self._md.append('*')
        elif tag == 'pre':
            self._in_pre = False
            self._md.append('\n```\n')

    def handle_data(self, data):
        if self._in_link:
            self._link_text.append(data)
        else:
            self._md.append(data)

    def handle_entityref(self, name):
        char = {'amp': '&', 'lt': '<', 'gt': '>', 'quot': '"', 'apos': "'"}
        text = char.get(name, f'&{name};')
        if self._in_link:
            self._link_text.append(text)
        else:
            self._md.append(text)

    def handle_charref(self, name):
        try:
            if name.startswith('x'):
                c = chr(int(name[1:], 16))
            else:
                c = chr(int(name))
        except (ValueError, OverflowError):
            c = f'&#{name};'
        if self._in_link:
            self._link_text.append(c)
        else:
            self._md.append(c)

    def get_markdown(self):
        return ''.join(self._md).strip()


def html_to_markdown(html_fragment):
    """Convert a Telegram message HTML fragment to markdown."""
    converter = TgHtmlToMarkdown()
    converter.feed(html_fragment)
    return converter.get_markdown()


# ---------------------------------------------------------------------------
# Archive parser
# ---------------------------------------------------------------------------

def parse_messages(html_content):
    """Parse all messages from the Telegram archive HTML.

    Returns list of dicts with keys:
        id, author, timestamp, timestamp_raw, text_html, text_md,
        is_joined, reply_to_id, css_classes
    """
    messages = []

    # Match message divs - both regular and joined
    msg_pattern = re.compile(
        r'<div\s+class="(message default clearfix(?:\s+joined)?)"'
        r'\s+id="(message\d+)">(.*?)</div>\s*(?=<div\s+class="message|</div>\s*</div>\s*</div>)',
        re.DOTALL
    )

    # Simpler approach: split by message divs
    # Find all message blocks
    msg_starts = list(re.finditer(
        r'<div\s+class="(message default clearfix[^"]*?)"\s+id="(message\d+)">',
        html_content
    ))

    for i, match in enumerate(msg_starts):
        css_classes = match.group(1)
        msg_id = match.group(2)
        is_joined = 'joined' in css_classes

        # Extract content between this message start and the next message start
        start_pos = match.end()
        if i + 1 < len(msg_starts):
            end_pos = msg_starts[i + 1].start()
        else:
            end_pos = len(html_content)

        block = html_content[start_pos:end_pos]

        # Extract timestamp
        ts_match = re.search(r'class="pull_right date details"\s+title="([^"]+)"', block)
        timestamp_raw = ts_match.group(1) if ts_match else None

        # Parse timestamp
        timestamp = None
        if timestamp_raw:
            timestamp = parse_timestamp(timestamp_raw)

        # Extract author (only in non-joined messages)
        author = None
        author_match = re.search(r'<div class="from_name">\s*\n?(.*?)\s*\n?\s*</div>', block, re.DOTALL)
        if author_match:
            author = author_match.group(1).strip()

        # Extract reply_to message id
        reply_match = re.search(r'GoToMessage\((\d+)\)', block)
        reply_to_id = int(reply_match.group(1)) if reply_match else None

        # Extract text content
        text_html = None
        text_match = re.search(r'<div class="text">\s*\n?(.*?)\s*</div>', block, re.DOTALL)
        if text_match:
            text_html = text_match.group(1).strip()

        text_md = html_to_markdown(text_html) if text_html else None

        messages.append({
            'id': msg_id,
            'author': author,
            'timestamp': timestamp,
            'timestamp_raw': timestamp_raw,
            'text_html': text_html,
            'text_md': text_md,
            'is_joined': is_joined,
            'reply_to_id': reply_to_id,
        })

    # Resolve authors for joined messages (inherit from previous non-joined)
    last_author = None
    for msg in messages:
        if msg['author']:
            last_author = msg['author']
        else:
            msg['author'] = last_author

    return messages


def parse_timestamp(ts_raw):
    """Parse Telegram timestamp like '23.01.2026 09:30:08 UTC+02:00' to ISO string."""
    # Format: DD.MM.YYYY HH:MM:SS UTC+HH:MM
    m = re.match(r'(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2}):(\d{2})\s+UTC([+-]\d{2}:\d{2})', ts_raw)
    if not m:
        return None
    day, month, year = int(m.group(1)), int(m.group(2)), int(m.group(3))
    hour, minute, second = int(m.group(4)), int(m.group(5)), int(m.group(6))
    tz_str = m.group(7)

    # Parse timezone offset
    tz_sign = 1 if tz_str[0] == '+' else -1
    tz_hours, tz_mins = int(tz_str[1:3]), int(tz_str[4:6])
    tz_offset = timedelta(hours=tz_sign * tz_hours, minutes=tz_sign * tz_mins)
    tz = timezone(tz_offset)

    dt = datetime(year, month, day, hour, minute, second, tzinfo=tz)
    return dt.isoformat()


def parse_deadline_text(text):
    """Extract stage 1 deadline text from a Stage 1 start message.

    Returns the raw deadline string (e.g., 'Monday 16 UTC').
    """
    # Look for patterns like "Stage one ends on Monday 16 UTC" or
    # "Stage 1 ends on Monday 16:00 UTC"
    m = re.search(r'[Ss]tage\s+(?:one|1)\s+ends\s+on\s+(.+?)(?:\*\*|$)', text)
    if m:
        return m.group(1).strip().rstrip('.*')
    return None


def compute_deadline_ts(deadline_text, stage1_start_iso):
    """Try to compute an ISO timestamp for the deadline.

    Given text like 'Monday 16 UTC' and the stage 1 start timestamp,
    find the next Monday at 16:00 UTC after the start.
    """
    if not deadline_text or not stage1_start_iso:
        return None

    # Parse day of week and time
    m = re.match(r'(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(\d{1,2})(?::(\d{2}))?\s*UTC', deadline_text, re.I)
    if not m:
        return None

    day_names = {
        'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
        'friday': 4, 'saturday': 5, 'sunday': 6
    }
    target_day = day_names[m.group(1).lower()]
    target_hour = int(m.group(2))
    target_minute = int(m.group(3)) if m.group(3) else 0

    # Parse start timestamp
    start_dt = datetime.fromisoformat(stage1_start_iso)
    start_utc = start_dt.astimezone(timezone.utc)

    # Find the next occurrence of target_day after start
    days_ahead = (target_day - start_utc.weekday()) % 7
    if days_ahead == 0:
        # Same day of week — check if time is later
        candidate = start_utc.replace(hour=target_hour, minute=target_minute, second=0, microsecond=0)
        if candidate <= start_utc:
            days_ahead = 7
    deadline_date = start_utc.date() + timedelta(days=days_ahead)
    deadline_dt = datetime(deadline_date.year, deadline_date.month, deadline_date.day,
                           target_hour, target_minute, 0, tzinfo=timezone.utc)
    return deadline_dt.isoformat()


# ---------------------------------------------------------------------------
# Proposal extraction
# ---------------------------------------------------------------------------

# Regex to detect TP/CR proposals in markdown text
# Handles: **TP: Title**, TP: Title, 📖 CR: Title, [CR: Title](url),
#          [📖](url) [CR: Title](url), etc.
PROPOSAL_RE = re.compile(
    r'^'                   # start of line
    r'(?:.*?)'             # any prefix (emoji, links, whitespace)
    r'(?:\*\*)?'           # optional bold opening
    r'(?:\[)?'             # optional link opening
    r'(TP|CR):\s*'         # TP: or CR:
    r'(.+?)'               # title (lazy)
    r'(?:\]\([^)]*\))?'    # optional link closing ](url)
    r'(?:\*\*)?'           # optional bold closing
    r'\s*$',               # end of line
    re.MULTILINE
)


def extract_proposal(text_md):
    """Check if a markdown message is a TP or CR proposal.

    Returns (type, title, description) or None.
    """
    if not text_md:
        return None

    lines = text_md.split('\n')
    first_line = lines[0].strip()

    # Try matching the first line
    m = PROPOSAL_RE.match(first_line)

    if not m:
        return None

    ptype = m.group(1).lower()
    title = m.group(2).strip().rstrip('*').strip()

    # Description is everything after the first line, stripping leading blank lines
    desc_lines = lines[1:]
    while desc_lines and not desc_lines[0].strip():
        desc_lines.pop(0)
    while desc_lines and not desc_lines[-1].strip():
        desc_lines.pop()
    description = '\n'.join(desc_lines)

    # Clean description artifacts from empty <strong><br></strong> patterns
    # These produce leading '** **' or '**\n**' in markdown
    description = re.sub(r'^\s*\*\*\s*\*\*\s*', '', description).lstrip()

    return ptype, title, description


def find_period_stage1(messages, period):
    """Find the Stage 1 start message for the given period.

    Looks for a period announcement message (containing "Period NNN")
    followed by a "Stage 1 starts" message.

    Returns the index of the Stage 1 start message, or None.
    """
    # First, find the period announcement
    period_announce_idx = None
    for i, msg in enumerate(messages):
        if msg['text_md'] and re.search(
            rf'Period\s+{period}\b', msg['text_md'], re.I
        ):
            period_announce_idx = i
            break

    if period_announce_idx is None:
        return None

    # Now find the Stage 1 start message near the announcement
    # (could be the same message or a subsequent one)
    for i in range(period_announce_idx, min(period_announce_idx + 5, len(messages))):
        msg = messages[i]
        if msg['text_md'] and re.search(r'Stage\s+1\s+starts\s+now', msg['text_md'], re.I):
            return i

    # Also check if the announcement itself contains Stage 1 start
    if messages[period_announce_idx]['text_md'] and re.search(
        r'Stage\s+1\s+starts', messages[period_announce_idx]['text_md'], re.I
    ):
        return period_announce_idx

    return None


def find_stage2_start(messages, start_idx):
    """Find the Stage 2 start message (Stage 1 ended) after start_idx.

    Returns the index, or None if not found.
    """
    for i in range(start_idx + 1, len(messages)):
        msg = messages[i]
        if msg['text_md'] and re.search(
            r'Stage\s+1\s+has\s+ended|Stage\s+2\s+starts', msg['text_md'], re.I
        ):
            return i
    return None


def extract_proposals(messages, period):
    """Extract all proposals for a given period from parsed messages.

    Returns a dict with period info, proposals list, and metadata.
    """
    stage1_idx = find_period_stage1(messages, period)
    if stage1_idx is None:
        print(f"ERROR: Could not find Stage 1 start for Period {period}", file=sys.stderr)
        sys.exit(1)

    stage1_msg = messages[stage1_idx]
    stage1_start_iso = stage1_msg['timestamp']

    # Parse deadline
    deadline_text = parse_deadline_text(stage1_msg['text_md'])
    deadline_ts = compute_deadline_ts(deadline_text, stage1_start_iso)

    # Find Stage 2 start (if present)
    stage2_idx = find_stage2_start(messages, stage1_idx)
    stage2_started = stage2_idx is not None

    # Determine search range
    end_idx = stage2_idx if stage2_idx is not None else len(messages)

    # Extract proposals
    proposals = []
    total_messages = 0
    for i in range(stage1_idx + 1, end_idx):
        msg = messages[i]
        total_messages += 1

        result = extract_proposal(msg['text_md'])
        if result is None:
            continue

        ptype, title, description = result

        # Determine if within deadline
        within_deadline = True
        if deadline_ts and msg['timestamp']:
            msg_dt = datetime.fromisoformat(msg['timestamp'])
            deadline_dt = datetime.fromisoformat(deadline_ts)
            within_deadline = msg_dt <= deadline_dt

        proposals.append({
            'id': msg['id'],
            'type': ptype,
            'author': msg['author'],
            'timestamp': msg['timestamp'],
            'title': title,
            'description': description,
            'withinDeadline': within_deadline,
        })

    tp_count = sum(1 for p in proposals if p['type'] == 'tp')
    cr_count = sum(1 for p in proposals if p['type'] == 'cr')

    return {
        'period': period,
        'stage1Start': stage1_start_iso,
        'stage1Deadline': deadline_text,
        'stage1DeadlineTs': deadline_ts,
        'proposals': proposals,
        'meta': {
            'totalMessages': total_messages,
            'proposalCount': {'tp': tp_count, 'cr': cr_count},
            'stage2Started': stage2_started,
        }
    }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description='Parse Telegram archive HTML to extract SRT proposals.'
    )
    parser.add_argument('--archive', required=True, help='Path to messages.html')
    parser.add_argument('--period', required=True, type=int, help='Period number')
    parser.add_argument('--out', help='Output JSON file path (default: stdout)')
    args = parser.parse_args()

    with open(args.archive, 'r', encoding='utf-8') as f:
        html_content = f.read()

    messages = parse_messages(html_content)
    result = extract_proposals(messages, args.period)

    output = json.dumps(result, indent=2, ensure_ascii=False)

    if args.out:
        import os
        os.makedirs(os.path.dirname(args.out) or '.', exist_ok=True)
        with open(args.out, 'w', encoding='utf-8') as f:
            f.write(output)
            f.write('\n')
        print(f"Wrote {len(result['proposals'])} proposals to {args.out}", file=sys.stderr)
    else:
        print(output)


if __name__ == '__main__':
    main()
