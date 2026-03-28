from django.urls import path
from .views import InitiatePaymentView, VerifyPaymentView, ReleasePaymentView

urlpatterns = [
    path('initiate/<int:item_id>/', InitiatePaymentView.as_view(), name='initiate-payment'),
    path('verify/', VerifyPaymentView.as_view(), name='verify-payment'),
    path('release/<int:item_id>/', ReleasePaymentView.as_view(), name='release-payment'),
]
