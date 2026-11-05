<?php
require_once __DIR__ . '/auth.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = require_auth();

if ($method === 'GET') {
  $stmt = db()->query('SELECT * FROM university_units ORDER BY created_at DESC');
  json_response(['data' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
  require_role($user, 'admin');
  $body = get_body();
  $name = trim($body['name'] ?? '');
  $description = $body['description'] ?? null;
  $location = $body['location'] ?? null;

  if (!$name) json_error('กรุณากรอกชื่อหน่วยงาน');

  $id = bin2hex(random_bytes(16));
  $stmt = db()->prepare('INSERT INTO university_units (id, name, description, location) VALUES (?, ?, ?, ?)');
  $stmt->execute([$id, $name, $description, $location]);

  $stmt = db()->prepare('SELECT * FROM university_units WHERE id = ?');
  $stmt->execute([$id]);
  json_response(['data' => $stmt->fetch()], 201);
}

if ($method === 'PUT') {
  require_role($user, 'admin');
  $id = get_query('id');
  if (!$id) json_error('Missing id');
  $body = get_body();

  $allowed = ['name', 'description', 'location'];
  $fields = [];
  $values = [];
  foreach ($allowed as $f) {
    if (array_key_exists($f, $body)) { $fields[] = "$f = ?"; $values[] = $body[$f]; }
  }
  if (empty($fields)) json_error('No fields to update');

  $values[] = $id;
  $stmt = db()->prepare('UPDATE university_units SET ' . implode(', ', $fields) . ' WHERE id = ?');
  $stmt->execute($values);

  $stmt = db()->prepare('SELECT * FROM university_units WHERE id = ?');
  $stmt->execute([$id]);
  json_response(['data' => $stmt->fetch()]);
}

if ($method === 'DELETE') {
  require_role($user, 'admin');
  $id = get_query('id');
  if (!$id) json_error('Missing id');
  $stmt = db()->prepare('DELETE FROM university_units WHERE id = ?');
  $stmt->execute([$id]);
  json_response(['success' => true]);
}

json_error('Method not allowed', 405);
