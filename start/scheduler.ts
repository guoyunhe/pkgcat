/*
|--------------------------------------------------------------------------
| Scheduler
|--------------------------------------------------------------------------
|
| This file is used to define scheduled jobs. You can schedule jobs to run
| at specific intervals using cron expressions or duration strings.
|
| Example:
|
|   import SendWeeklyReport from '#jobs/send_weekly_report'
|
|   SendWeeklyReport.schedule({ userId: 1 })
|     .cron('0 9 * * MON')
|     .run()
|
*/

import DistroCount from '#jobs/distro_count'
import RepoCount from '#jobs/repo_count'
import RepoImport from '#jobs/repo_import'
import RepoSync from '#jobs/repo_sync'

// Imported before the daily runs read the catalog, so the repositories a run adds are read too
await RepoImport.schedule({ project: null, dryRun: false, concurrency: 8 })
  .id('repo-import')
  .cron('0 2 * * MON')
  .run()

// Safety net under the counts the runs that write the catalog refresh
await DistroCount.schedule({}).id('distro-count').cron('0 3 * * *').run()
await RepoCount.schedule({}).id('repo-count').cron('30 3 * * *').run()

// Reads the repositories whose sync interval has elapsed, the shortest interval first
await RepoSync.schedule({ name: null, arch: null, force: false })
  .id('repo-sync')
  .cron('0 4 * * *')
  .run()
