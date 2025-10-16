-- Create ressources_clients table
CREATE TABLE IF NOT EXISTS public.ressources_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id TEXT UNIQUE NOT NULL,
  nom TEXT,
  prenom TEXT,
  telephone TEXT,
  produit TEXT,
  commentaire TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.ressources_clients ENABLE ROW LEVEL SECURITY;

-- Create policies for ressources_clients
CREATE POLICY "Users can view their own resources"
  ON public.ressources_clients
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resources"
  ON public.ressources_clients
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resources"
  ON public.ressources_clients
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resources"
  ON public.ressources_clients
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ressources_clients_user_id ON public.ressources_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_ressources_clients_resource_id ON public.ressources_clients(resource_id);
