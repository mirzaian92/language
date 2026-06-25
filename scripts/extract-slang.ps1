param(
  [string]$SourcePath,
  [string]$OutputPath
)

if (-not $SourcePath) {
  $SourcePath = Join-Path $PSScriptRoot '..\1930s slang.docx'
}

if (-not $OutputPath) {
  $OutputPath = Join-Path $PSScriptRoot '..\language-data\raw-categories.json'
}

$SourcePath = [System.IO.Path]::GetFullPath($SourcePath)
$OutputPath = [System.IO.Path]::GetFullPath($OutputPath)

Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::OpenRead($SourcePath)

try {
  $entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }

  if (-not $entry) {
    throw "The Word document did not contain word/document.xml."
  }

  $reader = New-Object System.IO.StreamReader($entry.Open())
  $xmlText = $reader.ReadToEnd()
  $reader.Dispose()

  [xml]$xml = $xmlText
  $ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
  $ns.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')

  $paragraphs = $xml.SelectNodes('//w:body/w:p', $ns)
  $categories = @()
  $current = $null

  foreach ($paragraph in $paragraphs) {
    $styleNode = $paragraph.SelectSingleNode('./w:pPr/w:pStyle/@w:val', $ns)
    $style = if ($styleNode) { $styleNode.Value } else { 'Normal' }
    $textNodes = $paragraph.SelectNodes('.//w:t', $ns) | ForEach-Object { $_.'#text' }
    $text = ($textNodes -join '').Trim()

    if ([string]::IsNullOrWhiteSpace($text)) {
      continue
    }

    if ($style -eq 'Heading1') {
      if ($current) {
        $categories += $current
      }

      $current = [ordered]@{
        title = $text
        lines = @()
      }

      continue
    }

    if ($current) {
      $current.lines += $text
    }
  }

  if ($current) {
    $categories += $current
  }

  $json = $categories | ConvertTo-Json -Depth 5
  [System.IO.File]::WriteAllText($OutputPath, $json, (New-Object System.Text.UTF8Encoding($false)))
}
finally {
  $zip.Dispose()
}