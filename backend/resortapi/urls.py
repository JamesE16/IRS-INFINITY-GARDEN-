from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from resortapi.core.views import (
    UserViewSet, UserProfileViewSet,
    FacilityViewSet, BlackoutDateViewSet,
    ReservationViewSet, PaymentViewSet, FeedbackViewSet, ReportViewSet, TransactionLogViewSet
)

router = DefaultRouter()

# Auth & Users
router.register(r'users', UserViewSet, basename='user')
router.register(r'profiles', UserProfileViewSet, basename='profile')

# Facilities
router.register(r'facilities', FacilityViewSet, basename='facility')
router.register(r'blackout-dates', BlackoutDateViewSet, basename='blackout-date')

# Reservations & Payments
router.register(r'reservations', ReservationViewSet, basename='reservation')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'feedbacks', FeedbackViewSet, basename='feedback')

# Reports
router.register(r'reports', ReportViewSet, basename='report')
router.register(r'transactions', TransactionLogViewSet, basename='transaction')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api-auth/', include('rest_framework.urls')),
]
