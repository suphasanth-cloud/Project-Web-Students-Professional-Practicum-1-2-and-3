<?php
require_once __DIR__ . '/auth.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = require_auth();

// GET /api/users.php — list users (admin: all, mentor: own students, instructor: all students, self: own profile)
if ($method === 'GET') {
  $role = get_query('role');
  $status = get_query('status');

  if ($user['role'] === 'admin') {
    $sql = 'SELECT * FROM users WHERE 1=1';
    $params = [];
    if ($role) { $sql .= ' AND role = ?'; $params[] = $role; }
    if ($status) { $sql .= ' AND status = ?'; $params[] = $status; }
    $sql .= ' ORDER BY created_at DESC';
  } elseif (in_array($user['role'], ['instructor', 'supervisor', 'head'])) {
    $sql = 'SELECT * FROM users WHERE role = ?';
    $params = ['student'];
    if ($status) { $sql .= ' AND status = ?'; $params[] = $status; }
    $sql .= ' ORDER BY created_at DESC';
  } elseif ($user['role'] === 'mentor') {
    $sql = 'SELECT * FROM users WHERE selected_mentor_id = ? AND role = ?';
    $params = [$user['id'], 'student'];
    if ($status) { $sql .= ' AND status = ?'; $params[] = $status; }
    $sql .= ' ORDER BY created_at DESC';
  } else {
    $sql = 'SELECT * FROM users WHERE id = ?';
    $params = [$user['id']];
  }

  $stmt = db()->prepare($sql);
  $stmt->execute($params);
  $users = $stmt->fetchAll();
  foreach ($users as &$u) unset($u['password_hash']);

  json_response(['data' => $users]);
}

// PUT /api/users.php?id=xxx — update user (admin: any, self: own)
if ($method === 'PUT') {
  $id = get_query('id');
  if (!$id) json_error('Missing id');

  $body = get_body();

  if ($user['role'] === 'admin') {
    $allowed = ['role', 'status', 'prefix_name', 'first_name', 'last_name', 'nickname', 'major', 'academic_year_level', 'phone', 'address', 'profile_image_url', 'selected_mentor_id', 'selected_unit_id'];
  } else {
    if ($id !== $user['id']) json_error('Forbidden', 403);
    $allowed = ['prefix_name', 'first_name', 'last_name', 'nickname', 'major', 'academic_year_level', 'phone', 'address', 'profile_image_url', 'selected_mentor_id', 'selected_unit_id'];
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

  $values[] = $id;
  $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?';
  $stmt = db()->prepare($sql);
  $stmt->execute($values);

  $stmt = db()->prepare('SELECT * FROM users WHERE id = ?');
  $stmt->execute([$id]);
  $updated = $stmt->fetch();
  unset($updated['password_hash']);

  audit_log($user['id'], 'update_user', 'users', $id, $body);

  json_response(['data' => $updated]);
}

// DELETE /api/users.php?id=xxx — admin only
if ($method === 'DELETE') {
  require_role($user, 'admin');
  $id = get_query('id');
  if (!$id) json_error('Missing id');

  $stmt = db()->prepare('DELETE FROM users WHERE id = ?');
  $stmt->execute([$id]);

  audit_log($user['id'], 'delete_user', 'users', $id);

  json_response(['success' => true]);
}

json_error('Method not allowed', 405);
