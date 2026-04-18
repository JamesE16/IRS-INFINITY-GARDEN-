from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Sum, Count, Q
from datetime import timedelta

from .models import (
    UserProfile, Facility, BlackoutDate,
    Reservation, Payment, Notification, Schedule, TransactionLog, Feedback
)
from .serializers import (
    UserSerializer, UserProfileSerializer, UserCreateSerializer,
    FacilitySerializer, BlackoutDateSerializer,
    ReservationListSerializer, ReservationDetailSerializer, ReservationCreateSerializer,
    ReservationApproveSerializer, PaymentSerializer, FeedbackSerializer, TransactionLogSerializer,
    ReservationReportSerializer, NotificationSerializer, ScheduleSerializer
)


# ============================================================
# USER MANAGEMENT
# ============================================================

class UserViewSet(viewsets.ModelViewSet):
    """Manage users (admin/staff/clients)"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=user.id)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        """Register a new client"""
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        """Authenticate a user and return their profile"""
        email = request.data.get('email')
        password = request.data.get('password')
        if not email or not password:
            return Response({'detail': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=email, password=password)
        if user is None:
            return Response({'detail': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = self.get_serializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def create_staff(self, request):
        """Admin creating staff account"""
        data = request.data.copy()
        data['role'] = 'staff'
        serializer = UserCreateSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current user profile"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def set_role(self, request, pk=None):
        """Admin changing user role"""
        user = self.get_object()
        role = request.data.get('role')
        
        if role not in ['client', 'staff', 'admin']:
            return Response(
                {'error': 'Invalid role'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            profile = user.profile
            profile.role = role
            profile.save()
            return Response({'status': 'Role updated'}, status=status.HTTP_200_OK)
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'User profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class UserProfileViewSet(viewsets.ModelViewSet):
    """View and manage user profiles"""
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return UserProfile.objects.all()
        return UserProfile.objects.filter(user=user)


# ============================================================
# FACILITY MANAGEMENT
# ============================================================

class FacilityViewSet(viewsets.ModelViewSet):
    """Manage facilities (rooms, cottages, pavilions, gazebos)"""
    queryset = Facility.objects.filter(availability_status=True)
    serializer_class = FacilitySerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get available facilities for date range"""
        check_in = request.query_params.get('check_in')
        check_out = request.query_params.get('check_out')
        facility_type = request.query_params.get('type', 'All')
        
        if not check_in or not check_out:
            return Response(
                {'error': 'check_in and check_out dates required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        facilities = Facility.objects.filter(is_active=True)
        
        if facility_type != 'All':
            facilities = facilities.filter(room_type__name=facility_type)
        
        # Exclude facilities with overlapping approved reservations
        booked = Reservation.objects.filter(
            status__in=['approved', 'confirmed', 'checked_in'],
            check_in__lt=check_out,
            check_out__gt=check_in
        ).values_list('facility_id', flat=True)
        
        available_facilities = facilities.exclude(id__in=booked)
        serializer = self.get_serializer(available_facilities, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def reservations(self, request, pk=None):
        """Get all reservations for a facility"""
        facility = self.get_object()
        reservations = facility.reservations.all()
        serializer = ReservationListSerializer(reservations, many=True)
        return Response(serializer.data)


class BlackoutDateViewSet(viewsets.ModelViewSet):
    """Manage blackout dates"""
    queryset = BlackoutDate.objects.all()
    serializer_class = BlackoutDateSerializer
    permission_classes = [IsAdminUser]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# ============================================================
# RESERVATION MANAGEMENT
# ============================================================

class ReservationViewSet(viewsets.ModelViewSet):
    """Manage reservations"""
    queryset = Reservation.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ReservationCreateSerializer
        elif self.action == 'approve':
            return ReservationApproveSerializer
        elif self.action in ['list', 'retrieve']:
            return ReservationListSerializer
        return ReservationDetailSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin/Staff can see all reservations
        if user.is_staff:
            return Reservation.objects.all()
        
        # Clients see their own reservations
        return Reservation.objects.filter(guest=user)
    
    def create(self, request, *args, **kwargs):
        """Client creating a reservation"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            facility_id = serializer.validated_data['facility'].id
            check_in = serializer.validated_data['check_in']
            check_out = serializer.validated_data['check_out']
            
            # Check for conflicts
            conflict = Reservation.objects.filter(
                facility_id=facility_id,
                status__in=['confirmed', 'checked_in'],
                check_in__lt=check_out,
                check_out__gt=check_in
            ).exists()
            
            if conflict:
                return Response(
                    {'error': 'Facility unavailable for selected dates'},
                    status=status.HTTP_409_CONFLICT
                )
            
            reservation = Reservation.objects.create(
                **serializer.validated_data
            )
            
            # Log transaction
            TransactionLog.objects.create(
                action='reservation_created',
                reservation=reservation,
                details={'method': 'web'}
            )
            
            output_serializer = ReservationDetailSerializer(reservation)
            return Response(output_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        """Admin approving/rejecting reservation"""
        reservation = self.get_object()
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            new_status = serializer.validated_data['status']
            review_notes = serializer.validated_data.get('review_notes', '')
            
            reservation.status = new_status
            reservation.review_notes = review_notes
            reservation.reviewed_by = request.user
            reservation.reviewed_at = timezone.now()
            reservation.save()
            
            # Log transaction
            action_name = 'reservation_approved' if new_status == 'approved' else 'reservation_cancelled'
            TransactionLog.objects.create(
                user=request.user,
                action=action_name,
                reservation=reservation,
                details={'review_notes': review_notes}
            )
            
            response_serializer = ReservationDetailSerializer(reservation)
            return Response(response_serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def cancel(self, request, pk=None):
        """Cancel a reservation"""
        reservation = self.get_object()
        
        # Only guest or admin can cancel
        if request.user != reservation.guest and not request.user.is_staff:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if reservation.status not in ['pending', 'approved', 'confirmed']:
            return Response(
                {'error': 'Cannot cancel reservation in this state'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reservation.status = 'cancelled'
        reservation.save()
        
        # Log transaction
        TransactionLog.objects.create(
            user=request.user,
            action='reservation_cancelled',
            reservation=reservation
        )
        
        serializer = ReservationDetailSerializer(reservation)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def my_bookings(self, request):
        """Get current user's bookings"""
        reservations = Reservation.objects.filter(guest=request.user).order_by('-created_at')
        serializer = ReservationListSerializer(reservations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def pending(self, request):
        """Get pending reservations (for admin review)"""
        reservations = Reservation.objects.filter(status='pending').order_by('created_at')
        serializer = ReservationDetailSerializer(reservations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def by_date_range(self, request):
        """Get reservations for a date range"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            return Response(
                {'error': 'start_date and end_date required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reservations = Reservation.objects.filter(
            check_in__gte=start_date,
            check_out__lte=end_date,
            status__in=['approved', 'confirmed', 'checked_in']
        ).order_by('check_in')
        
        serializer = ReservationListSerializer(reservations, many=True)
        return Response(serializer.data)


# ============================================================
# PAYMENT MANAGEMENT
# ============================================================

class PaymentViewSet(viewsets.ModelViewSet):
    """Manage payments"""
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAdminUser]
    
    @action(detail=False, methods=['get'])
    def by_status(self, request):
        """Get payments by status"""
        status_filter = request.query_params.get('status')
        if status_filter:
            payments = Payment.objects.filter(status=status_filter)
        else:
            payments = Payment.objects.all()
        
        serializer = self.get_serializer(payments, many=True)
        return Response(serializer.data)


class FeedbackViewSet(viewsets.ModelViewSet):
    """Manage guest feedback submissions"""
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = Feedback.objects.all()
        status_filter = self.request.query_params.get('status')
        search = self.request.query_params.get('search')

        if status_filter and status_filter.lower() != 'all':
            queryset = queryset.filter(status=status_filter.lower())

        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(comment__icontains=search) |
                Q(feedback_id__icontains=search) |
                Q(reservation__reservation_id__icontains=search)
            )

        return queryset.order_by('-submitted_at')

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        feedback = self.get_object()
        status_value = request.data.get('status')

        if status_value not in dict(Feedback.STATUS_CHOICES):
            return Response({'error': 'Invalid status value'}, status=status.HTTP_400_BAD_REQUEST)

        feedback.status = status_value
        feedback.save()

        serializer = self.get_serializer(feedback)
        return Response(serializer.data)


# ============================================================
# REPORTING
# ============================================================

class ReportViewSet(viewsets.ViewSet):
    """Generate reports"""
    permission_classes = [IsAdminUser]
    
    @action(detail=False, methods=['get'])
    def reservation_summary(self, request):
        """Get reservation summary report"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        query = Reservation.objects.all()
        
        if start_date:
            query = query.filter(created_at__gte=start_date)
        if end_date:
            query = query.filter(created_at__lte=end_date)
        
        total_reservations = query.count()
        approved_count = query.filter(status='approved').count()
        pending_count = query.filter(status='pending').count()
        cancelled_count = query.filter(status='cancelled').count()
        
        total_revenue = query.filter(
            status__in=['approved', 'confirmed', 'checked_out']
        ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        avg_value = total_revenue / total_reservations if total_reservations > 0 else 0
        
        data = {
            'total_reservations': total_reservations,
            'approved_count': approved_count,
            'pending_count': pending_count,
            'cancelled_count': cancelled_count,
            'total_revenue': total_revenue,
            'average_booking_value': avg_value
        }
        
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def facility_utilization(self, request):
        """Get facility utilization report"""
        facilities = Facility.objects.filter(is_active=True)
        
        data = []
        for facility in facilities:
            total_reservations = facility.reservations.filter(
                status__in=['approved', 'confirmed', 'checked_out']
            ).count()
            
            total_revenue = facility.reservations.filter(
                status__in=['approved', 'confirmed', 'checked_out']
            ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            
            data.append({
                'facility_id': facility.id,
                'facility_name': facility.name,
                'total_reservations': total_reservations,
                'total_revenue': float(total_revenue)
            })
        
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def guest_report(self, request):
        """Get guest statistics"""
        total_guests = User.objects.filter(profile__role='client').count()
        repeat_guests = User.objects.filter(
            profile__role='client',
            reservations__status__in=['approved', 'confirmed']
        ).annotate(reservation_count=Count('reservations')).filter(reservation_count__gt=1).count()
        
        return Response({
            'total_guests': total_guests,
            'repeat_guests': repeat_guests,
            'new_guests': total_guests - repeat_guests
        })


class TransactionLogViewSet(viewsets.ModelViewSet):
    """View transaction logs"""
    queryset = TransactionLog.objects.all()
    serializer_class = TransactionLogSerializer
    permission_classes = [IsAdminUser]
    
    @action(detail=False, methods=['get'])
    def by_action(self, request):
        """Get logs by action type"""
        action = request.query_params.get('action')
        if action:
            logs = TransactionLog.objects.filter(action=action).order_by('-created_at')
        else:
            logs = TransactionLog.objects.all().order_by('-created_at')
        
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)
