# Infinity Garden Resort Reservation System
## Full-Stack Implementation with React Frontend & Django Backend

---

## 📋 System Overview

This is a complete resort reservation system featuring:

### **Client Features**
- Browse available rooms, cottages, pavilions, and gazebos
- Make reservations (submitted as "Pending" for admin approval)
- View booking history and reservation details
- Cancel approved reservations
- Real-time room availability based on database status
- Dynamic visual states (grayscale + "Reserved" overlay for approved bookings)

### **Staff Features** (Accessible via hidden Ctrl+L login)
- View pending reservations for review
- Approve or reject reservations
- Add review notes
- Monitor facility utilization
- View transaction history

### **Admin Features** (Full control via dashboard)
- Complete user management (create staff accounts, assign roles)
- Reservation workflow management (pending → approve → confirmed)
- Facility and amenity management
- Dynamic pricing and availability control
- Blackout date management
- Comprehensive reporting and analytics
- Payment tracking
- Transaction audit logs

---

## 🚀 Quick Start Guide

### **Prerequisites**
- Node.js 16+ (for React frontend)
- Python 3.8+ (for Django backend)
- pip (Python package manager)

### **1. Setup Frontend (React)**

```bash
cd resortreservationsystem
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

### **2. Setup Backend (Django)**

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

Backend runs at: **http://localhost:8000**  
Django Admin: **http://localhost:8000/admin/**

---

## 🔐 Hidden Admin Access

### **How to Access Admin Panel**

1. **Keyboard Shortcut**: Press `Ctrl + L` (Windows/Linux) or `Cmd + L` (Mac) anywhere on the website
2. **Hidden Login Page**: You'll be redirected to `/admin/login`
3. **Login Credentials**:
   - Email: `admin@example.com`
   - Password: `admin123`

### **Important**: 
- The admin login link is NOT visible in the navbar (hidden from regular users)
- Only accessible via keyboard shortcut
- After login, navbar is hidden and you're in admin-only interface
- Logout returns you to home page

---

## 🗄️ Database Models

### **User Management**
- `UserProfile`: Extended user with role (client/staff/admin)
- Role-based access control
- Staff creation by admins

### **Facilities**
- `RoomType`: Type classification (Room, Cottage, Gazebo, Pavilion)
- `Facility`: Individual rooms/accommodations with amenities, pricing
- `BlackoutDate`: Maintenance/unavailability periods

### **Reservations**
- `Reservation`: Complete booking record with status workflow
  - Statuses: pending → approved → confirmed → checked_in → checked_out (or cancelled)
- `Payment`: Payment tracking and transaction records
- `TransactionLog`: Audit trail for all actions

---

## 🔄 Reservation Workflow

```
Client Submission → Pending Review → Admin Approval → Approved Status
                                   ↓
                            UI Updates (Grayscale + "Reserved" Label)
                            
Database Reflects Status → RoomCard Fetches Status → UI Dynamically Updates
```

### **Key Features**:
1. ✅ **NOT Hardcoded**: Room availability is data-driven from database
2. ✅ **Dynamic Visuals**: When approved status in DB → grayscale overlay applied
3. ✅ **Real-time**: RoomCard component fetches status from API
4. ✅ **Conflict Prevention**: System prevents double-booking

---

## 📡 API Endpoints

### **Authentication**
- `POST /api/users/register/` - Client registration
- `POST /api/users/create_staff/` - Admin creating staff
- `GET /api/users/me/` - Current user profile

### **Facilities**
- `GET /api/facilities/` - List all facilities
- `GET /api/facilities/{id}/` - Get facility details
- `GET /api/facilities/available/` - Available facilities by date range
- `POST /api/facilities/` - Create new facility (admin)
- `PUT /api/facilities/{id}/` - Update facility (admin)

### **Reservations**
- `POST /api/reservations/` - Create reservation (client)
- `GET /api/reservations/my_bookings/` - Get user's bookings
- `GET /api/reservations/pending/` - Pending for review (admin)
- `POST /api/reservations/{id}/approve/` - Approve/reject (admin)
- `POST /api/reservations/{id}/cancel/` - Cancel reservation

### **Reports** (Admin only)
- `GET /api/reports/reservation_summary/` - Summary statistics
- `GET /api/reports/facility_utilization/` - Facility usage
- `GET /api/reports/guest_report/` - Guest statistics

### **Payments & Logs**
- `GET /api/payments/` - Payment records
- `GET /api/transactions/` - Transaction audit logs

---

## 🎨 UI/UX Enhancements

### **Dynamic Reservation Status**
```jsx
// RoomCard Component
1. Fetches availability status from API
2. If approved reservation exists:
   - Apply grayscale filter (55% brightness reduction)
   - Display "Reserved" overlay label
   - Disable booking button
