from django.db import models
from users.models import User
import random
import string


class Item(models.Model):
    TYPE_CHOICES = [
        ('lost', 'Lost'),
        ('found', 'Found'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('claimed', 'Claimed'),
        ('closed', 'Closed'),
    ]

    CATEGORY_CHOICES = [
        ('electronics', 'Electronics'),
        ('books', 'Books'),
        ('keys', 'Keys'),
        ('wallet', 'Wallet'),
        ('id_card', 'ID Card'),
        ('clothing', 'Clothing'),
        ('accessories', 'Accessories'),
        ('other', 'Other'),
    ]

    LOCATION_CHOICES = [
        ('library', 'Library'),
        ('hostel', 'Hostel'),
        ('canteen', 'Canteen'),
        ('classroom', 'Classroom Block'),
        ('parking', 'Parking Area'),
        ('student_union', 'Student Union'),
        ('gym', 'Gym'),
        ('science_block', 'Science Block'),
        ('other', 'Other'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='other')
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    location = models.CharField(max_length=100, choices=LOCATION_CHOICES, default='other')
    
    # Multi-College fields
    college = models.ForeignKey('colleges.College', on_delete=models.CASCADE, related_name='items', null=True, blank=True)
    category_new = models.ForeignKey('colleges.Category', on_delete=models.SET_NULL, null=True, blank=True, related_name='items')
    block = models.ForeignKey('colleges.Block', on_delete=models.SET_NULL, null=True, blank=True, related_name='items')
    
    location_detail = models.CharField(max_length=200, blank=True, null=True)
    location_name = models.CharField(max_length=300, blank=True, null=True)  # GPS address text
    use_current_location = models.BooleanField(default=False)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    image = models.ImageField(upload_to='items/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    contact_phone = models.CharField(max_length=20, blank=True, null=True)
    reference_number = models.CharField(max_length=20, unique=True, blank=True)
    incident_datetime = models.DateTimeField(blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='items')
    claimed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='claimed_items'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'items'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.type.upper()}] {self.title} - {self.status}"

    def get_location_display_text(self):
        """Return GPS address if used, otherwise dropdown label"""
        if self.use_current_location and self.location_name:
            return self.location_name
        return self.get_location_display()

    def get_map_label(self):
        """Shows 'Lost here' or 'Found here' on map pin"""
        if self.type == 'lost':
            return 'Lost here'
        return 'Found here'

    def save(self, *args, **kwargs):
        # Generate reference number
        if not self.reference_number:
            prefix = 'LF' if self.type == 'lost' else 'FF'
            suffix = ''.join(random.choices(string.digits, k=4))
            self.reference_number = f"{prefix}-{suffix}"

        # Claimed status only allowed for lost items
        if self.type == 'found' and self.status == 'claimed':
            self.status = 'closed'

        super().save(*args, **kwargs)


class ItemPhoto(models.Model):
    """Multiple photos per item"""
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='photos')
    photo = models.ImageField(upload_to='items/photos/')
    is_primary = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'item_photos'
        ordering = ['-is_primary', 'uploaded_at']

    def __str__(self):
        return f"Photo for {self.item.title} (primary={self.is_primary})"