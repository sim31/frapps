---
description: Generate SRT V1 cumulative report from Snapshot poll data
---

# Generate SRT V1 Cumulative Report

This workflow generates a cumulative report for the SRT V1 game. It fetches poll data from the Snapshot API, parses proposal descriptions from poll bodies, and produces a report directory with data, descriptions, and an HTML report.

## Prerequisites

- Python 3 installed
- The report template exists at `apps/srt-1/reports/template/index.html`
- The build script exists at `apps/srt-1/tools/build-report.py`

## Step 1: Gather Snapshot poll URLs

The user provides Snapshot poll URLs for each period in the report window (2 URLs per period: one Topics poll + one CRs poll). These are found in the Telegram group: https://t.me/edenfractal/5562

Typical report window is 1 period.

## Step 2: Review the Telegram chat archive for supplementary info

If the user provides a Telegram chat archive (HTML export), review it for:

- **Stage 1 start dates** — messages announcing "Stage 1 starts" or similar
- **Missing items** — proposals omitted from polls (e.g., due to Snapshot's 9-option limit)
- **Period corrections** — polls mislabeled with wrong period numbers
- **Notes** — any special circumstances mentioned in chat

## Step 3: Create or update config.json

Create `reports/pNNN/config.json` with any overrides found. Supported fields:

```json
{
  "periodOverrides": { "0xPOLL_ID": CORRECT_PERIOD_NUMBER },
  "stage1Dates": { "PERIOD": "YYYY-MM-DD" },
  "proposerNames": { "ShortName": "Full Display Name" },
  "choiceProposers": { "PERIOD-TYPE-CHOICE_NAME": "Full Display Name" },
  "missingItems": [
    {
      "period": 135, "type": "cr", "name": "Item Name",
      "proposer": "Name", "reason": "Why it was omitted",
      "description": "Markdown description of the missing item"
    }
  ],
  "descriptionOverrides": { "PERIOD-TYPE-CHOICE_NAME": "Override markdown" },
  "notes": ["Any notes to display in the report footer."]
}
```

**`proposerNames`**: Maps short names from Snapshot body (e.g., "Tadas") to full display names (e.g., "Tadas | sim31"). Only needed if the Snapshot poll body uses `## From Name` headers with short names.

**`choiceProposers`**: Explicit proposer assignments for specific choices. Needed when poll bodies don't have `## From Name` headers (early periods) or when auto-detection assigns the wrong proposer. Key format: `"PERIOD-TYPE-CHOICE_NAME"` where TYPE is `tp` or `cr`.

## Step 4: Run the build script

// turbo
```bash
python3 apps/srt-1/tools/build-report.py \
  --period LATEST_PERIOD \
  --polls URL1 URL2 URL3 URL4 URL5 URL6 \
  --config apps/srt-1/reports/pNNN/config.json \
  --out apps/srt-1/reports/pNNN
```

Check the output for:
- All polls should show `N/N matched`
- Any `UNMATCHED choices` or `unused sections` warnings need investigation
- Fix issues by updating `config.json` and re-running

## Step 5: Preview and verify

// turbo
```bash
cd apps/srt-1/reports/pNNN && python3 -m http.server 8765
```

Open the report in a browser and verify:
- Cumulative scores are correct
- Proposal descriptions expand correctly when clicked
- Multi-period proposals show tabs
- Links in descriptions are properly highlighted
- Missing items are displayed with warnings
- Notes appear in the footer

## Step 6: Compare with previous report (if applicable)

If updating an existing report, compare the generated `data.json` with the previous one to verify scores and proposers match.

## Output structure

```
reports/pNNN/
├── config.json            # Config overrides used for generation
├── data.json              # Poll results + metadata
├── descriptions/          # One .md file per proposal per period
├── descriptions.json      # Bundled descriptions for the HTML
└── index.html             # Self-contained HTML report
```