3. Updates in real-time when API data changes
```

### **Admin Dashboard**
- Summary statistics cards
- Quick navigation to all management features
- Pending reservation count
- Revenue tracking
- Guest analytics

### **Responsive Design**
- Mobile-friendly admin interface
- Adaptive grid layouts
- Touch-optimized buttons

---

## 📊 Key Database Queries

### **Check Room Availability**
```python
approved = Reservation.objects.filter(
    facility_id=facility_id,
    status__in=['approved', 'confirmed', 'checked_in'],
    check_in__lt=checkout_date,
    check_out__gt=checkin_date
)
is_available = not approved.exists()
```

### **Generate Reports**
```python
total_revenue = Reservation.objects.filter(
    status__in=['approved', 'confirmed', 'checked_out']
).aggregate(Sum('total_amount'))
```

---

## 🛠️ Technology Stack

### **Frontend**
- React 18 (with hooks)
- React Router 6 (SPA navigation)
- CSS Modules (scoped styling)
- Fetch API (HTTP client)

### **Backend**
- Django 4.2 (Python web framework)
- Django REST Framework (API)
- SQLite 3 (database, upgradeable to PostgreSQL)
- CORS Headers (cross-origin requests)

---

## 📝 Environment Configuration

### **Frontend** (`.env`)
```
REACT_APP_API_URL=http://localhost:8000/api
```

### **Backend** (`.env`)
```
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1,localhost:3000,localhost:5173
DATABASE_URL=sqlite:///db.sqlite3
```

---

## 🔍 Admin Panel Walkthrough

### **After Ctrl+L Login:**

1. **Dashboard** (`/admin/dashboard`)
   - Overview statistics
   - Quick access cards

2. **Reservations** (`/admin/reservations`)
   - Filter pending/approved/all
   - Review and approve bookings
   - Add review notes

3. **Users** (Upcoming)
   - Manage staff accounts
   - Assign roles
   - View client information

4. **Facilities** (Upcoming)
   - Add new rooms/facilities
   - Update pricing/amenities
   - Manage blackout dates

5. **Reports** (Upcoming)
   - Reservation summary
   - Facility utilization
   - Guest analytics

6. **Payments** (Upcoming)
   - Track payments
   - View transaction history

---

## ⚙️ Advanced Features

### **Conflict Detection**
- System prevents overlapping reservations
- Real-time availability checking
- Automatic double-booking prevention

### **Audit Trail**
- All admin actions logged in `TransactionLog`
- Timestamps and user tracking
- Complete reservation history

### **Role-Based Access**
- Client: Can only see/manage own reservations
- Staff: Can approve/manage reservations (role-limited)
- Admin: Full system access

### **Data Validation**
- Email format validation
- Date range validation (checkout > checkin)
- Guest count vs room capacity
- Maximum occupancy limits

---

## 🚦 Status Codes & Responses

### **Reservation Status Workflow**
- `pending` - Awaiting admin review (not visible on client dashboard)
- `approved` - Admin approved, triggers visual changes (grayscale + overlay)
- `confirmed` - Confirmed by guest, can show in UI
- `checked_in` - Guest has checked in
- `checked_out` - Stay completed
- `cancelled` - Cancelled by admin or guest

### **API Error Handling**
```json
{
  "error": "Facility unavailable for selected dates",
  "status": 409
}
```

---

## 📦 Project Structure

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

---

## 🐛 Troubleshooting

### **CORS Errors**
- Ensure `CORS_ALLOWED_ORIGINS` in Django settings includes frontend URL
- Default: `http://localhost:3000`, `http://localhost:5173`

### **Admin Login Not Working**
- Verify Django server is running on port 8000
- Check credentials in superuser creation
- Clear browser cache/cookies

### **Room Status Not Updating**
- Hard refresh browser (Ctrl+F5)
- Check RoomCard API call in browser DevTools Network tab
- Verify reservations are marked as "approved" in Django admin

### **Migration Errors**
```bash
# Reset database completely
python manage.py flush
python manage.py migrate

# Or create fresh migrations
python manage.py makemigrations --create
```

---

## 🔐 Security Considerations

### **For Production**:
1. ✅ Use JWT tokens instead of session auth
2. ✅ Implement rate limiting on API endpoints
3. ✅ Use HTTPS/SSL certificates
4. ✅ Set `DEBUG=False` in Django
5. ✅ Use environment variables for secrets
6. ✅ Implement 2FA for admin access
7. ✅ Use PostgreSQL instead of SQLite
8. ✅ Add request validation/sanitization

---

## 📞 Support & Maintenance

### **Common Customizations**
- Add email notifications on reservation approval
- Integrate payment gateway (Stripe, PayPal)
- SMS notifications to guests
- Multi-language support
- Advanced search/filtering

### **Future Enhancements**
- Real-time availability updates (WebSockets)
- Calendar view for staff scheduling
- Guest feedback/review system
- Mobile app (React Native)
- Advanced analytics dashboard

---

## 📄 License & Credits

This resort reservation system demonstrates full-stack development with:
- Dynamic UI state management
- Role-based access control
- Real-time data synchronization
- Professional admin interface

Built with React & Django REST Framework.

---

**Last Updated**: March 2026  
**System Version**: 1.0.0
