# Deployment Plan: PetFoodVerifAI to Azure with GitHub Actions CI/CD

This document outlines the steps to deploy the PetFoodVerifAI application to Microsoft Azure and set up a Continuous Integration/Continuous Deployment (CI/CD) pipeline using GitHub Actions.

## Phases

The deployment is broken down into four main phases:

1.  **Phase 1: CI/CD Setup with GitHub Actions**
2.  **Phase 2: Azure Infrastructure Setup**
3.  **Phase 3: Connect GitHub and Azure for Deployment**
4.  **Phase 4: Post-Deployment Configuration**

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

-   [ ] **Create an Azure account and install Azure CLI:**
    -   Sign up for a Microsoft Azure account.
    -   Install the Azure CLI on your local machine for resource management.
-   [ ] **Create an Azure Resource Group:**
    -   A container that holds related resources for an Azure solution.
-   [ ] **Create an Azure App Service Plan:**
    -   Defines a set of compute resources for a web app to run.
-   [ ] **Create an Azure App Service:**
    -   The PaaS offering to host the web application.
-   [ ] **Create an Azure SQL Database and Server:**
    -   A managed SQL database service to host the application's data.
-   [ ] **Configure database firewall rules:**
    -   Allow access from the Azure App Service to the database.

### Phase 3: Connect GitHub and Azure for Deployment

This phase establishes the connection for automated deployments (Continuous Deployment).

-   [ ] **Create an Azure Service Principal for GitHub Actions:**
    -   An identity created for use with applications, hosted services, and automated tools to access Azure resources.
-   [ ] **Add Azure credentials as a GitHub secret:**
    -   Store the Service Principal credentials securely in your GitHub repository's secrets. The secret will be named `AZURE_CREDENTIALS`.
-   [ ] **Update GitHub Actions workflow to deploy the application:**
    -   Add a new job to the workflow for deployment, which will trigger after the build and test jobs succeed.
    -   Add steps to deploy the backend and frontend build artifacts to the Azure App Service.
-   [ ] **Configure application settings and connection strings in Azure:**
    -   Set up environment variables and the database connection string in the Azure App Service configuration.
-   [ ] **Add a step for running EF Core database migrations:**
    -   Ensure the database schema is updated automatically as part of the deployment process.

### Phase 4: Post-Deployment Configuration

Final steps to ensure the application is running correctly.

-   [ ] **Verify the application is deployed and running successfully:**
    -   Access the application using the App Service URL to confirm it's working.
-   [ ] **(Optional) Configure a custom domain and SSL certificate:**
    -   Map a custom domain to your App Service.
    -   Configure an SSL certificate for HTTPS.
