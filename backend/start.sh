#!/bin/bash

# Wait for postgres
until pg_isready -h postgres -p 5432; do
    echo "Waiting for postgres..."
    sleep 2
done

# Start the application
exec uvicorn main:app --host 0.0.0.0 --port 8000 