$ErrorActionPreference = 'Stop'

$resourceGroup = 'sayso-rg'
$location = 'koreacentral'
$environment = 'sayso-env'
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

az extension add --name containerapp --upgrade --only-show-errors
az provider register --namespace Microsoft.App --only-show-errors | Out-Null
az group create --name $resourceGroup --location $location --only-show-errors | Out-Null
az containerapp env create --name $environment --resource-group $resourceGroup --location $location --only-show-errors | Out-Null

az containerapp up `
  --name $appName `
  --resource-group $resourceGroup `
  --environment $environment `
  --source $PSScriptRoot `
  --ingress external `
  --target-port 3000 `
  --min-replicas 0 `
  --max-replicas 1 `
  --cpu 0.5 `
  --memory 1.0Gi `
  --only-show-errors

az containerapp secret set `
  --name $appName `
  --resource-group $resourceGroup `
  --secrets azure-openai-key=$($settings['AZURE_OPENAI_API_KEY']) `
  --only-show-errors | Out-Null

az containerapp update `
  --name $appName `
  --resource-group $resourceGroup `
  --set-env-vars `
    AZURE_OPENAI_API_KEY=secretref:azure-openai-key `
    AZURE_OPENAI_ENDPOINT=$($settings['AZURE_OPENAI_ENDPOINT']) `
    AZURE_OPENAI_DEPLOYMENT=$($settings['AZURE_OPENAI_DEPLOYMENT']) `
    AZURE_OPENAI_API_VERSION=$($settings['AZURE_OPENAI_API_VERSION']) `
    NODE_ENV=production `
  --only-show-errors

$fqdn = az containerapp show --name $appName --resource-group $resourceGroup --query properties.configuration.ingress.fqdn -o tsv
Write-Output "SAYSO deployed: https://$fqdn"
