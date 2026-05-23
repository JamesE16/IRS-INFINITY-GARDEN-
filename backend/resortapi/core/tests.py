from decimal import Decimal
from uuid import uuid4

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Facility, Notification, Payment, Reservation, RoomType, TransactionLog


class ReservationApiTests(APITestCase):
    def setUp(self):
        self.room_type = RoomType.objects.create(name=f"Deluxe-{uuid4().hex[:6]}")
        self.facility = Facility.objects.create(
            external_id=f"facility-{uuid4().hex[:8]}",
            name="Villa 1",
            room_type=self.room_type,
            capacity=4,
            price=Decimal("2500.00"),
            amenities=["WiFi"],
            is_active=True,
        )
        self.reservation_list_url = reverse("reservation-list")

    def reservation_payload(self, **overrides):
        payload = {
            "facility": self.facility.id,
            "first_name": "Jane",
            "last_name": "Doe",
            "contact": "09123456789",
            "email": "jane@example.com",
            "address": "Test Address",
            "check_in": "2026-06-10",
            "check_out": "2026-06-12",
            "num_guests": 2,
            "special_requests": "Late arrival",
            "total_amount": "5000.00",
            "payment_method": "gcash",
        }
        payload.update(overrides)
        return payload

    def test_create_reservation_creates_payment_notification_and_log(self):
        response = self.client.post(self.reservation_list_url, self.reservation_payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        reservation = Reservation.objects.get()
        payment = Payment.objects.get(reservation=reservation)
        notification = Notification.objects.get(reservation=reservation)
        log = TransactionLog.objects.get(reservation=reservation, action="reservation_created")

        self.assertEqual(reservation.nights, 2)
        self.assertEqual(payment.verification_status, "pending")
        self.assertIn("Payment receipt is ready for review.", notification.message)
        self.assertEqual(log.details, {"method": "web"})

    def test_create_reservation_rejects_overlapping_confirmed_booking(self):
        Reservation.objects.create(
            reservation_id=f"RES-{uuid4().hex[:8]}",
            facility=self.facility,
            first_name="Existing",
            last_name="Guest",
            contact="09999999999",
            email="existing@example.com",
            address="Existing Address",
            check_in="2026-06-11",
            check_out="2026-06-13",
            num_guests=2,
            nights=2,
            total_amount=Decimal("5000.00"),
            status="confirmed",
        )

        response = self.client.post(self.reservation_list_url, self.reservation_payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data["error"], "Facility unavailable for selected dates")

    def test_approve_confirmed_reservation_verifies_payment_and_logs_actions(self):
        admin = User.objects.create_user(
            username="admin@example.com",
            email="admin@example.com",
            password="StrongPass123",
            is_staff=True,
            is_superuser=True,
        )

        reservation = Reservation.objects.create(
            reservation_id=f"RES-{uuid4().hex[:8]}",
            facility=self.facility,
            first_name="Jane",
            last_name="Doe",
            contact="09123456789",
            email="jane@example.com",
            address="Test Address",
            check_in="2026-06-10",
            check_out="2026-06-12",
            num_guests=2,
            nights=2,
            total_amount=Decimal("5000.00"),
            status="pending",
        )
        Payment.objects.create(
            reservation=reservation,
            amount=reservation.total_amount,
            payment_method="gcash",
            reference_number=f"PAY-{uuid4().hex[:10]}",
        )

        self.client.force_authenticate(user=admin)
        response = self.client.post(
            reverse("reservation-approve", kwargs={"pk": reservation.pk}),
            {"status": "confirmed", "review_notes": "Looks good"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        reservation.refresh_from_db()
        reservation.payment.refresh_from_db()

        self.assertEqual(reservation.status, "confirmed")
        self.assertEqual(reservation.review_notes, "Looks good")
        self.assertEqual(reservation.payment.verification_status, "verified")
        self.assertIsNotNone(reservation.payment.paid_at)
        self.assertTrue(
            TransactionLog.objects.filter(
                reservation=reservation,
                action="payment_verified",
                user=admin,
            ).exists()
        )
        self.assertTrue(
            TransactionLog.objects.filter(
                reservation=reservation,
                action="reservation_confirmed",
                user=admin,
            ).exists()
        )
