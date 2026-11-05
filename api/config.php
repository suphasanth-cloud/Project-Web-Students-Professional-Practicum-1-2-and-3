<?php
// Database configuration for XAMPP + MySQL

define('DB_HOST', 'localhost');
define('DB_NAME', 'rmuti_practicum');
define('DB_USER', 'root');
define('DB_PASS', '');

function db() {
  static $pdo = null;
  if ($pdo === null) {
    try {
      $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [
          PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
          PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
          PDO::ATTR_EMULATE_PREPARES => false,
        ]
      );
    } catch (PDOException $e) {
      json_error('Database connection failed: ' . $e->getMessage(), 500);
    }
  }
  return $pdo;
}

function cors() {
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type, Authorization');
  header('Content-Type: application/json; charset=utf-8');
  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
  }
}

function json_response($data, $code = 200) {
  http_response_code($code);
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

function json_error($message, $code = 400) {
  http_response_code($code);
  echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
  exit;
}

function get_body() {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  return $data ?: [];
}

function get_query($key, $default = null) {
  return isset($_GET[$key]) ? $_GET[$key] : $default;
}

function get_bearer_token() {
  $headers = getallheaders();
  $auth = isset($headers['Authorization']) ? $headers['Authorization'] : '';
  if (!$auth) $auth = isset($headers['authorization']) ? $headers['authorization'] : '';
  if (preg_match('/Bearer\s+(.+)/i', $auth, $matches)) {
    return trim($matches[1]);
  }
  return null;
}

function generate_token() {
  return bin2hex(random_bytes(32));
}
