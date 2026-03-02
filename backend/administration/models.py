from django.db import models

class AdminRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, default='') # Added default
    college_name = models.CharField(max_length=255)
    college_id_card = models.ImageField(upload_to="admin_requests/college_id/", blank=True, null=True)
    aadhaar_card = models.ImageField(upload_to="admin_requests/aadhaar/", blank=True, null=True)
    designation = models.CharField(max_length=255, blank=True, null=True)
    reason = models.TextField(default='') # Added default
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.full_name} - {self.college_name} ({self.status})"

    class Meta:
        db_table = 'admin_requests'
        ordering = ['-created_at']
