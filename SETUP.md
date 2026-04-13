# TaskFlow Manager 📋

A flexible, modern task management application built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Firebase**. Users define their own priorities, groups, and tasks—no hardcoded structures.

## 🎯 Features

✅ **Dynamic Priorities** — Create, reorder, and manage custom priorities  
✅ **Flexible Groups** — Organize tasks into user-defined groups  
✅ **Task Management** — Create, complete, and delete tasks  
✅ **Firebase Auth** — Email/password + Google OAuth with persistent sessions  
✅ **Real-time Firestore** — Instant data sync across devices  
✅ **Minimalist Design** — Clean, modern UI with teal/orange accent colors  
✅ **Responsive** — Works on desktop and mobile  

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Firebase project (free tier OK)
- Google OAuth credentials (optional, for Google sign-in)

### 1. Install & Setup

```bash
# Clone/navigate to project
cd Task\ Manager

# Install dependencies (already done, but just in case)
npm install

# Create .env.local with Firebase config
cp .env.local.template .env.local
# OR manually create .env.local (see section below)
```

### 2. Configure Firebase

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Click "Create a new project"
   - Enable Google Analytics (optional)
   - Create project

2. **Get Firebase Credentials**:
   - In Firebase Console → Project Settings → General tab
   - Scroll down to "Your apps"
   - Click "Web" icon (</> button)
   - Copy the Firebase config object
   - Paste values into `.env.local`

3. **Enable Authentication**:
   - Left sidebar → Authentication
   - Sign-in method → Email/Password → Enable → Save
   - Sign-in method → Google → Enable → Add your project name → Save
   - (Optional) Copy OAuth credentials from Google Cloud Console if needed

