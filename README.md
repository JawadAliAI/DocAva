<<<<<<< HEAD
# 🤖 Talking Avatar with AI

An interactive 3D talking avatar powered by AI that can have natural conversations with users. The avatar features realistic lip-sync, facial expressions, and animations.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![Python](https://img.shields.io/badge/python-3.8%2B-blue)

## ✨ Features

- 🎭 **3D Animated Avatar** - Realistic 3D character with smooth animations
- 💬 **AI-Powered Conversations** - Natural language chat using custom AI API
- 🗣️ **Text-to-Speech** - High-quality voice synthesis using Edge TTS
- 👄 **Lip Sync** - Accurate lip synchronization using Rhubarb Lip Sync
- 😊 **Facial Expressions** - Dynamic expressions based on conversation context
- 🎤 **Voice Input** - Browser-based speech recognition (Web Speech API)
- 🔐 **User Authentication** - Firebase authentication with personalized sessions
- 📱 **Responsive Design** - Works on desktop and mobile devices

## 🏗️ Architecture

```
talking-avatar-with-ai/
├── apps/
│   ├── backend/          # Express.js API server
│   │   ├── modules/      # Custom API, lip-sync logic
│   │   ├── utils/        # TTS utilities
│   │   └── server.js     # Main server file
│   └── frontend/         # React + Vite application
│       ├── src/
│       │   ├── components/  # Avatar, Chat UI
│       │   ├── hooks/       # Speech, authentication
│       │   └── contexts/    # Auth context
│       └── public/
│           └── models/      # 3D avatar models
├── Rhubarb-Lip-Sync-*/  # Lip sync engine
└── resources/            # Additional resources

```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Python 3.8+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/talking-avatar-with-ai.git
   cd talking-avatar-with-ai
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install backend dependencies
   cd apps/backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Install Python dependencies**
   ```bash
   pip install edge-tts
   ```

4. **Set up environment variables**
   ```bash
   # Backend
   cd apps/backend
   cp .env.example .env
   # Edit .env if needed (no variables required for basic setup)

   # Frontend
   cd ../frontend
   cp .env.example .env
   # Edit .env and set VITE_API_URL=http://localhost:3000
   ```

5. **Run the application**

   **Option 1: Run both services together (from root)**
   ```bash
   npm run dev
   ```

   **Option 2: Run separately**
   ```bash
   # Terminal 1 - Backend
   cd apps/backend
   npm run dev

   # Terminal 2 - Frontend
   cd apps/frontend
   npm run dev
   ```

6. **Open your browser**
   - Navigate to `http://localhost:5173`
   - Start chatting with your avatar!

## 🌐 Deployment

See [DEPLOY.md](./DEPLOY.md) for detailed deployment instructions.

### Quick Deploy Options:

**Backend:** Railway, Render, or Heroku  
**Frontend:** Vercel, Netlify, or Railway

### Recommended Setup:
- **Backend** → Railway (includes Python support)
- **Frontend** → Vercel (optimized for React/Vite)

## 🔧 Configuration

### Custom API

The avatar uses a custom chat API. To change it, edit:
```javascript
// apps/backend/modules/customAPI.mjs
const API_BASE_URL = "https://your-api-url.com";
```

### Avatar Model

To use a different 3D avatar:
1. Export your avatar as GLB format
2. Place in `apps/frontend/public/models/`
3. Update the path in `Avatar.jsx`

### Voice Settings

Modify TTS voice in:
```python
# apps/backend/utils/tts.py
voice = "en-US-AriaNeural"  # Change to your preferred voice
```

## 📚 Tech Stack

### Frontend
- **React** - UI framework
- **Three.js** - 3D rendering
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for R3F
- **Vite** - Build tool
- **Firebase** - Authentication

### Backend
- **Express.js** - Web server
- **Node.js** - Runtime
- **Python** - TTS processing
- **Edge TTS** - Text-to-speech
- **Rhubarb Lip Sync** - Lip synchronization

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Rhubarb Lip Sync](https://github.com/DanielSWolf/rhubarb-lip-sync) - Lip sync engine
- [Edge TTS](https://github.com/rany2/edge-tts) - Text-to-speech
- [Ready Player Me](https://readyplayer.me/) - Avatar creation (if used)
- [Three.js](https://threejs.org/) - 3D graphics library

## 📧 Contact

For questions or support, please open an issue on GitHub.

## 🎯 Roadmap

- [ ] Multi-language support
- [ ] Custom avatar upload
- [ ] Voice cloning
- [ ] Emotion detection
- [ ] Screen sharing capability
- [ ] Mobile app version

---

**Made with ❤️ by [Your Name]**
=======
---
title: HealAvatar
emoji: 🐠
colorFrom: indigo
colorTo: red
sdk: static
pinned: false
app_build_command: npm run build
app_file: build/index.html
---

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
>>>>>>> 601fb1de6c4d68f8dbc1519e0193a88cdb8675f0
