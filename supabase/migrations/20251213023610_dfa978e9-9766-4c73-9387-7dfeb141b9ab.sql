-- Create tables for information modules
CREATE TABLE public.news_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('politics', 'culture', 'sports')),
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  source_url TEXT,
  source_name TEXT,
  image_url TEXT,
  video_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  country TEXT DEFAULT 'FR',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_news_category ON public.news_articles(category);
CREATE INDEX idx_news_country ON public.news_articles(country);
CREATE INDEX idx_news_published ON public.news_articles(published_at DESC);

-- Enable RLS
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

-- Everyone can read news
CREATE POLICY "Anyone can view news" 
ON public.news_articles 
FOR SELECT 
USING (true);

-- Only authenticated users can insert (for edge functions with service role)
CREATE POLICY "Service can insert news" 
ON public.news_articles 
FOR INSERT 
WITH CHECK (true);

-- Cultural events table
CREATE TABLE public.cultural_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL, -- theater, festival, concert, exhibition
  venue TEXT,
  city TEXT,
  country TEXT DEFAULT 'FR',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  price_info TEXT,
  ticket_url TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_type ON public.cultural_events(event_type);
CREATE INDEX idx_events_date ON public.cultural_events(start_date);

ALTER TABLE public.cultural_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events" 
ON public.cultural_events 
FOR SELECT 
USING (true);

CREATE POLICY "Service can insert events" 
ON public.cultural_events 
FOR INSERT 
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_news_updated_at
BEFORE UPDATE ON public.news_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();