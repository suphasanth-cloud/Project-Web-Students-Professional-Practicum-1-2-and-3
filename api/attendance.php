<?php
require_once __DIR__ . '/auth.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = require_auth();

if ($method === 'GET') {
  $userId = get_query('user_id', $user['id']);
  $semesterId = get_query('semester_id');

  if ($user['role'] === 'student' && $userId !== $user['id']) {
    json_error('Forbidden', 403);
  }
  if ($user['role'] === 'mentor') {
    $stmt = db()->prepare('SELECT id FROM users WHERE id = ? AND selected_mentor_id = ?');
    $stmt->execute([$userId, $user['id']]);
    if (!$stmt->fetch() && $userId !== $user['id']) {
      json_error('Forbidden', 403);
    }
  }

  $sql = 'SELECT * FROM attendance_logs WHERE 1=1';
  $params = [];

  if ($user['role'] === 'student') {
    $sql .= ' AND user_id = ?';
    $params[] = $user['id'];
  } elseif ($user['role'] === 'mentor') {
    $sql .= ' AND user_id IN (SELECT id FROM users WHERE selected_mentor_id = ?)';
    $params[] = $user['id'];
  } elseif (in_array($user['role'], ['instructor', 'supervisor', 'head', 'admin'])) {
    if ($userId && $userId !== 'all') {
      $sql .= ' AND user_id = ?';
      $params[] = $userId;
    }
  }

  if ($semesterId) { $sql .= ' AND semester_id = ?'; $params[] = $semesterId; }
  $sql .= ' ORDER BY date DESC, created_at DESC';

  $stmt = db()->prepare($sql);
  $stmt->execute($params);
  json_response(['data' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
  $body = get_body();

  if ($user['role'] === 'student') {
    $userId = $user['id'];
  } elseif ($user['role'] === 'admin') {
    $userId = $body['user_id'] ?? $user['id'];
  } else {
    json_error('Forbidden', 403);
  }

  $id = bin2hex(random_bytes(16));
  $stmt = db()->prepare('
    INSERT INTO attendance_logs (id, user_id, semester_id, unit_id, date, check_in_time, check_out_time, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  ');
  $stmt->execute([
    $id, $userId,
    $body['semester_id'] ?? null,
    $body['unit_id'] ?? null,
    $body['date'] ?? date('Y-m-d'),
    $body['check_in_time'] ?? null,
    $body['check_out_time'] ?? null,
    $body['status'] ?? 'present',
    $body['notes'] ?? null,
  ]);

  $stmt = db()->prepare('SELECT * FROM attendance_logs WHERE id = ?');
  $stmt->execute([$id]);
  json_response(['data' => $stmt->fetch()], 201);
}

if ($method === 'PUT') {
  $id = get_query('id');
  if (!$id) json_error('Missing id');
  $body = get_body();

  $stmt = db()->prepare('SELECT * FROM attendance_logs WHERE id = ?');
  $stmt->execute([$id]);
  $att = $stmt->fetch();
  if (!$att) json_error('Not found', 404);

  if ($user['role'] === 'student' && $att['user_id'] !== $user['id']) {
    json_error('Forbidden', 403);
  }
  if ($user['role'] === 'mentor') {
    $stmt = db()->prepare('SELECT id FROM users WHERE id = ? AND selected_mentor_id = ?');
    $stmt->execute([$att['user_id'], $user['id']]);
    if (!$stmt->fetch()) json_error('Forbidden', 403);
  }

  $studentFields = ['semester_id', 'unit_id', 'date', 'check_in_time', 'check_out_time', 'status', 'notes'];
  $mentorFields = ['mentor_approval_status'];

  $allowed = ($user['role'] === 'student') ? $studentFields : $mentorFields;
  if (in_array($user['role'], ['instructor', 'supervisor', 'head', 'admin'])) {
    $allowed = array_merge($studentFields, $mentorFields);
  }

  $fields = [];
  $values = [];
  foreach ($allowed as $f) {
    if (array_key_exists($f, $body)) {
      $fields[] = "$f = ?";
      $values[] = $body[$f];
    }
  }
  if (empty($fields)) json_error('No fields to update');

  if (isset($body['mentor_approval_status']) && in_array($body['mentor_approval_status'], ['approved', 'rejected'])) {
    $fields[] = 'mentor_approved_at = ?';
    $values[] = date('Y-m-d H:i:s');
  }

  $values[] = $id;
  $stmt = db()->prepare('UPDATE attendance_logs SET ' . implode(', ', $fields) . ' WHERE id = ?');
  $stmt->execute($values);

  $stmt = db()->prepare('SELECT * FROM attendance_logs WHERE id = ?');
  $stmt->execute([$id]);
  json_response(['data' => $stmt->fetch()]);
}

if ($method === 'DELETE') {
  $id = get_query('id');
  if (!$id) json_error('Missing id');

  $stmt = db()->prepare('SELECT * FROM attendance_logs WHERE id = ?');
  $stmt->execute([$id]);
  $att = $stmt->fetch();
  if (!$att) json_error('Not found', 404);

  if ($user['role'] === 'student' && $att['user_id'] !== $user['id']) {
    json_error('Forbidden', 403);
  }
  if (!in_array($user['role'], ['student', 'admin'])) {
    json_error('Forbidden', 403);
  }

  $stmt = db()->prepare('DELETE FROM attendance_logs WHERE id = ?');
  $stmt->execute([$id]);
  json_response(['success' => true]);
}

json_error('Method not allowed', 405);
