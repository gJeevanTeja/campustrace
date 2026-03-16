from rest_framework import serializers
from .models import College, Block, Category, CampusLocation

class CollegeSerializer(serializers.ModelSerializer):
    class Meta:
        model = College
        fields = '__all__'

class BlockSerializer(serializers.ModelSerializer):
    college_name = serializers.ReadOnlyField(source='college.name')
    
    class Meta:
        model = Block
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    college_name = serializers.ReadOnlyField(source='college.name')

    class Meta:
        model = Category
        fields = '__all__'
        ordering = ['-priority', 'name']

class CampusLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampusLocation
        fields = "__all__"
