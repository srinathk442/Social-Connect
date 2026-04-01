# SocialConnect

A full-stack social media web application built with **Next.js**, **TypeScript**, **Supabase**, and **Tailwind CSS**. Users can register, create profiles, post content with images, like and comment on posts, and discover content through a personalized feed.

---

## 🚀 Live Demo

[Deployed on Vercel →](https://social-connect-six-taupe.vercel.app/)

---

## 📋 Features

- **JWT Authentication** — Register, login, and logout with secure token-based auth
- **User Profiles** — Bio, avatar, website, location, and follower/following counts
- **Posts** — Create, edit, and delete text posts (up to 280 characters) with optional image uploads
- **Social Interactions** — Like/unlike posts, add and delete comments
- **Personalized Feed** — Chronological feed of public posts
- **Follow System** *(Optional)* — Follow/unfollow users; feed updates to show posts from followed users
- **Image Uploads** — Profile avatars and post images stored on Supabase Storage (JPEG/PNG, max 2MB)

---

## 🛠️ Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Framework   | Next.js (App Router) + TypeScript |
| Database    | PostgreSQL via Supabase           |
| Auth        | JWT / Supabase Auth               |
| Storage     | Supabase Storage                  |
| UI          | Tailwind CSS + shadcn/ui          |
| Deployment  | Vercel / Netlify                  |

---

## ⚙️ Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Clone the repository
```bash
git clone https://github.com/your-username/socialconnect.git
cd socialconnect
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint             | Description                          |
|--------|----------------------|--------------------------------------|
| POST   | `/api/auth/register` | Register a new user                  |
| POST   | `/api/auth/login`    | Login with email or username         |
| POST   | `/api/auth/logout`   | Logout current user                  |

### Users

| Method    | Endpoint                            | Description          |
|-----------|-------------------------------------|----------------------|
| GET       | `/api/users/`                       | List all users       |
| GET       | `/api/users/{user_id}`              | Get user profile     |
| PUT/PATCH | `/api/users/me`                     | Update own profile   |
| POST      | `/api/users/{user_id}/follow`       | Follow a user        |
| DELETE    | `/api/users/{user_id}/follow`       | Unfollow a user      |
| GET       | `/api/users/{user_id}/followers`    | Get followers list   |
| GET       | `/api/users/{user_id}/following`    | Get following list   |

### Posts

| Method    | Endpoint                                        | Description            |
|-----------|-------------------------------------------------|------------------------|
| GET       | `/api/posts/`                                   | List all posts         |
| POST      | `/api/posts/`                                   | Create a post          |
| GET       | `/api/posts/{post_id}`                          | Get a single post      |
| PUT/PATCH | `/api/posts/{post_id}`                          | Update own post        |
| DELETE    | `/api/posts/{post_id}`                          | Delete own post        |
| POST      | `/api/posts/{post_id}/like`                     | Like a post            |
| DELETE    | `/api/posts/{post_id}/like`                     | Unlike a post          |
| GET       | `/api/posts/{post_id}/comments`                 | List comments          |
| POST      | `/api/posts/{post_id}/comments`                 | Add a comment          |
| DELETE    | `/api/posts/{post_id}/comments/{comment_id}`    | Delete own comment     |

### Feed

| Method | Endpoint    | Description                   |
|--------|-------------|-------------------------------|
| GET    | `/api/feed` | Get personalized/public feed  |

---

## 🗄️ Database Schema

### User
| Field        | Type         | Notes                                       |
|--------------|--------------|---------------------------------------------|
| id           | UUID         | Primary key                                 |
| email        | String       | Unique                                      |
| username     | String       | Unique, 3–30 chars, alphanumeric+underscore |
| first_name   | String       |                                             |
| last_name    | String       |                                             |
| bio          | String       | Max 160 chars                               |
| avatar_url   | String       | Stored from Supabase Storage                |
| website      | String       | Optional                                    |
| location     | String       | Optional                                    |
| created_at   | DateTime     |                                             |
| last_login   | DateTime     |                                             |

### Post
| Field         | Type      | Notes                        |
|---------------|-----------|------------------------------|
| id            | UUID      | Primary key                  |
| content       | Text      | Max 280 chars                |
| author        | FK → User |                              |
| image_url     | URL       | Optional, Supabase Storage   |
| like_count    | Integer   | Denormalized, default 0      |
| comment_count | Integer   | Denormalized, default 0      |
| is_active     | Boolean   | Default true                 |
| created_at    | DateTime  |                              |
| updated_at    | DateTime  |                              |

### Follow
| Field     | Type      | Notes                              |
|-----------|-----------|------------------------------------|
| follower  | FK → User |                                    |
| following | FK → User |                                    |
| created_at| DateTime  |                                    |
|           |           | Unique together: (follower, following) |

---

## 📁 Project Structure
```
socialconnect/
├── app/
│   ├── api/                  # API route handlers
│   │   ├── auth/
│   │   │   ├── register/
│   │   │   ├── login/
│   │   │   └── logout/
│   │   ├── users/
│   │   ├── posts/
│   │   └── feed/
│   ├── (pages)/              # Next.js page components
│   └── layout.tsx
├── components/               # Reusable UI components
├── lib/                      # Supabase client, auth helpers, utils
├── types/                    # TypeScript interfaces & types
├── public/
├── .env.local                # Environment variables (not committed)
├── .gitignore
└── README.md
```

---

## 🔒 Security

- Passwords are hashed before storage — never stored in plain text
- JWT tokens are used for all authenticated sessions
- All mutating operations (create/edit/delete) are restricted to the resource owner
- Environment variables store all credentials — committed to `.gitignore`
- No secrets are exposed in client-side code

---

## 📸 Image Handling

- Supported formats: JPEG, PNG only
- Maximum file size: 2MB per image
- Images are uploaded directly to **Supabase Storage**
- The resulting public URL is stored in the database
- Validation is enforced on both file type and size before upload

---

