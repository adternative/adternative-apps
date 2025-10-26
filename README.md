# ADTERNATIVE - ExpressJS Application

A comprehensive ExpressJS application with user authentication, entity management, and modern UI design.

## Features

- **User Authentication**: JWT-based authentication with role-based access control
- **Entity Management**: Users can own multiple entities (brands) with industry classification
- **Modern UI**: TailwindCSS with Space Grotesk font and Lucide icons
- **Database**: MySQL with Sequelize ORM
- **Middleware**: Authentication and entity selection middleware
- **Social Media Integration**: Ready for social media platform connections
- **Google Search Console**: Integration support for Google Search Console

## Prerequisites

- Node.js (v14 or higher)
- MySQL database
- npm or yarn

## Installation

1. **Clone the repository and navigate to the apps directory**
   ```bash
   cd /Users/taxiandtakeoff/Development/ADTERNATIVE/ADTERNATIVE/apps
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=adternative
   DB_USER=your_username
   DB_PASSWORD=your_password
   JWT_SECRET=your-super-secret-jwt-key
   SESSION_SECRET=your-super-secret-session-key
   ```

4. **Create MySQL database**
   ```sql
   CREATE DATABASE adternative;
   ```

5. **Build CSS assets**
   ```bash
   npm run build-css-prod
   ```

6. **Start the application**
   ```bash
   npm start
   ```

   The application will be available at `http://localhost:3000`

## Development

For development with CSS watching:
```bash
npm run build-css
```

This will watch for changes in your CSS files and rebuild automatically.

## API Endpoints

### Authentication
- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /auth/profile` - Get user profile (requires auth)
- `PUT /auth/profile` - Update user profile (requires auth)
- `PUT /auth/change-password` - Change password (requires auth)

### Entities
- `GET /entities` - Get user's entities (requires auth)
- `POST /entities` - Create new entity (requires auth)
- `GET /entities/current` - Get current entity (requires auth)
- `POST /entities/switch` - Switch current entity (requires auth)
- `GET /entities/:entityId` - Get specific entity (requires auth)
- `PUT /entities/:entityId` - Update entity (requires auth)
- `DELETE /entities/:entityId` - Delete entity (requires auth)

### Users (Admin only)
- `GET /users` - Get all users (admin only)
- `GET /users/:userId` - Get specific user (admin only)
- `PUT /users/:userId/role` - Update user role (admin only)
- `PUT /users/:userId/toggle-status` - Toggle user status (admin only)

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `password` (String, Hashed)
- `firstName` (String)
- `lastName` (String)
- `role` (Enum: admin, user, manager)
- `isActive` (Boolean)
- `lastLogin` (DateTime)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Entities Table
- `id` (UUID, Primary Key)
- `name` (String)
- `industry` (String)
- `description` (Text, Optional)
- `website` (String, Optional)
- `socialMediaPlatforms` (JSON)
- `googleSearchConsole` (JSON)
- `integrations` (JSON)
- `isActive` (Boolean)
- `userId` (UUID, Foreign Key)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

## User Roles

- **admin**: Full access to all features and user management
- **manager**: Can manage entities and view analytics
- **user**: Basic entity management and viewing

## Middleware

### Authentication Middleware
- `authenticateToken`: Verifies JWT token and sets req.user
- `requireRole(roles)`: Checks if user has required role(s)
- `requireEntityOwnership`: Verifies user owns the entity
- `optionalAuth`: Optional authentication (doesn't fail if no token)

### Entity Middleware
- `currentEntity`: Handles currently selected entity
- `requireCurrentEntity`: Requires a current entity to be selected
- `getUserEntities`: Loads user's entities into req.userEntities
- `switchEntity`: Switches the current entity

## Frontend

The application uses:
- **TailwindCSS** for styling
- **Space Grotesk** font family
- **Lucide** icons
- **Vanilla JavaScript** for interactions
- **Pug** templating engine

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- SQL injection protection via Sequelize ORM

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is private and proprietary.
# adternative-apps
