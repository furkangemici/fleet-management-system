# Fleet Management System

A modern, web-based Fleet Management System designed to streamline the tracking of vehicles, drivers, maintenance, and fines. Features real-time updates and comprehensive reporting capabilities.

## About the Project

This project is a full-stack web application that enables companies to efficiently manage their vehicle fleet. It digitizes operational processes with a user-friendly interface and robust backend infrastructure.

### Key Features
*   **Vehicle Management:** Add, update, and track vehicle status (Active, Under Maintenance, etc.).
*   **Driver Tracking:** Driver profiles, license information, and vehicle assignments.
*   **Maintenance Tracking:** Periodic maintenance, costs, and maintenance history.
*   **Fine Management:** Recording traffic fines and payment tracking.
*   **Insurance & Inspection Tracking:** Alerts for upcoming insurance and inspection dates.
*   **Real-time Notifications:** Instant system notifications via Socket.io.
*   **Excel Export:** Export data in CSV/Excel format for reporting.
*   **Security:** Brute force attack protection and JWT-based authentication.

## Screenshots

### Main Dashboard
<details>
<summary>Dashboard</summary>

![Dashboard](screenshots/dashboard.png)
</details>


### Other Pages

<details>
<summary>Vehicle Management</summary>

![Vehicles](screenshots/vehicles.png)
</details>

<details>
<summary>Driver Management</summary>

![Drivers](screenshots/drivers.png)
</details>

<details>
<summary>Maintenance Tracking</summary>

![Maintenance](screenshots/maintenance.png)
</details>

<details>
<summary>Fine Management</summary>

![Fines](screenshots/fines.png)
</details>

<details>
<summary>Insurance Tracking</summary>

![Insurance](screenshots/insurance.png)
</details>

<details>
<summary>Map View</summary>

![Map](screenshots/map.png)
</details>

## Technologies Used

This project is built using modern and up-to-date web technologies.

### Backend (Server-side)
*   **Node.js & Express:** Fast and scalable server infrastructure.
*   **TypeScript:** Type safety and cleaner code structure.
*   **Prisma ORM:** Easy and secure interaction with PostgreSQL database.
*   **Socket.io:** Real-time bidirectional communication (WebSocket).
*   **PostgreSQL:** Reliable relational database system.

### Frontend (Client-side)
*   **React:** JavaScript library for building user interfaces.
*   **Vite:** Fast development and build tool.
*   **React Router:** Page routing and navigation.

##  Installation and Setup

Follow these steps to run the project in your local environment.

### Prerequisites
*   Node.js (v18+)
*   PostgreSQL database

### 1. Clone the Repository
```bash
git clone https://github.com/username/fleet-management-system.git
cd fleet-management-system
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file and enter your database connection information:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/fleet_db?schema=public"
PORT=3000
SECRET_KEY=your_secret_key
```

Create the database schema and load initial data:
```bash
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### 3. Frontend Setup
Open a new terminal and return to the project root directory:
```bash
cd frontend
npm install
npm run dev
```

The application will run at `http://localhost:5173` by default.

## Project Structure

```
fleet-management-system/
├── backend/            # Express server and API code
│   ├── prisma/         # Database schema and seed files
│   ├── src/
│   │   ├── controllers/# Request handler functions
│   │   ├── services/   # Business logic layer
│   │   ├── routes/     # API routes
│   │   └── ...
├── frontend/           # React application
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── pages/      # Application pages
│   │   ├── services/   # Services managing API requests
│   │   └── ...
└── README.md
```
