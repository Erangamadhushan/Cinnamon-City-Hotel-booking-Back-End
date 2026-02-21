# Cinnamon City Hotel Booking - Back End

A RESTful API for managing hotel bookings, rooms, and reservations.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Models](#models)
- [Utilities](#utilities)

## Features

- User authentication and authorization
- Room management
- Booking creation with date conflict detection
- Booking status management (pending, confirmed, cancelled)
- User-specific booking history
- Admin booking management
- Hotel management

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Language**: JavaScript (ES6+)

## Installation

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start the server
npm start
```

## Project Structure

```
src/
├── controllers/
│   └── bookings.controller.js    # Booking management handlers
├── models/
│   ├── booking.model.js          # Booking schema
│   ├── room.model.js             # Room schema
│   └── user.model.js             # User schema
├── routes/                        # API routes
├── middleware/                    # Custom middleware
├── utils/
│   ├── ApiError.js              # Error handling utility
│   ├── ApiResponse.js           # Response formatting utility
│   ├── asyncHandler.js          # Async error handler
│   └── DateOverLap.js           # Date conflict validation
└── app.js                         # Express app setup
```

## API Endpoints

### Bookings

#### Create Booking
- **POST** `/bookings`
- **Auth Required**: Yes
- **Body**:
  ```json
  {
    "roomId": "string",
    "checkIn": "2024-01-15",
    "checkOut": "2024-01-20"
  }
  ```
- **Response**: 201 Created with booking details

#### Get User Bookings
- **GET** `/bookings/my-bookings`
- **Auth Required**: Yes
- **Response**: 200 OK with array of user's bookings

#### Cancel Booking
- **PATCH** `/bookings/:id/cancel`
- **Auth Required**: Yes
- **Response**: 200 OK with updated booking status

#### Get All Bookings (Admin)
- **GET** `/bookings/admin/all`
- **Auth Required**: Yes (Admin only)
- **Response**: 200 OK with all bookings

#### Update Booking Status (Admin)
- **PATCH** `/bookings/:id/status`
- **Auth Required**: Yes (Admin only)
- **Body**:
  ```json
  {
    "status": "pending|confirmed|cancelled"
  }
  ```
- **Response**: 200 OK with updated booking

#### Delete Booking (Admin)
- **DELETE** `/bookings/:id`
- **Auth Required**: Yes (Admin only)
- **Response**: 200 OK with deleted booking details

## Models

### Booking
- `user`: Reference to User
- `room`: Reference to Room
- `checkIn`: Date
- `checkOut`: Date
- `totalPrice`: Number (calculated as nights × room price)
- `status`: String (pending, confirmed, cancelled)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### Room
- `number`: String
- `capacity`: Number
- `pricePerNight`: Number
- `hotel`: Reference to Hotel

### User
- `name`: String
- `email`: String
- Other authentication fields

## Utilities

### ApiError
Custom error class for consistent error responses

### ApiResponse
Utility for consistent API response formatting

### asyncHandler
Wrapper for async route handlers to catch errors

### DateOverLap
Validates date ranges to prevent double bookings
- Checks if booking dates overlap with existing reservations
- Returns true if overlap detected, false otherwise

