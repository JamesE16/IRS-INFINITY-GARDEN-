import uuid

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import Count, Q, Sum
from django.middleware.csrf import get_token
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, BasePermission, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    BlackoutDate,
    Facility,
    Feedback,
    Notification,
    Payment,
    Reservation,
    TransactionLog,
    UserProfile,
)
from .serializers import (
    BlackoutDateSerializer,
    FacilitySerializer,
    FeedbackSerializer,
    NotificationSerializer,
    PaymentSerializer,
    ReservationApproveSerializer,
    ReservationCreateSerializer,
    ReservationDetailSerializer,
    ReservationListSerializer,
    TransactionLogSerializer,
    UserCreateSerializer,
    UserProfileSerializer,
    UserSerializer,
)


STAFF_ROLES = {"staff", "admin"}
ACTIVE_RESERVATION_STATUSES = ["confirmed", "checked_in"]
REVENUE_RESERVATION_STATUSES = ["approved", "confirmed", "checked_in", "checked_out"]


def user_has_staff_or_admin_role(user):
    if not user or not user.is_authenticated:
        return False
    if user.is_staff or user.is_superuser:
        return True
    profile = getattr(user, "profile", None)
    return getattr(profile, "role", None) in STAFF_ROLES


def reservation_overlap_queryset(check_in, check_out):
    return Reservation.objects.filter(
        status__in=ACTIVE_RESERVATION_STATUSES,
        check_in__lt=check_out,
        check_out__gt=check_in,
    )


def sync_reservation_payment(reservation, verification_status, paid_at):
    try:
        payment = reservation.payment
    except Payment.DoesNotExist:
        return None

    payment.verification_status = verification_status
    payment.paid_at = paid_at
    payment.save(update_fields=["verification_status", "paid_at", "updated_at"])
    return payment


