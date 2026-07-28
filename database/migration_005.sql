-- KumoCoders Platform Migration 005
-- Add admin_notes column to reports table

USE kumocoders;

ALTER TABLE reports
  ADD COLUMN admin_notes TEXT NULL AFTER status;
