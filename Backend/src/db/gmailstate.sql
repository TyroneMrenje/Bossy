CREATE TABLE IF NOT EXISTS emails (
  id SERIAL PRIMARY KEY,
  message_id TEXT UNIQUE NOT NULL,
  thread_id TEXT,
  sender TEXT,
  recipient TEXT,
  subject TEXT,
  is_important BOOLEAN DEFAULT false,
  received_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);