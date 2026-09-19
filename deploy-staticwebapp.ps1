$ErrorActionPreference = 'Stop'

$resourceGroup = 'sayso-rg'
$location = 'eastasia'
$appName = 'sayso-static-web'
$envPath = Join-Path $PSScriptRoot 'server\.env'

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
  throw 'Azure CLI (az) is not installed.'
}
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
  if (-not $settings[$name]) { throw "$name is missing in server/.env" }
}

Write-Host 'Creating or reusing the Azure Static Web Apps Free resource...'
az group create --name $resourceGroup --location $location --only-show-errors | Out-Null
az staticwebapp create --name $appName --resource-group $resourceGroup --location $location --sku Free --only-show-errors | Out-Null

Write-Host 'Applying server-side Azure OpenAI settings...'
az staticwebapp appsettings set `
  --name $appName `
  --resource-group $resourceGroup `
  --setting-names `
    AZURE_OPENAI_API_KEY=$($settings['AZURE_OPENAI_API_KEY']) `
    AZURE_OPENAI_ENDPOINT=$($settings['AZURE_OPENAI_ENDPOINT']) `
    AZURE_OPENAI_DEPLOYMENT=$($settings['AZURE_OPENAI_DEPLOYMENT']) `
    AZURE_OPENAI_API_VERSION=$($settings['AZURE_OPENAI_API_VERSION']) `
  --only-show-errors | Out-Null

$token = az staticwebapp secrets list --name $appName --resource-group $resourceGroup --query properties.apiKey -o tsv
if (-not $token) { throw 'Could not retrieve the Static Web Apps deployment token.' }

Write-Host 'Deploying public/ and api/ with the Static Web Apps CLI...'
npx --yes @azure/static-web-apps-cli deploy $PSScriptRoot\public `
  --api-location $PSScriptRoot\api `
  --api-language node `
  --api-version 22 `
  --deployment-token $token `
  --env production

$fqdn = az staticwebapp show --name $appName --resource-group $resourceGroup --query defaultHostname -o tsv
Write-Host "SAYSO deployed: https://$fqdn"
