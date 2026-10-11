<?php

header('Content-Type: application/json; charset=utf-8');

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    respond(405, ['success' => false, 'error' => 'Only POST requests are allowed.']);
}

try {
    $input = json_decode(file_get_contents('php://input'), true, 512, JSON_THROW_ON_ERROR);
} catch (JsonException $exception) {
    respond(400, ['success' => false, 'error' => 'Request body must contain valid JSON.']);
}

if (!is_array($input)
    || !isset($input['cardnumber'], $input['bin'], $input['pan'], $input['brand'], $input['method'])
    || !is_string($input['cardnumber'])
    || !is_int($input['bin'])
    || !is_int($input['pan'])
    || !is_string($input['brand'])
    || !is_int($input['method'])
) {
    respond(400, ['success' => false, 'error' => 'Request is missing valid card details.']);
}

$cardNumber = $input['cardnumber'];
$bin = $input['bin'];
$pan = $input['pan'];
$brand = $input['brand'];
$method = $input['method'];
$allowedBrands = ['VISA', 'MASTERCARD', 'AMERICAN EXPRESS', 'DINERS CLUB', 'DISCOVER', 'JCB', 'MAESTRO'];
$validBin = in_array(strlen((string) $bin), [6, 8], true);
$validPan = strlen((string) $pan) === 5;
$validMethod = ($method === 1 && $validBin && $pan === 0)
    || ($method === 2 && $bin === 0 && $validPan)
    || ($method === 0 && $validBin && $validPan);

if (!preg_match('/^\d{14,16}$/', $cardNumber)
    || $bin < 0
    || $pan < 0
    || !$validMethod
    || !in_array($brand, $allowedBrands, true)
) {
    respond(400, ['success' => false, 'error' => 'Card details are not valid.']);
}

$credentials = require __DIR__ . '/credentials.php';

try {
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $connection = new mysqli(
        $credentials['host'],
        $credentials['username'],
        $credentials['password'],
        $credentials['database']
    );
    $connection->set_charset('utf8mb4');

    $statement = $connection->prepare(
        'INSERT INTO `cardgen` (`cardnumber`, `BIN`, `PAN`, `brand`, `method`) VALUES (?, ?, ?, ?, ?)'
    );
    $statement->bind_param('siisi', $cardNumber, $bin, $pan, $brand, $method);
    $statement->execute();
    $statement->close();
    $connection->close();
} catch (mysqli_sql_exception $exception) {
    error_log('Card record insert failed: ' . $exception->getMessage());
    respond(500, ['success' => false, 'error' => 'The card details could not be saved.']);
}

respond(201, ['success' => true]);
