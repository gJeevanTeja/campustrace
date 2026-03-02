from rest_framework import serializers
from .models import AdminRequest

class AdminRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminRequest
        fields = '__all__'
        read_only_fields = ['status', 'created_at', 'updated_at']

    def validate_college_id_card(self, value):
        if value:
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("ID card image must be less than 5MB.")
            ext = value.name.split('.')[-1].lower()
            if ext not in ['jpg', 'jpeg', 'png', 'pdf']:
                raise serializers.ValidationError("Only JPG, PNG, and PDF allowed.")
        return value

    def validate_aadhaar_card(self, value):
        if value:
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Aadhaar image must be less than 5MB.")
            ext = value.name.split('.')[-1].lower()
            if ext not in ['jpg', 'jpeg', 'png', 'pdf']:
                raise serializers.ValidationError("Only JPG, PNG, and PDF allowed.")
        return value

    def validate_email(self, value):
        existing = AdminRequest.objects.filter(email=value).first()
        if existing:
            if existing.status == 'approved':
                raise serializers.ValidationError("An admin account already exists for this email. Please log in.")
            elif existing.status == 'pending':
                raise serializers.ValidationError("A request is already pending for this email. Please wait for approval.")
            else:
                # If rejected, they might want to try again with different info, 
                # but since email is unique in model, we must block or delete.
                # For now, block with clear message.
                raise serializers.ValidationError("A previous request for this email was rejected. Please contact support.")
        return value

class AdminRequestActionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['approved', 'rejected'])
    college_id = serializers.IntegerField(required=False, allow_null=True) # Optional: if we want to link to existing college
