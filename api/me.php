<?php
require_once __DIR__ . '/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  $user = require_auth();
  json_response(['user' => $user]);
}

if ($method === 'PUT') {
  $user = require_auth();
  $body = get_body();

  $allowed = ['prefix_name', 'first_name', 'last_name', 'nickname', 'major', 'academic_year_level', 'phone', 'address', 'profile_image_url', 'selected_mentor_id', 'selected_unit_id'];
  $fields = [];
  $values = [];
  foreach ($allowed as $f) {
    if (array_key_exists($f, $body)) {
      $fields[] = "$f = ?";
      $values[] = $body[$f];
    }
  }

  if (empty($fields)) {
    json_response(['user' => $user]);
  }

  $values[] = $user['id'];
  $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?';
  $stmt = db()->prepare($sql);
  $stmt->execute($values);

  $stmt = db()->prepare('SELECT * FROM users WHERE id = ?');
  $stmt->execute([$user['id']]);
  $updated = $stmt->fetch();
  unset($updated['password_hash']);

  json_response(['user' => $updated]);
}

json_error('Method not allowed', 405);
