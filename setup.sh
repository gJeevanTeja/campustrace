#!/bin/bash
# =========================================
# CampusTrace Complete Setup Script
# =========================================

echo "🚀 Setting up CampusTrace Lost & Found Portal..."

# ── BACKEND SETUP ────────────────────────────────────────
echo ""
echo "📦 Setting up Django Backend..."

cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations users
python manage.py makemigrations items
python manage.py makemigrations notifications
python manage.py migrate

# Create superuser (optional)
echo ""
echo "👤 Creating admin user (optional - press Ctrl+C to skip)"
python manage.py createsuperuser --email admin@university.edu --noinput || true

# Start backend server
echo ""
echo "✅ Backend ready! Starting server..."
python manage.py runserver &

cd ..

# ── FRONTEND SETUP ────────────────────────────────────────
echo ""
echo "⚛️  Setting up React Frontend..."

cd frontend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
REACT_APP_API_URL=http://localhost:8000/api
EOF

# Start frontend
echo ""
echo "✅ Frontend ready! Starting..."
npm start

echo ""
echo "==========================================="
echo "🎉 CampusTrace is running!"
echo "==========================================="
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8000"
echo "Admin:    http://localhost:8000/admin"
echo "==========================================="
