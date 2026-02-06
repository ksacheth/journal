# Requirements Document

## Introduction

This feature adds Google OAuth authentication to an existing NextAuth v5 setup that currently uses Credentials-based authentication (username/password). The Google OAuth provider is already configured in the auth.ts file but requires environment variables and proper configuration to function. The key requirement is that Google-authenticated users must be completely separate from credentials-based users, with each authentication method creating its own user entries in MongoDB.

## Glossary

- **NextAuth**: Authentication library for Next.js applications (version 5)
- **OAuth_Provider**: Google OAuth 2.0 authentication service
- **Credentials_Provider**: Username/password authentication method in NextAuth
- **MongoDBAdapter**: NextAuth adapter that stores user data in MongoDB
- **User_Entry**: A document in the MongoDB users collection representing a user account
- **Authentication_Method**: The mechanism used to authenticate a user (Google OAuth or Credentials)
- **Session**: An authenticated user's active connection to the application
- **JWT_Strategy**: JSON Web Token-based session management
- **Sign_In_Page**: The /signin route where users authenticate
- **Environment_Variables**: Configuration values stored in .env file (AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET)

## Requirements

### Requirement 1: Google OAuth Configuration

**User Story:** As a system administrator, I want to configure Google OAuth credentials, so that the application can authenticate users via Google.

#### Acceptance Criteria

1. WHEN the application starts, THE System SHALL read AUTH_GOOGLE_ID from environment variables
2. WHEN the application starts, THE System SHALL read AUTH_GOOGLE_SECRET from environment variables
3. IF AUTH_GOOGLE_ID or AUTH_GOOGLE_SECRET are missing, THEN THE System SHALL log a warning but continue operation
4. THE OAuth_Provider SHALL use the configured credentials for all Google authentication requests

### Requirement 2: Separate User Identity Management

**User Story:** As a user, I want my Google account to create a separate user profile, so that my Google identity is not linked to any existing credentials-based accounts.

#### Acceptance Criteria

1. WHEN a user authenticates via Google OAuth, THE MongoDBAdapter SHALL create a new User_Entry with a unique identifier
2. WHEN a user authenticates via Credentials_Provider, THE MongoDBAdapter SHALL create or retrieve a User_Entry with username and password fields
3. THE System SHALL NOT merge or link User_Entry records from different Authentication_Method types
4. WHEN querying User_Entry records, THE System SHALL distinguish between OAuth and Credentials users by the presence of a password field
5. FOR ALL User_Entry records created via Google OAuth, THE password field SHALL be null or absent

### Requirement 3: Sign-In Page Integration

**User Story:** As a user, I want to see a Google sign-in button on the login page, so that I can choose to authenticate with my Google account.

#### Acceptance Criteria

1. WHEN a user visits the Sign_In_Page, THE System SHALL display a "Continue with Google" button
2. WHEN a user visits the Sign_In_Page, THE System SHALL display the existing credentials form (email/username and password)
3. THE Sign_In_Page SHALL visually separate OAuth options from credentials options with a divider
4. WHEN a user clicks the Google button, THE System SHALL initiate the OAuth flow by redirecting to Google's authentication page
5. WHEN Google authentication completes successfully, THE System SHALL redirect the user to the /entry page

### Requirement 4: OAuth Authentication Flow

**User Story:** As a user, I want to authenticate using my Google account, so that I can access the application without creating a separate password.

#### Acceptance Criteria

1. WHEN a user clicks the Google sign-in button, THE System SHALL redirect to Google's OAuth consent screen
2. WHEN the user grants permission on Google's consent screen, THE OAuth_Provider SHALL receive an authorization code
3. WHEN the OAuth_Provider receives an authorization code, THE System SHALL exchange it for user profile information
4. WHEN user profile information is received, THE MongoDBAdapter SHALL create a new User_Entry with email, name, and image fields
5. WHEN the User_Entry is created, THE System SHALL create a Session using the JWT_Strategy
6. WHEN the Session is created, THE System SHALL redirect the user to the callback URL (/entry)

### Requirement 5: Data Isolation

**User Story:** As a user with a credentials-based account, I want my data to remain separate from Google OAuth users, so that my entries and information are not accessible to other users.

#### Acceptance Criteria

1. WHEN retrieving user-specific data, THE System SHALL filter by the Session user ID
2. FOR ALL database queries for user data, THE System SHALL use the authenticated user's unique identifier
3. THE System SHALL NOT allow cross-user data access regardless of Authentication_Method
4. WHEN a credentials user signs in, THE System SHALL only return data associated with their User_Entry ID
5. WHEN a Google OAuth user signs in, THE System SHALL only return data associated with their User_Entry ID

### Requirement 6: Backward Compatibility

**User Story:** As an existing user with credentials-based authentication, I want to continue signing in with my username and password, so that my access is not disrupted.

#### Acceptance Criteria

1. WHEN an existing credentials user attempts to sign in, THE Credentials_Provider SHALL authenticate using the existing username/password logic
2. THE System SHALL continue to support username OR email as the identifier for credentials authentication
3. WHEN a credentials user successfully authenticates, THE System SHALL create a Session with their existing User_Entry ID
4. THE Credentials_Provider SHALL remain functional alongside the OAuth_Provider
5. WHEN the Sign_In_Page loads, THE System SHALL display both authentication options simultaneously

### Requirement 7: Error Handling

**User Story:** As a user, I want clear error messages when authentication fails, so that I understand what went wrong and can take corrective action.

#### Acceptance Criteria

1. WHEN Google OAuth authentication fails, THE System SHALL display an error message on the Sign_In_Page
2. WHEN credentials authentication fails, THE System SHALL display "Invalid email or password" message
3. IF the OAuth_Provider encounters a network error, THEN THE System SHALL display "Unable to sign in. Please try again."
4. WHEN an authentication error occurs, THE System SHALL log the error details for debugging
5. THE System SHALL NOT expose sensitive error details (like stack traces) to the user interface

### Requirement 8: Session Management

**User Story:** As an authenticated user, I want my session to persist across page refreshes, so that I don't have to sign in repeatedly.

#### Acceptance Criteria

1. WHEN a user successfully authenticates via any Authentication_Method, THE System SHALL create a JWT token
2. THE JWT token SHALL include the user ID from the User_Entry
3. WHEN a user makes subsequent requests, THE System SHALL validate the JWT token
4. WHEN the JWT token is valid, THE System SHALL restore the Session with user information
5. THE Session SHALL include user ID, email, name, and image fields regardless of Authentication_Method
