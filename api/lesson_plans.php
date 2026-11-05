<?php
require_once __DIR__ . '/auth.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = require_auth();

if ($method === 'GET') {
  $userId = get_query('user_id', $user['id']);
  $level = get_query('practicum_level');

  if ($user['role'] === 'student') {
    $sql = 'SELECT * FROM lesson_plans WHERE user_id = ?';
    $params = [$user['id']];
  } elseif ($user['role'] === 'mentor') {
    $sql = 'SELECT * FROM lesson_plans WHERE user_id IN (SELECT id FROM users WHERE selected_mentor_id = ?)';
    $params = [$user['id']];
  } else {
    if ($userId && $userId !== 'all') {
      $sql = 'SELECT * FROM lesson_plans WHERE user_id = ?';
      $params = [$userId];
    } else {
      $sql = 'SELECT * FROM lesson_plans WHERE 1=1';
      $params = [];
    }
  }

  if ($level) { $sql .= ' AND practicum_level = ?'; $params[] = (int)$level; }
  $sql .= ' ORDER BY created_at DESC';

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
    INSERT INTO lesson_plans (id, user_id, semester_id, practicum_level, subject_name, topic, plan_url, plan_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ');
  $stmt->execute([
    $id, $userId,
    $body['semester_id'] ?? null,
    (int)($body['practicum_level'] ?? 1),
    $body['subject_name'] ?? '',
    $body['topic'] ?? '',
    $body['plan_url'] ?? '',
    $body['plan_type'] ?? 'url',
  ]);

  $stmt = db()->prepare('SELECT * FROM lesson_plans WHERE id = ?');
  $stmt->execute([$id]);
  json_response(['data' => $stmt->fetch()], 201);
}

if ($method === 'PUT') {
  $id = get_query('id');
  if (!$id) json_error('Missing id');
  $body = get_body();

  $stmt = db()->prepare('SELECT * FROM lesson_plans WHERE id = ?');
  $stmt->execute([$id]);
  $plan = $stmt->fetch();
  if (!$plan) json_error('Not found', 404);

  if ($user['role'] === 'student' && $plan['user_id'] !== $user['id']) {
    json_error('Forbidden', 403);
  }

  $studentFields = ['semester_id', 'practicum_level', 'subject_name', 'topic', 'plan_url', 'plan_type'];
  $instructorFields = ['instructor_feedback', 'instructor_approval_status'];

  $allowed = ($user['role'] === 'student') ? $studentFields : $instructorFields;
  if (in_array($user['role'], ['instructor', 'supervisor', 'head', 'admin'])) {
    $allowed = array_merge($studentFields, $instructorFields);
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

  if (isset($body['instructor_approval_status']) && in_array($body['instructor_approval_status'], ['approved', 'rejected'])) {
    $fields[] = 'instructor_approved_at = ?';
    $values[] = date('Y-m-d H:i:s');
  }

  $values[] = $id;
  $stmt = db()->prepare('UPDATE lesson_plans SET ' . implode(', ', $fields) . ' WHERE id = ?');
  $stmt->execute($values);

  $stmt = db()->prepare('SELECT * FROM lesson_plans WHERE id = ?');
  $stmt->execute([$id]);
  json_response(['data' => $stmt->fetch()]);
}

if ($method === 'DELETE') {
  $id = get_query('id');
  if (!$id) json_error('Missing id');

  $stmt = db()->prepare('SELECT * FROM lesson_plans WHERE id = ?');
  $stmt->execute([$id]);
  $plan = $stmt->fetch();
  if (!$plan) json_error('Not found', 404);

  if ($user['role'] === 'student' && $plan['user_id'] !== $user['id']) {
    json_error('Forbidden', 403);
  }
  if (!in_array($user['role'], ['student', 'admin'])) {
    json_error('Forbidden', 403);
  }

  $stmt = db()->prepare('DELETE FROM lesson_plans WHERE id = ?');
  $stmt->execute([$id]);
  json_response(['success' => true]);
}

json_error('Method not allowed', 405);
