#!/usr/bin/env python3
"""Build SRT V1 cumulative report from Snapshot poll data.

Usage:
    python3 tools/build-report.py \
        --period 135 \
        --polls URL1 URL2 URL3 URL4 URL5 URL6 \
        --config config.json \
        --out reports/p135
"""

import argparse
import json
import os
import re
import shutil
import sys
import urllib.request
from datetime import datetime, timezone

SNAPSHOT_GQL = "https://hub.snapshot.org/graphql"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_TEMPLATE = os.path.join(SCRIPT_DIR, '..', 'reports', 'template', 'index.html')


# ── Snapshot API ────────────────────────────────────────────────────────────

def fetch_proposal(proposal_id):
    """Fetch a proposal from Snapshot GraphQL API."""
    query = json.dumps({
        "query": '{proposal(id:"%s"){id title body choices scores scores_total votes start end}}' % proposal_id
    })
    req = urllib.request.Request(
        SNAPSHOT_GQL,
        data=query.encode(),
        headers={
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (SRT-Report-Builder)"
        }
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
    return data["data"]["proposal"]


def extract_proposal_id(url):
    """Extract proposal ID from a Snapshot URL."""
    m = re.search(r'/proposal/(0x[a-f0-9]+)', url)
    if m:
        return m.group(1)
    raise ValueError(f"Cannot extract proposal ID from URL: {url}")


# ── Title Parsing ───────────────────────────────────────────────────────────

def parse_poll_title(title):
    """Parse period number and type from poll title.
    Examples: 'Topics (Period 135)', 'Contribution Requests (period 134)'
    """
    m = re.match(r'(Topics|Contribution Requests)\s*\((?:period|Period)\s*(\d+)\)', title, re.I)
    if m:
        poll_type = 'topics' if m.group(1).lower() == 'topics' else 'crs'
        period = int(m.group(2))
        return period, poll_type
    raise ValueError(f"Cannot parse poll title: {title}")


# ── Body Parsing ────────────────────────────────────────────────────────────

def parse_body_sections(body):
    """Parse proposal descriptions and proposer names from Snapshot poll body markdown.

    Handles variable heading levels and formatting:
        # From Name  /  ## From Name
        ## TP: Title  /  ### TP: Title  /  ### **TP: Title**
        **CR: Title** (bold text without heading)
    """
    sections = []
    current_proposer = None

    lines = body.split('\n')
    i = 0
    while i < len(lines):
        line = lines[i].strip()

        # Detect proposer header: # From Name  or  ## From Name
        proposer_match = re.match(r'^#{1,3}\s+From\s+(.+)', line)
        if proposer_match:
            current_proposer = proposer_match.group(1).strip()
            i += 1
            continue

        # Detect proposal header: ## TP: Title  /  ### CR: Title  /  ### **CR: Title**
        proposal_match = re.match(
            r'^#{1,4}\s+\**\s*(?:TP|CR):\s*(.+?)\**\s*$', line
        )
        # Also detect bold-text proposals: **CR: Title** or **TP: Title**
        if not proposal_match:
            proposal_match = re.match(
                r'^\*\*(?:TP|CR):\s*(.+?)\*\*\s*$', line
            )

        if proposal_match:
            title = proposal_match.group(1).strip().rstrip('*').strip()
            # Collect description lines until next heading or next proposal
            desc_lines = []
            i += 1
            while i < len(lines):
                next_line = lines[i].strip()
                # Stop at headings
                if re.match(r'^#{1,4}\s', next_line):
                    break
                # Stop at next bold-text proposal
                if re.match(r'^\*\*(?:TP|CR):', next_line):
                    break
                desc_lines.append(lines[i])
                i += 1

            # Strip leading/trailing blank lines
            while desc_lines and not desc_lines[0].strip():
                desc_lines.pop(0)
            while desc_lines and not desc_lines[-1].strip():
                desc_lines.pop()

            sections.append({
                'title': title,
                'proposer': current_proposer or 'Unknown',
                'description': '\n'.join(desc_lines)
            })
            continue

        i += 1

    return sections


# ── Choice ↔ Section Matching ──────────────────────────────────────────────

def normalize_words(s):
    return set(re.sub(r'[^\w\s]', '', s.lower()).split())


def word_overlap(a, b):
    wa, wb = normalize_words(a), normalize_words(b)
    if not wa or not wb:
        return 0
    return len(wa & wb) / min(len(wa), len(wb))


def match_choices_to_sections(choices, sections):
    """Match poll choices to parsed body sections by word similarity.

    Returns (matched_dict, unmatched_choices, unmatched_sections).
    matched_dict: { choice_name: { proposer, description } }
    """
    matched = {}
    used = set()

    # First pass: strong matches
    for choice in choices:
        best_score, best_idx = 0, -1
        for idx, sec in enumerate(sections):
            score = word_overlap(choice, sec['title'])
            if score > best_score:
                best_score = score
                best_idx = idx

        if best_score >= 0.5 and best_idx >= 0:
            matched[choice] = {
                'proposer': sections[best_idx]['proposer'],
                'description': sections[best_idx]['description']
            }
            used.add(best_idx)

    # Second pass: try merged choices (choice name contains words from 2+ section titles)
    for choice in choices:
        if choice in matched:
            continue
        candidates = []
        for idx, sec in enumerate(sections):
            if idx in used:
                continue
            common = normalize_words(choice) & normalize_words(sec['title'])
            # At least 1 significant word in common (excluding very short words)
            sig_common = {w for w in common if len(w) > 2}
            if sig_common:
                candidates.append(idx)

        if len(candidates) >= 2:
            descs = []
            proposers = set()
            for ci in candidates:
                descs.append(f"### {sections[ci]['title']}\n\n{sections[ci]['description']}")
                proposers.add(sections[ci]['proposer'])
                used.add(ci)
            matched[choice] = {
                'proposer': ', '.join(sorted(proposers)),
                'description': '\n\n---\n\n'.join(descs)
            }

    # Third pass: check if unused sections should be merged into already-matched choices
    for choice in choices:
        if choice not in matched:
            continue
        for idx, sec in enumerate(sections):
            if idx in used:
                continue
            common = normalize_words(choice) & normalize_words(sec['title'])
            sig_common = {w for w in common if len(w) > 3}
            if sig_common:
                # Merge this section into the existing match
                existing = matched[choice]
                existing['description'] = (
                    f"### {sections[matched[choice].get('_primary_idx', idx)]['title'] if '_primary_idx' in matched[choice] else ''}\n\n"
                    if '_primary_idx' in matched[choice] else ''
                ) + existing['description'] + f"\n\n---\n\n### {sec['title']}\n\n{sec['description']}"
                used.add(idx)

    unmatched_c = [c for c in choices if c not in matched]
    unmatched_s = [sections[i]['title'] for i in range(len(sections)) if i not in used]
    return matched, unmatched_c, unmatched_s


# ── Utilities ───────────────────────────────────────────────────────────────

def ts_to_date(ts):
    return datetime.fromtimestamp(ts, tz=timezone.utc).strftime('%Y-%m-%d')


def normalize_snapshot_url(url):
    """Normalize to snapshot.box URL for display."""
    return url.replace('snapshot.org/#/', 'snapshot.box/#/')


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='Build SRT V1 cumulative report')
    parser.add_argument('--period', type=int, required=True,
                        help='Report period number (latest period)')
    parser.add_argument('--polls', nargs='+', required=True,
                        help='Snapshot poll URLs (topics + CRs for each period)')
    parser.add_argument('--config', default=None,
                        help='Path to config.json with overrides')
    parser.add_argument('--out', required=True,
                        help='Output directory (e.g. reports/p135)')
    parser.add_argument('--decay', type=float, default=0.5,
                        help='Decay factor λ (default: 0.5)')
    parser.add_argument('--template', default=None,
                        help='Path to HTML template (default: reports/template/index.html)')
    args = parser.parse_args()

    # Load config
    config = {}
    if args.config and os.path.exists(args.config):
        with open(args.config) as f:
            config = json.load(f)
        print(f"Loaded config from {args.config}")

    period_overrides = config.get('periodOverrides', {})
    missing_items = config.get('missingItems', [])
    notes = config.get('notes', [])
    stage1_dates = config.get('stage1Dates', {})
    desc_overrides = config.get('descriptionOverrides', {})
    proposer_names = config.get('proposerNames', {})
    choice_proposers = config.get('choiceProposers', {})

    # ── Fetch polls ──────────────────────────────────────────────────────
    print(f"\nFetching {len(args.polls)} polls from Snapshot API...")
    polls = []
    for url in args.polls:
        pid = extract_proposal_id(url)
        print(f"  {pid[:16]}... ", end='')
        proposal = fetch_proposal(pid)

        try:
            period, poll_type = parse_poll_title(proposal['title'])
        except ValueError as e:
            print(f"SKIP ({e})")
            continue

        # Apply overrides
        if pid in period_overrides:
            old = period
            period = period_overrides[pid]
            print(f"(override: P{old}→P{period}) ", end='')

        # Parse body
        sections = parse_body_sections(proposal['body'])
        matched, unmatched_c, unmatched_s = match_choices_to_sections(
            proposal['choices'], sections
        )

        status = f"{len(matched)}/{len(proposal['choices'])} matched"
        if unmatched_c:
            status += f", UNMATCHED choices: {unmatched_c}"
        if unmatched_s:
            status += f", unused sections: {unmatched_s}"
        print(status)

        polls.append({
            'id': pid, 'url': url, 'period': period, 'type': poll_type,
            'title': proposal['title'],
            'choices': proposal['choices'], 'scores': proposal['scores'],
            'scores_total': proposal['scores_total'], 'votes': proposal['votes'],
            'start': proposal['start'], 'end': proposal['end'],
            'matched': matched
        })

    if not polls:
        print("ERROR: No valid polls found. Exiting.")
        sys.exit(1)

    # ── Group by period ──────────────────────────────────────────────────
    period_map = {}
    for poll in polls:
        period_map.setdefault(poll['period'], {})[poll['type']] = poll

    sorted_periods = sorted(period_map.keys())
    n = len(sorted_periods)

    # ── Build data structures ────────────────────────────────────────────
    periods_data = []
    descriptions = {}

    for idx, period in enumerate(sorted_periods):
        weight = round(args.decay ** (n - 1 - idx), 4)

        entry = {
            'period': period,
            'periodIndex': idx,
            'decayWeight': weight,
            'dates': {}
        }

        for poll_type in ['topics', 'crs']:
            if poll_type not in period_map[period]:
                print(f"  WARNING: No {poll_type} poll for period {period}")
                continue

            poll = period_map[period][poll_type]
            desc_type = 'tp' if poll_type == 'topics' else 'cr'

            stage2_end = ts_to_date(poll['end'])
            s1_key = str(period)
            stage1_start = stage1_dates.get(s1_key, ts_to_date(poll['start']))

            entry['dates'] = {
                'stage1Start': stage1_start,
                'stage2End': stage2_end
            }

            choices_data = []
            for i, choice_name in enumerate(poll['choices']):
                score = round(poll['scores'][i], 2)
                m = poll['matched'].get(choice_name, {})
                proposer = m.get('proposer', 'Unknown')
                desc = m.get('description', '')

                # Apply proposer name mapping (e.g. "Tadas" -> "Tadas | sim31")
                proposer = proposer_names.get(proposer, proposer)

                # Apply explicit per-choice proposer override
                ck = f"{period}-{desc_type}-{choice_name}"
                if ck in choice_proposers:
                    proposer = choice_proposers[ck]

                choices_data.append({
                    'name': choice_name,
                    'score': score,
                    'proposer': proposer
                })

                if desc:
                    desc_key = f"{period}-{desc_type}-{choice_name}"
                    descriptions[desc_key] = desc

            entry[poll_type] = {
                'snapshotId': poll['id'],
                'snapshotTitle': poll['title'],
                'snapshotUrl': normalize_snapshot_url(poll['url']),
                'votes': poll['votes'],
                'scoresTotal': round(poll['scores_total'], 2),
                'choices': choices_data
            }

        # Missing items from config
        period_missing = [m for m in missing_items if m.get('period') == period]
        if period_missing:
            entry['missingItems'] = [
                {k: v for k, v in m.items() if k != 'description'}
                for m in period_missing
            ]
            for m in period_missing:
                if 'description' in m:
                    dk = f"{period}-{m['type']}-{m['name']}"
                    descriptions[dk] = m['description']

        periods_data.append(entry)

    # Apply description overrides from config
    descriptions.update(desc_overrides)

    # ── Build data.json ──────────────────────────────────────────────────
    data = {
        'meta': {
            'game': 'SRT V1',
            'community': 'Eden Fractal',
            'reportPeriod': args.period,
            'periodsIncluded': sorted_periods,
            'decayFactor': args.decay,
            'generatedAt': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
            'proposalsGroup': 'https://t.me/edenfractal/5562',
            'notes': notes
        },
        'periods': periods_data
    }

    # ── Write output ─────────────────────────────────────────────────────
    os.makedirs(args.out, exist_ok=True)
    desc_dir = os.path.join(args.out, 'descriptions')
    os.makedirs(desc_dir, exist_ok=True)

    # data.json
    data_path = os.path.join(args.out, 'data.json')
    with open(data_path, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"\nWrote {data_path}")

    # descriptions/*.md
    for key, desc in descriptions.items():
        safe_name = re.sub(r'[<>:"/\\|?*]', '_', key)
        with open(os.path.join(desc_dir, f"{safe_name}.md"), 'w') as f:
            f.write(desc)
    print(f"Wrote {len(descriptions)} description files to {desc_dir}/")

    # descriptions.json
    desc_json_path = os.path.join(args.out, 'descriptions.json')
    with open(desc_json_path, 'w') as f:
        json.dump(descriptions, f, indent=2, ensure_ascii=False)
    print(f"Wrote {desc_json_path}")

    # HTML: read template, inline data, write
    tmpl_path = args.template or DEFAULT_TEMPLATE
    if os.path.exists(tmpl_path):
        with open(tmpl_path) as f:
            html = f.read()

        html = html.replace('__DATA_JSON__', json.dumps(data, ensure_ascii=False))
        html = html.replace('__DESCRIPTIONS_JSON__', json.dumps(descriptions, ensure_ascii=False))

        html_path = os.path.join(args.out, 'index.html')
        with open(html_path, 'w') as f:
            f.write(html)
        print(f"Wrote {html_path}")
    else:
        print(f"WARNING: Template not found at {tmpl_path}")
        print("  Run without --template to use default: reports/template/index.html")

    # ── Summary ──────────────────────────────────────────────────────────
    print(f"\n{'='*60}")
    print(f"Report generated: {args.out}/")
    print(f"  Periods: {sorted_periods[0]}–{sorted_periods[-1]}")
    print(f"  Polls: {len(polls)}")
    print(f"  Descriptions: {len(descriptions)}")
    if notes:
        print(f"  Notes: {len(notes)}")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
