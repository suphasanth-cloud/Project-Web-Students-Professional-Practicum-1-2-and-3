<?php
require_once __DIR__ . '/auth.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = require_auth();

if ($method !== 'POST') json_error('Method not allowed', 405);

if (!isset($_FILES['file'])) json_error('No file uploaded');

$file = $_FILES['file'];
$kind = isset($_POST['kind']) ? $_POST['kind'] : 'avatar';

$configs = [
  'avatar' => [
    'allowedMime' => ['image/jpeg', 'image/jpg', 'image/png'],
    'minSize' => 1024,
    'maxSize' => 5 * 1024 * 1024,
    'subdir' => 'avatars',
  ],
  'activity' => [
    'allowedMime' => ['image/jpeg', 'image/jpg', 'image/png'],
    'minSize' => 1024 * 1024,
    'maxSize' => 5 * 1024 * 1024,
    'subdir' => 'activities',
  ],
  'lessonplan' => [
    'allowedMime' => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    'minSize' => 1024,
    'maxSize' => 10 * 1024 * 1024,
    'subdir' => 'lessonplans',
  ],
];

if (!isset($configs[$kind])) json_error('Invalid upload kind');

$cfg = $configs[$kind];

$detectedMime = mime_content_type($file['tmp_name']);
if (!in_array($detectedMime, $cfg['allowedMime'])) {
  json_error('ประเภทไฟล์ไม่ได้รับอนุญาต กรุณาตรวจสอบรูปแบบไฟล์');
}
if ($file['size'] < $cfg['minSize']) {
  json_error('ไฟล์เล็กเกินไป กรุณาเลือกไฟล์ที่มีขนาดใหญ่กว่านี้');
}
if ($file['size'] > $cfg['maxSize']) {
  $maxMB = $cfg['maxSize'] / (1024 * 1024);
  json_error('ขนาดไฟล์ต้องไม่เกิน ' . $maxMB . ' MB');
}

$uploadDir = __DIR__ . '/uploads/' . $cfg['subdir'] . '/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = $user['id'] . '-' . time() . '-' . bin2hex(random_bytes(4)) . '.' . $ext;
$filepath = $uploadDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $filepath)) {
  json_error('Failed to upload file', 500);
}

$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];
$baseUrl = $protocol . '://' . $host . '/api/uploads/' . $cfg['subdir'] . '/';
$url = $baseUrl . $filename;

if ($kind === 'avatar') {
  $stmt = db()->prepare('UPDATE users SET profile_image_url = ? WHERE id = ?');
  $stmt->execute([$url, $user['id']]);
}

json_response(['url' => $url]);
