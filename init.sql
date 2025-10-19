-- Initialize the database with required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create the main database if it doesn't exist
-- This is handled by the POSTGRES_DB environment variable

-- The tables will be created by the application on startup
-- This file is included for any additional initialization if needed
