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

/**
 * The counts a distribution listing reads are written by the runs that change the packages of a
 * distribution (`repo:sync`, `app:prune`), and this schedule is the safety net under them: a run
 * that was stopped early leaves the counts of a catalog that has moved on. Counting every
 * distribution is a handful of grouped statements (`Distro.refreshCounts`), so the distributions
 * are counted once a day, at 03:00 UTC, when the repositories are not being synchronized.
 *
 * The schedule is created (or updated) here instead of being written by a migration, so that the
 * interval and the job it dispatches are read in one place. Its id is fixed, so that the row
 * survives the job being renamed.
 */
await DistroCount.schedule({}).id('distro-count').cron('0 3 * * *').run()
