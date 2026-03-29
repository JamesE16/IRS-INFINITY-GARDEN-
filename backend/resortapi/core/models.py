from django.db import models
from django.contrib.auth.models import User
from django.urls import reverse

# ============================================================
# USER ROLES / STAFF
# ============================================================

class UserProfile(models.Model):
    """Extended user profile with role information"""
    ROLE_CHOICES = [
        ('client', 'Client'),
        ('staff', 'Staff'),
        ('admin', 'Administrator'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='client')
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

class RoomType(models.Model):
    """Types of accommodations"""
    TYPE_CHOICES = [
        ('Room', 'Standard Room'),
        ('Cottage', 'Cottage'),
        ('Gazebo', 'Gazebo'),
        ('Pavilion', 'Pavilion'),
    ]
    
    name = models.CharField(max_length=50, choices=TYPE_CHOICES)
    description = models.TextField()
    
    def __str__(self):
        return self.name
    
    class Meta:
        unique_together = ('name',)


class Facility(models.Model):
    """Rooms, cottages, pavilions, gazebos"""
    external_id = models.CharField(max_length=10, unique=True)  # r1, c1, g1, p1, etc
    name = models.CharField(max_length=100)
    description = models.TextField()
    room_type = models.ForeignKey(RoomType, on_delete=models.CASCADE)
    subtype = models.CharField(max_length=50)  # Standard, Deluxe, etc
    max_guests = models.IntegerField()
    size_sqm = models.IntegerField()
    beds = models.CharField(max_length=100)
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    amenities = models.JSONField(default=list)  # ["WiFi", "AC", "TV"]
    features = models.JSONField(default=list)   # ["Housekeeping", "BBQ Grill"]
    image_url = models.URLField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.room_type.name})"
    
    class Meta:
        ordering = ['room_type', 'name']


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
    """Guest reservations"""
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('confirmed', 'Confirmed'),
        ('checked_in', 'Checked In'),
        ('checked_out', 'Checked Out'),
        ('cancelled', 'Cancelled'),
    ]
    
    booking_id = models.CharField(max_length=50, unique=True)
    facility = models.ForeignKey(Facility, on_delete=models.CASCADE, related_name='reservations')
    guest = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reservations')
    
    # Guest details (from form submission)
    guest_name = models.CharField(max_length=100)
    guest_email = models.EmailField()
    guest_phone = models.CharField(max_length=20)
    
    # Reservation details
    check_in = models.DateField()
    check_out = models.DateField()
    num_guests = models.IntegerField()
    special_requests = models.TextField(blank=True)
    
    # Pricing
    nights = models.IntegerField()
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Status & workflow
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Review notes (admin)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_reservations')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.booking_id} - {self.facility.name} ({self.status})"
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ('facility', 'check_in', 'check_out', 'status')


# ============================================================
# PAYMENTS & TRANSACTIONS
# ============================================================

class Payment(models.Model):
    """Payment records for reservations"""
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('credit_card', 'Credit Card'),
        ('debit_card', 'Debit Card'),
        ('bank_transfer', 'Bank Transfer'),
        ('paypal', 'PayPal'),
        ('cash', 'Cash'),
    ]
    
    reservation = models.OneToOneField(Reservation, on_delete=models.CASCADE, related_name='payment')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    transaction_id = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Payment for {self.reservation.booking_id} - {self.status}"
    
    class Meta:
        ordering = ['-created_at']


class TransactionLog(models.Model):
    """Audit log for all transactions"""
    ACTION_CHOICES = [
        ('reservation_created', 'Reservation Created'),
        ('reservation_approved', 'Reservation Approved'),
        ('reservation_cancelled', 'Reservation Cancelled'),
        ('payment_received', 'Payment Received'),
        ('payment_refunded', 'Payment Refunded'),
        ('check_in', 'Check-in'),
        ('check_out', 'Check-out'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=30, choices=ACTION_CHOICES)
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='transaction_logs', null=True, blank=True)
    details = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.action} - {self.created_at}"
    
    class Meta:
        ordering = ['-created_at']
