from django.urls import path
from .views import (
    ItemListCreateView, ItemDetailView, ClaimItemView,
    MyItemsView, RecentItemsView, AddItemPhotosView,
    NearbyItemsView, VerifyClaimView, ConfirmReturnView,
    ApproveVerificationView, SubmitAIAnswerView, RejectClaimView,
    GenerateElectronicQuestionsView
)

urlpatterns = [
    path('generate-questions/', GenerateElectronicQuestionsView.as_view(), name='generate-electronic-questions'),
    path('', ItemListCreateView.as_view(), name='item-list-create'),
    path('recent/', RecentItemsView.as_view(), name='recent-items'),
    path('my-items/', MyItemsView.as_view(), name='my-items'),
    path('nearby/', NearbyItemsView.as_view(), name='nearby-items'),
    path('<int:pk>/', ItemDetailView.as_view(), name='item-detail'),
    path('<int:pk>/claim/', ClaimItemView.as_view(), name='claim-item'),
    path('<int:pk>/verify-claim/', VerifyClaimView.as_view(), name='verify-claim'),
    path('<int:pk>/submit-ai-answer/', SubmitAIAnswerView.as_view(), name='submit-ai-answer'),

    path('<int:item_id>/confirm-return/', ConfirmReturnView.as_view(), name='confirm-return'),
    path('claim/<int:claim_id>/approve/', ApproveVerificationView.as_view(), name='approve-claim'),
    path('claim/<int:claim_id>/reject/', RejectClaimView.as_view(), name='reject-claim'),
    path('<int:pk>/photos/', AddItemPhotosView.as_view(), name='item-photos'),
]