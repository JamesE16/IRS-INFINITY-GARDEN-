from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from resortapi.core.views import (
    UserViewSet, UserProfileViewSet,
    FacilityViewSet, BlackoutDateViewSet,
    ReservationViewSet, PaymentViewSet, FeedbackViewSet, ReportViewSet, TransactionLogViewSet,
    NotificationViewSet
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
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'feedbacks', FeedbackViewSet, basename='feedback')

# Reports
router.register(r'reports', ReportViewSet, basename='report')
router.register(r'transactions', TransactionLogViewSet, basename='transaction')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api-auth/', include('rest_framework.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
