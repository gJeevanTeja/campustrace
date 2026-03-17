from rest_framework import serializers
from .models import College, Block, Category, CampusLocation
from items.models import Item

class CollegeSerializer(serializers.ModelSerializer):
    class Meta:
        model = College
        fields = '__all__'

class BlockSerializer(serializers.ModelSerializer):
    college_name = serializers.ReadOnlyField(source='college.name')
    # Write-only aliases to match user request
    photo = serializers.ImageField(write_only=True, required=False, source='image')
    active = serializers.BooleanField(write_only=True, required=False, source='is_active')
    
    class Meta:
        model = Block
        fields = ['id', 'college', 'college_name', 'name', 'latitude', 'longitude', 'image', 'is_active', 'photo', 'active']
        extra_kwargs = {
            'college': {'required': False, 'allow_null': True}
        }

class CategorySerializer(serializers.ModelSerializer):
    college_name = serializers.ReadOnlyField(source='college.name')

    class Meta:
        model = Category
        fields = ['id', 'name', 'icon', 'emoji', 'priority', 'active', 'college', 'college_name']
        extra_kwargs = {
            'college': {'required': False, 'allow_null': True}
        }
        ordering = ['-priority', 'name']

class CampusLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampusLocation
        fields = "__all__"

class ItemReportSerializer(serializers.ModelSerializer):
    category = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    reported_by = serializers.SerializerMethodField()
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    college_name = serializers.ReadOnlyField(source='college.name')
    date_reported = serializers.DateTimeField(source='created_at', format="%Y-%m-%d %H:%M")

    class Meta:
        model = Item
        fields = [
            'id', 'title', 'category', 'type', 'type_display', 
            'status', 'status_display', 'location', 
            'reported_by', 'date_reported', 'college_name'
        ]

    def get_category(self, obj):
        if obj.category_new:
            return obj.category_new.name
        return obj.get_category_display()

    def get_location(self, obj):
        if obj.block:
            return obj.block.name
        return obj.get_location_display()

    def get_reported_by(self, obj):
        return obj.user.name or obj.user.username
