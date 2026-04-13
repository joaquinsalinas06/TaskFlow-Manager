# TaskFlow Manager 📋

A flexible, modern task manager built with **Next.js 16**, **TypeScript**, **Tailwind CSS**, and **Firebase**. Define your own priorities, groups, and tasks.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Create .env.local with Firebase credentials (see SETUP.md)
cp .env.local .env.local

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → Sign up → Start managing tasks!

---

## 📖 Complete Setup Guide

**See [SETUP.md](./SETUP.md)** for detailed Firebase configuration, Firestore security rules, and deployment instructions.

---

## ✨ Features

- ✅ **Dynamic Priorities** — Create and reorder custom priorities
- ✅ **Flexible Groups** — Organize tasks into user-defined groups
- ✅ **Task Management** — Create, complete, and delete tasks
- ✅ **Firebase Auth** — Email/password + Google OAuth
- ✅ **Real-time Sync** — Firestore instant updates
- ✅ **Minimalist Design** — Clean UI with Poppins + Open Sans
- ✅ **Responsive** — Desktop & mobile optimized

---

## 🎨 Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, custom design system
- **Backend**: Firebase (Auth + Firestore)
- **Deployment**: Vercel-ready

---

## 📁 Project Structure

```
src/
├── app/           # Next.js App Router pages
├── components/    # React components (auth, dashboard, tasks)
├── hooks/         # Custom React hooks (useAuth, usePriorities, etc.)
├── lib/           # Firebase init + Firestore queries
└── types/         # TypeScript interfaces
```

---

## 🔐 Security

- **Firestore Rules** — Read/write restricted to authenticated users
- **Session Persistence** — Sessions survive page reloads
- **No sensitive data in .env** — Only `NEXT_PUBLIC_*` vars on client

---

## 🚀 Deploy

Push to GitHub → Connect to Vercel → Add Firebase env vars → Done!

See [SETUP.md](./SETUP.md#-deployment-vercel) for step-by-step deployment guide.

---

## 📚 Documentation

- [SETUP.md](./SETUP.md) — Complete Firebase configuration
- [Next.js Docs](https://nextjs.org/docs)
- [Firebase Guides](https://firebase.google.com/docs)

---

**Ready to build? Follow [SETUP.md](./SETUP.md) to get started!** 🎯

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
