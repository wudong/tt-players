# UK Ready League Scrape Progress

Started: 2026-03-15T08:41:02.013Z

- Total ready leagues scheduled: 190
- Mode: isolated sequential scrape by league using an internal campaign queue
- Progress checkpoint cadence: every 10 minutes

## Log

- 2026-03-15T08:41:02.048Z shared queue snapshot (ignored by isolated campaign runner): total=1340, runnable=1277, deferred=0, exhausted=63
- 2026-03-15T08:41:02.048Z bootstrapping ready leagues with history discovery
- 2026-03-15T08:43:06.424Z bootstrapped 190 ready leagues with scrape targets; missing_targets=2; writing initial tracker snapshot
- 2026-03-15T08:43:06.427Z ready leagues without targets: Basildon Table Tennis League; Colchester Table Tennis League
- 2026-03-15T08:43:06.433Z starting 1/190: Bath Table Tennis League (England / Avon), current_targets=4, history_targets=16
- 2026-03-15T08:43:14.705Z completed 1/190: Bath Table Tennis League, current=4/4, history=16/16, overall=completed, jobs_processed=80, jobs_failed=0
- 2026-03-15T08:43:14.708Z starting 2/190: Bristol Table Tennis League (England / Avon), current_targets=7, history_targets=34
- 2026-03-15T08:44:39.671Z completed 2/190: Bristol Table Tennis League, current=7/7, history=34/34, overall=completed, jobs_processed=163, jobs_failed=1
- 2026-03-15T08:44:39.672Z failure samples for Bristol Table Tennis League: processLogTask: {"logId":"e6becd9f-070b-4981-a02a-81aad72be16c","competitionId":"8f630049-7590-4f31-be37-da2b0663a66c","platformId":"c7560866-58f1-45f8-9406-570341fab522","platformType":"ttleagues-bundle"}: [
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      9,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      9,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  }
]
- 2026-03-15T08:44:39.674Z starting 3/190: Bedford Table Tennis League (England / Bedfordshire), current_targets=4, history_targets=21
- 2026-03-15T08:44:45.755Z completed 3/190: Bedford Table Tennis League, current=4/4, history=21/21, overall=completed, jobs_processed=100, jobs_failed=0
- 2026-03-15T08:44:45.757Z starting 4/190: Luton Table Tennis League (England / Bedfordshire), current_targets=1, history_targets=15
- 2026-03-15T08:45:30.687Z completed 4/190: Luton Table Tennis League, current=1/1, history=15/15, overall=completed, jobs_processed=66, jobs_failed=0
- 2026-03-15T08:45:30.688Z starting 5/190: Bracknell and Wokingham Table Tennis League (England / Berkshire), current_targets=3, history_targets=18
- 2026-03-15T08:46:41.039Z completed 5/190: Bracknell and Wokingham Table Tennis League, current=3/3, history=18/18, overall=completed, jobs_processed=84, jobs_failed=0
- 2026-03-15T08:46:41.041Z starting 6/190: Maidenhead Table Tennis League (England / Berkshire), current_targets=3, history_targets=9
- 2026-03-15T08:46:45.184Z completed 6/190: Maidenhead Table Tennis League, current=3/3, history=9/9, overall=completed, jobs_processed=48, jobs_failed=0
- 2026-03-15T08:46:45.185Z starting 7/190: Newbury Table Tennis League (England / Berkshire), current_targets=3, history_targets=12
- 2026-03-15T08:46:46.977Z completed 7/190: Newbury Table Tennis League, current=3/3, history=12/12, overall=completed, jobs_processed=60, jobs_failed=0
- 2026-03-15T08:46:46.979Z starting 8/190: Reading & District Table Tennis Association (England / Berkshire), current_targets=4, history_targets=24
