# UK Ready League Scrape Progress

Started: 2026-03-13T09:12:12.594Z

- Total ready leagues scheduled: 190
- Mode: isolated sequential scrape by league using an internal campaign queue
- Progress checkpoint cadence: every 10 minutes

## Log

- 2026-03-13T09:12:12.632Z shared queue snapshot (ignored by isolated campaign runner): total=1340, runnable=1277, deferred=0, exhausted=63
- 2026-03-13T09:12:12.632Z bootstrapping ready leagues with history discovery
- 2026-03-13T09:18:25.262Z bootstrapped 190 ready leagues with scrape targets; missing_targets=2; writing initial tracker snapshot
- 2026-03-13T09:18:25.265Z ready leagues without targets: Basildon Table Tennis League; Colchester Table Tennis League
- 2026-03-13T09:18:25.270Z starting 1/190: Bath Table Tennis League (England / Avon), current_targets=4, history_targets=16
- 2026-03-13T09:28:25.272Z checkpoint (10 minute timer): completed=0, partial=0, in_progress=1, pending=189
- 2026-03-13T09:32:08.983Z completed 1/190: Bath Table Tennis League, current=4/4, history=16/16, overall=completed, jobs_processed=80, jobs_failed=0
- 2026-03-13T09:32:08.984Z starting 2/190: Bristol Table Tennis League (England / Avon), current_targets=7, history_targets=34
- 2026-03-13T09:38:25.264Z checkpoint (10 minute timer): completed=1, partial=0, in_progress=1, pending=188
- 2026-03-13T09:48:25.299Z checkpoint (10 minute timer): completed=1, partial=0, in_progress=1, pending=188
- 2026-03-13T09:58:25.301Z checkpoint (10 minute timer): completed=1, partial=0, in_progress=1, pending=188
- 2026-03-13T10:21:20.735Z checkpoint (10 minute timer): completed=1, partial=0, in_progress=1, pending=188
- 2026-03-13T10:35:45.848Z checkpoint (10 minute timer): completed=1, partial=0, in_progress=1, pending=188
- 2026-03-13T11:01:39.848Z checkpoint (10 minute timer): completed=1, partial=0, in_progress=1, pending=188
- 2026-03-13T11:11:39.861Z checkpoint (10 minute timer): completed=1, partial=0, in_progress=1, pending=188
- 2026-03-13T11:21:39.871Z checkpoint (10 minute timer): completed=1, partial=0, in_progress=1, pending=188
- 2026-03-13T11:31:39.847Z checkpoint (10 minute timer): completed=1, partial=0, in_progress=1, pending=188
- 2026-03-13T11:41:39.849Z checkpoint (10 minute timer): completed=1, partial=0, in_progress=1, pending=188
- 2026-03-13T11:51:39.852Z checkpoint (10 minute timer): completed=1, partial=0, in_progress=1, pending=188
- 2026-03-13T12:16:42.663Z checkpoint (10 minute timer): completed=1, partial=0, in_progress=1, pending=188
- 2026-03-13T12:26:42.660Z checkpoint (10 minute timer): completed=1, partial=0, in_progress=1, pending=188
- 2026-03-13T12:36:42.658Z checkpoint (10 minute timer): completed=1, partial=0, in_progress=1, pending=188
- 2026-03-13T12:46:42.679Z checkpoint (10 minute timer): completed=1, partial=0, in_progress=1, pending=188
- 2026-03-13T12:56:42.692Z checkpoint (10 minute timer): completed=1, partial=0, in_progress=1, pending=188
- 2026-03-13T13:06:42.698Z checkpoint (10 minute timer): completed=1, partial=0, in_progress=1, pending=188
- 2026-03-13T13:49:24.111Z checkpoint (10 minute timer): completed=1, partial=0, in_progress=1, pending=188
- 2026-03-13T13:59:24.101Z checkpoint (10 minute timer): completed=1, partial=0, in_progress=1, pending=188
- 2026-03-13T14:09:24.160Z checkpoint (10 minute timer): completed=1, partial=0, in_progress=1, pending=188
- 2026-03-13T14:19:24.177Z checkpoint (10 minute timer): completed=1, partial=0, in_progress=1, pending=188
- 2026-03-13T14:22:22.792Z completed 2/190: Bristol Table Tennis League, current=7/7, history=34/34, overall=completed, jobs_processed=163, jobs_failed=1
- 2026-03-13T14:22:22.792Z failure samples for Bristol Table Tennis League: processLogTask: {"logId":"e6becd9f-070b-4981-a02a-81aad72be16c","competitionId":"8f630049-7590-4f31-be37-da2b0663a66c","platformId":"c7560866-58f1-45f8-9406-570341fab522","platformType":"ttleagues-bundle"}: [
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
- 2026-03-13T14:22:22.793Z starting 3/190: Bedford Table Tennis League (England / Bedfordshire), current_targets=4, history_targets=21
- 2026-03-13T14:29:24.179Z checkpoint (10 minute timer): completed=2, partial=0, in_progress=1, pending=187
- 2026-03-13T14:39:24.182Z checkpoint (10 minute timer): completed=2, partial=0, in_progress=1, pending=187
- 2026-03-13T14:43:11.341Z completed 3/190: Bedford Table Tennis League, current=4/4, history=21/21, overall=completed, jobs_processed=100, jobs_failed=0
- 2026-03-13T14:43:11.342Z starting 4/190: Luton Table Tennis League (England / Bedfordshire), current_targets=1, history_targets=15
- 2026-03-13T14:49:24.208Z checkpoint (10 minute timer): completed=3, partial=0, in_progress=1, pending=186
- 2026-03-13T14:59:24.221Z checkpoint (10 minute timer): completed=3, partial=0, in_progress=1, pending=186
- 2026-03-13T15:09:24.237Z checkpoint (10 minute timer): completed=3, partial=0, in_progress=1, pending=186
- 2026-03-13T15:18:59.226Z completed 4/190: Luton Table Tennis League, current=1/1, history=15/15, overall=completed, jobs_processed=1560, jobs_failed=0
- 2026-03-13T15:18:59.230Z starting 5/190: Bracknell and Wokingham Table Tennis League (England / Berkshire), current_targets=3, history_targets=18
- 2026-03-13T15:19:24.222Z checkpoint (10 minute timer): completed=4, partial=0, in_progress=1, pending=185
- 2026-03-13T15:29:24.224Z checkpoint (10 minute timer): completed=4, partial=0, in_progress=1, pending=185
- 2026-03-13T15:39:24.232Z checkpoint (10 minute timer): completed=4, partial=0, in_progress=1, pending=185
- 2026-03-13T15:49:24.239Z checkpoint (10 minute timer): completed=4, partial=0, in_progress=1, pending=185
- 2026-03-13T15:59:24.227Z checkpoint (10 minute timer): completed=4, partial=0, in_progress=1, pending=185
- 2026-03-13T16:09:24.232Z checkpoint (10 minute timer): completed=4, partial=0, in_progress=1, pending=185
- 2026-03-13T16:19:24.234Z checkpoint (10 minute timer): completed=4, partial=0, in_progress=1, pending=185
- 2026-03-13T16:24:11.620Z completed 5/190: Bracknell and Wokingham Table Tennis League, current=3/3, history=18/18, overall=completed, jobs_processed=2548, jobs_failed=0
- 2026-03-13T16:24:11.621Z starting 6/190: Maidenhead Table Tennis League (England / Berkshire), current_targets=3, history_targets=9
- 2026-03-13T16:29:24.210Z checkpoint (10 minute timer): completed=5, partial=0, in_progress=1, pending=184
- 2026-03-13T16:30:17.913Z completed 6/190: Maidenhead Table Tennis League, current=3/3, history=9/9, overall=completed, jobs_processed=48, jobs_failed=0
- 2026-03-13T16:30:17.915Z starting 7/190: Newbury Table Tennis League (England / Berkshire), current_targets=3, history_targets=12
- 2026-03-13T16:33:58.839Z completed 7/190: Newbury Table Tennis League, current=3/3, history=12/12, overall=completed, jobs_processed=60, jobs_failed=0
- 2026-03-13T16:33:58.841Z starting 8/190: Reading & District Table Tennis Association (England / Berkshire), current_targets=4, history_targets=24
- 2026-03-13T16:39:24.204Z checkpoint (10 minute timer): completed=7, partial=0, in_progress=1, pending=182
- 2026-03-13T16:49:24.201Z checkpoint (10 minute timer): completed=7, partial=0, in_progress=1, pending=182
- 2026-03-13T17:12:16.797Z checkpoint (10 minute timer): completed=7, partial=0, in_progress=1, pending=182
- 2026-03-13T17:29:00.708Z checkpoint (10 minute timer): completed=7, partial=0, in_progress=1, pending=182
- 2026-03-13T18:43:14.821Z checkpoint (10 minute timer): completed=7, partial=0, in_progress=1, pending=182
- 2026-03-13T18:53:14.814Z checkpoint (10 minute timer): completed=7, partial=0, in_progress=1, pending=182
- 2026-03-13T19:03:14.810Z checkpoint (10 minute timer): completed=7, partial=0, in_progress=1, pending=182
- 2026-03-13T19:13:14.806Z checkpoint (10 minute timer): completed=7, partial=0, in_progress=1, pending=182
- 2026-03-13T19:23:14.874Z checkpoint (10 minute timer): completed=7, partial=0, in_progress=1, pending=182
- 2026-03-13T19:33:14.883Z checkpoint (10 minute timer): completed=7, partial=0, in_progress=1, pending=182
- 2026-03-13T20:25:25.158Z checkpoint (10 minute timer): completed=7, partial=0, in_progress=1, pending=182
- 2026-03-13T20:35:25.159Z checkpoint (10 minute timer): completed=7, partial=0, in_progress=1, pending=182
- 2026-03-13T20:57:53.722Z checkpoint (10 minute timer): completed=7, partial=0, in_progress=1, pending=182
- 2026-03-13T21:07:53.635Z checkpoint (10 minute timer): completed=7, partial=0, in_progress=1, pending=182
- 2026-03-13T21:17:53.631Z checkpoint (10 minute timer): completed=7, partial=0, in_progress=1, pending=182
- 2026-03-13T21:27:53.631Z checkpoint (10 minute timer): completed=7, partial=0, in_progress=1, pending=182
- 2026-03-13T21:37:53.647Z checkpoint (10 minute timer): completed=7, partial=0, in_progress=1, pending=182
- 2026-03-13T21:47:53.655Z checkpoint (10 minute timer): completed=7, partial=0, in_progress=1, pending=182
- 2026-03-13T21:57:53.660Z checkpoint (10 minute timer): completed=7, partial=0, in_progress=1, pending=182
- 2026-03-13T22:07:53.666Z checkpoint (10 minute timer): completed=7, partial=0, in_progress=1, pending=182
- 2026-03-13T22:17:53.670Z checkpoint (10 minute timer): completed=7, partial=0, in_progress=1, pending=182
- 2026-03-13T22:27:53.632Z checkpoint (10 minute timer): completed=7, partial=0, in_progress=1, pending=182
- 2026-03-13T22:29:26.159Z completed 8/190: Reading & District Table Tennis Association, current=4/4, history=24/24, overall=completed, jobs_processed=5818, jobs_failed=0
- 2026-03-13T22:29:26.161Z starting 9/190: Aylesbury Table Tennis League (England / Buckinghamshire), current_targets=5, history_targets=21
- 2026-03-13T22:37:53.627Z checkpoint (10 minute timer): completed=8, partial=0, in_progress=1, pending=181
- 2026-03-13T22:59:04.731Z checkpoint (10 minute timer): completed=8, partial=0, in_progress=1, pending=181
- 2026-03-14T00:58:58.859Z checkpoint (10 minute timer): completed=8, partial=0, in_progress=1, pending=181
- 2026-03-14T02:14:17.790Z checkpoint (10 minute timer): completed=8, partial=0, in_progress=1, pending=181
- 2026-03-14T02:24:17.798Z checkpoint (10 minute timer): completed=8, partial=0, in_progress=1, pending=181
- 2026-03-14T02:34:17.806Z checkpoint (10 minute timer): completed=8, partial=0, in_progress=1, pending=181
- 2026-03-14T02:44:17.816Z checkpoint (10 minute timer): completed=8, partial=0, in_progress=1, pending=181
- 2026-03-14T02:54:17.822Z checkpoint (10 minute timer): completed=8, partial=0, in_progress=1, pending=181
- 2026-03-14T03:04:17.804Z checkpoint (10 minute timer): completed=8, partial=0, in_progress=1, pending=181
- 2026-03-14T04:06:08.695Z checkpoint (10 minute timer): completed=8, partial=0, in_progress=1, pending=181
- 2026-03-14T05:18:28.203Z checkpoint (10 minute timer): completed=8, partial=0, in_progress=1, pending=181
- 2026-03-14T05:28:28.207Z checkpoint (10 minute timer): completed=8, partial=0, in_progress=1, pending=181
- 2026-03-14T05:38:28.212Z checkpoint (10 minute timer): completed=8, partial=0, in_progress=1, pending=181
- 2026-03-14T05:48:28.211Z checkpoint (10 minute timer): completed=8, partial=0, in_progress=1, pending=181
- 2026-03-14T05:58:28.215Z checkpoint (10 minute timer): completed=8, partial=0, in_progress=1, pending=181
- 2026-03-14T06:08:28.217Z checkpoint (10 minute timer): completed=8, partial=0, in_progress=1, pending=181
- 2026-03-14T06:49:01.428Z checkpoint (10 minute timer): completed=8, partial=0, in_progress=1, pending=181
- 2026-03-14T06:59:01.430Z checkpoint (10 minute timer): completed=8, partial=0, in_progress=1, pending=181
- 2026-03-14T07:09:01.432Z checkpoint (10 minute timer): completed=8, partial=0, in_progress=1, pending=181
- 2026-03-14T07:19:01.432Z checkpoint (10 minute timer): completed=8, partial=0, in_progress=1, pending=181
- 2026-03-14T07:29:01.436Z checkpoint (10 minute timer): completed=8, partial=0, in_progress=1, pending=181
- 2026-03-14T07:39:01.439Z checkpoint (10 minute timer): completed=8, partial=0, in_progress=1, pending=181
- 2026-03-14T08:21:55.235Z checkpoint (10 minute timer): completed=8, partial=0, in_progress=1, pending=181
- 2026-03-14T08:28:16.325Z completed 9/190: Aylesbury Table Tennis League, current=5/5, history=21/21, overall=completed, jobs_processed=103, jobs_failed=1
- 2026-03-14T08:28:16.325Z failure samples for Aylesbury Table Tennis League: processLogTask: {"logId":"978bf879-9725-4b9c-bb14-5d420978cdc5","competitionId":"430d453b-b983-4189-8f99-774f14eefe56","platformId":"c7560866-58f1-45f8-9406-570341fab522","platformType":"ttleagues-bundle"}: Fixture not found for rubber 8366406: matchExternalId=821866
- 2026-03-14T08:28:16.327Z starting 10/190: Chalfonts Table Tennis League (England / Buckinghamshire), current_targets=2, history_targets=11
- 2026-03-14T08:31:55.233Z checkpoint (10 minute timer): completed=9, partial=0, in_progress=1, pending=180
- 2026-03-14T08:35:44.457Z completed 10/190: Chalfonts Table Tennis League, current=2/2, history=11/11, overall=completed, jobs_processed=52, jobs_failed=0
- 2026-03-14T08:35:44.458Z starting 11/190: Chiltern Table Tennis League (England / Buckinghamshire), current_targets=2, history_targets=8
- 2026-03-14T08:40:50.882Z completed 11/190: Chiltern Table Tennis League, current=2/2, history=8/8, overall=completed, jobs_processed=40, jobs_failed=0
- 2026-03-14T08:40:50.884Z starting 12/190: High Wycombe Table Tennis League (England / Buckinghamshire), current_targets=4, history_targets=16
- 2026-03-14T08:41:55.236Z checkpoint (10 minute timer): completed=11, partial=0, in_progress=1, pending=178
- 2026-03-14T08:51:55.236Z checkpoint (10 minute timer): completed=11, partial=0, in_progress=1, pending=178
- 2026-03-14T08:54:24.272Z completed 12/190: High Wycombe Table Tennis League, current=4/4, history=16/16, overall=completed, jobs_processed=80, jobs_failed=0
- 2026-03-14T08:54:24.274Z starting 13/190: Cambridge Table Tennis League (England / Cambridgeshire), current_targets=4, history_targets=17
- 2026-03-14T09:01:55.254Z checkpoint (10 minute timer): completed=12, partial=0, in_progress=1, pending=177
- 2026-03-14T09:09:00.120Z completed 13/190: Cambridge Table Tennis League, current=4/4, history=17/17, overall=completed, jobs_processed=83, jobs_failed=1
- 2026-03-14T09:09:00.121Z failure samples for Cambridge Table Tennis League: processLogTask: {"logId":"0d434eba-8c7d-4d0b-85d1-c5a69064ea00","competitionId":"75759588-f991-406c-ab48-59e9d4efac57","platformId":"c7560866-58f1-45f8-9406-570341fab522","platformType":"ttleagues-bundle"}: Team not found for fixture 701848: home=51392 (undefined), away=51398 (cc831dfe-14ea-4e41-be45-d23a6784ed40)
- 2026-03-14T09:09:00.123Z starting 14/190: Ely & District Table Tennis League (England / Cambridgeshire), current_targets=3, history_targets=12
- 2026-03-14T09:11:55.256Z checkpoint (10 minute timer): completed=13, partial=0, in_progress=1, pending=176
- 2026-03-14T09:15:22.344Z completed 14/190: Ely & District Table Tennis League, current=3/3, history=12/12, overall=completed, jobs_processed=59, jobs_failed=1
- 2026-03-14T09:15:22.344Z failure samples for Ely & District Table Tennis League: processLogTask: {"logId":"1c67da40-23b1-4876-8ecd-83ba531ecc76","competitionId":"862d5d46-422e-4901-b7db-189ee60900b1","platformId":"c7560866-58f1-45f8-9406-570341fab522","platformType":"ttleagues-bundle"}: [
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      1,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      1,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      2,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      2,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      3,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      3,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      4,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      4,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      5,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      5,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      6,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      6,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      7,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      7,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      8,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      8,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  }
]
- 2026-03-14T09:15:22.345Z starting 15/190: Peterborough Table Tennis League (England / Cambridgeshire), current_targets=4, history_targets=11
- 2026-03-14T09:21:55.262Z checkpoint (10 minute timer): completed=14, partial=0, in_progress=1, pending=175
- 2026-03-14T09:22:04.652Z completed 15/190: Peterborough Table Tennis League, current=4/4, history=11/11, overall=completed, jobs_processed=60, jobs_failed=0
- 2026-03-14T09:22:04.652Z starting 16/190: Chester and Ellesmere Port Table Tennis League (England / Cheshire), current_targets=4, history_targets=18
- 2026-03-14T09:31:55.266Z checkpoint (10 minute timer): completed=15, partial=0, in_progress=1, pending=174
- 2026-03-14T09:32:50.917Z completed 16/190: Chester and Ellesmere Port Table Tennis League, current=4/4, history=18/18, overall=completed, jobs_processed=88, jobs_failed=0
- 2026-03-14T09:32:50.920Z starting 17/190: Crewe Table Tennis League (England / Cheshire), current_targets=8, history_targets=16
- 2026-03-14T09:37:38.856Z completed 17/190: Crewe Table Tennis League, current=8/8, history=16/16, overall=completed, jobs_processed=96, jobs_failed=0
- 2026-03-14T09:37:38.857Z starting 18/190: Glossop Table Tennis League (England / Cheshire), current_targets=3, history_targets=15
- 2026-03-14T09:41:55.250Z checkpoint (10 minute timer): completed=17, partial=0, in_progress=1, pending=172
- 2026-03-14T09:49:05.944Z completed 18/190: Glossop Table Tennis League, current=3/3, history=15/15, overall=completed, jobs_processed=66, jobs_failed=3
- 2026-03-14T09:49:05.945Z failure samples for Glossop Table Tennis League: Glossop Table Tennis League: matches Division 1: HTTP 500 fetching https://ttleagues-api.azurewebsites.net/api/divisions/1881/matches | Glossop Table Tennis League: matches Division 2: HTTP 500 fetching https://ttleagues-api.azurewebsites.net/api/divisions/1882/matches | Glossop Table Tennis League: matches Division 3: HTTP 500 fetching https://ttleagues-api.azurewebsites.net/api/divisions/1883/matches
- 2026-03-14T09:49:05.946Z starting 19/190: Halton Table Tennis League (England / Cheshire), current_targets=2, history_targets=5
- 2026-03-14T09:50:54.116Z completed 19/190: Halton Table Tennis League, current=2/2, history=5/5, overall=completed, jobs_processed=27, jobs_failed=1
- 2026-03-14T09:50:54.116Z failure samples for Halton Table Tennis League: processLogTask: {"logId":"2e68c86a-9041-4e64-80e9-6540392ae8f1","competitionId":"11de6317-f52c-47c2-9c20-0bee24dc9df9","platformId":"c7560866-58f1-45f8-9406-570341fab522","platformType":"ttleagues-bundle"}: Team not found for fixture 133804: home=9094 (0b106eae-6576-4bd8-83b3-048186845ee6), away=9088 (undefined)
- 2026-03-14T09:50:54.118Z starting 20/190: Mid-Cheshire Table Tennis League (England / Cheshire), current_targets=2, history_targets=11
- 2026-03-14T09:51:55.246Z checkpoint (10 minute timer): completed=19, partial=0, in_progress=1, pending=170
- 2026-03-14T09:58:07.306Z completed 20/190: Mid-Cheshire Table Tennis League, current=2/2, history=11/11, overall=completed, jobs_processed=52, jobs_failed=0
- 2026-03-14T09:58:07.309Z starting 21/190: Trafford Table Tennis League (England / Cheshire), current_targets=3, history_targets=15
- 2026-03-14T10:01:55.251Z checkpoint (10 minute timer): completed=20, partial=0, in_progress=1, pending=169
- 2026-03-14T10:08:49.706Z completed 21/190: Trafford Table Tennis League, current=3/3, history=15/15, overall=completed, jobs_processed=72, jobs_failed=0
- 2026-03-14T10:08:49.707Z starting 22/190: Wilmslow Table Tennis League (England / Cheshire), current_targets=3, history_targets=15
- 2026-03-14T10:11:55.253Z checkpoint (10 minute timer): completed=21, partial=0, in_progress=1, pending=168
- 2026-03-14T10:19:03.698Z completed 22/190: Wilmslow Table Tennis League, current=3/3, history=15/15, overall=completed, jobs_processed=70, jobs_failed=1
- 2026-03-14T10:19:03.699Z failure samples for Wilmslow Table Tennis League: Wilmslow Table Tennis League: matches DIVISION 1: [
  {
    "expected": "object",
    "code": "invalid_type",
    "path": [
      "groups",
      3,
      "matches",
      0,
      "home"
    ],
    "message": "Invalid input: expected object, received null"
  },
  {
    "expected": "object",
    "code": "invalid_type",
    "path": [
      "groups",
      3,
      "matches",
      0,
      "away"
    ],
    "message": "Invalid input: expected object, received null"
  },
  {
    "expected": "object",
    "code": "invalid_type",
    "path": [
      "matches",
      14,
      "home"
    ],
    "message": "Invalid input: expected object, received null"
  },
  {
    "expected": "object",
    "code": "invalid_type",
    "path": [
      "matches",
      14,
      "away"
    ],
    "message": "Invalid input: expected object, received null"
  }
]
- 2026-03-14T10:19:03.702Z starting 23/190: Wirral Table Tennis League (England / Cheshire), current_targets=3, history_targets=14
- 2026-03-14T10:21:55.244Z checkpoint (10 minute timer): completed=22, partial=0, in_progress=1, pending=167
- 2026-03-14T10:30:33.334Z completed 23/190: Wirral Table Tennis League, current=3/3, history=14/14, overall=completed, jobs_processed=67, jobs_failed=1
- 2026-03-14T10:30:33.334Z failure samples for Wirral Table Tennis League: processLogTask: {"logId":"eca5a2f6-92d5-4a04-92d0-9560a2df82f6","competitionId":"958ee361-96c2-4ded-9790-4cf0933f7c3c","platformId":"c7560866-58f1-45f8-9406-570341fab522","platformType":"ttleagues-bundle"}: [
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      1,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      1,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      2,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      2,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      3,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      3,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      4,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      4,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      5,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      5,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      6,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      6,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      7,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      7,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      8,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      8,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
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
- 2026-03-14T10:30:33.335Z starting 24/190: Lancashire And Cheshire Table Tennis League (England / Cheshire|Lancashire), current_targets=3, history_targets=6
- 2026-03-14T10:31:55.247Z checkpoint (10 minute timer): completed=23, partial=0, in_progress=1, pending=166
- 2026-03-14T10:32:02.719Z completed 24/190: Lancashire And Cheshire Table Tennis League, current=3/3, history=6/6, overall=completed, jobs_processed=36, jobs_failed=0
- 2026-03-14T10:32:02.720Z starting 25/190: Cleveland Table Tennis League (England / Cleveland), current_targets=1, history_targets=3
- 2026-03-14T10:33:26.156Z completed 25/190: Cleveland Table Tennis League, current=1/1, history=3/3, overall=completed, jobs_processed=15, jobs_failed=1
- 2026-03-14T10:33:26.157Z failure samples for Cleveland Table Tennis League: processLogTask: {"logId":"420ad7ba-1182-4326-9502-d2e95f9594e8","competitionId":"b4bb2bf2-5e07-44a0-85d0-0af5922e81e9","platformId":"c7560866-58f1-45f8-9406-570341fab522","platformType":"ttleagues-bundle"}: [
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      1,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      1,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      5,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      5,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      8,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      8,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  }
]
- 2026-03-14T10:33:26.158Z starting 26/190: Middlesbrough Table Tennis League (England / Cleveland), current_targets=3, history_targets=6
- 2026-03-14T10:37:33.478Z completed 26/190: Middlesbrough Table Tennis League, current=3/3, history=6/6, overall=completed, jobs_processed=36, jobs_failed=0
- 2026-03-14T10:37:33.483Z starting 27/190: Stockton Table Tennis League (England / Cleveland), current_targets=3, history_targets=13
- 2026-03-14T10:41:55.254Z checkpoint (10 minute timer): completed=26, partial=0, in_progress=1, pending=163
- 2026-03-14T10:49:02.039Z completed 27/190: Stockton Table Tennis League, current=3/3, history=13/13, overall=completed, jobs_processed=64, jobs_failed=0
- 2026-03-14T10:49:02.043Z starting 28/190: North Cornwall Table Tennis League (England / Cornwall), current_targets=2, history_targets=16
- 2026-03-14T10:51:55.273Z checkpoint (10 minute timer): completed=27, partial=0, in_progress=1, pending=162
- 2026-03-14T11:01:55.284Z checkpoint (10 minute timer): completed=27, partial=0, in_progress=1, pending=162
- 2026-03-14T11:11:55.281Z checkpoint (10 minute timer): completed=27, partial=0, in_progress=1, pending=162
- 2026-03-14T11:21:55.266Z checkpoint (10 minute timer): completed=27, partial=0, in_progress=1, pending=162
- 2026-03-14T11:28:19.377Z completed 28/190: North Cornwall Table Tennis League, current=2/2, history=16/16, overall=completed, jobs_processed=1452, jobs_failed=0
- 2026-03-14T11:28:19.380Z starting 29/190: West Cornwall Table Tennis League (England / Cornwall), current_targets=4, history_targets=14
- 2026-03-14T11:31:55.265Z checkpoint (10 minute timer): completed=28, partial=0, in_progress=1, pending=161
- 2026-03-14T11:41:55.266Z checkpoint (10 minute timer): completed=28, partial=0, in_progress=1, pending=161
- 2026-03-14T11:46:32.416Z completed 29/190: West Cornwall Table Tennis League, current=4/4, history=14/14, overall=completed, jobs_processed=72, jobs_failed=0
- 2026-03-14T11:46:32.418Z starting 30/190: Barrow Table Tennis League (England / Cumbria), current_targets=2, history_targets=0
- 2026-03-14T11:47:58.097Z completed 30/190: Barrow Table Tennis League, current=2/2, history=0/0, overall=completed, jobs_processed=8, jobs_failed=0
- 2026-03-14T11:47:58.100Z starting 31/190: Chesterfield Table Tennis League (England / Derbyshire), current_targets=4, history_targets=6
- 2026-03-14T11:51:55.267Z checkpoint (10 minute timer): completed=30, partial=0, in_progress=1, pending=159
- 2026-03-14T11:54:27.431Z completed 31/190: Chesterfield Table Tennis League, current=4/4, history=6/6, overall=completed, jobs_processed=39, jobs_failed=1
- 2026-03-14T11:54:27.432Z failure samples for Chesterfield Table Tennis League: processLogTask: {"logId":"3bed307a-0e15-4839-a7c3-241249515a94","competitionId":"b3168bda-52a0-4652-92f3-a761ad87a789","platformId":"c7560866-58f1-45f8-9406-570341fab522","platformType":"ttleagues-bundle"}: [
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      4,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      4,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      5,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      5,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      6,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      6,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      7,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      7,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      8,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      8,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
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
- 2026-03-14T11:54:27.433Z starting 32/190: Derby & District Table Tennis Association (England / Derbyshire), current_targets=4, history_targets=21
- 2026-03-14T12:01:55.277Z checkpoint (10 minute timer): completed=31, partial=0, in_progress=1, pending=158
- 2026-03-14T12:19:36.747Z checkpoint (10 minute timer): completed=31, partial=0, in_progress=1, pending=158
- 2026-03-14T12:29:36.659Z checkpoint (10 minute timer): completed=31, partial=0, in_progress=1, pending=158
- 2026-03-14T12:39:36.640Z checkpoint (10 minute timer): completed=31, partial=0, in_progress=1, pending=158
- 2026-03-14T12:49:36.629Z checkpoint (10 minute timer): completed=31, partial=0, in_progress=1, pending=158
- 2026-03-14T12:59:36.684Z checkpoint (10 minute timer): completed=31, partial=0, in_progress=1, pending=158
- 2026-03-14T13:09:36.691Z checkpoint (10 minute timer): completed=31, partial=0, in_progress=1, pending=158
- 2026-03-14T13:19:36.696Z checkpoint (10 minute timer): completed=31, partial=0, in_progress=1, pending=158
- 2026-03-14T14:00:53.107Z checkpoint (10 minute timer): completed=31, partial=0, in_progress=1, pending=158
- 2026-03-14T14:10:53.112Z checkpoint (10 minute timer): completed=31, partial=0, in_progress=1, pending=158
- 2026-03-14T14:20:53.118Z checkpoint (10 minute timer): completed=31, partial=0, in_progress=1, pending=158
- 2026-03-14T14:30:53.086Z checkpoint (10 minute timer): completed=31, partial=0, in_progress=1, pending=158
- 2026-03-14T14:40:53.087Z checkpoint (10 minute timer): completed=31, partial=0, in_progress=1, pending=158
- 2026-03-14T14:50:53.078Z checkpoint (10 minute timer): completed=31, partial=0, in_progress=1, pending=158
- 2026-03-14T15:03:39.249Z checkpoint (10 minute timer): completed=31, partial=0, in_progress=1, pending=158
- 2026-03-14T15:06:38.368Z completed 32/190: Derby & District Table Tennis Association, current=4/4, history=21/21, overall=completed, jobs_processed=99, jobs_failed=1
- 2026-03-14T15:06:38.369Z failure samples for Derby & District Table Tennis Association: processLogTask: {"logId":"7e0a90fa-e093-4922-8302-a317130dc109","competitionId":"c9e9445d-8540-4885-93f6-7def8cce6ff7","platformId":"c7560866-58f1-45f8-9406-570341fab522","platformType":"ttleagues-bundle"}: [
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      5,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      5,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      6,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      6,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      7,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      7,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      8,
      "homeScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      8,
      "awayScore"
    ],
    "message": "Invalid input: expected number, received null"
  },
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
- 2026-03-14T15:06:38.373Z starting 33/190: Matlock Table Tennis League (England / Derbyshire), current_targets=2, history_targets=10
- 2026-03-14T15:13:39.291Z checkpoint (10 minute timer): completed=32, partial=0, in_progress=1, pending=157
- 2026-03-14T15:15:12.141Z completed 33/190: Matlock Table Tennis League, current=2/2, history=10/10, overall=completed, jobs_processed=48, jobs_failed=0
- 2026-03-14T15:15:12.143Z starting 34/190: Exeter Table Tennis League (England / Devonshire), current_targets=4, history_targets=14
