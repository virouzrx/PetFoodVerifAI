# Deployment Plan: PetFoodVerifAI to Azure with GitHub Actions CI/CD

This document outlines the steps to deploy the PetFoodVerifAI application to Microsoft Azure and set up a Continuous Integration/Continuous Deployment (CI/CD) pipeline using GitHub Actions.

## Phases

The deployment is broken down into five main phases:

1.  **Phase 1: CI/CD Setup with GitHub Actions**
2.  **Phase 2: Azure Infrastructure Setup**
3.  **Phase 3: Connect GitHub and Azure for Backend Deployment**
4.  **Phase 4: Frontend Deployment Setup**
5.  **Phase 5: Post-Deployment Configuration**

---

## Detailed Task List

### Phase 1: CI/CD Setup with GitHub Actions

This phase focuses on creating a continuous integration pipeline that automatically builds and tests the application on every push.

-   [x] **Create GitHub Actions workflow file:**
    -   Define a new workflow file (e.g., `.github/workflows/ci-cd.yml`).
-   [x] **Configure backend build and test job:**
    -   Set up a job to build the .NET backend.
    -   Add a step to run the backend unit tests.
-   [x] **Configure frontend build and test job:**
    -   Set up a job to build the React frontend.
    -   Add a step to run the frontend unit tests.

### Phase 2: Azure Infrastructure Setup

This phase involves creating and configuring all the necessary Azure resources.

-   [x] **Create an Azure account and install Azure CLI:**
    -   Sign up for a Microsoft Azure account.
    -   Install the Azure CLI on your local machine for resource management.
-   [x] **Create an Azure Resource Group:**
    -   A container that holds related resources for an Azure solution.
-   [x] **Create an Azure App Service Plan:**
    -   Defines a set of compute resources for a web app to run.
-   [x] **Create an Azure App Service:**
    -   The PaaS offering to host the web application.
-   [x] **Create an Azure SQL Database and Server:**
    -   A managed SQL database service to host the application's data.
-   [x] **Configure database firewall rules:**
    -   Allow access from the Azure App Service to the database.

### Phase 3: Connect GitHub and Azure for Backend Deployment

This phase establishes the connection for automated backend deployments (Continuous Deployment).

-   [x] **Create an Azure Service Principal for GitHub Actions:**
    -   An identity created for use with applications, hosted services, and automated tools to access Azure resources.
-   [x] **Add Azure credentials as a GitHub secret:**
    -   Store the Service Principal credentials securely in your GitHub repository's secrets. The secret will be named `AZURE_CREDENTIALS`.
-   [x] **Update GitHub Actions workflow to deploy the backend:**
    -   Add a new job to the workflow for deployment, which will trigger after the build and test jobs succeed.
    -   Add steps to deploy the backend build artifacts to the Azure App Service.
-   [x] **Configure application settings and connection strings in Azure:**
    -   Set up environment variables and the database connection string in the Azure App Service configuration.
-   [x] **Add a step for running EF Core database migrations:**
    -   Ensure the database schema is updated automatically as part of the deployment process.

### Phase 4: Frontend Deployment Setup

This phase focuses on deploying the React frontend application.

-   [ ] **Create Azure Static Web App:**
    -   Set up a new Static Web App resource in Azure.
    -   Configure the build settings for the React application.
    -   ℹ️ Note: SSL certificate is automatically provided for *.azurestaticapps.net domains
-   [ ] **Update GitHub Actions workflow for frontend deployment:**
    -   Add deployment steps for the frontend build artifacts.
    -   Configure environment variables (API endpoint, etc.).
-   [ ] **Configure CORS settings on the backend:**
    -   Allow requests from the frontend domain (Static Web App URL).
    -   Update CORS policy in the backend configuration.
-   [ ] **Update frontend API base URL:**
    -   Point the frontend to the deployed backend API URL (https://*.azurewebsites.net).
    -   ℹ️ Note: Backend App Service also includes automatic SSL certificate
-   [ ] **Verify frontend deployment:**
    -   Test the frontend application in the browser (HTTPS).
    -   Ensure frontend can communicate with the backend API.
    -   Verify SSL certificates are working correctly.

### Phase 5: Post-Deployment Configuration

Final steps to ensure the complete application is running correctly.

-   [ ] **Verify the full application (backend + frontend) is working:**
    -   ✅ Backend successfully deployed and verified!
    -   [ ] Frontend deployed and accessible
    -   [ ] End-to-end functionality tested (frontend ↔ backend communication)
    -   [ ] Verify HTTPS is working on both frontend and backend (automatic SSL)
-   [ ] **(Optional) Configure custom domains:**
    -   Map a custom domain to your Static Web App (frontend).
    -   Map a custom domain to your App Service (backend).
    -   ℹ️ Note: Azure automatically provides SSL certificates for custom domains too!
