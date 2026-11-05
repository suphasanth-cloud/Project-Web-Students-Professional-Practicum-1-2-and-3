<?php
require_once __DIR__ . '/config.php';
cors();

function get_session_user() {
  $token = get_bearer_token();
  if (!$token) return null;

  $stmt = db()->prepare('SELECT user_id FROM auth_tokens WHERE token = ? AND expires_at > NOW()');
  $stmt->execute([$token]);
  $row = $stmt->fetch();
  if (!$row) return null;

  $stmt = db()->prepare('SELECT * FROM users WHERE id = ?');
  $stmt->execute([$row['user_id']]);
  $user = $stmt->fetch();
  if (!$user) return null;

  unset($user['password_hash']);
  return $user;
}

function require_auth() {
  $user = get_session_user();
  if (!$user) json_error('Unauthorized', 401);
  return $user;
}

function require_role($user, ...$roles) {
  if (!in_array($user['role'], $roles)) {
    json_error('Forbidden', 403);
  }
  return $user;
}

function create_token($userId) {
  $token = generate_token();
  $expires = date('Y-m-d H:i:s', time() + 86400 * 7);
  $stmt = db()->prepare('INSERT INTO auth_tokens (token, user_id, expires_at) VALUES (?, ?, ?)');
  $stmt->execute([$token, $userId, $expires]);
  return $token;
}

function destroy_token($token) {
  $stmt = db()->prepare('DELETE FROM auth_tokens WHERE token = ?');
  $stmt->execute([$token]);
}

function audit_log($actorId, $action, $targetType = null, $targetId = null, $details = null) {
  $stmt = db()->prepare('INSERT INTO audit_logs (action, actor_id, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)');
  $stmt->execute([$action, $actorId, $targetType, $targetId, $details ? json_encode($details) : null]);
}
