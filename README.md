# Infinity Garden Resort Hotel and Pavilion Reservation System
# with React Frontend & Django Backend

---
 📋 SYSTEM OVERVIEW

This is a complete resort reservation system featuring:

# Client Features
- Browse available rooms, cottages, pavilions, and gazebos
- Make reservations (submitted as "Pending" for admin approval)
- View booking history and reservation details
- Cancel approved reservations
- Real-time room availability based on database status
- Dynamic visual states (grayscale + "Reserved" overlay for approved bookings)

# Staff Features (Accessible via hidden Ctrl+L login)
- View pending reservations for review
- Approve or reject reservations
- Add review notes
- Monitor facility utilization
- View transaction history

# Admin Features (Accessible via hidden Ctrl+L login)
- Complete user management (create staff accounts, assign roles)
- Reservation workflow management (pending → approve → confirmed)
- Facilities management
- Dynamic pricing and availability control
- Blackout date management
- Comprehensive reporting and analytics
- Payment tracking
- Report Generation

---

🔐 Hidden Admin Access

# How to Access Admin Panel

1. Keyboard Shortcut: Press `Ctrl + L` (Windows/Linux) or `Cmd + L` (Mac) anywhere on the website
2. Hidden Login Page: You'll be redirected to `/admin/login` or `/staff/login`

# Important: 
- The admin/staff login link is NOT visible in the navbar (hidden from regular users)
- Only accessible via keyboard shortcut
- After login, navbar is hidden and you're in admin/staff-only interface
- Logout returns you to home page

---


 📋 QUICK START GUIDE

# Prerequisites
- Node.js 16+ (for React frontend)
- Python 3.8+ (for Django backend)
- pip (Python package manager)

# 1. Setup Frontend (React)

```bash
cd resortreservationsystem
npm install
npm run dev
```
Frontend runs at: http://localhost:5173

# 2. Setup Backend (Django)

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# or: source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create admin superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

Backend runs at: http://localhost:8000 
Django Admin: http://localhost:8000/admin/

---

 🔄 RESERVATION FLOW

```
Client Submission → Pending Review → Admin Approval → Approved Status
                                   ↓
                            UI Updates (Grayscale + "Reserved" Label)
                            
Database Reflects Status → RoomCard Fetches Status → UI Dynamically Updates
```

📡 API ENDPOINTS

# Authentication
- `POST /api/users/register/` - Client registration
- `POST /api/users/create_staff/` - Admin creating staff
- `GET /api/users/me/` - Current user profile

# Facilities
- `GET /api/facilities/` - List all facilities
- `GET /api/facilities/{id}/` - Get facility details
- `GET /api/facilities/available/` - Available facilities by date range
- `POST /api/facilities/` - Create new facility (admin)
- `PUT /api/facilities/{id}/` - Update facility (admin)

# Reservations
- `POST /api/reservations/` - Create reservation (client)
- `GET /api/reservations/my_bookings/` - Get user's bookings
- `GET /api/reservations/pending/` - Pending for review (admin)
- `POST /api/reservations/{id}/approve/` - Approve/reject (admin)
- `POST /api/reservations/{id}/cancel/` - Cancel reservation

# Reports (Admin only)
- `GET /api/reports/reservation_summary/` - Summary statistics
- `GET /api/reports/facility_utilization/` - Facility usage
- `GET /api/reports/guest_report/` - Guest statistics

# Payments & Logs
- `GET /api/payments/` - Payment records
- `GET /api/transactions/` - Transaction audit logs

---

🛠️ TECHNOLOGY STACK

# Frontend
- React 18 (with hooks)
- React Router 6 (SPA navigation)
- CSS Modules (scoped styling)
- Fetch API (HTTP client)

# Backend
- Django 4.2 (Python web framework)
- Django REST Framework (API)
- SQLite 3 (database, upgradeable to PostgreSQL)
- CORS Headers (cross-origin requests)

---

📦 Project Structure

```
resortreservationsystem/
├── src/                          # React frontend
│   ├── components/
│   │   ├── admin/               # Admin-specific components
│   │   ├── booking/             # Booking flow components
│   │   ├── layout/              # Nav, Footer
│   │   └── ui/                  # Shared UI components
│   ├── pages/
│   │   ├── admin/               # Admin pages
│   │   └── *.jsx                # Public pages
│   ├── context/
│   │   └── BookingContext.jsx   # Global state
│   ├── utils/
│   │   ├── api.js              # API service calls
│   │   └── helpers.js          # Utilities
│   └── styles/                  # CSS modules
│
└── backend/                      # Django API
    ├── resortapi/
    │   ├── settings.py          # Django config
    │   ├── urls.py              # API routes
    │   ├── wsgi.py              # WSGI server
    │   └── __init__.py
    ├── core/
    │   ├── models.py            # Database models
    │   ├── serializers.py       # API serializers
    │   ├── views.py             # API viewsets
    │   ├── admin.py             # Admin interface config
    │   └── migrations/          # DB migrations
    ├── manage.py                # Django CLI
    ├── requirements.txt         # Python dependencies
    └── db.sqlite3              # SQLite database
```

SUMMARY:
Open two terminals:
```bash
Terminal 1: npm run dev
Terminal 2: python manage.py runserver
```

Then:
1. Visit http://localhost:5173
2. Create a booking
3. Press Ctrl+L to access admin/staff
4. Approve the booking


