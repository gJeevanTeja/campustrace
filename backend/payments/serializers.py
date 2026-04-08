from rest_framework import serializers
from .models import RewardPayment
from items.models import Item
from users.models import User

class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'phone', 'avatar']

class ItemBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ['id', 'title', 'category', 'type', 'status', 'image_url']

class RewardPaymentSerializer(serializers.ModelSerializer):
    payer_details = UserBasicSerializer(source='payer', read_only=True)
    payee_details = UserBasicSerializer(source='payee', read_only=True)
    item_details = ItemBasicSerializer(source='item', read_only=True)
    return_proof_url = serializers.SerializerMethodField()

    class Meta:
        model = RewardPayment
        fields = [
            'id', 'status', 'amount', 'commission', 'finder_amount',
            'razorpay_order_id', 'razorpay_payment_id',
            'return_proof', 'return_proof_url', 'proof_comment',
            'proof_uploaded_at', 'proof_uploaded_by',
            'payer_details', 'payee_details', 'item_details'
        ]

    def get_return_proof_url(self, obj):
        if obj.return_proof:
            return obj.return_proof.url
        return None
