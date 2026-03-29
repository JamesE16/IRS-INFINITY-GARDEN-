# COMPLETE DJANGO BACKEND CODE SUMMARY

## Directory Structure
```
backend/
├── manage.py                           # Django CLI
├── requirements.txt                    # Python dependencies  
├── db.sqlite3                          # Database (created after migration)
└── resortapi/
    ├── settings.py                     # Django configuration
    ├── urls.py                         # URL routing + API endpoints
    ├── wsgi.py                         # WSGI application
    ├── __init__.py
    └── core/
        ├── models.py                   # Database models (8 models)
        ├── serializers.py              # DRF serializers (10+ classes)
        ├── views.py                    # ViewSets/API logic (8 viewsets)
        ├── admin.py                    # Django admin configuration
        ├── apps.py                     # App configuration
        ├── __init__.py
        └── migrations/
            └── __init__.py
```

---

## Key Files

### 1. requirements.txt
Python dependencies to install:
```
Django==4.2.0
djangorestframework==3.14.0
django-cors-headers==4.0.0
python-dotenv==1.0.0
Pillow==9.5.0
```

### 2. resortapi/settings.py
Main Django configuration with:
- INSTALLED_APPS: rest_framework, corsheaders, core
- DATABASES: SQLite (can switch to PostgreSQL)
- CORS_ALLOWED_ORIGINS: localhost:3000, localhost:5173
- REST_FRAMEWORK: SessionAuthentication

### 3. resortapi/urls.py
API routing:
- `/api/users/` - User management
- `/api/profiles/` - User profiles
- `/api/room-types/` - Room type lookups
- `/api/facilities/` - Room/facility management
- `/api/blackout-dates/` - Maintenance dates
- `/api/reservations/` - Bookings (core functionality)
- `/api/payments/` - Payment tracking
- `/api/reports/` - Analytics & reports
- `/api/transactions/` - Audit logs

### 4. resortapi/core/models.py
8 Database Models:

#### UserProfile
```python
- Extends Django User
- Roles: client, staff, admin
- phone, address fields
- Timestamps (created_at, updated_at)
```

#### RoomType
```python
- name (Standard Room, Cottage, Gazebo, Pavilion)
- description
```

#### Facility (Room/Cottage/Gazebo/Pavilion)
```python
- external_id (unique identifier)
- name, description
- room_type (ForeignKey)
- max_guests, size_sqm, beds
- price_per_night
- amenities (JSON array)
- features (JSON array)
- image_url
- is_active (boolean)
- availability_status computed property
```

#### BlackoutDate (Maintenance Periods)
```python
- facility (ForeignKey to Facility)
- start_date, end_date
- reason (string: "Maintenance", etc)
- created_by (ForeignKey to User)
```

#### Reservation (CORE - Guest Bookings)
```python
- booking_id (unique, auto-generated: BK{timestamp})
- facility (ForeignKey)
- guest (ForeignKey to User)
- guest_name, guest_email, guest_phone
- check_in, check_out (dates)
- num_guests
- special_requests
- nights, subtotal, tax_amount, total_amount
- STATUS: pending → approved → confirmed → checked_in → checked_out (or cancelled)
- reviewed_by (ForeignKey to User/Admin)
- review_notes
- availability_status computed property
```

#### Payment
```python
- reservation (OneToOne)
- amount
- payment_method: credit_card, debit_card, bank_transfer, cash, online
- transaction_id (unique)
- status: pending, completed, failed, refunded
- paid_at timestamp
```

#### TransactionLog (Audit Trail)
```python
- user (ForeignKey - who performed action)
- action: reservation_created, reservation_approved, reservation_cancelled, payment_received, etc
- reservation (ForeignKey, nullable)
- details (JSON)
- created_at (readonly)
```

---

### 5. resortapi/core/serializers.py
10+ Serializer Classes for data validation/transformation:

#### User Serializers
- `UserSerializer` - Full user info
- `UserProfileSerializer` - Profile with role
- `UserCreateSerializer` - Client/staff registration

#### Facility Serializers
- `RoomTypeSerializer` - Room type info
- `FacilitySerializer` - Complete facility with availability_status computed field
- `BlackoutDateSerializer` - Maintenance dates

