# Dev-Jobs 💼

A modern, full-stack job platform built with Next.js, designed to connect developers with their dream opportunities. This platform provides a seamless experience for both job seekers and employers in the tech industry.

## 🚀 Features

### For Job Seekers
- **Profile Management**: Create and customize your developer profile
- **Job Search & Filtering**: Advanced search with filters location, salary
- **Application Tracking**: Keep track of your job applications and their status
- 
### For Employers
- **Company Profiles**: Create detailed company pages to attract top talent
- **Job Posting Management**: Easy-to-use job posting interface with rich text editing
- **Candidate Search**: Search and filter through developer profiles
- **Application Management**: Streamlined hiring workflow and candidate tracking
- **Analytics Dashboard**: Insights into job posting performance and applicant metrics

### Platform Features
- **Real-time Notifications**: Instant updates on applications, messages, and job matches
- **Messaging System**: Direct communication between employers and candidates
- **Advanced Search**: Powerful search capabilities with multiple filter options
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Mode**: Theme switching for better user experience

## 🛠️ Tech Stack

### Frontend
- **Next.js 15+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Modern component library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Database management and migrations
- **PostgreSQL** - Primary database
- **NextAuth.js** - Authentication and authorization

### Additional Tools
- **Vercel** - Deployment and hosting
- **Uploadthing** - File upload management
- **Resend** - Email service
- **Stripe** - Payment processing (for premium features)
- **Geist Font** - Modern typography

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm/bun
- PostgreSQL database

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/reckless-sherixx/Dev-Jobs.git
   cd Dev-Jobs
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Environment Configuration**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/devjobs"
   
   # NextAuth
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   
   # OAuth Providers (optional)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   GITHUB_CLIENT_ID="your-github-client-id"
   GITHUB_CLIENT_SECRET="your-github-client-secret"
   
   # Email Service
   RESEND_API_KEY="your-resend-api-key"
   
   # File Upload
   UPLOADTHING_SECRET="your-uploadthing-secret"
   UPLOADTHING_APP_ID="your-uploadthing-app-id"
   
   # Stripe (optional)
   STRIPE_SECRET_KEY="your-stripe-secret-key"
   STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma db push
   
   # Seed the database (optional)
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 🗂️ Project Structure

```
Dev-Jobs/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Dashboard routes
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── ui/               # UI components
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── lib/                  # Utility functions
│   ├── auth.ts           # Authentication config
│   ├── db.ts             # Database connection
│   └── utils.ts          # Helper functions
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Prisma schema
│   └── seed.ts           # Database seeding
├── public/               # Static assets
├── types/                # TypeScript type definitions
└── config files         # Various configuration files
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to [Vercel](https://vercel.com)
2. **Configure environment variables** in the Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy your application

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## 📝 API Routes

### Authentication
- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signout` - User sign out

### Jobs
- `GET /api/jobs` - Get all jobs with filtering
- `POST /api/jobs` - Create new job posting
- `GET /api/jobs/[id]` - Get specific job details
- `PUT /api/jobs/[id]` - Update job posting
- `DELETE /api/jobs/[id]` - Delete job posting

### Applications
- `POST /api/applications` - Submit job application
- `GET /api/applications` - Get user applications
- `PUT /api/applications/[id]` - Update application status

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/upload-resume` - Upload resume

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add some amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
- Follow the existing code style and conventions
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Vercel](https://vercel.com/) for hosting and deployment
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Shadcn/ui](https://ui.shadcn.com/) for the beautiful component library


---

**Made with ❤️ by [reckless-sherixx](https://github.com/reckless-sherixx)**
