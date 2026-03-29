#!/bin/bash

# Infinity Garden Resort - Complete Setup Script
# This script sets up both frontend and backend

echo "🏰 Infinity Garden Resort Reservation System Setup"
echo "=================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 16+ first."
    exit 1
fi

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.8+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ Python version: $(python --version)"
echo ""

# Setup Frontend
echo "📦 Setting up Frontend (React)..."
npm install
echo "✅ Frontend dependencies installed"
echo ""

# Setup Backend
echo "📦 Setting up Backend (Django)..."
cd backend

# Create virtual environment
echo "Creating virtual environment..."
python -m venv venv

# Activate according to OS
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows
    source venv/Scripts/activate
else
    # Mac/Linux
    source venv/bin/activate
fi

echo "Installing Python packages..."
pip install -r requirements.txt

echo "Running migrations..."
python manage.py makemigrations
python manage.py migrate

echo ""
echo "✅ Backend setup complete!"
echo ""
echo "=================================================="
echo "🎉 Setup Complete!"
echo "=================================================="
echo ""
echo "NEXT STEPS:"
echo "==========="
echo ""
echo "1. Create admin superuser:"
echo "   python manage.py createsuperuser"
echo ""
echo "2. Start Backend (from /backend folder):"
echo "   python manage.py runserver"
echo "   → Server will run at: http://localhost:8000"
echo ""
echo "3. Start Frontend (from root folder):"
echo "   npm run dev"
echo "   → Frontend will run at: http://localhost:5173"
echo ""
echo "4. Access Admin Panel:"
echo "   - Visit: http://localhost:5173"
echo "   - Press: Ctrl + L"
echo "   - Login with your superuser credentials"
echo ""
echo "5. Test the System:"
echo "   - Create a room booking as client"
echo "   - Use Ctrl+L to access admin"
echo "   - Approve the booking"
echo "   - See room status update dynamically on frontend! ✨"
echo ""
echo "=================================================="
