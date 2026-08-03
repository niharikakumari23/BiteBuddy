# BiteBuddy 🍽️

![License](https://img.shields.io/github/license/niharikakumari23/BiteBuddy)
![Stars](https://img.shields.io/github/stars/niharikakumari23/BiteBuddy?style=social)
![Last Commit](https://img.shields.io/github/last-commit/niharikakumari23/BiteBuddy)

## Overview

**BiteBuddy** is a modern, full‑stack web application that helps users discover, track, and share their favorite recipes. Built with a sleek **React** frontend and a **Node.js/Express** backend, it offers an intuitive UI, real‑time updates, and a pleasant dark‑mode experience.

---

## Features

- 🍳 **Recipe Management**: Create, edit, and delete recipes with rich text and image support.
- 📊 **Nutrition Insights**: Automatic calculation of calories, macros, and serving sizes.
- 🤝 **Social Sharing**: Share recipes via a unique link or directly to social platforms.
- 🌙 **Dark Mode**: Elegant dark theme with smooth transitions.
- ⚡ **Real‑time Sync**: Instant updates across devices using WebSockets.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | **React** (Vite), **CSS Modules**, **Google Fonts (Inter)** |
| Backend | **Node.js** (Express), **MongoDB**, **Mongoose** |
| Dev Tools | **Vite**, **ESLint**, **Prettier**, **Jest** |
| Deployment | **Docker**, **GitHub Actions** |

---

## Getting Started

### Prerequisites

- **Node.js** (>= 18.x)
- **npm** (or **yarn**)
- **MongoDB** (local or Atlas instance)

### Installation

```bash
# Clone the repository
git clone https://github.com/niharikakumari23/BiteBuddy.git
cd BiteBuddy

# Install dependencies for both frontend and backend
npm install        # installs root dev tools
npm run install:all   # custom script to install both sides (or run manually)
```

### Running the App

```bash
# Start the backend API
cd backend
npm run dev

# In a new terminal, start the frontend
cd ../frontend
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Usage

1. **Sign Up / Login** – Secure authentication via JWT.
2. **Add a Recipe** – Fill out the form, upload an image, and the app calculates nutrition.
3. **Explore** – Browse community recipes, filter by ingredients, or search by name.
4. **Share** – Click the share button to copy a link or post directly to social media.

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feat/awesome-feature`).
3. Commit your changes with clear messages.
4. Open a Pull Request describing the changes.

Make sure your code passes linting and tests:

```bash
npm run lint
npm test
```

---

## License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## Contact

- **Author**: [Niharika Kumari](https://github.com/niharikakumari23)
- **Project Link**: https://github.com/niharikakumari23/BiteBuddy

---



---

*Let your culinary adventures begin with BiteBuddy!*
