# CT Session Tracker

A web application for tracking amendments from the Connecticut General Assembly.

## Features

- View Senate and House amendments
- Filter and sort amendments
- View amendments grouped by bill number
- View amendment details and PDFs
- Authentication system to protect data

## Prerequisites

- Node.js 18.x or later
- AWS account with DynamoDB tables set up
- AWS credentials with access to DynamoDB

## Getting Started

1. Clone the repository
2. Navigate to the frontend directory:
   ```bash
   cd session-tracker-frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env.local` file based on the `.env.local.example` file:
   ```bash
   cp .env.local.example .env.local
   ```
5. Edit the `.env.local` file with your credentials:
   - Generate a secure `NEXTAUTH_SECRET` (you can use `openssl rand -base64 32`)
   - Set your admin email and password
   - Add your AWS credentials
6. Run the development server:
   ```bash
   npm run dev
   ```
7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment to Vercel

1. Create a Vercel account if you don't have one
2. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. Login to Vercel:
   ```bash
   vercel login
   ```
4. Deploy the application:
   ```bash
   vercel
   ```
5. Add environment variables in the Vercel dashboard:
   - Go to your project settings
   - Navigate to the "Environment Variables" tab
   - Add all the variables from your `.env.local` file

## Project Structure

- `/src/app`: Next.js app router pages
- `/src/components`: Reusable React components
- `/src/context`: React context providers for state management
- `/src/app/api`: API routes for accessing DynamoDB

## Authentication

The application uses NextAuth.js for authentication. By default, it uses a simple credentials provider with an admin email and password defined in environment variables.

## License

This project is licensed under the MIT License.
