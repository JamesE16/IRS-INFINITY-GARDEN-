from django.db import models
from django.contrib.auth.models import User
from django.urls import reverse
import uuid

# ============================================================
# USER ROLES / STAFF
# ============================================================

class UserProfile(models.Model):
    """Extended user profile with role information for Admins and Staff"""
    ROLE_CHOICES = [
        ('staff', 'Staff'),
        ('admin', 'Administrator'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='staff')
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.email} ({self.get_role_display()})"
    
    class Meta:
        ordering = ['-created_at']


# ============================================================
# FACILITIES / ROOMS
# ============================================================

class Facility(models.Model):
    """Facilities: Rooms, Cottages, Pavilions"""
    TYPE_CHOICES = [
        ('Room', 'Room'),
        ('Cottage', 'Cottage'),
        ('Pavilion', 'Pavilion'),
    ]
    
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    capacity = models.IntegerField()  # max guests
    price = models.DecimalField(max_digits=10, decimal_places=2)  # price per night
    availability_status = models.BooleanField(default=True)  # is available
    description = models.TextField(blank=True)
    amenities = models.JSONField(default=list)
    image_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.type})"
    
    class Meta:
        ordering = ['type', 'name']


class BlackoutDate(models.Model):
    """Dates when a facility is unavailable"""
    facility = models.ForeignKey(Facility, on_delete=models.CASCADE, related_name='blackout_dates')
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.CharField(max_length=200, default="Maintenance")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.facility.name} ({self.start_date} to {self.end_date})"
    
    class Meta:
        ordering = ['facility', 'start_date']


# ============================================================
# RESERVATIONS
# ============================================================

class Reservation(models.Model):
    """Guest reservations - no user account required"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('checked_in', 'Checked In'),
        ('checked_out', 'Checked Out'),
        ('cancelled', 'Cancelled'),
    ]
    
    reservation_id = models.CharField(max_length=50, unique=True, default=uuid.uuid4, editable=False)
    facility = models.ForeignKey(Facility, on_delete=models.CASCADE, related_name='reservations')
    
    # Guest details (captured directly)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    contact = models.CharField(max_length=20)  # phone
    email = models.EmailField()
    address = models.TextField()
    valid_id = models.CharField(max_length=100)  # ID details
    
    # Reservation details
    check_in = models.DateField()
    check_out = models.DateField()
    num_guests = models.IntegerField()
    special_requests = models.TextField(blank=True)
    
    # Pricing
    nights = models.IntegerField()
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Admin review
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_reservations')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.reservation_id} - {self.facility.name} ({self.status})"
    
    class Meta:
        ordering = ['-created_at']


# ============================================================
# PAYMENTS
# ============================================================

class Payment(models.Model):
    """Payment records linked to reservations"""
    VERIFICATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    
    reservation = models.OneToOneField(Reservation, on_delete=models.CASCADE, related_name='payment')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reference_number = models.CharField(max_length=100, unique=True)
    proof_of_payment = models.FileField(upload_to='payments/', blank=True, null=True)  # or URLField if needed
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS_CHOICES, default='pending')
    
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Payment for {self.reservation.reservation_id} - {self.verification_status}"
    
    class Meta:
        ordering = ['-created_at']


# ============================================================
# NOTIFICATIONS & SCHEDULE
# ============================================================

class Notification(models.Model):
    """Notifications for extension requests, etc., linked to reservations"""
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Notification for {self.reservation.reservation_id}"
    
    class Meta:
        ordering = ['-created_at']


class Schedule(models.Model):
    """Schedules linked to reservations for blackout dates or extensions"""
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='schedules')
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.CharField(max_length=200, default="Extension")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Schedule for {self.reservation.reservation_id} ({self.start_date} to {self.end_date})"
    
    class Meta:
        ordering = ['reservation', 'start_date']


# ============================================================
# TRANSACTION LOG
# ============================================================

class TransactionLog(models.Model):
    """Audit log for all transactions"""
    ACTION_CHOICES = [
        ('reservation_created', 'Reservation Created'),
        ('reservation_confirmed', 'Reservation Confirmed'),
        ('reservation_cancelled', 'Reservation Cancelled'),
        ('payment_verified', 'Payment Verified'),
        ('check_in', 'Check-in'),
        ('check_out', 'Check-out'),
        ('extension_requested', 'Extension Requested'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='transaction_logs', null=True, blank=True)
    action = models.CharField(max_length=30, choices=ACTION_CHOICES)
    details = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.action} - {self.created_at}"
    
    class Meta:
        ordering = ['-created_at']


class Feedback(models.Model):
    """Guest feedback submissions to be reviewed by admin."""

    STATUS_CHOICES = [
        ('new', 'New'),
        ('reviewed', 'Reviewed'),
        ('resolved', 'Resolved'),
        ('archived', 'Archived'),
    ]

    feedback_id = models.CharField(max_length=50, unique=True, default=uuid.uuid4, editable=False)
    reservation = models.ForeignKey(Reservation, on_delete=models.SET_NULL, null=True, blank=True, related_name='feedbacks')
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField()
    rating = models.PositiveSmallIntegerField(default=5)
    comment = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.feedback_id} - {self.first_name} {self.last_name} ({self.status})"

    class Meta:
        ordering = ['-submitted_at']
