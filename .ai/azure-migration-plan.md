# Azure Migration Plan for PetFoodVerifAI

## 📋 Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Azure Services Architecture](#azure-services-architecture)
4. [Step-by-Step Migration Guide](#step-by-step-migration-guide)
5. [GitHub Actions Integration](#github-actions-integration)
6. [Environment Variables & Secrets](#environment-variables--secrets)
7. [Cost Estimation](#cost-estimation)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This plan guides you through migrating your PetFoodVerifAI application from local development to Microsoft Azure cloud platform. Your application consists of:

- **Backend**: ASP.NET Core 8.0 API
- **Frontend**: React application built with Vite
- **Database**: PostgreSQL (already deployed in Azure ✓)
- **External Services**: Resend (email), Anthropic Claude (LLM), Google OAuth

---

## Prerequisites

### Required Accounts & Tools
1. **Azure Account**: [Create free account](https://azure.microsoft.com/free/) (includes $200 credit for 30 days)
2. **Azure CLI**: [Install Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
3. **GitHub Account**: You already have this with your CI/CD setup
4. **Text Editor**: For updating configuration files

### Required Information (Gather Before Starting)
- Your existing Azure PostgreSQL connection string
- Your domain name (if you have one, optional for now)
- API keys for external services:
  - Resend API Key
  - Anthropic API Key
  - Google OAuth Client ID & Secret

---

## Azure Services Architecture

### Services You'll Create

```
┌─────────────────────────────────────────────────────────────┐
│                         AZURE CLOUD                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────┐      ┌────────────────────────┐ │
│  │  Static Web App      │      │   App Service          │ │
│  │  (Frontend)          │◄────►│   (Backend API)        │ │
│  │  - React/Vite        │      │   - .NET 8.0           │ │
│  │  - CDN enabled       │      │   - Auto-scaling       │ │
│  └──────────────────────┘      └────────┬───────────────┘ │
│                                          │                  │
│                                          ▼                  │
│  ┌──────────────────────┐      ┌────────────────────────┐ │
│  │  Key Vault           │      │   PostgreSQL           │ │
│  │  (Secrets)           │      │   (Already exists ✓)   │ │
│  │  - JWT Key           │      │   - Managed service    │ │
│  │  - API Keys          │      └────────────────────────┘ │
│  └──────────────────────┘                                  │
│                                                             │
│  ┌──────────────────────┐      ┌────────────────────────┐ │
│  │  Application         │      │   Log Analytics        │ │
│  │  Insights            │      │   Workspace            │ │
│  │  (Monitoring)        │      │   (Logs)               │ │
│  └──────────────────────┘      └────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
               GitHub Actions (CI/CD)
```

### Service Breakdown

| Service | Purpose | Why We Need It |
|---------|---------|----------------|
| **Azure App Service** | Host your .NET backend API | Automatically manages servers, scaling, and deployment for web apps |
| **Azure Static Web Apps** | Host your React frontend | Optimized for static sites with global CDN, free SSL, and GitHub integration |
| **Azure Key Vault** | Store secrets securely | Keeps API keys and secrets safe, separate from code |
| **Application Insights** | Monitor app performance | Track errors, performance issues, and usage patterns |
| **Log Analytics Workspace** | Store and query logs | Central location for all application logs |

---

## Step-by-Step Migration Guide

### Phase 1: Initial Azure Setup (15-20 minutes)

#### Step 1.1: Login to Azure

Open your terminal and run:

```bash
# Login to Azure
az login

# Verify your subscription
az account show

# If you have multiple subscriptions, set the one you want to use
az account set --subscription "YOUR_SUBSCRIPTION_NAME"
```

#### Step 1.2: Create Resource Group

A Resource Group is like a folder that holds all related Azure resources together.

```bash
# Replace 'eastus' with your preferred region (e.g., westeurope, canadacentral)
az group create \
  --name petfoodverifai-rg \
  --location eastus \
  --tags Environment=Production Application=PetFoodVerifAI
```

**What this does**: Creates a container for all your Azure resources in the East US datacenter.

---

### Phase 2: Backend Setup (30-40 minutes)

#### Step 2.1: Create App Service Plan

An App Service Plan is like a hosting plan that defines the computing resources for your backend.

```bash
# Create a production-ready plan (you can start with a smaller tier and scale up)
az appservice plan create \
  --name petfoodverifai-backend-plan \
  --resource-group petfoodverifai-rg \
  --location eastus \
  --sku B1 \
  --is-linux
```

**Pricing tiers explained**:
- **B1 (Basic)**: ~$13/month - Good for testing and small production workloads
- **S1 (Standard)**: ~$69/month - Better for production with custom domains and SSL
- **P1V2 (Premium)**: ~$73/month - High performance with auto-scaling

**Recommendation**: Start with B1, upgrade to S1 when ready for production.

#### Step 2.2: Create Backend App Service

```bash
# Create the web app for your backend
az webapp create \
  --name petfoodverifai-backend \
  --resource-group petfoodverifai-rg \
  --plan petfoodverifai-backend-plan \
  --runtime "DOTNET|8.0"
```

**Important**: The name `petfoodverifai-backend` must be globally unique across all of Azure. If taken, try adding your company name or random numbers.

#### Step 2.3: Configure Backend Settings

```bash
# Enable HTTPS only
az webapp update \
  --name petfoodverifai-backend \
  --resource-group petfoodverifai-rg \
  --https-only true

# Enable detailed logging
az webapp log config \
  --name petfoodverifai-backend \
  --resource-group petfoodverifai-rg \
  --application-logging filesystem \
  --detailed-error-messages true \
  --failed-request-tracing true \
  --web-server-logging filesystem

# Configure health check (uses your existing /api/health/database endpoint)
az webapp config set \
  --name petfoodverifai-backend \
  --resource-group petfoodverifai-rg \
  --health-check-path "/api/health/database"
```

**What this does**: 
- Forces all traffic to use HTTPS for security
- Enables detailed logs to help with troubleshooting
- Sets up automatic health monitoring

---

### Phase 3: Frontend Setup (20-30 minutes)

#### Step 3.1: Create Static Web App

Azure Static Web Apps is perfect for React applications. It includes:
- Global CDN (fast worldwide)
- Free SSL certificate
- GitHub Actions integration
- Custom domains

```bash
az staticwebapp create \
  --name petfoodverifai-frontend \
  --resource-group petfoodverifai-rg \
  --location eastus2 \
  --source https://github.com/YOUR_USERNAME/PetFoodVerifAI \
  --branch main \
  --app-location "/frontend" \
  --output-location "dist" \
  --login-with-github
```

**Replace**:
- `YOUR_USERNAME` with your GitHub username/organization
- `main` with your default branch name if different

**What happens**: 
- Azure will open a browser to authenticate with GitHub
- It will create a GitHub Actions workflow automatically
- Your frontend will be deployed on the first push

#### Step 3.2: Get Frontend URL

```bash
# Get the URL of your deployed frontend
az staticwebapp show \
  --name petfoodverifai-frontend \
  --resource-group petfoodverifai-rg \
  --query "defaultHostname" \
  --output tsv
```

**Save this URL** - you'll need it for configuring your backend CORS policy.

---

### Phase 4: Database Configuration (10-15 minutes)

Since your database is already deployed in Azure, you just need to configure access.

#### Step 4.1: Get Database Connection String

```bash
# If you have the database details, construct your connection string:
# Format: Host=YOUR_SERVER.postgres.database.azure.com;Database=petfoodverifai;Username=YOUR_USERNAME;Password=YOUR_PASSWORD;SSL Mode=Require;Trust Server Certificate=true;
```

#### Step 4.2: Configure Database Firewall

Allow your App Service to access the database:

```bash
# Get the outbound IP addresses of your App Service
az webapp show \
  --name petfoodverifai-backend \
  --resource-group petfoodverifai-rg \
  --query "possibleOutboundIpAddresses" \
  --output tsv
```

Then, add firewall rules for each IP:

```bash
# Add firewall rule (repeat for each IP from above)
az postgres flexible-server firewall-rule create \
  --resource-group YOUR_DB_RESOURCE_GROUP \
  --name YOUR_DB_SERVER_NAME \
  --rule-name "AppService-Access-1" \
  --start-ip-address "XX.XX.XX.XX" \
  --end-ip-address "XX.XX.XX.XX"
```

**Replace**:
- `YOUR_DB_RESOURCE_GROUP` with your database's resource group
- `YOUR_DB_SERVER_NAME` with your database server name
- `XX.XX.XX.XX` with each IP address

---

### Phase 5: Secrets Management (25-30 minutes)

#### Step 5.1: Create Key Vault

Azure Key Vault is a secure place to store secrets (API keys, passwords, etc.)

```bash
# Create Key Vault
az keyvault create \
  --name petfoodverifai-kv \
  --resource-group petfoodverifai-rg \
  --location eastus \
  --enable-rbac-authorization false
```

**Note**: Key Vault names must also be globally unique. Add random numbers if needed.

#### Step 5.2: Enable App Service to Access Key Vault

```bash
# Enable managed identity for App Service
az webapp identity assign \
  --name petfoodverifai-backend \
  --resource-group petfoodverifai-rg

# Get the principal ID (this identifies your app)
PRINCIPAL_ID=$(az webapp identity show \
  --name petfoodverifai-backend \
  --resource-group petfoodverifai-rg \
  --query principalId \
  --output tsv)

# Grant the app access to read secrets
az keyvault set-policy \
  --name petfoodverifai-kv \
  --object-id $PRINCIPAL_ID \
  --secret-permissions get list
```

**What this does**: Allows your backend app to read secrets from Key Vault without needing passwords.

#### Step 5.3: Store Secrets in Key Vault

```bash
# Store JWT Key
az keyvault secret set \
  --vault-name petfoodverifai-kv \
  --name "JwtKey" \
  --value "YOUR_SECURE_JWT_KEY_AT_LEAST_32_CHARACTERS"

# Store Resend API Key
az keyvault secret set \
  --vault-name petfoodverifai-kv \
  --name "ResendApiKey" \
  --value "YOUR_RESEND_API_KEY"

# Store Anthropic API Key
az keyvault secret set \
  --vault-name petfoodverifai-kv \
  --name "AnthropicApiKey" \
  --value "YOUR_ANTHROPIC_API_KEY"

# Store Google OAuth Client ID
az keyvault secret set \
  --vault-name petfoodverifai-kv \
  --name "GoogleClientId" \
  --value "YOUR_GOOGLE_CLIENT_ID"

# Store Google OAuth Client Secret
az keyvault secret set \
  --vault-name petfoodverifai-kv \
  --name "GoogleClientSecret" \
  --value "YOUR_GOOGLE_CLIENT_SECRET"

# Store Database Connection String
az keyvault secret set \
  --vault-name petfoodverifai-kv \
  --name "ConnectionStrings--DefaultConnection" \
  --value "YOUR_DATABASE_CONNECTION_STRING"
```

**Replace**: Each `YOUR_*` value with your actual secrets.

**Security Note**: Never commit these values to Git!

---

### Phase 6: Configure Backend Environment (15-20 minutes)

#### Step 6.1: Configure App Settings

Your backend needs to know where to find secrets and how to configure itself.

```bash
# Get Key Vault URI
KEYVAULT_URI=$(az keyvault show \
  --name petfoodverifai-kv \
  --query "properties.vaultUri" \
  --output tsv)

# Get your frontend URL (from Step 3.2)
FRONTEND_URL="https://YOUR_FRONTEND_URL"

# Configure all app settings
az webapp config appsettings set \
  --name petfoodverifai-backend \
  --resource-group petfoodverifai-rg \
  --settings \
    "ASPNETCORE_ENVIRONMENT=Production" \
    "ConnectionStrings__DefaultConnection=@Microsoft.KeyVault(SecretUri=${KEYVAULT_URI}secrets/ConnectionStrings--DefaultConnection/)" \
    "Jwt__Key=@Microsoft.KeyVault(SecretUri=${KEYVAULT_URI}secrets/JwtKey/)" \
    "Jwt__Issuer=https://petfoodverifai-backend.azurewebsites.net" \
    "Jwt__Audience=${FRONTEND_URL}" \
    "Email__Resend__ApiKey=@Microsoft.KeyVault(SecretUri=${KEYVAULT_URI}secrets/ResendApiKey/)" \
    "Email__From=onboarding@petfoodverifai.com" \
    "LLM__Provider=anthropic" \
    "LLM__ApiKey=@Microsoft.KeyVault(SecretUri=${KEYVAULT_URI}secrets/AnthropicApiKey/)" \
    "LLM__Model=claude-3-5-haiku-20241022" \
    "Google__ClientId=@Microsoft.KeyVault(SecretUri=${KEYVAULT_URI}secrets/GoogleClientId/)" \
    "Google__ClientSecret=@Microsoft.KeyVault(SecretUri=${KEYVAULT_URI}secrets/GoogleClientSecret/)" \
    "AppUrl=${FRONTEND_URL}" \
    "UseMockLLM=false"
```

**What this does**: 
- Tells your app to pull secrets from Key Vault (notice the `@Microsoft.KeyVault(...)` syntax)
- Sets production environment
- Configures CORS to allow your frontend

#### Step 6.2: Configure CORS

```bash
# Allow frontend to call backend API
az webapp cors add \
  --name petfoodverifai-backend \
  --resource-group petfoodverifai-rg \
  --allowed-origins "${FRONTEND_URL}"

# Enable credentials (needed for authentication cookies)
az webapp cors enable-credentials \
  --name petfoodverifai-backend \
  --resource-group petfoodverifai-rg
```

---

### Phase 7: Monitoring Setup (10-15 minutes)

#### Step 7.1: Create Application Insights

Application Insights tracks performance, errors, and usage.

```bash
# Create Log Analytics Workspace (required for App Insights)
az monitor log-analytics workspace create \
  --workspace-name petfoodverifai-logs \
  --resource-group petfoodverifai-rg \
  --location eastus

# Get workspace ID
WORKSPACE_ID=$(az monitor log-analytics workspace show \
  --workspace-name petfoodverifai-logs \
  --resource-group petfoodverifai-rg \
  --query id \
  --output tsv)

# Create Application Insights
az monitor app-insights component create \
  --app petfoodverifai-insights \
  --location eastus \
  --resource-group petfoodverifai-rg \
  --workspace $WORKSPACE_ID
```

#### Step 7.2: Connect Backend to Application Insights

```bash
# Get Application Insights connection string
APPINSIGHTS_CONNECTION=$(az monitor app-insights component show \
  --app petfoodverifai-insights \
  --resource-group petfoodverifai-rg \
  --query connectionString \
  --output tsv)

# Add to App Service
az webapp config appsettings set \
  --name petfoodverifai-backend \
  --resource-group petfoodverifai-rg \
  --settings \
    "APPLICATIONINSIGHTS_CONNECTION_STRING=${APPINSIGHTS_CONNECTION}"
```

---

## GitHub Actions Integration

Now we'll modify your existing CI/CD pipeline to deploy to Azure automatically.

### Step 1: Create Azure Service Principal

This gives GitHub permission to deploy to Azure.

```bash
# Get your subscription ID
SUBSCRIPTION_ID=$(az account show --query id --output tsv)

# Create service principal with contributor access
az ad sp create-for-rbac \
  --name "petfoodverifai-github-deployer" \
  --role contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/petfoodverifai-rg \
  --sdk-auth
```

**Important**: This command outputs JSON with credentials. Copy the entire JSON output - you'll need it in the next step.

### Step 2: Add GitHub Secrets

Go to your GitHub repository:
1. Click **Settings** > **Secrets and variables** > **Actions**
2. Click **New repository secret**
3. Add the following secrets:

| Secret Name | Value | Where to Find It |
|-------------|-------|------------------|
| `AZURE_CREDENTIALS` | JSON output from service principal command | From Step 1 above |
| `AZURE_WEBAPP_NAME` | `petfoodverifai-backend` | Your backend app name |
| `AZURE_STATICWEBAPP_NAME` | `petfoodverifai-frontend` | Your frontend app name |
| `AZURE_RESOURCE_GROUP` | `petfoodverifai-rg` | Your resource group name |
| `RESEND_API_KEY` | Your Resend API key | From Resend dashboard |
| `JWT_KEY` | Your JWT key | Generate secure 32+ char string |

### Step 3: Get Static Web App Deployment Token

```bash
# Get deployment token for Static Web App
az staticwebapp secrets list \
  --name petfoodverifai-frontend \
  --resource-group petfoodverifai-rg \
  --query "properties.apiKey" \
  --output tsv
```

Add this as a GitHub secret named `AZURE_STATIC_WEB_APPS_API_TOKEN`.

### Step 4: Update GitHub Actions Workflow

Replace your `.github/workflows/ci-cd.yml` file with the updated version:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

env:
  # Azure settings
  AZURE_WEBAPP_NAME: petfoodverifai-backend
  AZURE_RESOURCE_GROUP: petfoodverifai-rg
  DOTNET_VERSION: '8.0.x'
  NODE_VERSION: '20'

jobs:
  # ============================================
  # EXISTING JOBS: Backend Tests
  # ============================================
  backend-tests:
    name: Backend Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: ${{ env.DOTNET_VERSION }}

      - name: Restore dependencies
        run: dotnet restore
        working-directory: ./PetFoodVerifAI.Tests

      - name: Build
        run: dotnet build --no-restore
        working-directory: ./PetFoodVerifAI.Tests

      - name: Run tests
        run: dotnet test --no-build --verbosity normal --collect:"XPlat Code Coverage"
        working-directory: ./PetFoodVerifAI.Tests

      - name: Upload coverage reports
        if: always()
        uses: codecov/codecov-action@v4
        with:
          files: ./PetFoodVerifAI.Tests/TestResults/*/coverage.cobertura.xml
          flags: backend
          name: backend-coverage

  # ============================================
  # EXISTING JOBS: Frontend Unit Tests
  # ============================================
  frontend-unit-tests:
    name: Frontend Unit Tests
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: './frontend/package-lock.json'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests with coverage
        run: npm run test:coverage

      - name: Upload coverage reports
        if: always()
        uses: codecov/codecov-action@v4
        with:
          files: ./frontend/coverage/lcov.info
          flags: frontend
          name: frontend-coverage

  # ============================================
  # EXISTING JOBS: Frontend E2E Tests
  # ============================================
  frontend-e2e-tests:
    name: Frontend E2E Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: petfoodverifai
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      ASPNETCORE_ENVIRONMENT: Development
      ConnectionStrings__DefaultConnection: Host=127.0.0.1;Port=5432;Database=petfoodverifai;Username=postgres;Password=postgres
      AppUrl: http://127.0.0.1:5173
      UseMockLLM: 'true'
      Email__Resend__ApiKey: ${{ secrets.RESEND_API_KEY || 'test-e2e-key' }}
      Jwt__Key: ${{ secrets.JWT_KEY || 'set-a-secure-jwt-key' }}
      BASE_URL: http://127.0.0.1:5173
      VITE_API_URL: http://127.0.0.1:5135/api
      CI: 'true'
    defaults:
      run:
        working-directory: ./frontend
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: ${{ env.DOTNET_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: './frontend/package-lock.json'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps

      - name: Install dotnet-ef tool
        run: dotnet tool install --global dotnet-ef

      - name: Restore backend dependencies
        run: dotnet restore
        working-directory: ./PetFoodVerifAI

      - name: Apply database migrations
        run: dotnet ef database update
        working-directory: ./PetFoodVerifAI

      - name: Build backend
        run: dotnet build --no-restore
        working-directory: ./PetFoodVerifAI

      - name: Start backend API
        run: |
          dotnet run --no-build --urls http://0.0.0.0:5135 &
          echo "BACKEND_PID=$!" >> $GITHUB_ENV
        working-directory: ./PetFoodVerifAI

      - name: Wait for backend readiness
        run: |
          for i in {1..30}; do
            if curl -sf http://127.0.0.1:5135/api/health/database > /dev/null; then
              echo "Backend is ready"
              exit 0
            fi
            sleep 2
          done
          echo "Backend did not become ready in time" >&2
          exit 1

      - name: Run E2E tests
        run: npm run e2e
        env:
          VITE_API_URL: http://127.0.0.1:5135/api

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-test-results
          path: test-results/
          retention-days: 30

      - name: Stop backend API
        if: always() && env.BACKEND_PID != ''
        run: kill $BACKEND_PID || true

  # ============================================
  # EXISTING JOBS: Lint
  # ============================================
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: './frontend/package-lock.json'

      - name: Install dependencies
        run: npm ci
        working-directory: ./frontend

      - name: Run linter
        run: npm run lint
        working-directory: ./frontend

  # ============================================
  # NEW JOB: Deploy Backend to Azure
  # ============================================
  deploy-backend:
    name: Deploy Backend to Azure
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-unit-tests, frontend-e2e-tests, lint]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    environment:
      name: production
      url: ${{ steps.deploy.outputs.webapp-url }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: ${{ env.DOTNET_VERSION }}

      - name: Restore dependencies
        run: dotnet restore
        working-directory: ./PetFoodVerifAI

      - name: Build
        run: dotnet build --configuration Release --no-restore
        working-directory: ./PetFoodVerifAI

      - name: Publish
        run: dotnet publish --configuration Release --no-build --output ./publish
        working-directory: ./PetFoodVerifAI

      - name: Login to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Deploy to Azure Web App
        id: deploy
        uses: azure/webapps-deploy@v2
        with:
          app-name: ${{ env.AZURE_WEBAPP_NAME }}
          package: ./PetFoodVerifAI/publish

      - name: Check deployment health
        run: |
          sleep 30
          curl -f https://${{ env.AZURE_WEBAPP_NAME }}.azurewebsites.net/api/health/database || exit 1

      - name: Logout from Azure
        if: always()
        run: az logout

  # ============================================
  # NEW JOB: Deploy Frontend to Azure
  # ============================================
  deploy-frontend:
    name: Deploy Frontend to Azure
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-unit-tests, frontend-e2e-tests, lint]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    environment:
      name: production
      url: ${{ steps.deploy.outputs.static-web-app-url }}
    defaults:
      run:
        working-directory: ./frontend
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: './frontend/package-lock.json'

      - name: Install dependencies
        run: npm ci

      - name: Build frontend
        run: npm run build
        env:
          VITE_API_URL: https://${{ env.AZURE_WEBAPP_NAME }}.azurewebsites.net/api

      - name: Deploy to Azure Static Web Apps
        id: deploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: 'upload'
          app_location: '/frontend'
          api_location: ''
          output_location: 'dist'
```

**Key changes**:
- Added two new jobs: `deploy-backend` and `deploy-frontend`
- They only run on pushes to `main` branch
- They depend on all tests passing
- Added health check after backend deployment

---

## Environment Variables & Secrets

### Backend (App Service)

All configured via Azure CLI in Phase 6. Here's a quick reference:

| Variable | Purpose | Stored In |
|----------|---------|-----------|
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection | Key Vault |
| `Jwt__Key` | JWT token signing | Key Vault |
| `Jwt__Issuer` | JWT issuer URL | App Settings |
| `Jwt__Audience` | Frontend URL | App Settings |
| `Email__Resend__ApiKey` | Email service | Key Vault |
| `LLM__ApiKey` | Anthropic API | Key Vault |
| `Google__ClientId` | OAuth login | Key Vault |
| `Google__ClientSecret` | OAuth login | Key Vault |
| `AppUrl` | Frontend URL | App Settings |
| `UseMockLLM` | Use mock/real LLM | App Settings |

### Frontend (Static Web App)

The frontend only needs one environment variable at build time:

| Variable | Purpose | Set During |
|----------|---------|------------|
| `VITE_API_URL` | Backend API URL | Build step in GitHub Actions |

This is set in the workflow file:
```yaml
VITE_API_URL: https://petfoodverifai-backend.azurewebsites.net/api
```

### GitHub Secrets Reference

| Secret | Purpose |
|--------|---------|
| `AZURE_CREDENTIALS` | Allows GitHub to deploy to Azure |
| `AZURE_WEBAPP_NAME` | Backend app service name |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Frontend deployment token |
| `AZURE_RESOURCE_GROUP` | Resource group name |
| `RESEND_API_KEY` | For E2E tests |
| `JWT_KEY` | For E2E tests |

---

## Cost Estimation

### Monthly Cost Breakdown (USD)

| Service | Tier | Estimated Cost | Notes |
|---------|------|----------------|-------|
| **App Service Plan** | B1 (Basic) | $13.14 | Can scale up as needed |
| **Static Web Apps** | Standard | $9.00 | Free tier available (limited features) |
| **PostgreSQL Flexible Server** | Burstable B1ms | $12.41 | You already have this |
| **Key Vault** | Standard | $0.15 | $0.03 per 10k operations |
| **Application Insights** | Basic | $2.88+ | First 5GB free, then $2.88/GB |
| **Log Analytics** | Pay-as-you-go | $2.76+ | First 5GB free |
| **Bandwidth** | Outbound | $0-8.00 | First 100GB free |
| **Total (without DB)** | | **~$27-35/month** | Database adds ~$12/month |
| **Total (with DB)** | | **~$39-47/month** | |

### Cost Optimization Tips

1. **Start Small**: Use B1 tier for App Service, can upgrade later
2. **Use Free Tiers**: Static Web Apps has a free tier (limited features)
3. **Monitor Usage**: Set up Azure Cost Alerts in the portal
4. **Development Environment**: Use cheaper tiers for dev/test
5. **Reserved Instances**: Save 30-50% with 1-year commitments (only after stable)

### Setting Up Cost Alerts

```bash
# Create a budget alert at $50/month
az consumption budget create \
  --resource-group petfoodverifai-rg \
  --budget-name monthly-budget \
  --amount 50 \
  --time-grain Monthly \
  --start-date $(date +%Y-%m-01) \
  --end-date $(date -d "+1 year" +%Y-%m-01)
```

---

## Monitoring & Maintenance

### Accessing Application Insights

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Resource Groups** > **petfoodverifai-rg**
3. Click on **petfoodverifai-insights**

### Key Metrics to Monitor

#### Performance
- **Response Time**: Should be < 500ms for most requests
- **Server Response Time**: Should be < 200ms
- **Failed Requests**: Should be < 1%

#### Availability
- **Uptime**: Target 99.9% (Azure SLA)
- **Health Check Status**: Monitor `/api/health/database`

#### Resource Usage
- **CPU Usage**: Keep below 70% average
- **Memory Usage**: Keep below 80%
- **Database Connections**: Monitor for connection pool exhaustion

### Setting Up Alerts

```bash
# Create alert for high response time
az monitor metrics alert create \
  --name "High-Response-Time" \
  --resource-group petfoodverifai-rg \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/petfoodverifai-rg/providers/Microsoft.Web/sites/petfoodverifai-backend \
  --condition "avg responseTime > 1000" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --description "Alert when response time exceeds 1 second"

# Create alert for high error rate
az monitor metrics alert create \
  --name "High-Error-Rate" \
  --resource-group petfoodverifai-rg \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/petfoodverifai-rg/providers/Microsoft.Web/sites/petfoodverifai-backend \
  --condition "sum http5xx > 10" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --description "Alert when more than 10 server errors occur in 5 minutes"
```

### Viewing Logs

#### Real-time Logs (Live Tail)
```bash
# Stream backend logs in real-time
az webapp log tail \
  --name petfoodverifai-backend \
  --resource-group petfoodverifai-rg
```

#### Download Logs
```bash
# Download log files
az webapp log download \
  --name petfoodverifai-backend \
  --resource-group petfoodverifai-rg \
  --log-file backend-logs.zip
```

#### Query Logs with Kusto
In Application Insights, use Kusto Query Language (KQL):

```kusto
// Find all errors in the last 24 hours
traces
| where timestamp > ago(24h)
| where severityLevel >= 3
| project timestamp, message, severityLevel
| order by timestamp desc

// Find slow requests (> 1 second)
requests
| where timestamp > ago(24h)
| where duration > 1000
| project timestamp, name, duration, resultCode
| order by duration desc

// Count requests by endpoint
requests
| where timestamp > ago(24h)
| summarize count() by name
| order by count_ desc
```

### Backup Strategy

#### Database Backups
Azure PostgreSQL automatically backs up your database:
- **Automated backups**: Every day
- **Retention**: 7 days (configurable up to 35 days)
- **Point-in-time restore**: Can restore to any point within retention period

To increase backup retention:
```bash
az postgres flexible-server parameter set \
  --resource-group YOUR_DB_RESOURCE_GROUP \
  --server-name YOUR_DB_SERVER_NAME \
  --name backup_retention_days \
  --value 14
```

#### Application Code
- Your code is in GitHub (already backed up)
- GitHub Actions handles deployment

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Backend Deployment Fails

**Symptoms**: GitHub Actions deploy job fails with authentication error

**Solution**:
```bash
# Regenerate service principal
az ad sp create-for-rbac \
  --name "petfoodverifai-github-deployer" \
  --role contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/petfoodverifai-rg \
  --sdk-auth

# Update AZURE_CREDENTIALS secret in GitHub
```

#### Issue 2: Backend Can't Connect to Database

**Symptoms**: Health check fails with connection timeout

**Solution**:
```bash
# Check firewall rules
az postgres flexible-server firewall-rule list \
  --resource-group YOUR_DB_RESOURCE_GROUP \
  --name YOUR_DB_SERVER_NAME

# Verify App Service IPs are allowed
az webapp show \
  --name petfoodverifai-backend \
  --resource-group petfoodverifai-rg \
  --query "possibleOutboundIpAddresses"

# Add missing IPs to firewall
```

#### Issue 3: CORS Errors in Frontend

**Symptoms**: Browser console shows "CORS policy" errors

**Solution**:
```bash
# Verify CORS settings
az webapp cors show \
  --name petfoodverifai-backend \
  --resource-group petfoodverifai-rg

# Update CORS to include frontend URL
az webapp cors add \
  --name petfoodverifai-backend \
  --resource-group petfoodverifai-rg \
  --allowed-origins "https://YOUR_FRONTEND_URL"
```

#### Issue 4: Key Vault Secrets Not Accessible

**Symptoms**: App logs show "Secret not found" or "Access denied"

**Solution**:
```bash
# Verify managed identity is enabled
az webapp identity show \
  --name petfoodverifai-backend \
  --resource-group petfoodverifai-rg

# Re-grant access to Key Vault
PRINCIPAL_ID=$(az webapp identity show \
  --name petfoodverifai-backend \
  --resource-group petfoodverifai-rg \
  --query principalId \
  --output tsv)

az keyvault set-policy \
  --name petfoodverifai-kv \
  --object-id $PRINCIPAL_ID \
  --secret-permissions get list
```

#### Issue 5: Frontend Shows "API Not Found"

**Symptoms**: Frontend loads but API calls fail with 404

**Solution**:
1. Check `VITE_API_URL` in GitHub Actions workflow
2. Verify backend is running:
   ```bash
   curl https://petfoodverifai-backend.azurewebsites.net/api/health/database
   ```
3. Check browser network tab for actual URL being called

#### Issue 6: Application is Slow

**Symptoms**: High response times, timeouts

**Solutions**:
1. **Scale Up**: Upgrade App Service Plan
   ```bash
   az appservice plan update \
     --name petfoodverifai-backend-plan \
     --resource-group petfoodverifai-rg \
     --sku S1
   ```

2. **Scale Out**: Add more instances
   ```bash
   az appservice plan update \
     --name petfoodverifai-backend-plan \
     --resource-group petfoodverifai-rg \
     --number-of-workers 2
   ```

3. **Check Database**: Upgrade PostgreSQL tier if needed

4. **Enable Caching**: Add Redis cache for frequently accessed data

#### Issue 7: High Costs

**Symptoms**: Azure bill is higher than expected

**Solutions**:
1. **Check Cost Analysis**: Portal > Cost Management
2. **Review logs**: Ensure you're not generating excessive logs
3. **Downgrade unused resources**: Dev environments can use cheaper tiers
4. **Set up autoscaling**: Scale down during off-hours

### Getting Help

#### Azure Support
- **Documentation**: https://docs.microsoft.com/azure
- **Community Forums**: https://docs.microsoft.com/answers
- **Stack Overflow**: Tag your questions with `azure`, `azure-web-app-service`

#### Viewing Deployment Logs
```bash
# Get recent deployment information
az webapp deployment list \
  --name petfoodverifai-backend \
  --resource-group petfoodverifai-rg

# View specific deployment log
az webapp deployment show \
  --name petfoodverifai-backend \
  --resource-group petfoodverifai-rg \
  --deployment-id <deployment-id>
```

---

## Next Steps After Migration

### 1. Custom Domain (Optional)

Once your app is running, add a custom domain:

```bash
# Map custom domain to backend
az webapp config hostname add \
  --webapp-name petfoodverifai-backend \
  --resource-group petfoodverifai-rg \
  --hostname api.yourdomain.com

# Map custom domain to frontend
az staticwebapp hostname set \
  --name petfoodverifai-frontend \
  --resource-group petfoodverifai-rg \
  --hostname www.yourdomain.com
```

### 2. Enable Auto-Scaling

For production traffic:

```bash
# Enable autoscaling based on CPU
az monitor autoscale create \
  --resource-group petfoodverifai-rg \
  --resource petfoodverifai-backend-plan \
  --resource-type Microsoft.Web/serverfarms \
  --name autoscale-cpu \
  --min-count 1 \
  --max-count 3 \
  --count 1

az monitor autoscale rule create \
  --resource-group petfoodverifai-rg \
  --autoscale-name autoscale-cpu \
  --condition "Percentage CPU > 70 avg 5m" \
  --scale out 1

az monitor autoscale rule create \
  --resource-group petfoodverifai-rg \
  --autoscale-name autoscale-cpu \
  --condition "Percentage CPU < 30 avg 5m" \
  --scale in 1
```

### 3. Set Up Staging Environment

Create a staging slot for testing before production:

```bash
# Create staging slot
az webapp deployment slot create \
  --name petfoodverifai-backend \
  --resource-group petfoodverifai-rg \
  --slot staging

# Deploy to staging first, then swap to production
az webapp deployment slot swap \
  --name petfoodverifai-backend \
  --resource-group petfoodverifai-rg \
  --slot staging \
  --target-slot production
```

### 4. Database Migrations in Production

Update your Program.cs or create a startup task to run migrations:

```csharp
// In Program.cs, before app.Run()
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    if (app.Environment.IsProduction())
    {
        // In production, apply migrations automatically
        db.Database.Migrate();
    }
}
```

Or run migrations manually after deployment:

```bash
# Connect to App Service via SSH and run
dotnet ef database update
```

### 5. Performance Optimization

#### Enable Application Insights Profiler
```bash
az webapp config appsettings set \
  --name petfoodverifai-backend \
  --resource-group petfoodverifai-rg \
  --settings "APPINSIGHTS_PROFILERFEATURE_VERSION=1.0.0"
```

#### Enable Response Compression
Add to Program.cs:
```csharp
builder.Services.AddResponseCompression();
app.UseResponseCompression();
```

### 6. Security Hardening

#### Enable Advanced Threat Protection
```bash
az security atp storage update \
  --resource-group petfoodverifai-rg \
  --storage-account YOUR_STORAGE_ACCOUNT \
  --is-enabled true
```

#### Regular Security Scans
- Use Azure Security Center recommendations
- Regularly update NuGet packages and npm dependencies
- Monitor for security alerts in Application Insights

---

## Summary Checklist

Before going live, verify:

- [ ] Backend deployed and accessible at `https://petfoodverifai-backend.azurewebsites.net`
- [ ] Frontend deployed and accessible at your Static Web App URL
- [ ] Database connection working (health check returns 200)
- [ ] All secrets stored in Key Vault
- [ ] CORS configured correctly (no console errors)
- [ ] Application Insights receiving data
- [ ] GitHub Actions successfully deploying on push to main
- [ ] Email service working (test registration email)
- [ ] Google OAuth working (if implemented)
- [ ] LLM service responding (test analysis endpoint)
- [ ] Cost alerts configured
- [ ] Backups enabled and tested
- [ ] Monitoring alerts configured
- [ ] Documentation updated with production URLs

---

## Appendix: Quick Reference Commands

### Get URLs
```bash
# Backend URL
echo "https://petfoodverifai-backend.azurewebsites.net"

# Frontend URL
az staticwebapp show \
  --name petfoodverifai-frontend \
  --resource-group petfoodverifai-rg \
  --query "defaultHostname" \
  --output tsv
```

### Restart Services
```bash
# Restart backend
az webapp restart \
  --name petfoodverifai-backend \
  --resource-group petfoodverifai-rg

# Frontend doesn't need restart (it's static files)
```

### Update App Settings
```bash
# Update a single setting
az webapp config appsettings set \
  --name petfoodverifai-backend \
  --resource-group petfoodverifai-rg \
  --settings "SettingName=SettingValue"
```

### Check Status
```bash
# Backend status
az webapp show \
  --name petfoodverifai-backend \
  --resource-group petfoodverifai-rg \
  --query "state" \
  --output tsv

# Check if backend is responding
curl https://petfoodverifai-backend.azurewebsites.net/api/health/database
```

---

## Support

If you run into issues during migration:

1. **Check the Troubleshooting section** above
2. **Review Azure logs**: Use `az webapp log tail` for real-time logs
3. **Check Application Insights**: Look for errors in the Azure Portal
4. **GitHub Actions logs**: Check the Actions tab in your repository
5. **Azure documentation**: https://docs.microsoft.com/azure

---

**Migration Plan Version**: 1.0  
**Last Updated**: November 3, 2025  
**Maintained By**: PetFoodVerifAI Team

