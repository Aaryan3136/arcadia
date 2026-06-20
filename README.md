# Arcadia — Anime & Gaming Discovery Platform

A modern full-stack Anime & Gaming Discovery Platform built using HTML, CSS, JavaScript, Node.js, Express.js, MongoDB, and Jikan API.

Arcadia allows users to explore trending anime and games, create accounts, manage favorites, and enjoy a responsive community-driven interface.

---

## Features

### User Authentication

* User Signup
* User Login
* User Authentication System
* Protected Favorites System
* Secure Password Storage

### Anime Discovery

* Live Anime Data using Jikan API
* Trending Anime Listings
* Anime Details Modal
* MyAnimeList Integration

### Gaming Section

* Curated Popular Games
* Game Information Cards
* External Store Links

### Favorites System

* Add Anime/Games to Favorites
* Remove Favorites
* Persistent Storage using MongoDB
* Favorites Dashboard
* Search and Filter Favorites

### UI & Experience

* Fully Responsive Design
* Dark / Light Theme Toggle
* Animated Counters
* Search Functionality
* Category Filters
* Sorting Options
* Toast Notifications
* Modern Modal Interface

---

## Tech Stack

### Frontend

* HTML5
* CSS3
* Vanilla JavaScript

### Backend

* Node.js
* Express.js

### Database

* MongoDB Atlas

### Authentication

*  Login & Signup

### External API

* Jikan API (MyAnimeList API)

---

## Project Structure

```text
Arcadia
│
├── Backend
│   ├── data
│   │   └── favorites.js
│   │
│   ├── models
│   │   ├── User.js
│   │   └── Favorite.js
│   │
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── css
│   ├── style.css
│   ├── auth.css
│   ├── animations.css
│   └── ux-polish.css
│
├── js
│   ├── api.js
│   ├── auth.js
│   ├── data.js
│   ├── favorites.js
│   ├── main.js
│   ├── nav.js
│   └── ui.js
│
├── index.html
├── login.html
├── signup.html
├── favorites.html
└── README.md
```

---

## Key Functionalities

### Authentication Flow

1. User creates account
2. User logs in
3. MongoDB User Storage
4. User session is maintained
5. Favorites are linked to authenticated users

### Favorites Management

* Add anime to favorites
* Add games to favorites
* View all favorites
* Filter by category
* Search saved content
* Remove saved items

### Anime Integration

* Fetches anime data from Jikan API
* Displays ratings, genres, descriptions, and metadata
* Links directly to MyAnimeList

---

## Responsive Design

The application is optimized for:

* Mobile Devices
* Tablets
* Laptops
* Desktop Screens

---

## Future Improvements

* User Profiles
* Community Discussions
* Watchlists
* Personalized Recommendations
* Reviews & Ratings
* Social Features

---

## Screenshots

* Home Page
* Anime Section
* Favorites Dashboard
* Login & Signup Pages

(Add screenshots after deployment)

---

## Author

### Aaryan Hirani

LinkedIn:
https://www.linkedin.com/in/aaryan-hirani-a43029294

GitHub:
https://github.com/Aaryan3136

---

## License

This project was created for learning, portfolio building, internship applications, and placement preparation.
