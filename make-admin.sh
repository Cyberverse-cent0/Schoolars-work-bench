#!/bin/bash

# Script to update a user to admin role
echo "Updating user to admin role..."

# Get the user ID for admin@scholarforge.io
USER_ID=$(curl -s -X POST http://localhost:8080/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@scholarforge.io","password":"password123"}' | \
  grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$USER_ID" ]; then
  echo "Error: Could not get user ID. Make sure the user exists and credentials are correct."
  exit 1
fi

echo "User ID: $USER_ID"

# Update the user role to ADMIN (this would require a direct DB update or an admin endpoint)
echo "Note: To make this user an admin, you need to:"
echo "1. Access the database directly"
echo "2. Run: UPDATE users SET role = 'ADMIN' WHERE email = 'admin@scholarforge.io';"
echo "3. Or create a fresh database (first user automatically becomes admin)"

echo "Current user can sign in but has USER role, not ADMIN role."
