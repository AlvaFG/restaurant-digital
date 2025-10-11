# Test QR Generation API
Write-Host "Testing QR Generation API..." -ForegroundColor Cyan

# Test 1: Generate QR for single table
Write-Host "`n=== Test 1: Generate QR for table-1 ===" -ForegroundColor Yellow
$body1 = @{
    tableId = "table-1"
} | ConvertTo-Json

try {
    $response1 = Invoke-WebRequest `
        -Uri 'http://localhost:3000/api/qr/generate' `
        -Method POST `
        -Body $body1 `
        -ContentType 'application/json' `
        -UseBasicParsing
    
    $result1 = $response1.Content | ConvertFrom-Json
    Write-Host "✓ Status: $($response1.StatusCode)" -ForegroundColor Green
    Write-Host "✓ Success: $($result1.success)" -ForegroundColor Green
    Write-Host "✓ Table: $($result1.data.table.id) #$($result1.data.table.number)" -ForegroundColor Green
    Write-Host "✓ Token length: $($result1.data.token.Length) chars" -ForegroundColor Green
    Write-Host "✓ QR Base64 length: $($result1.data.qrCodeBase64.Length) chars" -ForegroundColor Green
    Write-Host "✓ Expires at: $($result1.data.expiresAt)" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

# Test 2: Generate QR with custom options
Write-Host "`n=== Test 2: Generate QR with custom options ===" -ForegroundColor Yellow
$body2 = @{
    tableId = "table-5"
    options = @{
        size = 500
        errorCorrectionLevel = "H"
        margin = 2
    }
} | ConvertTo-Json -Depth 3

try {
    $response2 = Invoke-WebRequest `
        -Uri 'http://localhost:3000/api/qr/generate' `
        -Method POST `
        -Body $body2 `
        -ContentType 'application/json' `
        -UseBasicParsing
    
    $result2 = $response2.Content | ConvertFrom-Json
    Write-Host "✓ Status: $($response2.StatusCode)" -ForegroundColor Green
    Write-Host "✓ Success: $($result2.success)" -ForegroundColor Green
    Write-Host "✓ Table: $($result2.data.table.id)" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

# Test 3: Test validation - nonexistent table
Write-Host "`n=== Test 3: Validation - Nonexistent table ===" -ForegroundColor Yellow
$body3 = @{
    tableId = "nonexistent-table"
} | ConvertTo-Json

try {
    $response3 = Invoke-WebRequest `
        -Uri 'http://localhost:3000/api/qr/generate' `
        -Method POST `
        -Body $body3 `
        -ContentType 'application/json' `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "✗ Should have failed but got: $($response3.StatusCode)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "✓ Correctly returned 404 for nonexistent table" -ForegroundColor Green
    } else {
        Write-Host "✗ Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 4: Batch generation
Write-Host "`n=== Test 4: Batch generation (3 tables) ===" -ForegroundColor Yellow
$body4 = @{
    tableIds = @("table-1", "table-2", "table-3")
} | ConvertTo-Json

try {
    $response4 = Invoke-WebRequest `
        -Uri 'http://localhost:3000/api/qr/generate' `
        -Method PUT `
        -Body $body4 `
        -ContentType 'application/json' `
        -UseBasicParsing
    
    $result4 = $response4.Content | ConvertFrom-Json
    Write-Host "✓ Status: $($response4.StatusCode)" -ForegroundColor Green
    Write-Host "✓ Success: $($result4.success)" -ForegroundColor Green
    Write-Host "✓ Total: $($result4.data.summary.total)" -ForegroundColor Green
    Write-Host "✓ Successful: $($result4.data.summary.successful)" -ForegroundColor Green
    Write-Host "✓ Failed: $($result4.data.summary.failed)" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

Write-Host "`n=== All tests completed ===" -ForegroundColor Cyan