#### Reservation Serializers
- `ReservationListSerializer` - Simplified for list views
- `ReservationDetailSerializer` - Full details with facility info
- `ReservationCreateSerializer` - Client booking submission
- `ReservationApproveSerializer` - Admin approval (status + notes)

#### Other Serializers
- `PaymentSerializer` - Payment info with booking reference
- `ReservationReportSerializer` - Report data
- `TransactionLogSerializer` - Audit log entries

---

### 6. resortapi/core/views.py
8 ViewSets with 30+ API endpoints:

#### UserViewSet
```python
@action POST /api/users/register/
  - Anyone can register as client
  
@action POST /api/users/create_staff/
  - Admin only, creates staff accounts
  
@action GET /api/users/me/
  - Get current logged-in user
  
@action POST /api/users/{id}/set_role/
  - Admin changes user role
```

#### UserProfileViewSet
```python
- Standard CRUD for user profiles
- Clients see only their own
- Staff see all
```

#### RoomTypeViewSet
```python
- List room types (Room, Cottage, Gazebo, Pavilion)
- Anyone can access (AllowAny)
```

#### FacilityViewSet
```python
GET /api/facilities/
  - List all active facilities

GET /api/facilities/{id}/
  - Get facility details with availability_status

GET /api/facilities/available/
  - Query params: check_in, check_out, type
  - Returns facilities WITHOUT approved reservations for date range

POST /api/facilities/
  - Admin creates facility

PUT /api/facilities/{id}/
  - Admin updates facility

GET /api/facilities/{id}/reservations/
  - Get all reservations for facility
```

#### BlackoutDateViewSet
```python
- Admin only
- Create/manage maintenance periods
- Prevents bookings during blackout dates
```

#### ReservationViewSet (CORE)
```python
POST /api/reservations/
  - Client creates booking (status=pending)
  - System checks conflict before creation
  - Generates unique booking_id

GET /api/reservations/
  - Clients see own reservations
  - Staff see all

GET /api/reservations/my_bookings/
  - Client's bookings

GET /api/reservations/pending/ (admin)
  - Reservations awaiting approval

POST /api/reservations/{id}/approve/ (admin)
  - Admin approves/rejects with notes
  - Changes status to approved/cancelled
  - Logs transaction

POST /api/reservations/{id}/cancel/
  - Guest or admin cancels

GET /api/reservations/by_date_range/ (admin)
  - Get reservations for date range
```

#### PaymentViewSet
```python
GET /api/payments/
  - List all payments (admin)

GET /api/payments/by_status/
  - Filter by status (pending, completed, failed, refunded)
```

#### ReportViewSet
```python
GET /api/reports/reservation_summary/
  - total_reservations, approved_count, pending_count, cancelled_count
  - total_revenue, average_booking_value

GET /api/reports/facility_utilization/
  - Reservations and revenue per facility

GET /api/reports/guest_report/
  - total_guests, repeat_guests, new_guests
```

#### TransactionLogViewSet
```python
GET /api/transactions/
  - All transaction logs (admin)

GET /api/transactions/by_action/
  - Filter by action type
```

---

### 7. resortapi/core/admin.py
Django Admin Configuration:

Registers all 7 models with:
- `list_display` - What columns show in list view
- `list_filter` - Filtering options
- `search_fields` - Searchable fields
- `readonly_fields` - Read-only fields (timestamps)

Example - ReservationAdmin:
```python
list_display = ['booking_id', 'facility', 'guest_name', 'check_in', 'check_out', 'status', 'total_amount']
list_filter = ['status', 'created_at', 'check_in']
search_fields = ['booking_id', 'guest_name', 'guest_email']
```

Access at: http://localhost:8000/admin

---

## API Workflow Example: Guest Makes Reservation

