# Django backend for Infinity Garden Resort

## Setup Instructions

### 1. Create Virtual Environment
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # On Windows
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Create Admin User
```bash
python manage.py createsuperuser
```

### 5. Start Development Server
```bash
python manage.py runserver
```

Server runs at: http://localhost:8000

## API Endpoints

- **Users**: `/api/users/`
- **Facilities**: `/api/facilities/`
- **Reservations**: `/api/reservations/`
- **Payments**: `/api/payments/`
- **Reports**: `/api/reports/`
- **Admin Panel**: `/admin/`

## Key Features

- User authentication (Client, Staff, Admin)
- Facility management with availability tracking
- Reservation workflow (Pending → Approved → Confirmed)
- Payment tracking
- Comprehensive reporting
- Transaction auditing
