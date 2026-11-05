<?php
require_once __DIR__ . '/auth.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = require_auth();

if ($method === 'GET') {
  $userId = get_query('user_id', $user['id']);
  $level = get_query('practicum_level');

  if ($user['role'] === 'student' && $userId !== $user['id']) {
    json_error('Forbidden', 403);
  }

  $sql = 'SELECT * FROM evaluations WHERE 1=1';
  $params = [];

  if ($user['role'] === 'student') {
    $sql .= ' AND user_id = ?';
    $params[] = $user['id'];
  } elseif (in_array($user['role'], ['instructor', 'supervisor', 'head', 'admin'])) {
    if ($userId && $userId !== 'all') {
      $sql .= ' AND user_id = ?';
      $params[] = $userId;
    }
  } elseif ($user['role'] === 'mentor') {
    $sql .= ' AND user_id IN (SELECT id FROM users WHERE selected_mentor_id = ?)';
    $params[] = $user['id'];
  } else {
    json_error('Forbidden', 403);
  }

  if ($level) { $sql .= ' AND practicum_level = ?'; $params[] = (int)$level; }
  $sql .= ' ORDER BY evaluated_at DESC';

  $stmt = db()->prepare($sql);
  $stmt->execute($params);
  json_response(['data' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
  require_role($user, 'instructor', 'supervisor', 'head', 'admin');
  $body = get_body();

  $evaluatorRole = $user['role'];
  $isFinal = 0;

  // Only head can set final evaluation
  if ($user['role'] === 'head' && isset($body['is_final'])) {
    $isFinal = $body['is_final'] ? 1 : 0;
  }

  $id = bin2hex(random_bytes(16));
  $stmt = db()->prepare('
    INSERT INTO evaluations (id, user_id, semester_id, practicum_level, evaluator_id, evaluator_role, score, comments, result, is_final)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ');
  $stmt->execute([
    $id,
    $body['user_id'] ?? '',
    $body['semester_id'] ?? null,
    (int)($body['practicum_level'] ?? 1),
    $user['id'],
    $evaluatorRole,
    (float)($body['score'] ?? 0),
    $body['comments'] ?? null,
    $body['result'] ?? 'pending',
    $isFinal,
  ]);

  $stmt = db()->prepare('SELECT * FROM evaluations WHERE id = ?');
  $stmt->execute([$id]);
  json_response(['data' => $stmt->fetch()], 201);
}

if ($method === 'PUT') {
  require_role($user, 'instructor', 'supervisor', 'head', 'admin');
  $id = get_query('id');
  if (!$id) json_error('Missing id');
  $body = get_body();

  $allowed = ['user_id', 'semester_id', 'practicum_level', 'score', 'comments', 'result'];
  if ($user['role'] === 'head') {
    $allowed[] = 'is_final';
  }
  $fields = [];
  $values = [];
  foreach ($allowed as $f) {
    if (array_key_exists($f, $body)) {
      $fields[] = "$f = ?";
      $values[] = $f === 'is_final' ? ($body[$f] ? 1 : 0) : $body[$f];
    }
  }
  if (empty($fields)) json_error('No fields to update');

  $values[] = $id;
  $stmt = db()->prepare('UPDATE evaluations SET ' . implode(', ', $fields) . ' WHERE id = ?');
  $stmt->execute($values);

  $stmt = db()->prepare('SELECT * FROM evaluations WHERE id = ?');
  $stmt->execute([$id]);
  json_response(['data' => $stmt->fetch()]);
}

if ($method === 'DELETE') {
  require_role($user, 'instructor', 'supervisor', 'head', 'admin');
  $id = get_query('id');
  if (!$id) json_error('Missing id');
  $stmt = db()->prepare('DELETE FROM evaluations WHERE id = ?');
  $stmt->execute([$id]);
  json_response(['success' => true]);
}

json_error('Method not allowed', 405);
