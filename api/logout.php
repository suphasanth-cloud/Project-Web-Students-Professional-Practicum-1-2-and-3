<?php
require_once __DIR__ . '/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
  $token = get_bearer_token();
  if ($token) {
    destroy_token($token);
  }
  json_response(['success' => true]);
}

json_error('Method not allowed', 405);
