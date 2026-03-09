# Snapshot Poll Description Template

This template defines the expected format for Snapshot poll descriptions used by the SRT V1 report generator (`tools/build-report.py`). Following this format ensures proposals, authors, and descriptions are automatically parsed without needing manual overrides in `config.json`.

## Poll Title

Use one of these exact formats:

- `Topics (Period NNN)`
- `Contribution Requests (Period NNN)`

where `NNN` is the period number.

## Poll Description Body

The poll description should start with an introductory paragraph explaining the purpose of the poll, followed by a section header, then the proposals grouped by author.

### For Topics polls:

```markdown
This is a poll to determine priority of topics at the time of period NNN of Eden Fractal. It is part of stage 2 of [Synchronous Respect Tree V1 game](https://hackmd.io/@sim31/srt-1).

Spread your Respect-weighted votes among topics according to your understanding of what topics are the most important to discuss right now. This will help determine our discussion topics for the upcoming town hall and the following week.

## From Author Display Name

### TP: Proposal Title

Proposal description...
```

### For Contribution Requests polls:

```markdown
This is a poll to determine priority of contribution requests at the time of period NNN of Eden Fractal. It is part of stage 2 of [Synchronous Respect Tree V1 game](https://hackmd.io/@sim31/srt-1).

Spread your Respect-weighted votes among contribution requests according to your understanding of what contributions are the most important right now. This will help guide contributors on what work would be most valuable to the community.

## From Author Display Name

### CR: Contribution Request Title

Description...
```

### Optional Note Section

```markdown
# Note
Optional notes about the poll (e.g. why a proposal was omitted).
This section is ignored by the parser.

## From Author Display Name

### TP: Proposal Title

Proposal description in markdown. Can include links, lists, bold, etc.

### TP: Another Proposal

Another description...

## From Another Author

### TP: Their Proposal Title

Description...
```

### For Contribution Requests polls, use `CR:` instead of `TP:`

```markdown
## From Author Display Name

### CR: Contribution Request Title

Description...
```

## Rules

1. **Proposer headers** — Use `## From Full Display Name`. The name here will appear in the report as-is (e.g. `## From Tadas | sim31`, not `## From Tadas`).

2. **Proposal headers** — Always use `### TP:` or `### CR:` prefix at heading level 3. Do not mix heading levels or use bold-text proposals.

3. **Title matching** — The title after `TP:` / `CR:` should match the Snapshot poll choice name as closely as possible. Snapshot truncates choices to 32 characters, so keep titles concise or ensure the first 30+ characters are unique.

4. **One proposal per heading** — Do not combine multiple proposals under one heading. If two proposals are merged into a single poll choice, use the merged choice name as the heading title.

5. **Description content** — Everything between one `###` heading and the next `##` or `###` heading is treated as the proposal description. Use standard markdown (links, lists, bold, etc.).

6. **Notes section** — An optional `# Note` section at the top is ignored by the parser. Use it for poll creator notes.

## Example: Topics Poll

**Poll title:** `Topics (Period 136)`

**Poll description:**

```markdown
This is a poll to determine priority of topics at the time of period 136 of Eden Fractal. It is part of stage 2 of [Synchronous Respect Tree V1 game](https://hackmd.io/@sim31/srt-1).

Spread your Respect-weighted votes among topics according to your understanding of what topics are the most important to discuss right now. This will help determine our discussion topics for the upcoming town hall and the following week.

## From Tadas | sim31

### TP: Update ORDAO configuration

Current configuration of Eden Fractal's ORDAO was meant to be temporary...

I propose to make these configuration changes: [details](https://example.com)

### TP: SRT V1 improvements

We've already started discussing this in [Eden Town Hall](https://example.com)...

## From Dan Singjoy

### TP: Fractalgram

Fractalgram has been a major topic of discussion...

### TP: Eden Fractal Community Agreement

Creating a community agreement has been one of our outstanding goals...
```

## Example: Contribution Requests Poll

**Poll title:** `Contribution Requests (Period 136)`

**Poll description:**

```markdown
This is a poll to determine priority of contribution requests at the time of period 136 of Eden Fractal. It is part of stage 2 of [Synchronous Respect Tree V1 game](https://hackmd.io/@sim31/srt-1).

Spread your Respect-weighted votes among contribution requests according to your understanding of what contributions are the most important right now. This will help guide contributors on what work would be most valuable to the community.

# Note
Snapshot only allows 9 choices. CR "Example Item" was omitted from this poll.

## From Tadas | sim31

### CR: Firmament

Firmament is an old project idea...

### CR: Non-profit for fractal ecosystem

A non-profit could help Eden Fractal by accepting donations...

## From Dan Singjoy

### CR: Educational Resources

Eden Fractal needs better educational resources...
```
