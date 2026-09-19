$ErrorActionPreference = 'Stop'

$resourceGroup = 'sayso-rg'
$location = 'koreacentral'
$appName = 'sayso-app'
$envPath = Join-Path $PSScriptRoot 'server\.env'

if (-not (Test-Path -LiteralPath $envPath -PathType Leaf)) {
  throw 'server/.env not found. Add Azure OpenAI settings before deploying.'
}

$settings = @{}
foreach ($line in Get-Content -LiteralPath $envPath) {
  if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$') {
    $settings[$Matches[1]] = $Matches[2].Trim().Trim('"').Trim("'")
  }
}

$required = @('AZURE_OPENAI_API_KEY', 'AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_DEPLOYMENT', 'AZURE_OPENAI_API_VERSION')
foreach ($name in $required) {
  if (-not $settings[$name]) {
    throw "$name is missing in server/.env"
  }
}

az group create --name $resourceGroup --location $location --only-show-errors | Out-Null
az webapp up `
  --name $appName `
  --resource-group $resourceGroup `
  --location $location `
  --runtime 'NODE:24LTS' `
  --sku F1 `
  --os-type Windows `
  --only-show-errors | Out-Null

az webapp config appsettings set `
  --name $appName `
  --resource-group $resourceGroup `
  --settings `
    AZURE_OPENAI_API_KEY=$($settings['AZURE_OPENAI_API_KEY']) `
    AZURE_OPENAI_ENDPOINT=$($settings['AZURE_OPENAI_ENDPOINT']) `
    AZURE_OPENAI_DEPLOYMENT=$($settings['AZURE_OPENAI_DEPLOYMENT']) `
    AZURE_OPENAI_API_VERSION=$($settings['AZURE_OPENAI_API_VERSION']) `
    NODE_ENV=production `
    WEBSITE_NODE_DEFAULT_VERSION=24LTS `
    SCM_DO_BUILD_DURING_DEPLOYMENT=true `
    ENABLE_ORYX_BUILD=true `
  --only-show-errors | Out-Null

$fqdn = az webapp show --name $appName --resource-group $resourceGroup --query defaultHostName -o tsv
Write-Output "SAYSO deployed: https://$fqdn"
