<?php
require_once __DIR__ . '/auth.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = require_auth();

if ($method === 'GET') {
  require_role($user, 'admin');
  $stmt = db()->query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500');
  json_response(['data' => $stmt->fetchAll()]);
}

if ($method === 'DELETE') {
  require_role($user, 'admin');
  $id = get_query('id');
  if ($id) {
    $stmt = db()->prepare('DELETE FROM audit_logs WHERE id = ?');
    $stmt->execute([$id]);
  } else {
    db()->exec('DELETE FROM audit_logs');
  }
  json_response(['success' => true]);
}

json_error('Method not allowed', 405);
