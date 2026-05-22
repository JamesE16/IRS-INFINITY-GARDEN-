from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile, Facility, BlackoutDate,
    Reservation, Payment, Notification, Schedule, TransactionLog,
    Feedback
)


# ============================================================
# USER SERIALIZERS
# ============================================================

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'address', 'created_at']
        read_only_fields = ['created_at']


class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']

    def get_profile(self, obj):
        try:
            return UserProfileSerializer(obj.profile).data
        except UserProfile.DoesNotExist:
            return None


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new users (admin/staff/client registration)"""
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=['admin', 'staff', 'client'], default='client')
    phone = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password', 'role', 'phone']
    
    def create(self, validated_data):
        role = validated_data.pop('role')
        phone = validated_data.pop('phone', '')
        
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password']
        )
        
        UserProfile.objects.create(
            user=user,
            role=role,
            phone=phone
        )
        
        return user


# ============================================================
# FACILITY SERIALIZERS
# ============================================================

class FacilitySerializer(serializers.ModelSerializer):
    type = serializers.CharField(source='room_type.name', read_only=True)

    class Meta:
        model = Facility
        fields = [
            'id', 'external_id', 'name', 'type', 'capacity', 'price', 'availability_status',
            'description', 'amenities', 'image_url', 'created_at', 'updated_at'
        ]


class BlackoutDateSerializer(serializers.ModelSerializer):
    facility_name = serializers.CharField(source='facility.name', read_only=True)
    maintenance_type_display = serializers.CharField(source='get_maintenance_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = BlackoutDate
        fields = [
            'id', 'facility', 'facility_name',
            'start_date', 'end_date',
            'maintenance_type', 'maintenance_type_display',
            'status', 'status_display',
            'reason', 'created_at',
        ]


# ============================================================
# RESERVATION SERIALIZERS
# ============================================================

class ReservationListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing"""
    facility_name = serializers.CharField(source='facility.name', read_only=True)
    facility_type = serializers.CharField(source='facility.room_type.name', read_only=True)
    facility_image = serializers.CharField(source='facility.image_url', read_only=True)
    guest_full_name = serializers.SerializerMethodField()
    payment_method = serializers.CharField(source='payment.payment_method', read_only=True, allow_null=True)
    payment_status = serializers.CharField(source='payment.verification_status', read_only=True, allow_null=True)
    proof_of_payment = serializers.FileField(source='payment.proof_of_payment', read_only=True, allow_null=True)
    
    class Meta:
        model = Reservation
        fields = [
            'id', 'reservation_id', 'facility', 'facility_name', 'facility_type', 'facility_image',
            'first_name', 'last_name', 'guest_full_name', 'contact', 'email', 'address',
            'payment_method', 'payment_status', 'proof_of_payment',
            'check_in', 'check_out', 'num_guests', 'nights', 'special_requests', 'status', 'is_archived',
            'total_amount', 'review_notes', 'reviewed_at', 'created_at'
        ]
    
    def get_guest_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"


class ReservationDetailSerializer(serializers.ModelSerializer):
    """Full serializer with all details"""
    facility = FacilitySerializer(read_only=True)
    reviewed_by_username = serializers.CharField(source='reviewed_by.username', read_only=True, allow_null=True)
    payment_method = serializers.CharField(source='payment.payment_method', read_only=True, allow_null=True)
    payment_status = serializers.CharField(source='payment.verification_status', read_only=True, allow_null=True)
    proof_of_payment = serializers.FileField(source='payment.proof_of_payment', read_only=True, allow_null=True)
    has_feedback = serializers.SerializerMethodField()
    
    class Meta:
        model = Reservation
        fields = [
            'id', 'reservation_id', 'facility', 'first_name', 'last_name', 'contact', 'email',
            'address', 'check_in', 'check_out', 'num_guests', 'special_requests',
            'nights', 'total_amount', 'status', 'is_archived', 'payment_method', 'payment_status', 'proof_of_payment',
            'reviewed_by', 'reviewed_by_username', 'reviewed_at', 'review_notes',
            'has_feedback', 'created_at', 'updated_at'
        ]

    def get_has_feedback(self, obj):
        return obj.feedbacks.exists()


class ReservationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating reservations"""
    payment_method = serializers.ChoiceField(choices=Payment.PAYMENT_METHOD_CHOICES, write_only=True)
    receipt_image = serializers.FileField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Reservation
        fields = [
            'facility', 'first_name', 'last_name', 'contact', 'email', 'address',
            'check_in', 'check_out', 'num_guests', 'special_requests',
            'total_amount', 'payment_method', 'receipt_image'
        ]


class ReservationApproveSerializer(serializers.Serializer):
    """Serializer for admin approving reservations"""
    review_notes = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=['confirmed', 'cancelled'])


# ============================================================
# PAYMENT SERIALIZERS
# ============================================================

class PaymentSerializer(serializers.ModelSerializer):
    reservation_reservation_id = serializers.CharField(source='reservation.reservation_id', read_only=True)
    guest_name = serializers.SerializerMethodField()
    guest_email = serializers.CharField(source='reservation.email', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'reservation', 'reservation_reservation_id', 'amount',
            'reference_number', 'payment_method', 'payment_method_display', 'guest_name', 'guest_email',
            'proof_of_payment', 'verification_status', 'paid_at',
            'created_at', 'updated_at'
        ]

    def get_guest_name(self, obj):
        return f"{obj.reservation.first_name} {obj.reservation.last_name}".strip()


class FeedbackSerializer(serializers.ModelSerializer):
    reservation = serializers.PrimaryKeyRelatedField(read_only=True)
    reservation_id = serializers.CharField(write_only=True, required=True)
    guest_name = serializers.SerializerMethodField()
    reservation_reference = serializers.SerializerMethodField()
    facility_name = serializers.SerializerMethodField()

    class Meta:
        model = Feedback
        fields = [
            'id', 'feedback_id', 'reservation', 'reservation_id', 'reservation_reference',
            'facility_name', 'first_name', 'last_name', 'guest_name', 'email', 'rating',
            'comment', 'status', 'submitted_at', 'updated_at'
        ]
        read_only_fields = [
            'feedback_id', 'first_name', 'last_name', 'guest_name', 'email',
            'submitted_at', 'updated_at'
        ]

    def validate(self, attrs):
        reservation_id = attrs.pop('reservation_id', '').strip()
        reservation = Reservation.objects.filter(reservation_id__iexact=reservation_id).first()

        if reservation is None:
            raise serializers.ValidationError({
                'reservation_id': 'Reservation ID was not found.'
            })

        if reservation.status != 'confirmed':
            raise serializers.ValidationError({
                'reservation_id': 'Only confirmed reservations can submit feedback.'
            })

        if reservation.feedbacks.exists():
            raise serializers.ValidationError({
                'reservation_id': 'Feedback has already been submitted for this reservation.'
            })

        rating = attrs.get('rating', 5)
        if rating < 1 or rating > 5:
            raise serializers.ValidationError({
                'rating': 'Rating must be between 1 and 5.'
            })

        attrs['reservation'] = reservation
        attrs['first_name'] = reservation.first_name
        attrs['last_name'] = reservation.last_name
        attrs['email'] = reservation.email
        return attrs

    def get_guest_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def get_reservation_reference(self, obj):
        if obj.reservation:
            return obj.reservation.reservation_id

        matched_reservation = Reservation.objects.filter(
            email__iexact=obj.email,
            first_name__iexact=obj.first_name,
            last_name__iexact=obj.last_name,
        ).order_by('-created_at').first()

        return matched_reservation.reservation_id if matched_reservation else None

    def get_facility_name(self, obj):
        if obj.reservation and obj.reservation.facility:
            return obj.reservation.facility.name
        return None


# ============================================================
# REPORT SERIALIZERS
# ============================================================

class ReservationReportSerializer(serializers.Serializer):
    """For generating reports"""
    total_reservations = serializers.IntegerField()
    approved_count = serializers.IntegerField()
    pending_count = serializers.IntegerField()
    cancelled_count = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    average_booking_value = serializers.DecimalField(max_digits=12, decimal_places=2)


class TransactionLogSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True, allow_null=True)
    
    class Meta:
        model = TransactionLog
        fields = ['id', 'user', 'user_username', 'action', 'reservation', 'details', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    reservation_id = serializers.CharField(source='reservation.reservation_id', read_only=True)
    guest_name = serializers.SerializerMethodField()
    facility_name = serializers.CharField(source='reservation.facility.name', read_only=True)
    proof_of_payment = serializers.FileField(source='reservation.payment.proof_of_payment', read_only=True, allow_null=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'reservation', 'reservation_id', 'guest_name', 'facility_name',
            'proof_of_payment', 'message', 'is_read', 'created_at'
        ]

    def get_guest_name(self, obj):
        return f"{obj.reservation.first_name} {obj.reservation.last_name}".strip()


class ScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = ['id', 'reservation', 'start_date', 'end_date', 'reason', 'created_by', 'created_at']
