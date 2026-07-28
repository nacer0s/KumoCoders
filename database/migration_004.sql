-- KumoCoders Platform Migration 004
-- Add verified_at and verified_by columns to users table

USE kumocoders;

ALTER TABLE users
  ADD COLUMN verified_at TIMESTAMP NULL AFTER is_verified,
  ADD COLUMN verified_by INT UNSIGNED NULL AFTER verified_at;