class IsStaffOrAdminRole(BasePermission):
    def has_permission(self, request, view):
        return user_has_staff_or_admin_role(request.user)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return User.objects.all().order_by("id")
        return User.objects.filter(id=user.id).order_by("id")

    def _build_auth_response(self, user):
        refresh = RefreshToken.for_user(user)
        serializer = self.get_serializer(user)
        return {
            **serializer.data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }

    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def register(self, request):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def login(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return Response(
                {"detail": "Email and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, username=email, password=password)
        if user is None:
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        login(request, user)
        return Response(self._build_auth_response(user), status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def logout(self, request):
        logout(request)
        return Response({"detail": "Logged out successfully."}, status=status.HTTP_200_OK)

    @method_decorator(ensure_csrf_cookie)
    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def csrf(self, request):
        return Response({"csrfToken": get_token(request)}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], permission_classes=[IsAdminUser])
    def create_staff(self, request):
        data = request.data.copy()
        requested_role = (data.get("role") or "staff").lower()

        if requested_role not in STAFF_ROLES:
            return Response(
                {"role": ["Role must be admin or staff."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data["role"] = requested_role
        serializer = UserCreateSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsAdminUser])
    def set_role(self, request, pk=None):
        user = self.get_object()
        role = request.data.get("role")

        if role not in ["client", "staff", "admin"]:
            return Response({"error": "Invalid role"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            profile = user.profile
        except UserProfile.DoesNotExist:
            return Response(
                {"error": "User profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        profile.role = role
        profile.save(update_fields=["role", "updated_at"])
        return Response({"status": "Role updated"}, status=status.HTTP_200_OK)


class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return UserProfile.objects.all()
        return UserProfile.objects.filter(user=user)


class FacilityViewSet(viewsets.ModelViewSet):
    queryset = Facility.objects.filter(is_active=True)
    serializer_class = FacilitySerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        permission_classes = [AllowAny] if self.action in ["list", "retrieve"] else [IsAdminUser]
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=["get"])
    def available(self, request):
        check_in = request.query_params.get("check_in")
        check_out = request.query_params.get("check_out")
        facility_type = request.query_params.get("type", "All")

        if not check_in or not check_out:
            return Response(
                {"error": "check_in and check_out dates required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        facilities = Facility.objects.filter(is_active=True)
        if facility_type != "All":
            facilities = facilities.filter(room_type__name__iexact=facility_type)

        booked_facility_ids = reservation_overlap_queryset(check_in, check_out).values_list(
            "facility_id",
            flat=True,
        )
        available_facilities = facilities.exclude(id__in=booked_facility_ids)

        serializer = self.get_serializer(available_facilities, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def reservations(self, request, pk=None):
        facility = self.get_object()
        reservations = facility.reservations.all()
        serializer = ReservationListSerializer(reservations, many=True)
        return Response(serializer.data)


class BlackoutDateViewSet(viewsets.ModelViewSet):
    queryset = BlackoutDate.objects.all()
    serializer_class = BlackoutDateSerializer
    permission_classes = [IsAdminUser]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"])
    def maintenance_types(self, request):
        return Response(
            [{"value": value, "label": label} for value, label in BlackoutDate.MAINTENANCE_TYPE_CHOICES]
        )

    @action(detail=False, methods=["get"])
    def status_options(self, request):
        return Response(
            [{"value": value, "label": label} for value, label in BlackoutDate.STATUS_CHOICES]
        )


class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.all()

    def get_permissions(self):
        if self.action in ["create", "track"]:
            permission_classes = [AllowAny]
        elif self.action in ["approve", "archive", "pending", "by_date_range"]:
            permission_classes = [IsStaffOrAdminRole]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        serializer_map = {
            "create": ReservationCreateSerializer,
            "approve": ReservationApproveSerializer,
            "list": ReservationListSerializer,
        }
        return serializer_map.get(self.action, ReservationDetailSerializer)

    def get_queryset(self):
        user = self.request.user

        if user_has_staff_or_admin_role(user):
            queryset = Reservation.objects.all()
            if self.action in ["list", "pending"]:
                return queryset.filter(is_archived=False)
            return queryset

        if user.is_authenticated:
            return Reservation.objects.filter(guest=user)

        return Reservation.objects.none()

    def _create_payment(self, reservation, payment_method, receipt_image):
        return Payment.objects.create(
            reservation=reservation,
            amount=reservation.total_amount,
            payment_method=payment_method,
            reference_number=f"PAY-{reservation.reservation_id}-{uuid.uuid4().hex[:6].upper()}",
            proof_of_payment=receipt_image,
            verification_status="pending",
        )

    def _create_notification(self, reservation):
        Notification.objects.create(
            reservation=reservation,
            message=(
                f"New reservation from {reservation.first_name} {reservation.last_name} "
                f"for {reservation.facility.name}. Payment receipt is ready for review."
            ),
        )

    def _log_reservation_action(self, action, reservation, user=None, details=None):
        TransactionLog.objects.create(
            user=user,
            action=action,
            reservation=reservation,
            details=details or {},
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated_data = dict(serializer.validated_data)
        payment_method = validated_data.pop("payment_method")
        receipt_image = validated_data.pop("receipt_image", None)
        facility = validated_data["facility"]
        check_in = validated_data["check_in"]
        check_out = validated_data["check_out"]
        nights = (check_out - check_in).days

        if nights <= 0:
            return Response(
                {"error": "check_out date must be after check_in date"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        has_conflict = reservation_overlap_queryset(check_in, check_out).filter(
            facility_id=facility.id
        ).exists()
        if has_conflict:
            return Response(
                {"error": "Facility unavailable for selected dates"},
                status=status.HTTP_409_CONFLICT,
            )

        reservation = Reservation.objects.create(
            guest=request.user if request.user.is_authenticated else None,
            nights=nights,
            **validated_data,
        )
        self._create_payment(reservation, payment_method, receipt_image)
        self._create_notification(reservation)
        self._log_reservation_action(
            action="reservation_created",
            reservation=reservation,
            details={"method": "web"},
        )

        output_serializer = ReservationDetailSerializer(reservation, context=self.get_serializer_context())
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], permission_classes=[IsStaffOrAdminRole])
    def approve(self, request, pk=None):
        reservation = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data["status"]
        review_notes = serializer.validated_data.get("review_notes", "")

        reservation.status = new_status
        reservation.review_notes = review_notes
        reservation.reviewed_by = request.user
        reservation.reviewed_at = timezone.now()
        reservation.save()

        if new_status == "confirmed":
            payment = sync_reservation_payment(reservation, "verified", timezone.now())
            if payment is not None:
                self._log_reservation_action(
                    action="payment_verified",
                    user=request.user,
                    reservation=reservation,
                    details={"method": "reservation_confirmation"},
                )
        elif new_status == "cancelled":
            sync_reservation_payment(reservation, "rejected", None)

        action_name = "reservation_confirmed" if new_status == "confirmed" else "reservation_cancelled"
        self._log_reservation_action(
            action=action_name,
            user=request.user,
            reservation=reservation,
            details={"review_notes": review_notes},
        )

        response_serializer = ReservationDetailSerializer(
            reservation,
            context=self.get_serializer_context(),
        )
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[IsStaffOrAdminRole])
    def archive(self, request, pk=None):
        reservation = self.get_object()
        reservation.is_archived = True
        reservation.save(update_fields=["is_archived", "updated_at"])

        response_serializer = ReservationDetailSerializer(
            reservation,
            context=self.get_serializer_context(),
        )
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def cancel(self, request, pk=None):
        reservation = self.get_object()

        if request.user != reservation.guest and not request.user.is_staff:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        if reservation.status not in ["pending", "confirmed"]:
            return Response(
                {"error": "Cannot cancel reservation in this state"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reservation.status = "cancelled"
        reservation.save()
        sync_reservation_payment(reservation, "rejected", None)
        self._log_reservation_action(
            action="reservation_cancelled",
            user=request.user,
            reservation=reservation,
        )

        serializer = ReservationDetailSerializer(reservation, context=self.get_serializer_context())
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def my_bookings(self, request):
        reservations = Reservation.objects.filter(guest=request.user).order_by("-created_at")
        serializer = ReservationListSerializer(
            reservations,
            many=True,
            context=self.get_serializer_context(),
        )
        return Response(serializer.data)

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def track(self, request):
        reservation_id = (request.query_params.get("reservation_id") or "").strip()
        if not reservation_id:
            return Response(
                {"error": "reservation_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reservation = Reservation.objects.filter(reservation_id__iexact=reservation_id).first()
        if reservation is None:
            return Response({"error": "Reservation not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = ReservationDetailSerializer(reservation, context=self.get_serializer_context())
        return Response(serializer.data)

    @action(detail=False, methods=["get"], permission_classes=[IsStaffOrAdminRole])
    def pending(self, request):
        reservations = Reservation.objects.filter(status="pending").order_by("created_at")
        serializer = ReservationDetailSerializer(
            reservations,
            many=True,
            context=self.get_serializer_context(),
        )
        return Response(serializer.data)

    @action(detail=False, methods=["get"], permission_classes=[IsStaffOrAdminRole])
    def by_date_range(self, request):
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if not start_date or not end_date:
            return Response(
                {"error": "start_date and end_date required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reservations = Reservation.objects.filter(
            check_in__gte=start_date,
            check_out__lte=end_date,
            status__in=ACTIVE_RESERVATION_STATUSES,
        ).order_by("check_in")
        serializer = ReservationListSerializer(
            reservations,
            many=True,
            context=self.get_serializer_context(),
        )
        return Response(serializer.data)


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAdminUser]

    def sync_payment_statuses(self):
        now = timezone.now()
        Payment.objects.filter(reservation__status="cancelled").exclude(
            verification_status="rejected"
        ).update(verification_status="rejected", paid_at=None, updated_at=now)

        Payment.objects.filter(reservation__status="confirmed").exclude(
            verification_status="verified"
        ).update(verification_status="verified", paid_at=now, updated_at=now)

    def get_queryset(self):
        self.sync_payment_statuses()
        return Payment.objects.select_related("reservation").all()

    @action(detail=False, methods=["get"])
    def by_status(self, request):
        status_filter = request.query_params.get("status")
        payments = Payment.objects.filter(verification_status=status_filter) if status_filter else Payment.objects.all()
        serializer = self.get_serializer(payments, many=True)
        return Response(serializer.data)


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.select_related(
        "reservation",
        "reservation__facility",
        "reservation__payment",
    ).all()
    serializer_class = NotificationSerializer
    permission_classes = [IsStaffOrAdminRole]

    def get_queryset(self):
        queryset = super().get_queryset()
        unread = self.request.query_params.get("unread")
        if unread in ["1", "true", "True"]:
            queryset = queryset.filter(is_read=False)
        return queryset

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"status": "Notifications marked as read"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        serializer = self.get_serializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)


class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = [IsAdminUser]

    def get_permissions(self):
        permission_classes = [AllowAny] if self.action == "create" else [IsAdminUser]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = Feedback.objects.all()
        status_filter = self.request.query_params.get("status")
        search = self.request.query_params.get("search")

        if status_filter and status_filter.lower() != "all":
            queryset = queryset.filter(status=status_filter.lower())

        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(email__icontains=search)
                | Q(comment__icontains=search)
                | Q(feedback_id__icontains=search)
                | Q(reservation__reservation_id__icontains=search)
            )

        return queryset.order_by("-submitted_at")

    @action(detail=True, methods=["patch"])
    def update_status(self, request, pk=None):
        feedback = self.get_object()
        status_value = request.data.get("status")

        if status_value not in dict(Feedback.STATUS_CHOICES):
            return Response({"error": "Invalid status value"}, status=status.HTTP_400_BAD_REQUEST)

        feedback.status = status_value
        feedback.save()

        serializer = self.get_serializer(feedback)
        return Response(serializer.data)


class ReportViewSet(viewsets.ViewSet):
    permission_classes = [IsStaffOrAdminRole]

    def get_filtered_reservations(self, request):
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        facility_type = request.query_params.get("facility_type")
        report_type = request.query_params.get("report_type", "reservations")

        queryset = Reservation.objects.select_related("facility", "facility__room_type", "payment").all()

        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
        if facility_type and facility_type.lower() != "all":
            queryset = queryset.filter(facility__room_type__name__iexact=facility_type)
        if report_type == "payments":
            queryset = queryset.filter(payment__isnull=False)
        elif report_type == "guests":
            queryset = queryset.exclude(email="")

        return queryset.order_by("-created_at")

    def _build_reservation_summary(self, queryset, include_confirmed_in_approved=True):
        total_reservations = queryset.count()
        total_revenue = queryset.filter(status__in=REVENUE_RESERVATION_STATUSES).aggregate(
            Sum("total_amount")
        )["total_amount__sum"] or 0
        approved_statuses = ["approved", "confirmed"] if include_confirmed_in_approved else ["approved"]

        return {
            "total_reservations": total_reservations,
            "approved_count": queryset.filter(status__in=approved_statuses).count(),
            "confirmed_count": queryset.filter(status="confirmed").count(),
            "pending_count": queryset.filter(status="pending").count(),
            "cancelled_count": queryset.filter(status="cancelled").count(),
            "total_revenue": total_revenue,
            "average_booking_value": total_revenue / total_reservations if total_reservations > 0 else 0,
        }

    @action(detail=False, methods=["get"])
    def reservation_summary(self, request):
        queryset = self.get_filtered_reservations(request)
        return Response(self._build_reservation_summary(queryset))

    @action(detail=False, methods=["get"])
    def reservation_detail(self, request):
        queryset = self.get_filtered_reservations(request)
        summary = self._build_reservation_summary(queryset, include_confirmed_in_approved=False)
        summary["total_guests"] = queryset.aggregate(Sum("num_guests"))["num_guests__sum"] or 0

        facility_breakdown = list(
            queryset.values("facility__room_type__name")
            .annotate(total_reservations=Count("id"), total_revenue=Sum("total_amount"))
            .order_by("facility__room_type__name")
        )

        serializer = ReservationListSerializer(queryset, many=True, context={"request": request})
        return Response(
            {
                "summary": summary,
                "facility_breakdown": [
                    {
                        "facility_type": item["facility__room_type__name"] or "Uncategorized",
                        "total_reservations": item["total_reservations"],
                        "total_revenue": item["total_revenue"] or 0,
                    }
                    for item in facility_breakdown
                ],
                "reservations": serializer.data,
            }
        )

    @action(detail=False, methods=["get"])
    def facility_utilization(self, request):
        facilities = Facility.objects.filter(is_active=True)
        data = []

        for facility in facilities:
            qualifying_reservations = facility.reservations.filter(status__in=["confirmed", "checked_in", "checked_out"])
            total_revenue = qualifying_reservations.aggregate(Sum("total_amount"))["total_amount__sum"] or 0
            data.append(
                {
                    "facility_id": facility.id,
                    "facility_name": facility.name,
                    "total_reservations": qualifying_reservations.count(),
                    "total_revenue": float(total_revenue),
                }
            )

        return Response(data)

    @action(detail=False, methods=["get"])
    def guest_report(self, request):
        total_guests = Reservation.objects.values("email").distinct().count()
        repeat_guests = (
            Reservation.objects.values("email").annotate(count=Count("id")).filter(count__gt=1).count()
        )
        return Response(
            {
                "total_guests": total_guests,
                "repeat_guests": repeat_guests,
                "new_guests": total_guests - repeat_guests,
            }
        )


class TransactionLogViewSet(viewsets.ModelViewSet):
    queryset = TransactionLog.objects.all()
    serializer_class = TransactionLogSerializer
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=["get"])
    def by_action(self, request):
        action_name = request.query_params.get("action")
        logs = TransactionLog.objects.all().order_by("-created_at")
        if action_name:
            logs = logs.filter(action=action_name)

        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)
