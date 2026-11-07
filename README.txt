MTC / ORBI Marketing — Stage 1 (scheduler only)

This patch changes ONLY the ORBI trial scheduler. It does not send emails and does not enable sending.

Default: read-only preview.
Test scheduling: MTC_TRIAL_SCHEDULE_WRITE_TEST=true and MTC_TRIAL_SCHEDULE_TEST_USER_ID=<UUID>.
Production scheduling: MTC_TRIAL_SCHEDULE_WRITE_PRODUCTION=true AND the ORBI mtc_marketing_automation_settings row must have trial_enrolment_enabled=true and trial_enrolment_starts_at set. Both gates default to disabled. Production scheduling also checks MTC eligibility for each contact and does not backfill old trials.

WARNING: Do not set production scheduling true until consent withdrawal, paid membership eligibility and unsubscribe suppression are verified. MTC_TRIAL_EMAIL_SENDING_ENABLED must remain false.

Install into ORBI repo, backup first:
cd ~/Documents/TOTs/TOTS-OS/tots-os
cp app/api/cron/mtc-trial-schedule/route.ts app/api/cron/mtc-trial-schedule/route.ts.backup.$(date +%Y%m%d-%H%M%S)
unzip -o ~/Downloads/MTC_Marketing_Implementation_Stage1.zip 'app/api/cron/mtc-trial-schedule/route.ts' -d .
npx tsc --noEmit
git diff --check

Do not commit/push until validation and review. This package does not implement cancellations, referrals or course automations.
