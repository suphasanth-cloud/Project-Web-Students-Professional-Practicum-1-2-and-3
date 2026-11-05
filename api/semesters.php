<?php
require_once __DIR__ . '/auth.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = require_auth();

if ($method === 'GET') {
  $stmt = db()->query('SELECT * FROM academic_semesters ORDER BY year DESC, semester DESC');
  json_response(['data' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
  require_role($user, 'admin');
  $body = get_body();
  $year = (int)($body['year'] ?? 0);
  $semester = (int)($body['semester'] ?? 0);
  $isCurrent = (int)($body['is_current'] ?? 0);
  $startDate = $body['start_date'] ?? null;
  $endDate = $body['end_date'] ?? null;

  if (!$year || !$semester) json_error('กรุณากรอกปีการศึกษาและภาคเรียน');

  if ($isCurrent) {
    db()->exec('UPDATE academic_semesters SET is_current = 0');
  }

  $id = bin2hex(random_bytes(16));
  $stmt = db()->prepare('INSERT INTO academic_semesters (id, year, semester, is_current, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)');
  $stmt->execute([$id, $year, $semester, $isCurrent, $startDate, $endDate]);

  $stmt = db()->prepare('SELECT * FROM academic_semesters WHERE id = ?');
  $stmt->execute([$id]);
  json_response(['data' => $stmt->fetch()], 201);
}

if ($method === 'PUT') {
  require_role($user, 'admin');
  $id = get_query('id');
  if (!$id) json_error('Missing id');
  $body = get_body();

  $allowed = ['year', 'semester', 'is_current', 'start_date', 'end_date'];
  $fields = [];
  $values = [];
  foreach ($allowed as $f) {
    if (array_key_exists($f, $body)) {
      $fields[] = "$f = ?";
      $values[] = $f === 'is_current' ? (int)$body[$f] : $body[$f];
    }
  }
  if (empty($fields)) json_error('No fields to update');

  if (isset($body['is_current']) && (int)$body['is_current'] === 1) {
    db()->exec('UPDATE academic_semesters SET is_current = 0');
  }

  $values[] = $id;
  $stmt = db()->prepare('UPDATE academic_semesters SET ' . implode(', ', $fields) . ' WHERE id = ?');
  $stmt->execute($values);

  $stmt = db()->prepare('SELECT * FROM academic_semesters WHERE id = ?');
  $stmt->execute([$id]);
  json_response(['data' => $stmt->fetch()]);
}

if ($method === 'DELETE') {
  require_role($user, 'admin');
  $id = get_query('id');
  if (!$id) json_error('Missing id');
  $stmt = db()->prepare('DELETE FROM academic_semesters WHERE id = ?');
  $stmt->execute([$id]);
  json_response(['success' => true]);
}

json_error('Method not allowed', 405);
