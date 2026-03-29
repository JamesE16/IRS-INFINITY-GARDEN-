from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile, RoomType, Facility, BlackoutDate,
    Reservation, Payment, TransactionLog
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
    """Serializer for creating new users (admin/staff registration)"""
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=['staff', 'client'], default='client')
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

class RoomTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomType
        fields = ['id', 'name', 'description']


class FacilitySerializer(serializers.ModelSerializer):
    room_type = RoomTypeSerializer(read_only=True)
    room_type_id = serializers.PrimaryKeyRelatedField(
        queryset=RoomType.objects.all(),
        source='room_type',
        write_only=True
    )
    availability_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Facility
        fields = [
            'id', 'external_id', 'name', 'description', 'room_type', 'room_type_id',
            'subtype', 'max_guests', 'size_sqm', 'beds', 'price_per_night',
            'amenities', 'features', 'image_url', 'is_active', 'availability_status',
            'created_at', 'updated_at'
        ]
    
    def get_availability_status(self, obj):
        """Check if facility has approved reservations"""
        from django.utils import timezone
        today = timezone.now().date()
        
        approved_reservations = obj.reservations.filter(
            status__in=['approved', 'confirmed', 'checked_in'],
            check_in__lte=today,
            check_out__gte=today
        )
        
        return {
            'is_available': not approved_reservations.exists(),
            'current_reservation': None if not approved_reservations.exists() 
                                   else {'id': approved_reservations.first().id, 
                                        'booking_id': approved_reservations.first().booking_id}
        }


class BlackoutDateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlackoutDate
        fields = ['id', 'facility', 'start_date', 'end_date', 'reason', 'created_at']


# ============================================================
# RESERVATION SERIALIZERS
# ============================================================

class ReservationListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing"""
    facility_name = serializers.CharField(source='facility.name', read_only=True)
    facility_image = serializers.CharField(source='facility.image_url', read_only=True)
    
    class Meta:
        model = Reservation
        fields = [
            'id', 'booking_id', 'facility', 'facility_name', 'facility_image',
            'guest_name', 'check_in', 'check_out', 'num_guests', 'status',
            'total_amount', 'created_at'
        ]


class ReservationDetailSerializer(serializers.ModelSerializer):
    """Full serializer with all details"""
    facility = FacilitySerializer(read_only=True)
    guest = UserSerializer(read_only=True)
    reviewed_by_username = serializers.CharField(source='reviewed_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = Reservation
        fields = [
            'id', 'booking_id', 'facility', 'guest', 'guest_name', 'guest_email',
            'guest_phone', 'check_in', 'check_out', 'num_guests', 'special_requests',
            'nights', 'subtotal', 'tax_amount', 'total_amount', 'status',
            'reviewed_by', 'reviewed_by_username', 'reviewed_at', 'review_notes',
            'created_at', 'updated_at'
        ]


class ReservationCreateSerializer(serializers.ModelSerializer):
    """Serializer for client creating reservations"""
    class Meta:
        model = Reservation
        fields = [
            'facility', 'guest_name', 'guest_email', 'guest_phone',
            'check_in', 'check_out', 'num_guests', 'special_requests',
            'nights', 'subtotal', 'tax_amount', 'total_amount'
        ]


class ReservationApproveSerializer(serializers.Serializer):
    """Serializer for admin approving reservations"""
    review_notes = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=['approved', 'cancelled'])


# ============================================================
# PAYMENT SERIALIZERS
# ============================================================

class PaymentSerializer(serializers.ModelSerializer):
    reservation_booking_id = serializers.CharField(source='reservation.booking_id', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'reservation', 'reservation_booking_id', 'amount',
            'payment_method', 'transaction_id', 'status', 'paid_at',
            'created_at', 'updated_at'
        ]


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
