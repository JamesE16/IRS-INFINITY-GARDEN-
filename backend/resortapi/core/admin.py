from django.contrib import admin
from .models import (
    UserProfile, Facility, BlackoutDate,
    Reservation, Payment, Notification, Schedule, TransactionLog, Feedback
)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'phone', 'created_at']
    list_filter = ['role', 'created_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'capacity', 'price', 'availability_status']
    list_filter = ['type', 'availability_status', 'created_at']
    search_fields = ['name', 'type']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(BlackoutDate)
class BlackoutDateAdmin(admin.ModelAdmin):
    list_display = ['facility', 'start_date', 'end_date', 'reason']
    list_filter = ['facility', 'created_at']
    search_fields = ['facility__name', 'reason']


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ['reservation_id', 'facility', 'first_name', 'last_name', 'check_in', 'check_out', 'status', 'total_amount']
    list_filter = ['status', 'created_at', 'check_in']
    search_fields = ['reservation_id', 'first_name', 'last_name', 'email']
    readonly_fields = ['reservation_id', 'created_at', 'updated_at']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['reference_number', 'reservation', 'amount', 'verification_status', 'paid_at']
    list_filter = ['verification_status', 'created_at']
    search_fields = ['reference_number', 'reservation__reservation_id']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['reservation', 'message', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['reservation__reservation_id', 'message']


@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ['reservation', 'start_date', 'end_date', 'reason']
    list_filter = ['created_at']
    search_fields = ['reservation__reservation_id', 'reason']


@admin.register(TransactionLog)
class TransactionLogAdmin(admin.ModelAdmin):
    list_display = ['action', 'user', 'reservation', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['user__email', 'reservation__reservation_id']
    readonly_fields = ['created_at']


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ['feedback_id', 'reservation', 'first_name', 'last_name', 'rating', 'status', 'submitted_at']
    list_filter = ['status', 'rating', 'submitted_at']
    search_fields = ['feedback_id', 'first_name', 'last_name', 'email', 'comment', 'reservation__reservation_id']
    readonly_fields = ['feedback_id', 'submitted_at', 'updated_at']
