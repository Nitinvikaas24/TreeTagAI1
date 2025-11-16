# TreeTagAI

A full-stack application for plant identification and officer management.

## Structure
- **client/**: React (Vite), TailwindCSS, React Router, Axios, JWT authentication
- **server/**: Express.js, MongoDB (Mongoose), JWT authentication, file upload

## Main Features
- User/Officer authentication
- Plant identification with camera functionality
- Dashboard for users and officers
- PDF generation and receipt management
- Excel handling and reporting
- Multi-language translation integration
- Inventory management
- Wishlist and cart functionality

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
1. Clone the repository
2. Install root dependencies:
   ```bash
   npm install
   ```

3. Install client dependencies:
   ```bash
   cd client
   npm install
   ```

4. Install server dependencies:
   ```bash
   cd server
   npm install
   ```

### Running the Application

#### Development Mode
1. Start the backend server:
   ```bash
   cd server
   npm run dev
   ```

2. Start the frontend development server (in a new terminal):
   ```bash
   cd client
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173` for the frontend

#### Production Build
1. Build the client:
   ```bash
   cd client
   npm run build
   ```

2. Start the production server:
   ```bash
   cd server
   npm start
   ```

## Project Features
- **Authentication**: JWT-based user and officer authentication
- **Plant Identification**: Camera-based plant identification using AI
- **User Management**: Role-based access (users and officers)
- **Dashboard**: Personalized dashboards for different user types
- **Inventory**: Plant inventory management for officers
- **Orders & Cart**: Shopping cart and order management
- **Reports**: Analytics and reporting features
- **Multi-language**: Translation support