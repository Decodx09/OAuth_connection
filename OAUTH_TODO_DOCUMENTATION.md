# OAuth-Secured ToDo Application Documentation

## Overview

This is a comprehensive ToDo application built with Express.js that implements OAuth 2.0 authentication for secure user access. The application allows users to manage their personal tasks with enterprise-grade security, featuring both direct login and OAuth provider authentication.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [OAuth Implementation](#oauth-implementation)
3. [Application Features](#application-features)
4. [API Endpoints](#api-endpoints)
5. [Frontend Implementation](#frontend-implementation)
6. [Security Features](#security-features)
7. [Configuration](#configuration)
8. [Installation & Setup](#installation--setup)
9. [Usage Guide](#usage-guide)
10. [File Structure](#file-structure)

## Architecture Overview

The application follows a client-server architecture with the following components:

- **Backend**: Express.js server with OAuth 2.0 authentication
- **Frontend**: Vanilla JavaScript with modern UI/UX
- **Authentication**: OAuth 2.0 Authorization Code Flow + Direct Login
- **Data Storage**: In-memory storage (easily replaceable with database)
- **Session Management**: Express sessions with HTTP-only cookies

## OAuth Implementation

### Authentication Flows

#### 1. OAuth 2.0 Authorization Code Flow

The application implements the standard OAuth 2.0 Authorization Code flow:

1. **Initiate OAuth Flow**: User clicks "Login with OAuth Provider"
2. **Authorization Request**: Server redirects to authorization server with:
   - `client_id`: Application's client ID
   - `redirect_uri`: Callback URL
   - `response_type`: "code"
   - `state`: CSRF protection token
   - `scope`: "openid email profile"

3. **Authorization Response**: Authorization server redirects back with authorization code
4. **Token Exchange**: Server exchanges code for access and refresh tokens
5. **Session Creation**: Tokens stored in server-side session and HTTP-only cookies

#### 2. Direct Login Flow

Alternative authentication method:
1. User submits email/password
2. Server forwards credentials to authentication service
3. Tokens received and stored in session/cookies
4. User redirected to dashboard

### Security Measures

- **CSRF Protection**: State parameter in OAuth flow
- **Secure Token Storage**: Server-side sessions + HTTP-only cookies
- **Token Validation**: Regular validation with authorization server
- **Session Management**: 24-hour session expiration
- **Secure Cookies**: HTTPS-only in production, SameSite policy

## Application Features

### User Authentication
- OAuth 2.0 provider login
- Direct email/password login
- User registration
- Secure logout with token invalidation

### Task Management
- Create new tasks with title and description
- Mark tasks as completed/pending
- Edit existing tasks
- Delete tasks
- Filter tasks (All, Pending, Completed)
- Real-time task statistics

### User Interface
- Modern, responsive design
- Real-time updates
- Error handling and user feedback
- Loading states and animations
- Mobile-friendly interface

## API Endpoints

### Authentication Endpoints

#### `GET /auth/login`
Initiates OAuth 2.0 authorization flow
- Generates state parameter for CSRF protection
- Redirects to authorization server

#### `GET /auth/callback`
Handles OAuth callback and token exchange
- Validates state parameter
- Exchanges authorization code for tokens
- Creates user session

#### `POST /api/login`
Direct login with email/password
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### `POST /api/register`
User registration
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

#### `POST /api/logout`
Logout and invalidate tokens
- Notifies authorization server
- Destroys session
- Clears cookies

#### `GET /api/user`
Get authenticated user information
- Requires authentication
- Returns user profile data

### ToDo Endpoints

#### `GET /api/todos`
Get user's tasks
- Requires authentication
- Returns array of user-specific todos

#### `POST /api/todos`
Create new task
```json
{
  "title": "Task title",
  "description": "Optional description"
}
```

#### `PUT /api/todos/:id`
Update existing task
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "completed": true
}
```

#### `DELETE /api/todos/:id`
Delete task
- Requires task ownership
- Returns success confirmation

## Frontend Implementation

### Page Structure

#### Home Page (`/`)
- Welcome screen with authentication options
- Feature highlights
- OAuth and direct login buttons

#### Login Page (`/login`)
- Email/password form
- OAuth login option
- Registration link
- Error handling

#### Registration Page (`/register`)
- User registration form
- Form validation
- Success/error messaging

#### Dashboard Page (`/dashboard`)
- Task creation form
- Task list with filtering
- User statistics
- Account information
- Logout functionality

### JavaScript Functionality

#### Authentication Handling
- Form submission with validation
- Error/success message display
- Automatic redirects
- Session management

#### Task Management
- CRUD operations for tasks
- Real-time UI updates
- Filter functionality
- Modal dialogs for editing

#### User Interface
- Responsive design
- Loading states
- Error handling
- Smooth animations

## Security Features

### Token Security
- **Server-side Storage**: Tokens stored in server sessions
- **HTTP-only Cookies**: Prevent XSS attacks
- **Secure Flags**: HTTPS-only in production
- **SameSite Policy**: CSRF protection

### Authentication Security
- **State Parameter**: CSRF protection in OAuth flow
- **Token Validation**: Regular validation with auth server
- **Session Expiration**: Automatic logout after 24 hours
- **Secure Logout**: Token invalidation on logout

### Data Security
- **User Isolation**: Tasks are user-specific
- **Input Validation**: Server-side validation
- **Error Handling**: Secure error messages
- **HTTPS Enforcement**: Production security

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# OAuth Configuration
AUTH_SERVICE_URL=http://localhost:3000/api/auth
CLIENT_ID=your-client-app-id
CLIENT_SECRET=your-client-secret
REDIRECT_URI=http://localhost:3001/auth/callback

# Session Configuration
SESSION_SECRET=your-session-secret-key
```

### OAuth Provider Setup

1. Register your application with OAuth provider
2. Configure redirect URI: `http://localhost:3001/auth/callback`
3. Set required scopes: `openid email profile`
4. Obtain client ID and secret
5. Update environment variables

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- OAuth provider account

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd oauth-todo-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start the application**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

5. **Access the application**
Open `http://localhost:3001` in your browser

## Usage Guide

### Getting Started

1. **Access the Application**
   - Navigate to `http://localhost:3001`
   - Choose authentication method

2. **Authentication Options**
   - **OAuth Login**: Click "Login with OAuth Provider"
   - **Direct Login**: Use email/password form
   - **Registration**: Create new account

3. **Using the Dashboard**
   - **Add Tasks**: Fill out the task form and click "Add Task"
   - **Manage Tasks**: Check off completed tasks, edit, or delete
   - **Filter Tasks**: Use filter buttons to view specific task types
   - **View Stats**: See total and completed task counts

### Task Management

#### Creating Tasks
1. Enter task title (required)
2. Add description (optional)
3. Click "Add Task"

#### Managing Tasks
- **Complete**: Check the checkbox next to task
- **Edit**: Click the edit icon (✏️)
- **Delete**: Click the delete icon (🗑️)

#### Filtering Tasks
- **All**: Show all tasks
- **Pending**: Show incomplete tasks
- **Completed**: Show finished tasks

### Account Management

#### User Information
- Click "Account Info" to view profile details
- Information includes ID, email, name, role, and verification status

#### Logout
- Click "Logout" button in header
- Tokens are invalidated and session destroyed

## File Structure

```
oauth-todo-app/
├── views/                  # HTML templates
│   ├── index.html         # Home page
│   ├── login.html         # Login page
│   ├── register.html      # Registration page
│   └── dashboard.html     # Dashboard page
├── public/                # Static assets
│   ├── css/
│   │   └── style.css      # Application styles
│   └── js/
│       └── app.js         # Frontend JavaScript
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── .env                   # Environment configuration
└── README.md              # Project documentation
```

### Key Files Description

#### `server.js`
- Express.js server setup
- OAuth implementation
- API endpoints
- Authentication middleware
- ToDo CRUD operations

#### `views/dashboard.html`
- Main application interface
- Task management UI
- User statistics
- Account information

#### `public/js/app.js`
- Frontend JavaScript logic
- API communication
- UI interactions
- Form handling

#### `public/css/style.css`
- Modern, responsive styling
- Component-based CSS
- Mobile-friendly design
- Animation and transitions

## Development Notes

### In-Memory Storage
Current implementation uses in-memory storage for simplicity. For production:
- Replace with database (MongoDB, PostgreSQL, etc.)
- Implement data persistence
- Add data migration scripts

### Scalability Considerations
- Implement database connection pooling
- Add caching layer (Redis)
- Use environment-specific configurations
- Implement logging and monitoring

### Security Enhancements
- Add rate limiting
- Implement PKCE for OAuth
- Add input sanitization
- Implement audit logging

## Troubleshooting

### Common Issues

#### OAuth Callback Errors
- Verify redirect URI configuration
- Check client ID and secret
- Ensure authorization server is accessible

#### Session Issues
- Verify session secret configuration
- Check cookie settings
- Ensure HTTPS in production

#### API Errors
- Check network connectivity
- Verify authentication tokens
- Review server logs

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Implement changes
4. Add tests
5. Submit pull request

## License

This project is licensed under the MIT License.

---

*This documentation provides a comprehensive guide to the OAuth-secured ToDo application. For additional support or questions, please refer to the project repository or contact the development team.*