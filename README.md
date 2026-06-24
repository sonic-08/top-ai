# TopAI Directory - Fedora Linux Setup

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


---


# Windows Development Setup Guide (TopAI)

Welcome! This guide is specifically designed to help Windows users avoid the common platform-specific hurdles that often occur with Node.js projects.

Follow these steps sequentially.

---

# 1. Prerequisites (Verify First)

Before cloning the repo, ensure your environment is configured correctly.

## Node.js (LTS version)

Download and install the LTS version.

**Crucial:** Check the box that says:

```
Automatically install the necessary tools
```

(includes Python/Build Tools) during setup.

**Verify:**

Open your terminal and run:

```bash
node -v

npm -v
```

If you see version numbers, you are set.

---

## Git for Windows

Download and install Git for Windows.

During installation, you can safely stick to the default settings:

```
Let Git decide
```

---

## Code Editor

VS Code is the industry standard for this project.

---

# 2. Terminal Configuration

We recommend using the Integrated Terminal inside VS Code.

1. Open VS Code.

2. Press:

```
Ctrl + `
```

(backtick) to open the terminal.

3. If it defaults to:

```
Command Prompt
```

click the small dropdown arrow and select:

```
PowerShell
```

or

```
Git Bash
```

---

# 3. Step-by-Step Setup

## Step A: Clone and Install

1. In your terminal, navigate to the folder where you want to keep your projects:

Example:

```bash
cd Documents
```

2. Run:

```bash
git clone https://github.com/sonic-08/top-ai.git

cd top-ai

npm install
```

**Note:**

You may see a warning about:

```
fsevents being skipped
```

This is completely normal and expected, as `fsevents` is only for macOS.

---

# Step B: The .env File (Avoiding Common Traps)

Windows often hides file extensions, which causes the app to fail when it looks for:

```
.env
```

but finds:

```
.env.txt
```

instead.

1. Open your project folder in VS Code.

2. In File Explorer, go to:

```
View
```

and ensure:

```
File name extensions
```

is checked.

3. In VS Code:

```
Right-click file explorer area

→ New File
```

4. Name it exactly:

```env
.env
```

If you see:

```
.txt
```

suffix, rename it.

5. Paste your Firebase keys as provided in the main README.md.

---

# 4. Troubleshooting Windows-Specific Errors

---

## "Script execution is disabled on this system"

If you get this error when running:

```bash
npm run dev
```

your Windows PowerShell has a security restriction on running scripts.

### Fix:

1. Open PowerShell as Administrator.

2. Run:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

3. Type:

```
Y
```

and hit Enter.

---

# "npm : The term 'npm' is not recognized"

This usually happens because the system PATH hasn't updated since you installed Node.js.

Fix:

1. Save your work in all open programs.

2. Restart VS Code completely.

3. If that fails, restart your computer.

The installation needs a system refresh to recognize the npm command.

---

# "Permission Denied" Errors

If you are running:

```bash
npm install
```

and get a permission error:

Ensure:

1. No other terminal or application is using the:

```
node_modules
```

folder.

2. You are not running the terminal as a different user than the one who installed Node.js.

3. Try:

```bash
npm cache clean --force
```

Then run:

```bash
npm install
```

again.

---

# 5. Running the Application

Once the steps above are completed:

1. Ensure your `.env` file is in the root directory.

2. Start the dev server:

```bash
npm run dev
```

3. Open:

```
http://localhost:5173
```

in your browser.

---
