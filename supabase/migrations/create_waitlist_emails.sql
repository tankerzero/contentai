CREATE TABLE IF NOT EXISTS waitlist_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  lang text NOT NULL DEFAULT 'en',
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS waitlist_emails_email_idx ON waitlist_emails (lower(email));

ALTER TABLE waitlist_emails ENABLE ROW LEVEL SECURITY;
