<?php
require_once __DIR__ . '/auth.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = require_auth();

// GET /api/subjects.php — list subjects (with optional ?level= filter)
// GET /api/subjects.php?sections=1 — list course sections with subject + instructor info
if ($method === 'GET') {
  $sectionsMode = get_query('sections');

  if ($sectionsMode) {
    $sql = 'SELECT cs.*, s.subject_code, s.subject_name, s.credits, s.practicum_level,
                   u.prefix_name AS instructor_prefix, u.first_name AS instructor_first, u.last_name AS instructor_last,
                   sm.year, sm.semester
            FROM course_sections cs
            LEFT JOIN subjects s ON cs.subject_id = s.id
            LEFT JOIN users u ON cs.instructor_id = u.id
            LEFT JOIN academic_semesters sm ON cs.semester_id = sm.id
            WHERE 1=1';
    $params = [];

    $subjectId = get_query('subject_id');
    if ($subjectId) { $sql .= ' AND cs.subject_id = ?'; $params[] = $subjectId; }

    $semesterId = get_query('semester_id');
    if ($semesterId) { $sql .= ' AND cs.semester_id = ?'; $params[] = $semesterId; }

    $instructorId = get_query('instructor_id');
    if ($instructorId) { $sql .= ' AND cs.instructor_id = ?'; $params[] = $instructorId; }

    $sql .= ' ORDER BY sm.year DESC, sm.semester DESC, s.subject_code';

    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    json_response(['data' => $stmt->fetchAll()]);
  }

  $sql = 'SELECT * FROM subjects WHERE 1=1';
  $params = [];

  $level = get_query('level');
  if ($level) { $sql .= ' AND practicum_level = ?'; $params[] = (int)$level; }

  $sql .= ' ORDER BY subject_code';
  $stmt = db()->prepare($sql);
  $stmt->execute($params);
  json_response(['data' => $stmt->fetchAll()]);
}

// POST — create subject or section
if ($method === 'POST') {
  $body = get_body();
  $type = $body['type'] ?? 'subject';

  if ($type === 'section') {
    require_role($user, 'admin', 'instructor', 'head');
    $id = bin2hex(random_bytes(16));
    $stmt = db()->prepare('
      INSERT INTO course_sections (id, subject_id, section_name, semester_id, instructor_id)
      VALUES (?, ?, ?, ?, ?)
    ');
    $stmt->execute([
      $id,
      $body['subject_id'] ?? '',
      $body['section_name'] ?? '',
      $body['semester_id'] ?? null,
      $body['instructor_id'] ?? null,
    ]);

    $stmt = db()->prepare('SELECT * FROM course_sections WHERE id = ?');
    $stmt->execute([$id]);
    json_response(['data' => $stmt->fetch()], 201);
  }

  require_role($user, 'admin');
  $id = bin2hex(random_bytes(16));
  $stmt = db()->prepare('
    INSERT INTO subjects (id, subject_code, subject_name, credits, practicum_level, description)
    VALUES (?, ?, ?, ?, ?, ?)
  ');
  $stmt->execute([
    $id,
    $body['subject_code'] ?? '',
    $body['subject_name'] ?? '',
    (int)($body['credits'] ?? 3),
    (int)($body['practicum_level'] ?? 1),
    $body['description'] ?? null,
  ]);

  $stmt = db()->prepare('SELECT * FROM subjects WHERE id = ?');
  $stmt->execute([$id]);
  json_response(['data' => $stmt->fetch()], 201);
}

// PUT — update subject or section
if ($method === 'PUT') {
  $id = get_query('id');
  if (!$id) json_error('Missing id');
  $body = get_body();
  $type = $body['type'] ?? 'subject';

  if ($type === 'section') {
    require_role($user, 'admin', 'instructor', 'head');
    $allowed = ['section_name', 'semester_id', 'instructor_id'];
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
    $stmt = db()->prepare('UPDATE course_sections SET ' . implode(', ', $fields) . ' WHERE id = ?');
    $stmt->execute($values);

    $stmt = db()->prepare('SELECT * FROM course_sections WHERE id = ?');
    $stmt->execute([$id]);
    json_response(['data' => $stmt->fetch()]);
  }

  require_role($user, 'admin');
  $allowed = ['subject_code', 'subject_name', 'credits', 'practicum_level', 'description'];
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
  $stmt = db()->prepare('UPDATE subjects SET ' . implode(', ', $fields) . ' WHERE id = ?');
  $stmt->execute($values);

  $stmt = db()->prepare('SELECT * FROM subjects WHERE id = ?');
  $stmt->execute([$id]);
  json_response(['data' => $stmt->fetch()]);
}

// DELETE — delete subject or section
if ($method === 'DELETE') {
  require_role($user, 'admin');
  $id = get_query('id');
  if (!$id) json_error('Missing id');
  $type = get_query('type', 'subject');

  if ($type === 'section') {
    $stmt = db()->prepare('DELETE FROM course_sections WHERE id = ?');
  } else {
    $stmt = db()->prepare('DELETE FROM subjects WHERE id = ?');
  }
  $stmt->execute([$id]);
  json_response(['success' => true]);
}

// POST /api/subjects.php?enroll=1 — enroll student in section
if ($method === 'POST' && get_query('enroll')) {
  require_role($user, 'admin', 'instructor', 'head');
  $body = get_body();
  $id = bin2hex(random_bytes(16));
  $stmt = db()->prepare('INSERT INTO course_enrollments (id, section_id, student_id) VALUES (?, ?, ?)');
  $stmt->execute([$id, $body['section_id'] ?? '', $body['student_id'] ?? '']);
  json_response(['data' => ['id' => $id]], 201);
}

// GET /api/subjects.php?enrollments=1&section_id=xxx — list enrollments
if ($method === 'GET' && get_query('enrollments')) {
  $sectionId = get_query('section_id');
  if (!$sectionId) json_error('Missing section_id');
  $stmt = db()->prepare('
    SELECT ce.*, u.prefix_name, u.first_name, u.last_name, u.nickname, u.email, u.academic_year_level
    FROM course_enrollments ce
    LEFT JOIN users u ON ce.student_id = u.id
    WHERE ce.section_id = ?
    ORDER BY u.first_name
  ');
  $stmt->execute([$sectionId]);
  json_response(['data' => $stmt->fetchAll()]);
}

json_error('Method not allowed', 405);
