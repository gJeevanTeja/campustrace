from django.db import models

class College(models.Model):
    name = models.CharField(max_length=200)
    logo = models.ImageField(upload_to='colleges/logos/', blank=True, null=True)
    email_domain = models.CharField(max_length=100) # e.g. mallareddyuniversity.ac.in
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'colleges'

    def __str__(self):
        return self.name

class Block(models.Model):
    college = models.ForeignKey(College, on_delete=models.CASCADE, related_name='blocks')
    name = models.CharField(max_length=100)
    latitude = models.FloatField()
    longitude = models.FloatField()
    image = models.ImageField(upload_to='blocks/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'blocks'

    def __str__(self):
        return f"{self.name} ({self.college.name})"

class Category(models.Model):
    college = models.ForeignKey(College, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100)
    icon = models.ImageField(upload_to='categories/icons/', blank=True, null=True)
    priority = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'Categories'
        ordering = ['-priority', 'name']

    def __str__(self):
        return f"{self.name} ({self.college.name})"
