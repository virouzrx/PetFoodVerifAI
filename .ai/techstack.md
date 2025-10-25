# PetFoodVerifAI Technology Stack

This document outlines the technology stack for the PetFoodVerifAI project.

## Backend

- **Framework:** .NET 8
- **ORM:** Entity Framework Core
- **Database Approach:** Code-First
- **Reasoning:** Developer familiarity for rapid MVP development. It's a robust, scalable, and high-performance framework suitable for building the required REST API. Entity Framework Core with a Code-First approach will be used for data access, allowing the database schema to be defined and managed directly from the C# code.

## Frontend

- **Framework:** React
- **Reasoning:** A popular and powerful library for building modern, component-based user interfaces. Its ecosystem and flexibility are ideal for the project's frontend requirements.

## Database

- **Primary:** PostgreSQL
- **Reasoning:** A powerful, open-source object-relational database system with a strong reputation for reliability, feature robustness, and performance. It will be used for production.
- **Development/Alternative:** SQLite
- **Reasoning:** A lightweight, serverless, self-contained SQL database engine that is great for development and testing purposes.

## Styling

- **CSS Framework:** Tailwind CSS
- **Reasoning:** A utility-first CSS framework for rapidly building custom user interfaces without leaving your HTML. It provides flexibility while maintaining a consistent design system.

## Authentication

- **Framework:** ASP.NET Identity
- **Protocol:** OAuth2
- **Reasoning:** ASP.NET Identity provides a robust and secure authentication system out-of-the-box, handling user registration, login, and management. OAuth2 will be integrated for future scalability, allowing for social logins and secure API access.

## Deployment

- **Platform:** Microsoft Azure
- **Reasoning:** Azure offers a scalable and reliable cloud platform with excellent support for .NET applications. Services like Azure App Service and Azure Database for PostgreSQL will be utilized for seamless deployment and management.