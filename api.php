<?php
header('Content-Type: application/json');
// Bu rivojlanish uchun, real loyihada cheklangan domenlarni ko'rsatish tavsiya etiladi.
// Masalan: header('Access-Control-Allow-Origin: https://yourdomain.com');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Agar OPTIONS so'rovi kelsa, javob berib chiqib ketish
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Ma'lumotlarni fayllardan yuklash funksiyasi
function loadData($filename) {
    if (!file_exists($filename) || filesize($filename) == 0) {
        return [];
    }
    $data = json_decode(file_get_contents($filename), true);
    return is_array($data) ? $data : [];
}

$contests = loadData('contests.json');

// API so'rovini aniqlash
$action = $_GET['action'] ?? 'get_all_contests';
$contestId = $_GET['id'] ?? null;

switch ($action) {
    case 'get_all_contests':
        $activeContests = array_filter($contests, function($c) {
            return $c['status'] == 'active';
        });
        // Kalitlarni saqlash uchun array_values o'rniga shu holatda qoldirdik
        // Chunki JSda contest ID'sini kalit sifatida ishlatish qulayroq bo'lishi mumkin.
        echo json_encode(['status' => 'success', 'data' => $activeContests]);
        break;
    case 'get_contest_details':
        if ($contestId && isset($contests[$contestId])) {
            echo json_encode(['status' => 'success', 'data' => $contests[$contestId]]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Konkurs topilmadi.']);
        }
        break;
    default:
        echo json_encode(['status' => 'error', 'message' => 'Noto\'g\'ri harakat.']);
        break;
}
?>
