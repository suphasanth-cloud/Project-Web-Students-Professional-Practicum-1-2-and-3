<?php
require_once __DIR__ . '/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
  $body = get_body();
  $email = trim($body['email'] ?? '');
  $password = $body['password'] ?? '';
  $role = $body['role'] ?? 'student';
  $prefixName = $body['prefix_name'] ?? null;
  $firstName = $body['first_name'] ?? null;
  $lastName = $body['last_name'] ?? null;
  $nickname = $body['nickname'] ?? null;
  $major = $body['major'] ?? null;
  $academicYearLevel = $body['academic_year_level'] ?? null;
  $phone = $body['phone'] ?? null;
  $address = $body['address'] ?? null;
  $selectedMentorId = $body['selected_mentor_id'] ?? null;
  $selectedUnitId = $body['selected_unit_id'] ?? null;

  if (!$email || !$password) {
    json_error('กรุณากรอกอีเมลและรหัสผ่าน');
  }

  if (!in_array($role, ['admin', 'instructor', 'mentor', 'supervisor', 'head', 'student'])) {
    json_error('บทบาทไม่ถูกต้อง');
  }

  $stmt = db()->prepare('SELECT id FROM users WHERE email = ?');
  $stmt->execute([$email]);
  if ($stmt->fetch()) {
    json_error('อีเมลนี้ถูกใช้แล้ว');
  }

  $hash = password_hash($password, PASSWORD_BCRYPT);
  $id = sprintf('%s', bin2hex(random_bytes(16)));
  $status = 'pending';

  $stmt = db()->prepare('
    INSERT INTO users (id, role, status, email, password_hash, prefix_name, first_name, last_name, nickname, major, academic_year_level, phone, address, selected_mentor_id, selected_unit_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ');
  $stmt->execute([$id, $role, $status, $email, $hash, $prefixName, $firstName, $lastName, $nickname, $major, $academicYearLevel, $phone, $address, $selectedMentorId, $selectedUnitId]);

  $stmt = db()->prepare('SELECT * FROM users WHERE id = ?');
  $stmt->execute([$id]);
  $user = $stmt->fetch();
  unset($user['password_hash']);

  json_response(['user' => $user], 201);
}

json_error('Method not allowed', 405);
