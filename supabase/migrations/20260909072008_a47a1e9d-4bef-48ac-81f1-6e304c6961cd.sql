-- lovable-cron-fallback-reviewed: 288 runs/day; scheduled social posts must go out within ~5 minutes of their slot, and there is no external event that fires at the scheduled time.
CREATE TABLE public.cron_tokens (
  name text PRIMARY KEY,
  token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.cron_tokens TO service_role;
ALTER TABLE public.cron_tokens ENABLE ROW LEVEL SECURITY;
INSERT INTO public.cron_tokens (name) VALUES ('publish_due');

SELECT cron.schedule(
  'publish-due-posts',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--6d350b98-9327-4fc1-988f-db9eea25a73a.lovable.app/api/public/publish-due',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-token', (SELECT token FROM public.cron_tokens WHERE name = 'publish_due')
    ),
    body := '{}'::jsonb
  );
  $$
);