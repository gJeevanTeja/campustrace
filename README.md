# CampusTrace - Lost & Found Portal

## Project Structure

```
campustrace/
├── backend/                    (Django REST Framework)
│   ├── manage.py
│   ├── requirements.txt
│   ├── campustrace_backend/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── users/
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   └── urls.py
│   ├── items/
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   └── urls.py
│   └── notifications/
│       ├── models.py
│       ├── views.py
│       ├── serializers.py
│       └── urls.py
│
└── frontend/                   (React + Bootstrap)
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js
        ├── index.js
        ├── index.css
        ├── services/
        │   └── api.js
        ├── context/
        │   └── AuthContext.js
        ├── components/
        │   ├── Navbar.jsx
        │   ├── BottomNav.jsx
        │   ├── ItemCard.jsx
        │   └── ProtectedRoute.jsx
        └── pages/
            ├── Login.jsx
            ├── Signup.jsx
            ├── Home.jsx
            ├── BrowseItems.jsx
            ├── ReportItem.jsx
            ├── ItemDetails.jsx
            ├── SearchFilters.jsx
            └── Profile.jsx
```

## Setup Instructions

### Backend
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## API Endpoints
- POST /api/auth/register/
- POST /api/auth/login/
- GET/POST /api/items/
- GET/PUT/DELETE /api/items/:id/
- GET /api/notifications/
- PUT /api/notifications/:id/read/
- GET/PUT /api/users/profile/
