---
description: Generate Snapshot poll descriptions and choice lists from Telegram chat archive for SRT Stage 2
---

# Generate SRT Poll Descriptions for Stage 2

This workflow generates Snapshot poll descriptions and choice lists from a Telegram chat archive. It uses a helper script to parse the HTML archive, then the AI reviews, formats, and validates the output.

## Prerequisites

- Python 3 installed
- Helper script exists at `apps/srt-1/tools/parse-tg-archive.py`
- Poll description template at `apps/srt-1/resources/snapshot-poll-template.md`

## Step 1: Gather inputs from the user

Ask the user for:
1. **Period number** (e.g., 136)
2. **Path to Telegram archive HTML** (e.g., `apps/srt-1/resources/tg-srt-export_YYYY-MM-DD/messages.html`)

## Step 2: Parse the archive

// turbo
Run the helper script to extract proposals:
```bash
python3 apps/srt-1/tools/parse-tg-archive.py \
  --archive <ARCHIVE_PATH> \
  --period <PERIOD> \
  --out apps/srt-1/stage2/p<PERIOD>/proposals.json
```

Read the output file and print a summary:
- Number of TPs and CRs found
- Which proposals are within the declared Stage 1 deadline and which are late
- The declared deadline

## Step 3: Review extracted proposals

Review `proposals.json` and check for issues. Present findings to the user:

### 3a. Late proposals
If any proposals have `withinDeadline: false`, list them and ask the user whether to include or exclude each one. In practice, late proposals are often still included (e.g., the poll creator waited for them).

### 3b. Choice count limit
Snapshot currently allows **9 choices** per poll (unverified space). If there are more than 9 TPs or 9 CRs:
- List all proposals with their authors
- Ask the user which proposals to **merge** (combine into one choice) or **omit**
- If omitting, note these for inclusion in a `# Note` section in the poll description

### 3c. Title length
Snapshot limits choice names to **32 characters**. Check each proposal title and suggest truncations for any that exceed this limit.

### 3d. Duplicates
Flag any proposals that appear to be near-duplicates (similar titles across different authors or the same author reposting).

Wait for user confirmation before proceeding.

## Step 4: Generate poll description markdown

Read the template at `apps/srt-1/resources/snapshot-poll-template.md` for the expected format.

For each poll type (Topics and CRs), generate a markdown file following the template:

**File: `apps/srt-1/stage2/p<PERIOD>/topics-body.md`**
```markdown
## From <Author 1 Display Name>

### TP: <Proposal Title>

<Proposal description>

### TP: <Another Proposal Title>

<Description>

## From <Author 2 Display Name>

### TP: <Proposal Title>

<Description>
```

**File: `apps/srt-1/stage2/p<PERIOD>/crs-body.md`**
Same format but with `### CR:` headers.

If any proposals were omitted due to the 9-choice limit, add a `# Note` section at the top:
```markdown
# Note
Snapshot allows only 9 choices. The following proposals were omitted from this poll:
- "<Omitted Proposal Title>" by <Author> — <reason>
```

## Step 5: Generate choice lists

Create JSON files with the choice names (these are what appear in the Snapshot poll UI):

**File: `apps/srt-1/stage2/p<PERIOD>/topics-choices.json`**
```json
["Choice 1", "Choice 2", "Choice 3"]
```

**File: `apps/srt-1/stage2/p<PERIOD>/crs-choices.json`**
```json
["Choice 1", "Choice 2", "Choice 3"]
```

Rules for choice names:
- Must be ≤ 32 characters
- Should match the `### TP:` / `### CR:` header titles as closely as possible
- If a choice was merged from multiple proposals, use a combined name

## Step 6: Validate

Check the following constraints:

| Constraint | Limit | Action if exceeded |
|---|---|---|
| Choices per poll | 9 | Must merge or omit (should have been resolved in Step 3) |
| Choice name length | 32 chars | Truncate title |
| Description body length | 10,000 chars | Propose truncation of longest descriptions |

If the body exceeds 10,000 characters:
- Show the current character count
- Identify the longest descriptions
- Propose specific truncations for user approval

## Step 7: User review

Present the final output files to the user for review:

```
apps/srt-1/stage2/p<PERIOD>/
├── proposals.json          # Raw parsed proposals (from Step 2)
├── topics-body.md          # Poll description for Topics poll
├── topics-choices.json     # Choice names for Topics poll
├── crs-body.md             # Poll description for CRs poll
└── crs-choices.json        # Choice names for CRs poll
```

The user should:
1. Review the markdown files — check descriptions are accurate, nothing is missing
2. Review the choice lists — check names are appropriate
3. Confirm or request edits

The poll title should follow the format:
- `Topics (Period <PERIOD>)`
- `Contribution Requests (Period <PERIOD>)`

## Snapshot Limits Reference

| Setting | Current (unverified) | Verified | Turbo |
|---|---|---|---|
| Choices per poll | 9 | 20 | 1000 |
| Description length | 10,000 chars | 10,000 chars | 10,000 chars |
| Choice name length | 32 chars | 32 chars | 32 chars |

## Notes

- The helper script handles HTML→markdown conversion, "joined" message author inheritance, and Stage 1 boundary detection automatically.
- The AI is responsible for judgment calls: handling late proposals, merging/omitting when over the choice limit, and truncating descriptions.
- The generated files follow the format defined in `resources/snapshot-poll-template.md` so they are compatible with the report generator (`tools/build-report.py`).
