-- Create price_history table for chart data
CREATE TABLE IF NOT EXISTS public.price_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    price_usd numeric NOT NULL,
    price_vnd numeric NOT NULL,
    recorded_at timestamptz DEFAULT now() NOT NULL
);

-- Index for fast time-range queries
CREATE INDEX idx_price_history_recorded_at ON public.price_history (recorded_at DESC);

-- Enable RLS (Public read-only, service_role write)
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-only access" ON public.price_history
    FOR SELECT USING (true);

-- Activate extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the Edge Function to run every 10 minutes
-- Note: Replace with your actual project URL if not using Supabase's internal networking
SELECT cron.schedule(
  'fetch-gold-price-10m',
  '*/10 * * * *',
  $$
  SELECT net.http_get(
    url := (SELECT value FROM net._config WHERE name = 'endpoint') || '/functions/v1/get-gold-price'
  );
  $$
);

-- Seed with some mock data for the last 7 days so the chart isn't empty
INSERT INTO public.price_history (price_usd, price_vnd, recorded_at)
VALUES 
    (75.20, 1880000, now() - interval '7 days'),
    (76.45, 1911250, now() - interval '6 days'),
    (75.10, 1877500, now() - interval '5 days'),
    (77.30, 1932500, now() - interval '4 days'),
    (78.50, 1962500, now() - interval '3 days'),
    (77.80, 1945000, now() - interval '2 days'),
    (79.15, 1978750, now() - interval '1 day'),
    (78.95, 1973750, now());

-- Clean up any old simple cache records
DELETE FROM public.price_cache WHERE id = 'gold_price_current';
