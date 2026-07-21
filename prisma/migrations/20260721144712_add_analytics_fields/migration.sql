-- Add analytics fields to Project
ALTER TABLE "projects" ADD COLUMN "sla_threshold_days" INTEGER NOT NULL DEFAULT 7;
ALTER TABLE "projects" ADD COLUMN "bottleneck_threshold_days" INTEGER NOT NULL DEFAULT 7;

-- Add analytics fields to ProjectTimelineEvent
ALTER TABLE "project_timeline_events" ADD COLUMN "event_key" TEXT;
ALTER TABLE "project_timeline_events" ADD COLUMN "event_label" TEXT;
ALTER TABLE "project_timeline_events" ADD COLUMN "previous_status" TEXT;
ALTER TABLE "project_timeline_events" ADD COLUMN "next_status" TEXT;
ALTER TABLE "project_timeline_events" ADD COLUMN "actor_user_id" TEXT;
ALTER TABLE "project_timeline_events" ADD COLUMN "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "project_timeline_events" ADD COLUMN "metadata" JSONB;
ALTER TABLE "project_timeline_events" ADD COLUMN "duration_minutes" INTEGER;

-- Add indexes for analytics queries
CREATE INDEX "project_timeline_events_project_id_event_key_occurred_at_idx" ON "project_timeline_events" ("project_id", "event_key", "occurred_at");
CREATE INDEX "project_timeline_events_event_key_occurred_at_idx" ON "project_timeline_events" ("event_key", "occurred_at");
CREATE INDEX "project_timeline_events_occurred_at_idx" ON "project_timeline_events" ("occurred_at");