4. **Create Firestore Database**:
   - Left sidebar → Firestore Database
   - Click "Create database"
   - Start in **production mode** (we'll set rules below)
   - Choose region closest to you
   - Click "Create"

5. **Set Firestore Security Rules**:
   - In Firestore (left sidebar → Firestore Database → Rules tab)
   - Replace with rules below:

```firestore
rules_version = '3';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // Allow read/write only to authenticated users
      allow read, write: if request.auth != null;
    }
  }
}
```

---

### 3. Configure .env.local

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Where to find these:**
- Open [Firebase Console](https://console.firebase.google.com)
- Select your project
- Click ⚙️ (Project Settings)
- Go to "General" tab
- Scroll to "Your apps" section
- Click the "Web" app (or create one if not exists)
- Copy the `firebaseConfig` object

---

### 4. Run Development Server

```bash
npm run dev
```

Server will start at **http://localhost:3000**

- **First visit** → Redirects to `/auth`
- **Sign up/Log in** → Creates Firebase Auth user + Firestore collections
- **Redirects to `/dashboard`** → Your task manager!

---

## 📁 Project Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── page.tsx (login/signup page)
│   │   └── layout.tsx
│   ├── dashboard/
│   │   ├── page.tsx (main dashboard)
│   │   └── layout.tsx (auth guard)
│   ├── layout.tsx (root layout)
│   ├── page.tsx (redirect to /auth)
│   └── globals.css (typography + design tokens)
│
├── components/
│   ├── auth/
│   │   └── LoginForm.tsx
│   ├── dashboard/
│   │   ├── Sidebar.tsx
│   │   └── MainContent.tsx
│   ├── priority/
│   │   ├── PriorityColumn.tsx
│   │   ├── PriorityList.tsx
│   │   └── CreatePriorityForm.tsx
│   ├── group/
│   │   ├── GroupSection.tsx
│   │   └── CreateGroupForm.tsx
│   └── task/
│       ├── TaskItem.tsx
│       └── CreateTaskForm.tsx
│
├── hooks/
│   ├── useAuth.ts (Firebase auth + login/logout)
│   ├── usePriorities.ts (priorities CRUD)
│   ├── useGroups.ts (groups CRUD)
│   └── useTasks.ts (tasks CRUD)
│
├── lib/
│   ├── firebase.ts (Firebase initialization)
│   └── firestore.ts (Firestore queries)
│
├── types/
│   └── index.ts (TypeScript interfaces)
│
├── tailwind.config.ts (design tokens)
└── .env.local (Firebase credentials)
```

---

## 🎨 Design System

### Colors (Tailwind Custom)
- **Primary (Teal)**: `#0D9488`
- **Accent (Orange)**: `#F97316`
- **Background (Off-white)**: `#F8FAFC`
- **Border**: `#E2E8F0`
- **Text Dark**: `#1E293B`
- **Text Muted**: `#64748B`

### Typography
- **Headings**: Poppins, 600 weight
- **Body**: Open Sans, 400 weight
- **Grid**: 8px spacing system

### Effects
- Hover/Focus: 200ms smooth transitions
- Shadow: Subtle (0 1px 2px), hover to medium (0 4px 6px)
- No excessive animations

---

## 🔐 Firestore Collections Schema

### `priorities/{priorityId}`
```ts
{
  userId: string;
  name: string;
  order: number; // 0, 1, 2... (for sorting)
  createdAt: Timestamp;
}
```

### `groups/{groupId}`
```ts
{
  userId: string;
  name: string;
  createdAt: Timestamp;
}
```

### `tasks/{taskId}`
```ts
{
  userId: string;
  title: string;
  priorityId: string; // FK → priorities
  groupId: string;    // FK → groups
  completed?: boolean;
  createdAt: Timestamp;
}
```

---

## 🚀 Deployment (Vercel)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial TaskFlow setup"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [Vercel](https://vercel.com)
   - Click "Import Project"
   - Select GitHub repo
   - Import

3. **Add Environment Variables**:
   - Vercel dashboard → Settings → Environment Variables
   - Add all `NEXT_PUBLIC_FIREBASE_*` vars from `.env.local`
   - Redeploy

4. **Done!** App is live

---

## 🧪 Testing the App

### Signup Flow
1. Go to http://localhost:3000 (redirects to /auth)
2. Click "Sign up" tab
3. Enter email + password
4. Click "Sign Up"
5. → Redirected to dashboard

### Create Priority
1. Sidebar → "+ New Priority"
2. Enter priority name (e.g., "Urgent", "Important")
3. Click "Add"
4. Priority appears in list with ↑↓ reorder buttons

### Create Group
1. Sidebar → "+ New Group"
2. Enter group name (e.g., "Work", "Personal")
3. Click "Add"
4. Group appears in list

### Create Task
1. Main content → "+ New Task" button
2. Fill: Title, Priority, Group
3. Click "Create Task"
4. Task appears under [Priority] → [Group]

### Complete Task
- Click checkbox next to task to toggle completion

### Delete Task
- Hover over task → Click ✕ button

---

## 📝 Commands

```bash
# Development server
npm run dev          # http://localhost:3000

# Production build
npm run build        # Creates optimized bundle
npm run start        # Run production build

# Linting
npm run lint         # Check for code issues
```

---

## 🐛 Troubleshooting

**"Firebase app not initialized"**
- ✅ Check `.env.local` has all Firebase credentials
- ✅ Restart `npm run dev` after adding .env.local
- ✅ Credentials must start with `NEXT_PUBLIC_` to be exposed to client

**"Permission denied" on Firestore**
- ✅ Check Firestore Rules (see Setup section)
- ✅ Ensure user is authenticated (check /auth login)
- ✅ Collections must have userId field matching authenticated user

**"Google sign-in not working"**
- ✅ Verify Google OAuth enabled in Firebase → Authentication
- ✅ Check `firebaseConfig.authDomain` matches Firebase project
- ✅ Google OAuth may need redirect URIs configured

**Tailwind colors not applying**
- ✅ Restart dev server (`npm run dev`) after modifying `tailwind.config.ts`
- ✅ Use custom color names: `bg-primary`, `text-accent`, etc.

---

## 📚 Documentation

- [Next.js 16 Docs](https://nextjs.org/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Firebase Hooks](https://github.com/CSFrequency/react-firebase-hooks)

---

## 📄 License

This project is open source and available under the MIT License.

---

## ✨ What's Next?

After setup, consider:
- 📱 Add mobile sidebar collapse
- 🎨 Add light/dark mode toggle
- 🔔 Add task reminders/notifications
- 🏷️ Add tags to tasks
- 📊 Add task analytics/stats
- ☑️ Add task templates
- 🔄 Add drag-and-drop reordering

**Happy task managing! 🚀**
