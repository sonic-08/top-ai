# TopAI Directory

A high-performance, community-driven AI tool registry. Built for scale, this directory allows users to search, filter, discover, and discuss the latest artificial intelligence applications.

## 🚀 Features

- **Dynamic Search:** Real-time search across 1,000+ AI tool entries.

- **Categorization:** Smart filtering by categories (Writing, Coding, Image Gen, etc.) and pricing models.

- **Community Engagement:** Real-time bookmarking, voting, and comment system powered by Firebase.

- **Responsive UI:** Built with React, Vite, and Tailwind CSS for a seamless desktop and mobile experience.

---

## 🛠 Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Lucide React

- **Backend/Database:** Firebase Firestore (NoSQL)

- **Authentication:** Firebase Anonymous Auth

- **Deployment:** Vercel

---

## 📦 Local Setup Instructions

### Prerequisites

- Node.js installed (v18 or higher recommended).

- A Firebase project (Firebase Console).

---

## 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/sonic-08/top-ai.git
cd top-ai
npm install
```

---

## 2. Firebase Configuration (Mandatory)

To enable real-time features like bookmarking and commenting, you need to connect your own Firebase project.

1. **Create Firebase Project:** Go to the Firebase Console and create a new project.

2. **Add Web App:** In the Project Overview, click Add App (`</>`) and register a web app.

3. **Get Keys:** Firebase will provide a `firebaseConfig` object. Copy these values.

4. **Create .env File:** Create a `.env` file in the root directory and add your keys using the following format:

```env
VITE_FIREBASE_API_KEY="your_api_key"
VITE_FIREBASE_AUTH_DOMAIN="your_project_id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your_project_id"
VITE_FIREBASE_STORAGE_BUCKET="your_project_id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
VITE_FIREBASE_APP_ID="your_app_id"
```

5. **Enable Services:** In the Firebase Console, go to Authentication and enable Anonymous sign-in. Then, go to Firestore Database and create a database in Test Mode.

---

## 3. Run Locally

Start the development server:

```bash
npm run dev
```

The app will be available at:

```
http://localhost:5173
```

---

## 🔒 Database Security

This project uses Firebase Firestore. Ensure you have published the following Security Rules in your Firebase Console under:

```
Firestore Database > Rules
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

## 🚀 Deployment

This project is configured for seamless deployment on Vercel.

1. Push your code to a GitHub repository.

2. Connect your repository to Vercel.

3. Ensure you add the environment variables (`VITE_FIREBASE_*`) in the Vercel dashboard under:

```
Project Settings > Environment Variables
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an Issue if you find a bug or want to request a new feature.

---

## 📄 License

This project is open-source and available for anyone to use.
