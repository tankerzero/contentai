-- Migration: add language and is_favorite columns to generations table
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query)

ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS language    TEXT    NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT FALSE;
