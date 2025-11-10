# Product Requirements Document (PRD) - Pet Food Analyzer
## 1. Product Overview
The Pet Food Analyzer is a web application designed to provide pet owners with a quick and objective analysis of pet food ingredients. The initial Proof of Concept (PoC) will focus on analyzing cat and dog food from a single, predefined online store. Users can submit product information in two ways: (1) by providing a product URL from which the system automatically extracts the product name and ingredients, or (2) by manually entering the product name and ingredients. The application will send the ingredients to a Large Language Model (LLM) for analysis against a set of predefined rules, and return a simple "Recommended" or "Not Recommended" verdict with a concise justification. All analyses are saved to a user's private history for future reference.

## 2. User Problem
Pet owners are often skeptical about the quality of commercial pet food and find it difficult to decipher complex ingredient lists. They lack a simple, accessible, and objective tool to help them quickly determine if a particular food product is suitable for their pet's specific needs, leading to uncertainty and a time-consuming research process. This application aims to solve this by providing an immediate, AI-driven analysis from a simple product link.

## 3. Functional Requirements
- FR-01: User Authentication: The system shall require users to register and log in to use the application. There will be no guest access.
- FR-02: Data Input Form: The application shall provide a form with two input modes: (1) URL Mode: users provide a Product URL, and the system automatically extracts the product name and ingredients from the URL; (2) Manual Mode: users manually enter the Product Name and ingredients. Both modes require Species (Cat/Dog), Breed (free text), Age, and optional "Additional Info".
- FR-03: Product Data Scraping: When a product URL is provided, the system shall automatically scrape both the product name and ingredient list from the provided product URL.
- FR-04: Manual Ingredient Input: The system supports manual entry as a primary input mode. Users can choose to manually enter product name and ingredients without providing a URL. Additionally, if ingredient scraping fails in URL mode, the system shall prompt the user to manually copy and paste the ingredients as a fallback.
- FR-05: LLM Analysis: The application will use an LLM with a guided meta-prompt containing predefined rules (e.g., "grain is bad for cats") to analyze the ingredients.
- FR-06: Results Display: The analysis result shall be displayed on a dedicated page featuring a prominent "Recommended" or "Not Recommended" badge and a short, LLM-generated justification.
- FR-07: AI Disclaimer: A disclaimer stating that the analysis is AI-generated and not a substitute for professional veterinary advice must be visible on the results page.
- FR-08: Product History: All analyses must be saved to a user-specific "My Products" page.
- FR-09: Analysis Versioning: The system will store a version history of analyses for each unique product name when a user re-analyzes a product.
- FR-10: User Feedback Mechanism: A simple "thumbs up/down" feedback system will be present on the results page for the developer to privately assess the quality of the LLM's analysis.
- FR-11: Database: The application will use a PostgreSQL database for data persistence.
- FR-12: Loading Indicator: The UI shall display a loading indicator (e.g., "Thinking...") while the LLM analysis is in progress.

## 4. Product Boundaries
### In Scope (PoC)
- Platform: Web application.
- Target Users: Logged-in cat and dog owners.
- Data Source: A single, predefined online store for product URLs.
- Core Functionality: User registration/login, product submission, LLM analysis, results display, and personal product history.

### Out of Scope (PoC)
- Mobile native application (iOS/Android).
- Support for analyzing products from multiple or user-defined online stores.
- Analysis for animals other than cats and dogs.
- Social features like sharing results or public product reviews.
- A user interface for comparing different versions of a product's analysis history.
- Advanced, structured analysis based on the free-text "Breed" field.

### Unresolved Issues
- Breed Analysis Strategy: A strategy for how the LLM will reliably use the unstructured, free-text "Breed" input has not been defined.
- History Versioning UI: The specific user interface for navigating and comparing different historical versions of an analysis has not been designed.

## 5. User Stories
### Authentication
- ID: US-001
- Title: User Registration
- Description: As a new user, I want to create an account so that I can access the application and save my product analyses.
- Acceptance Criteria:
  - Given I am on the application's landing page,
  - When I click the "Register" button,
  - Then I am presented with a form to enter my email and password.
  - When I submit the form with valid credentials,
  - Then my account is created, and I am automatically logged in and redirected to the main analysis page.

- ID: US-002
- Title: User Login
- Description: As a registered user, I want to log in to my account so that I can access my saved product history and perform new analyses.
- Acceptance Criteria:
  - Given I am a registered user on the login page,
  - When I enter my correct email and password and click "Login",
  - Then I am authenticated and redirected to the main analysis page.
  - Given I enter incorrect credentials,
  - Then an error message is displayed, and I remain on the login page.

- ID: US-003
- Title: User Password Recovery
- Description: As a registered user who has forgotten my password, I want to be able to reset it so that I can regain access to my account.
- Acceptance Criteria:
  - Given I am on the login page,
  - When I click the "Forgot Password?" link,
  - Then I am taken to a page where I can enter my registered email address.
  - When I submit my email address,
  - Then I receive an email with a link to reset my password.
  - When I click the link in the email,
  - Then I am taken to a page where I can enter and confirm a new password.
  - When I submit my new password,
  - Then my password is updated, and I can log in with the new password.

