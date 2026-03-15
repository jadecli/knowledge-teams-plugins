# /jade-cron

Manage cron-scheduled crawl jobs.

## Syntax

```
/jade-cron list
/jade-cron status <crawler-name>
/jade-cron enable <crawler-name>
/jade-cron disable <crawler-name>
/jade-cron history <crawler-name> [--limit <n>]
```

## Subcommands

### `list`
Show all registered crawlers, their cron schedules, and enabled/disabled status.

### `status <crawler-name>`
Show detailed status for a crawler: last run time, next scheduled run, success/failure count, freshness SLA compliance.

### `enable <crawler-name>`
Enable the cron schedule for a crawler. This activates the corresponding GitHub Actions workflow.

### `disable <crawler-name>`
Disable the cron schedule. The crawler manifest remains but automated runs are paused.

### `history <crawler-name>`
Show recent crawl run history with run IDs, duration, source count, fact count, and status.

## Examples

```
/jade-cron list                            # Show all scheduled crawlers
/jade-cron status blog-crawler             # Check blog crawler health
/jade-cron history blog-crawler --limit 10 # Last 10 runs
```
