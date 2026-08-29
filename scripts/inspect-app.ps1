$text = Get-Content App.js -Raw
$patterns = @('business_promotions','businesses','promotion','owner','partner','Discover')

foreach ($pattern in $patterns) {
  $match = [regex]::Match($text, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
  Write-Output ""
  Write-Output "PATTERN: $pattern"
  if ($match.Success) {
    $start = [Math]::Max(0, $match.Index - 500)
    $length = [Math]::Min(1800, $text.Length - $start)
    Write-Output $text.Substring($start, $length)
  } else {
    Write-Output 'NOT FOUND'
  }
}