- ID: US-004
- Title: User Login with Google OAuth
- Description: As a new or returning user, I want to be able to register and log in using my Google account so that I can access the application quickly without creating a new password.
- Acceptance Criteria:
  - Given I am on the login or registration page,
  - When I click the "Continue with Google" button,
  - Then I am redirected to Google's authentication page.
  - When I successfully authenticate with Google and grant permissions,
  - Then I am redirected back to the application.
  - If this is my first time logging in with Google, then a new account is created automatically using my Google email.
  - Then I am authenticated and redirected to the main analysis page.
  - Given I have previously registered with Google,
  - When I log in with Google again,
  - Then I am authenticated using my existing account.
  - Given my Google account email matches an existing email/password account,
  - Then the system should handle the account linking appropriately or display an appropriate message.

### Product Analysis
- ID: US-005
- Title: Analyze a product with successful URL scraping
- Description: As a logged-in user, I want to submit a product URL and my pet's details to get an analysis of the food, with the system automatically extracting the product name and ingredients.
- Acceptance Criteria:
  - Given I am logged in and on the analysis form page,
  - When I select URL mode and fill in the required fields (URL, Species, Age, Breed) and click "Analyze",
  - And the system successfully scrapes the product name and ingredients from the URL,
  - Then a loading indicator is displayed while the analysis is processing.
  - Then I am redirected to the results page, which shows a "Recommended" or "Not Recommended" badge and a justification.
  - The product name displayed on the results page matches the name extracted from the URL.

- ID: US-006
- Title: Analyze a product with failed ingredient scraping (fallback to manual)
- Description: As a logged-in user, if the app cannot find the ingredients when scraping from a URL, I want to be prompted to enter them manually so I can still get an analysis.
- Acceptance Criteria:
  - Given I have submitted the analysis form in URL mode,
  - And the system fails to scrape the ingredients from the URL,
  - Then a message is displayed informing me of the failure and providing a text box for manual ingredient entry.
  - When I paste the ingredients into the text box and resubmit,
  - Then the analysis proceeds, and I am shown the results page.

- ID: US-007
- Title: Analyze a product using manual entry mode
- Description: As a logged-in user, I want to manually enter a product name and ingredients without providing a URL, so I can analyze products that are not available online or products I have in physical form.
- Acceptance Criteria:
  - Given I am logged in and on the analysis form page,
  - When I select Manual mode and fill in the required fields (Product Name, Ingredients, Species, Age, Breed) and click "Analyze",
  - Then a loading indicator is displayed while the analysis is processing.
  - Then I am redirected to the results page, which shows a "Recommended" or "Not Recommended" badge and a justification.
  - The product is saved in my history with the manually entered name and marked as a manual entry.

- ID: US-007a
- Title: Handle a product with no ingredient list
- Description: As a user, if I submit a product that has no ingredient list available for scraping or manual entry, I want the system to flag it as not recommended.
- Acceptance Criteria:
  - Given I have submitted a product for analysis,
  - And the system cannot find an ingredient list via scraping,
  - And I indicate (e.g., by submitting an empty manual entry form) that no list is available,
  - Then the results page displays a "Not Recommended" badge.
  - And the justification states that an ingredient list could not be found.

### Results and History
- ID: US-008
- Title: View analysis result
- Description: As a user, after submitting a product for analysis, I want to see a clear and simple result.
- Acceptance Criteria:
  - Given an analysis is complete,
  - Then the results page is displayed.
  - The page must contain a prominent "Recommended" or "Not Recommended" badge.
  - The page must contain a short, concise justification for the recommendation.
  - The page must display a disclaimer that the advice is AI-generated and not from a veterinarian.

- ID: US-009
- Title: Provide feedback on an analysis
- Description: As a user, I want to provide feedback on the quality of an analysis to help improve the service.
- Acceptance Criteria:
  - Given I am on the analysis results page,
  - Then I can see "thumbs up" and "thumbs down" icons.
  - When I click one of the icons,
  - Then my feedback is recorded by the system for developer review.
  - The UI should provide a visual confirmation that the feedback was submitted.

- ID: US-010
- Title: View my product analysis history
- Description: As a logged-in user, I want to view a list of all the products I have previously analyzed so I can refer back to them.
- Acceptance Criteria:
  - Given I am logged in,
  - When I navigate to the "My Products" page,
  - Then I see a list of all products I have analyzed previously.
  - Each item in the list should display the product name and the date of the last analysis.

- ID: US-011
- Title: Re-analyze a product from history
- Description: As a logged-in user, I want to re-analyze a product from my history to get an updated opinion or use different pet details.
- Acceptance Criteria:
  - Given I am viewing a product in my "My Products" history,
  - When I click a "Re-analyze" button,
  - Then I am taken to the analysis form with the product's details pre-filled.
  - When I submit the new analysis,
  - Then the new result is saved, and a version history is maintained for that product.

## 6. Success Metrics
- SM-01: Core Functionality Success Rate: The primary success metric is the percentage of users who can successfully complete the primary usage path: submitting the form, receiving a coherent analysis, and having the result saved to their history. Target: >95%.
- SM-02: Analysis Quality (Developer Metric): The ratio of "thumbs up" to "thumbs down" feedback received on analysis results. This will serve as a key internal indicator of the LLM's performance and the value of the analysis to the user.
- SM-03: User Engagement: The average number of products analyzed and saved per user. An increasing average indicates that users find the service valuable and are using it repeatedly.