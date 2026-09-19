$ErrorActionPreference = 'Stop'

$resourceGroup = 'sayso-rg'
$location = 'koreacentral'
$staticAppName = 'sayso-static-web'
$functionAppName = 'sayso-api-fn-06876'
$storageName = 'saysostorage06876'
$envPath = Join-Path $PSScriptRoot 'server\.env'
$apiPath = Join-Path $PSScriptRoot 'api'
$zipPath = Join-Path $env:TEMP 'sayso-api.zip'

if (-not (Get-Command az -ErrorAction SilentlyContinue)) { throw 'Azure CLI (az) is not installed.' }
if (-not (Test-Path -LiteralPath $envPath -PathType Leaf)) { throw 'server/.env not found.' }

$settings = @{}
foreach ($line in Get-Content -LiteralPath $envPath) {
  if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$') {
    $settings[$Matches[1]] = $Matches[2].Trim().Trim('"').Trim("'")
  }
}
foreach ($name in @('AZURE_OPENAI_API_KEY', 'AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_DEPLOYMENT', 'AZURE_OPENAI_API_VERSION')) {
  if (-not $settings[$name]) { throw "$name is missing in server/.env" }
}

az group create --name $resourceGroup --location $location --only-show-errors | Out-Null

$storageExists = az storage account list --resource-group $resourceGroup --query "[?name=='$storageName'].name | [0]" -o tsv --only-show-errors
if (-not $storageExists) {
  az storage account create --name $storageName --resource-group $resourceGroup --location $location --sku Standard_LRS --kind StorageV2 --min-tls-version TLS1_2 --allow-blob-public-access false --only-show-errors | Out-Null
}

$functionExists = az functionapp list --resource-group $resourceGroup --query "[?name=='$functionAppName'].name | [0]" -o tsv --only-show-errors
if (-not $functionExists) {
  az functionapp create `
    --name $functionAppName `
    --resource-group $resourceGroup `
    --storage-account $storageName `
    --consumption-plan-location $location `
    --runtime node `
    --runtime-version 22 `
    --functions-version 4 `
    --os-type Linux `
    --only-show-errors | Out-Null
}

az functionapp config appsettings set `
  --name $functionAppName `
  --resource-group $resourceGroup `
  --settings `
    AZURE_OPENAI_API_KEY=$($settings['AZURE_OPENAI_API_KEY']) `
    AZURE_OPENAI_ENDPOINT=$($settings['AZURE_OPENAI_ENDPOINT']) `
    AZURE_OPENAI_DEPLOYMENT=$($settings['AZURE_OPENAI_DEPLOYMENT']) `
    AZURE_OPENAI_API_VERSION=$($settings['AZURE_OPENAI_API_VERSION']) `
    FUNCTIONS_WORKER_RUNTIME=node `
  --only-show-errors | Out-Null

$staticHostname = az staticwebapp show --name $staticAppName --resource-group $resourceGroup --query defaultHostname -o tsv
if (-not $staticHostname) { throw 'Static Web App was not found.' }
az functionapp cors add --name $functionAppName --resource-group $resourceGroup --allowed-origins "https://$staticHostname" --only-show-errors | Out-Null

if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
Compress-Archive -Path (Join-Path $apiPath '*') -DestinationPath $zipPath -Force
az functionapp deployment source config-zip --name $functionAppName --resource-group $resourceGroup --src $zipPath --only-show-errors | Out-Null

$functionUrl = "https://$functionAppName.azurewebsites.net"
Set-Content -LiteralPath (Join-Path $PSScriptRoot 'public\js\api-config.js') -Value "window.SAYSO_API_BASE = '$functionUrl';`n" -Encoding utf8

$token = az staticwebapp secrets list --name $staticAppName --resource-group $resourceGroup --query properties.apiKey -o tsv
if (-not $token) { throw 'Could not retrieve Static Web Apps deployment token.' }
npx --yes @azure/static-web-apps-cli deploy (Join-Path $PSScriptRoot 'public') --deployment-token $token --env production

Remove-Item -LiteralPath $zipPath -Force -ErrorAction SilentlyContinue
Write-Host "SAYSO Static Web App: https://$staticHostname"
Write-Host "SAYSO Azure Function API: $functionUrl"


