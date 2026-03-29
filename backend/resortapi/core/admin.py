from django.contrib import admin
from .models import (
    UserProfile, RoomType, Facility, BlackoutDate,
    Reservation, Payment, TransactionLog
)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'phone', 'created_at']
    list_filter = ['role', 'created_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(RoomType)
class RoomTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']


@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    list_display = ['external_id', 'name', 'room_type', 'price_per_night', 'is_active']
    list_filter = ['room_type', 'is_active', 'created_at']
    search_fields = ['name', 'external_id']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(BlackoutDate)
class BlackoutDateAdmin(admin.ModelAdmin):
    list_display = ['facility', 'start_date', 'end_date', 'reason']
    list_filter = ['facility', 'created_at']
    search_fields = ['facility__name', 'reason']


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ['booking_id', 'facility', 'guest_name', 'check_in', 'check_out', 'status', 'total_amount']
    list_filter = ['status', 'created_at', 'check_in']
    search_fields = ['booking_id', 'guest_name', 'guest_email']
    readonly_fields = ['booking_id', 'created_at', 'updated_at']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['transaction_id', 'reservation', 'amount', 'status', 'paid_at']
    list_filter = ['status', 'payment_method', 'created_at']
    search_fields = ['transaction_id', 'reservation__booking_id']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(TransactionLog)
class TransactionLogAdmin(admin.ModelAdmin):
    list_display = ['action', 'user', 'reservation', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['user__email', 'reservation__booking_id']
    readonly_fields = ['created_at']