```
1. Client browser calls: POST /api/reservations/
   {
     "facility": 1,
     "guest_name": "John Doe",
     "guest_email": "john@example.com",
     "guest_phone": "1234567890",
     "check_in": "2026-04-01",
     "check_out": "2026-04-05",
     "num_guests": 2,
     "nights": 4,
     "subtotal": "2000.00",
     "tax_amount": "400.00",
     "total_amount": "2400.00"
   }

2. ReservationViewSet.create() checks for conflicts:
   - Query: Reservation.objects.filter(
       facility=1,
       check_in < '2026-04-05',
       check_out > '2026-04-01',
       status='approved'
     )
   - If exists: return 409 Conflict

3. If no conflict:
   - booking_id = "BK1234567890"
   - Create Reservation with status='pending'
   - Create TransactionLog('reservation_created')
   - Return ReservationDetailSerializer

4. Response:
   {
     "id": 1,
     "booking_id": "BK1234567890",
     "facility": {...},
     "status": "pending",
     "total_amount": 2400.00,
     ...
   }

5. Admin reviews in AdminDashboard:
   GET /api/reservations/pending/
   - Shows all pending reservations

6. Admin approves:
   POST /api/reservations/1/approve/
   {
     "status": "approved",
     "review_notes": "Approved - prepaid"
   }

7. System updates:
   - Reservation.status = 'approved'
   - Reservation.reviewed_by = admin_user
   - Create TransactionLog('reservation_approved')
   - Frontend fetches updated facility status
   - RoomCard shows "Reserved" overlay

8. Frontend detects change:
   GET /api/facilities/1/
   - availability_status { is_available: false, current_reservation: {...} }
   - RoomCard applies grayscale filter + overlay

```

---

## Setup Commands

```bash
# 1. Create virtual environment
python -m venv venv

# 2. Activate (Windows)
venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run migrations
python manage.py migrate

# 5. Create admin user
python manage.py createsuperuser
# Email: admin@infinitygarden.com
# Password: admin123

# 6. Run server
python manage.py runserver
# Server at: http://localhost:8000

# 7. Access admin
# http://localhost:8000/admin
# Create test data, add facilities, make test bookings
```

---

## Authentication

Currently uses **Django Session Authentication**:
- Login credentials sent to `POST /api/auth/login/`
- Session ID stored in cookie
- Subsequent requests include `credentials: 'include'`

For production, migrate to **JWT tokens**:
```bash
pip install djangorestframework-simplejwt
```

---

## Key Features

✅ **8 Database Models** - Complete data structure
✅ **7 ViewSets** - 30+ API endpoints
✅ **Role-Based Access** - client/staff/admin permissions
✅ **Reservation Workflow** - pending → approved → confirmed → checked-in → checked-out
✅ **Conflict Detection** - Prevents double bookings
✅ **Availability Computation** - API-driven, not hardcoded
✅ **Audit Trail** - TransactionLog tracks all actions
✅ **Reporting** - Revenue, utilization, guest statistics
✅ **Admin Interface** - Django admin for data management
✅ **CORS Enabled** - Works with frontend on different ports

---

## Database Schema

All models use Django ORM with automatic migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

Current schema includes:
- User authentication (Django built-in)
- UserProfile (roles)
- 7 custom models (RoomType, Facility, BlackoutDate, Reservation, Payment, TransactionLog)
- Total: 8+ tables with relationships

---

## Testing the API

Use browser, Postman, or cURL:

```bash
# Get all facilities
curl "http://localhost:8000/api/facilities/"

# Get available facilities for dates
curl "http://localhost:8000/api/facilities/available/?check_in=2026-04-01&check_out=2026-04-05&type=Room"

# Create reservation
curl -X POST http://localhost:8000/api/reservations/ \
  -H "Content-Type: application/json" \
  -d '{...}'

# Get pending reservations (admin)
curl -X GET http://localhost:8000/api/reservations/pending/ \
  -H "Authorization: Basic admin@example.com:password"

# Approve reservation (admin)
curl -X POST http://localhost:8000/api/reservations/1/approve/ \
  -H "Content-Type: application/json" \
  -d '{"status":"approved","review_notes":"OK"}'

# Get reports (admin)
curl "http://localhost:8000/api/reports/reservation_summary/" \
  -H "Authorization: Basic admin@example.com:password"
```

---

## All Backend Files Complete ✅

All Python code is in place:
- ✅ models.py - 8 models
- ✅ serializers.py - 10+ serializers
- ✅ views.py - 8 viewsets, 30+ endpoints
- ✅ urls.py - URL routing
- ✅ settings.py - Django config
- ✅ admin.py - Admin interface
- ✅ wsgi.py - WSGI app
- ✅ manage.py - CLI

Ready to migrate and run: `python manage.py migrate && python manage.py runserver`
