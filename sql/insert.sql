INSERT INTO assets (name, status) VALUES ($1, $2) RETURNING id, name, status
