<?php
require_once __DIR__ . '/auth.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = require_auth();

if ($method !== 'GET') json_error('Method not allowed', 405);

$role = $user['role'];
$stats = [];

if ($role === 'admin') {
  $counts = ['users' => 'users', 'units' => 'university_units', 'semesters' => 'academic_semesters', 'activities' => 'activity_logs', 'attendance' => 'attendance_logs', 'evaluations' => 'evaluations'];
  foreach ($counts as $key => $table) {
    $stmt = db()->query("SELECT COUNT(*) as cnt FROM $table");
    $stats[$key] = (int)$stmt->fetch()['cnt'];
  }
  $stmt = db()->query("SELECT COUNT(*) as cnt FROM users WHERE status = 'pending'");
  $stats['pending_users'] = (int)$stmt->fetch()['cnt'];
  $stmt = db()->query("SELECT COUNT(*) as cnt FROM users WHERE status = 'approved'");
  $stats['approved_users'] = (int)$stmt->fetch()['cnt'];
  $stmt = db()->query("SELECT role, COUNT(*) as cnt FROM users GROUP BY role");
  $stats['by_role'] = $stmt->fetchAll();
} elseif (in_array($role, ['instructor', 'supervisor', 'head'])) {
  $stmt = db()->query("SELECT COUNT(*) as cnt FROM users WHERE role = 'student' AND status = 'approved'");
  $stats['students'] = (int)$stmt->fetch()['cnt'];
  $stmt = db()->query("SELECT COUNT(*) as cnt FROM lesson_plans WHERE instructor_approval_status = 'pending'");
  $stats['pending_lesson_plans'] = (int)$stmt->fetch()['cnt'];
  $stmt = db()->query("SELECT COUNT(*) as cnt FROM evaluations");
  $stats['evaluations'] = (int)$stmt->fetch()['cnt'];
  $stmt = db()->query("SELECT COUNT(*) as cnt FROM activity_logs");
  $stats['activities'] = (int)$stmt->fetch()['cnt'];
  if ($role === 'head') {
    $stmt = db()->query("SELECT COUNT(*) as cnt FROM evaluations WHERE is_final = 1");
    $stats['final_evaluations'] = (int)$stmt->fetch()['cnt'];
    $stmt = db()->query("SELECT COUNT(*) as cnt FROM evaluations WHERE result = 'pending'");
    $stats['pending_evaluations'] = (int)$stmt->fetch()['cnt'];
  }
} elseif ($role === 'mentor') {
  $stmt = db()->prepare("SELECT COUNT(*) as cnt FROM users WHERE selected_mentor_id = ? AND role = 'student'");
  $stmt->execute([$user['id']]);
  $stats['students'] = (int)$stmt->fetch()['cnt'];
  $stmt = db()->prepare("SELECT COUNT(*) as cnt FROM activity_logs WHERE user_id IN (SELECT id FROM users WHERE selected_mentor_id = ?) AND mentor_approval_status = 'pending'");
  $stmt->execute([$user['id']]);
  $stats['pending_activities'] = (int)$stmt->fetch()['cnt'];
  $stmt = db()->prepare("SELECT COUNT(*) as cnt FROM attendance_logs WHERE user_id IN (SELECT id FROM users WHERE selected_mentor_id = ?) AND mentor_approval_status = 'pending'");
  $stmt->execute([$user['id']]);
  $stats['pending_attendance'] = (int)$stmt->fetch()['cnt'];
} else {
  $stmt = db()->prepare("SELECT COUNT(*) as cnt FROM activity_logs WHERE user_id = ?");
  $stmt->execute([$user['id']]);
  $stats['activities'] = (int)$stmt->fetch()['cnt'];
  $stmt = db()->prepare("SELECT COUNT(*) as cnt FROM attendance_logs WHERE user_id = ?");
  $stmt->execute([$user['id']]);
  $stats['attendance'] = (int)$stmt->fetch()['cnt'];
  $stmt = db()->prepare("SELECT COUNT(*) as cnt FROM lesson_plans WHERE user_id = ?");
  $stmt->execute([$user['id']]);
  $stats['lesson_plans'] = (int)$stmt->fetch()['cnt'];
  $stmt = db()->prepare("SELECT COUNT(*) as cnt FROM evaluations WHERE user_id = ?");
  $stmt->execute([$user['id']]);
  $stats['evaluations'] = (int)$stmt->fetch()['cnt'];
}

json_response(['data' => $stats]);
