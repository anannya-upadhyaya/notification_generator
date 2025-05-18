# notification_generator
Notification Service
A system to send and manage notifications to users via Email, SMS, and in-app channels.
Features

Send notifications via multiple channels (Email, SMS, In-app)
Retrieve user notifications
Queue-based notification processing using RabbitMQ
Automatic retries for failed notifications
TypeScript-based implementation with Express

Tech Stack

Node.js
TypeScript
Express
MongoDB
RabbitMQ for message queuing
Jest for testing

Project Structure
notification-service/
├── src/
│   ├── controllers/     # Request handlers
│   ├── models/          # Data models
│   ├── services/        # Business logic
│   ├── routes/          # API routes
│   ├── middleware/      # Express middleware
│   ├── config/          # Configuration files
│   └── app.ts           # Main application file
├── tests/               # Test files
├── package.json
└── tsconfig.json
API Endpoints

POST /notifications - Send a notification
GET /users/{id}/notifications - Get user notifications

Setup Instructions
Prerequisites

Node.js (v14 or later)
MongoDB
RabbitMQ

Installation

Clone the repository

bashgit clone <repository-url>
cd notification-service

Install dependencies

bashnpm install

Set up environment variables
Create a .env file in the root directory with the following variables:

PORT=3000
MONGODB_URI=mongodb://localhost:27017/notification-service
RABBITMQ_URL=amqp://localhost

Start the server

bashnpm run build
npm start
For development with hot-reload:
bashnpm run dev
Assumptions

Authentication and authorization are handled by an external service.
User records already exist in the system.
Notifications are stored in MongoDB.
Failed notifications will be retried up to 3 times before being marked as failed.
Email and SMS delivery are mocked for demonstration purposes.

Testing
Run tests with:
bashnpm test
