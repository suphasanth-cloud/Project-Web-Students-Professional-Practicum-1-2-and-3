<?php
require_once __DIR__ . '/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
  $body = get_body();
  $email = trim($body['email'] ?? '');
  $password = $body['password'] ?? '';

  if (!$email || !$password) {
    json_error('กรุณากรอกอีเมลและรหัสผ่าน');
  }

  $stmt = db()->prepare('SELECT * FROM users WHERE email = ?');
  $stmt->execute([$email]);
  $user = $stmt->fetch();

  if (!$user || !password_verify($password, $user['password_hash'])) {
    json_error('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401);
  }

  unset($user['password_hash']);
  $token = create_token($user['id']);

  json_response(['token' => $token, 'user' => $user]);
}

json_error('Method not allowed', 405);
