from django.urls import path
from .views import InitiatePaymentView, VerifyPaymentView, ReleasePaymentView, ProofUploadView, ProofReviewListView, ProofReviewActionView, EscrowAnalyticsView

urlpatterns = [
    path('initiate/<int:item_id>/', InitiatePaymentView.as_view(), name='initiate-payment'),
    path('verify/', VerifyPaymentView.as_view(), name='verify-payment'),
    path('release/<int:item_id>/', ReleasePaymentView.as_view(), name='release-payment'),
    path('proof-upload/<int:item_id>/', ProofUploadView.as_view(), name='proof-upload'),
    path('proof-reviews/', ProofReviewListView.as_view(), name='proof-reviews'),
    path('proof-review/<int:payment_id>/', ProofReviewActionView.as_view(), name='proof-review-action'),
    path('analytics/', EscrowAnalyticsView.as_view(), name='escrow-analytics'),
]
