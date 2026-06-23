# TopAI Directory 🚀

A high-performance, community-driven AI tool registry built for scale.

TopAI Directory allows users to search, filter, discover, bookmark, vote, and discuss the latest artificial intelligence applications through a fast and modern web experience.

---

## 🚀 Features

### 🔍 Dynamic Search
- Real-time search across **1,000+ AI tool entries**.
- Quickly discover AI applications based on name, category, and use case.

### 🗂 Categorization
- Smart filtering system by:
  - Categories:
    - Writing
    - Coding
    - Image Generation
    - Productivity
    - Research
    - More

  - Pricing models:
    - Free
    - Freemium
    - Paid

### 👥 Community Engagement
Powered by Firebase:

- Bookmark AI tools
- Vote for useful applications
- Comment and discuss tools in real time

### 📱 Responsive UI
A seamless experience across:

- Desktop
- Tablet
- Mobile

Built with:

- React
- Vite
- Tailwind CSS

---

# 🛠 Tech Stack

## Frontend

- React
- Vite
- Tailwind CSS
- Lucide React

## Backend / Database

- Firebase Firestore (NoSQL)

## Authentication

- Firebase Anonymous Auth

## Deployment

- Vercel

---

# 📦 Local Setup Instructions

## Prerequisites

Make sure you have:

- Node.js installed  
  Recommended:

```bash
Node.js v18+
```

- A Firebase project created in Firebase Console

---

# ⚙️ Installation

Clone the repository:

```bash
git clone https://github.com/sonic-08/top-ai.git
```

Navigate into the project folder:

```bash
cd top-ai
```

Install dependencies:

```bash
npm install
```

---

# 🔑 Environment Configuration

Create a `.env` file in the root directory:

```bash
touch .env
```

Add your Firebase configuration:

```env
VITE_FIREBASE_API_KEY="your_api_key"

VITE_FIREBASE_AUTH_DOMAIN="your_project_id.firebaseapp.com"

VITE_FIREBASE_PROJECT_ID="your_project_id"

VITE_FIREBASE_STORAGE_BUCKET="your_project_id.appspot.com"

VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"

VITE_FIREBASE_APP_ID="your_app_id"
```

Replace these values with your Firebase project credentials.

---

# ▶️ Run Locally

Start the development server:

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:5173
```

---

# 🔒 Database Security

This project uses Firebase Firestore.

Add the following security rules:

Firebase Console:

```text
Firestore Database
        ↓
Rules
```

```javascript
rules_version = '2';

service cloud.firestore {

  match /databases/{database}/documents {


    match /artifacts/{appId}/tools/{toolId} {

      allow read: if true;

    }


    match /artifacts/{appId}/tools/{toolId}/comments/{commentId} {

      allow read, write: if true;

    }


    match /artifacts/{appId}/users/{userId}/bookmarks/{bookmarkId} {

      allow read, write: if request.auth != null 
      && request.auth.uid == userId;

    }

  }

}
```

---

# 🚀 Deployment

This project is configured for seamless deployment using Vercel.

## Deployment Steps

1. Push your code to GitHub.

2. Connect your repository with Vercel.

3. Add your Firebase environment variables:

```text
Project Settings
        ↓
Environment Variables
```

Add:

```env
VITE_FIREBASE_*
```

4. Deploy your application.

---

# 🤝 Contributing

Contributions are welcome.

If you want to improve TopAI Directory:

1. Fork the repository.

2. Create a feature branch:

```bash
git checkout -b feature-name
```

3. Commit your changes:

```bash
git commit -m "Added new feature"
```

4. Push your branch:

```bash
git push origin feature-name
```

5. Open a Pull Request.

You can also open an Issue for:

- Bug reports
- Feature requests
- Suggestions

---

# 📄 License

This project is open-source and available for anyone to use.

---

# ⭐ TopAI Directory

Discover. Compare. Discuss.

Your community-powered hub for exploring the future of AI tools.  
