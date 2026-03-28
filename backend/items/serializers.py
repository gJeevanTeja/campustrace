from rest_framework import serializers
from .models import Item, ItemPhoto, ClaimSession
from users.serializers import UserSerializer
import math


def haversine_distance(lat1, lon1, lat2, lon2):
    """Distance in km between two GPS coordinates. Returns None if coords missing."""
    if None in (lat1, lon1, lat2, lon2):
        return None
    R     = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a     = (math.sin(d_lat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(d_lon / 2) ** 2)
    c     = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


class ClaimSessionSerializer(serializers.ModelSerializer):
    claimant = UserSerializer(read_only=True)
    has_paid = serializers.SerializerMethodField()
    claim_code = serializers.SerializerMethodField()

    class Meta:
        model = ClaimSession
        fields = ['id', 'item', 'claimant', 'status', 'ai_score', 'ai_result', 'ai_result_label', 'claim_code', 'attempts', 'created_at', 'has_paid']
        read_only_fields = ['id', 'item', 'claimant', 'ai_score', 'ai_result', 'ai_result_label', 'claim_code', 'attempts', 'created_at', 'has_paid']

    def get_has_paid(self, obj):
        from payments.models import RewardPayment
        return RewardPayment.objects.filter(item=obj.item, payer=obj.claimant, status__in=['paid', 'completed']).exists()

    def get_claim_code(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        
        # Original Flow: Only the Finder (Post Owner) should see the code to show it to the claimant
        if obj.item.user == request.user:
             # Only show if paid
             from payments.models import RewardPayment
             if RewardPayment.objects.filter(item=obj.item, payer=obj.claimant, status__in=['paid', 'completed']).exists():
                 return obj.claim_code
            
        return None


class ItemPhotoSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model  = ItemPhoto
        fields = ['id', 'photo', 'photo_url', 'is_primary', 'uploaded_at']

    def get_photo_url(self, obj):
        request = self.context.get('request')
        if obj.photo and request:
            return request.build_absolute_uri(obj.photo.url)
        return None


class ItemSerializer(serializers.ModelSerializer):
    user               = UserSerializer(read_only=True)
    claimed_by         = UserSerializer(read_only=True)
    image_url          = serializers.SerializerMethodField()
    photos             = ItemPhotoSerializer(many=True, read_only=True)
    time_ago           = serializers.SerializerMethodField()
    location_display   = serializers.SerializerMethodField()
    map_label          = serializers.SerializerMethodField()
    can_be_claimed     = serializers.SerializerMethodField()
    distance_from_user = serializers.SerializerMethodField()
    nearby_matches     = serializers.SerializerMethodField()
    pending_claims     = serializers.SerializerMethodField()
    my_claim           = serializers.SerializerMethodField()
    is_electronics     = serializers.SerializerMethodField()
    category_display   = serializers.SerializerMethodField()

    claim_code         = serializers.SerializerMethodField()
    reward_suggestions = serializers.SerializerMethodField()
    contact_phone     = serializers.SerializerMethodField()
    matching_lost_item_price = serializers.SerializerMethodField()
    matching_lost_item_id = serializers.SerializerMethodField()

    class Meta:
        model  = Item
        fields = [
            'id', 'title', 'description', 'category', 'type', 'location',
            'location_detail', 'location_name', 'latitude', 'longitude',
            'use_current_location', 'location_display', 'map_label',
            'image', 'image_url', 'photos',
            'status', 'can_be_claimed', 'contact_phone', 'reference_number',
            'claim_code', 'incident_datetime', 'user', 'claimed_by',
            'created_at', 'updated_at', 'time_ago',
            'distance_from_user', 'nearby_matches',
            'college', 'category_new', 'category_display', 'block', 'pending_claims', 'my_claim',
            'is_electronics', 'latitude', 'longitude',
            'brand', 'color', 'unique_mark', 'verification_questions', 'verification_answers',
            'product_price', 'reward_amount', 'reward_suggestions',
            'matching_lost_item_price', 'matching_lost_item_id'
        ]
        read_only_fields = ['id', 'reference_number', 'user', 'created_at', 'updated_at', 'claim_code']

    def get_claim_code(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        
        # Original Flow: Only the Finder (Post Owner) should see the code
        if obj.user == request.user:
            # Check for any verified and paid claim
            from payments.models import RewardPayment
            has_paid = RewardPayment.objects.filter(
                item=obj, 
                status__in=['paid', 'completed']
            ).exists()
            
            if has_paid:
                return obj.claim_code
            
        return None

    def get_matching_lost_item_price(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated or obj.type != 'found':
            return None
        # Look for the current user's most recent lost report of the same category
        match = Item.objects.filter(
            user=request.user, 
            type='lost', 
            category=obj.category,
            status='active'
        ).order_by('-created_at').first()
        if match and match.product_price:
            return float(match.product_price)
        return None

    def get_matching_lost_item_id(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated or obj.type != 'found':
            return None
        match = Item.objects.filter(
            user=request.user, 
            type='lost', 
            category=obj.category,
            status='active'
        ).order_by('-created_at').first()
        return match.id if match else None

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None

    def get_pending_claims(self, obj):
        request = self.context.get('request')
        # Only show pending claims to the user who posted the item
        if request and request.user.is_authenticated and obj.user == request.user:
            claims = ClaimSession.objects.filter(item=obj, status__in=['pending', 'awaiting_approval', 'verified'])
            return ClaimSessionSerializer(claims, many=True).data
        return []

    def get_my_claim(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            claim = ClaimSession.objects.filter(item=obj, claimant=request.user).order_by('-created_at').first()
            if claim:
                return ClaimSessionSerializer(claim).data
        return None

    def get_is_electronics(self, obj):
        return obj.is_electronics()

    def get_category_display(self, obj):
        if obj.category_new:
            return obj.category_new.name
        return obj.get_category_display()

    def get_time_ago(self, obj):
        from django.utils import timezone
        now   = timezone.now()
        diff  = now - obj.created_at
        secs  = diff.total_seconds()
        if secs < 60:     return "Just now"
        if secs < 3600:   m = int(secs / 60);   return f"{m} minute{'s' if m!=1 else ''} ago"
        if secs < 86400:  h = int(secs / 3600);  return f"{h} hour{'s' if h!=1 else ''} ago"
        if diff.days < 7: return f"{diff.days} day{'s' if diff.days!=1 else ''} ago"
        return obj.created_at.strftime("%b %d, %Y")

    def get_location_display(self, obj):
        if obj.use_current_location and obj.location_name:
            return obj.location_name
        if obj.location_detail:
            return f"{obj.get_location_display()} — {obj.location_detail}"
        return obj.get_location_display()

    def get_map_label(self, obj):
        return f"🔴 Lost here: {obj.title}" if obj.type == 'lost' else f"🟢 Found here: {obj.title}"

    def get_can_be_claimed(self, obj):
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None
        if obj.status != 'active':
            return False
        if user and obj.user == user:
            return False
        return True

    def get_reward_suggestions(self, obj):
        if not obj.product_price:
            return None
        from payments.utils import get_suggested_reward
        suggested, min_val = get_suggested_reward(obj.product_price)
        return {
            "suggested": float(suggested),
            "min": float(min_val)
        }

    def get_contact_phone(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return "Locked"
        
        # If the requester is the finder themselves, show it
        if obj.user == request.user:
            return obj.contact_phone
            
        # Check if there is a successful payment (status='paid' or 'completed')
        try:
            from payments.models import RewardPayment
            has_paid = RewardPayment.objects.filter(
                item=obj, 
                payer=request.user, 
                status__in=['paid', 'completed']
            ).exists()
            
            if has_paid:
                return obj.contact_phone
        except Exception:
            pass
            
        return "Locked"

    def get_distance_from_user(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        try:
            user_lat = float(request.query_params.get('user_lat', ''))
            user_lng = float(request.query_params.get('user_lng', ''))
            dist     = haversine_distance(user_lat, user_lng, obj.latitude, obj.longitude)
            if dist is not None:
                return f"{int(dist * 1000)}m away" if dist < 1 else f"{dist} km away"
        except (ValueError, TypeError):
            pass
        return None

    def get_nearby_matches(self, obj):
        if not obj.latitude or not obj.longitude:
            return []
        opposite_type = 'found' if obj.type == 'lost' else 'lost'
        candidates    = Item.objects.filter(
            type=opposite_type, category=obj.category, status='active'
        ).exclude(id=obj.id)

        matches = []
        for candidate in candidates:
            if candidate.latitude and candidate.longitude:
                dist = haversine_distance(
                    obj.latitude, obj.longitude,
                    candidate.latitude, candidate.longitude
                )
                if dist is not None and dist <= 2.0:
                    matches.append({
                        'id':       candidate.id,
                        'title':    candidate.title,
                        'distance': f"{dist} km away" if dist >= 1 else f"{int(dist*1000)}m away",
                        'type':     candidate.type,
                        'time_ago': self.get_time_ago(candidate),
                    })

        matches.sort(key=lambda x: (
            float(x['distance'].replace(' km away', ''))
            if 'km' in x['distance']
            else float(x['distance'].replace('m away', '')) / 1000
        ))
        return matches[:5]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Fallback to block coordinates if item coordinates are missing
        if not data.get('latitude') or not data.get('longitude'):
            if instance.block and (instance.block.latitude or instance.block.longitude):
                data['latitude'] = instance.block.latitude
                data['longitude'] = instance.block.longitude
        
        # Ensure category fallback for UI
        if not data.get('category_display'):
             data['category_display'] = data.get('category')
             
        return data


class ItemSimpleSerializer(serializers.ModelSerializer):
    """Lightweight item serializer for lists/notifications to avoid expensive distance calculations."""
    image_url = serializers.SerializerMethodField()
    category_display = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = ['id', 'title', 'type', 'status', 'image_url', 'category_display', 'created_at']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None

    def get_category_display(self, obj):
        if obj.category_new:
            return obj.category_new.name
        return obj.get_category_display()


class ItemCreateSerializer(serializers.ModelSerializer):
    photos = serializers.ListField(
        child=serializers.ImageField(),
        required=False,
        write_only=True
    )
    verification_questions = serializers.JSONField(required=False, allow_null=True)
    verification_answers = serializers.JSONField(required=False, allow_null=True)

    class Meta:
        model  = Item
        fields = [
            'title', 'description', 'category', 'type', 'location',
            'location_detail', 'latitude', 'longitude', 'location_name',
            'use_current_location', 'image', 'contact_phone', 'incident_datetime',
            'photos', 'college', 'category_new', 'block',
            'brand', 'color', 'unique_mark', 'verification_questions', 'verification_answers', 'product_price'
        ]

    def to_internal_value(self, data):
        # Handle JSON strings from FormData
        import json
        from django.http import QueryDict
        
        # If it's a QueryDict, we must convert to a regular dict.
        # However, .dict() loses lists (like 'photos'). We must handle it.
        if isinstance(data, QueryDict) or hasattr(data, 'dict'):
            if hasattr(data, 'dict'):
                # Handle lists like 'photos' correctly
                new_data = data.dict()
                if 'photos' in data:
                    new_data['photos'] = data.getlist('photos')
                data = new_data
            else:
                data = data.copy()
        else:
            data = dict(data) # Ensure it's a plain dict
            
        # Ensure 'category' has a valid value for legacy reasons
        if not data.get('category'):
            data['category'] = 'other'
            
        fields_to_parse = ['verification_questions', 'verification_answers']
        for field in fields_to_parse:
            if field in data:
                val = data[field]
                if isinstance(val, str):
                    # Clean common "nullish" strings sent by some frontend libs
                    cleaned_val = val.strip()
                    if cleaned_val in ['', 'null', 'undefined']:
                        data[field] = None
                    else:
                        try:
                            data[field] = json.loads(cleaned_val)
                        except (ValueError, TypeError):
                            # Let the JSONField validation catch actual syntax errors later if needed
                            pass
        
        # Handle string block names
        block_val = data.get('block')
        if isinstance(block_val, str):
            block_val = block_val.strip()
            if block_val in ['', 'null', 'undefined']:
                data['block'] = None
            elif not block_val.isdigit():
                from colleges.models import CampusLocation
                loc = CampusLocation.objects.filter(name__iexact=block_val).first()
                if loc:
                    data['block'] = loc.id
                else:
                    data['block'] = None
                    
        # Handle string category_new
        category_val = data.get('category_new')
        if isinstance(category_val, str):
            category_val = category_val.strip()
            if category_val in ['', 'null', 'undefined']:
                data['category_new'] = None
            elif not category_val.isdigit():
                from colleges.models import Category
                cat = Category.objects.filter(name__iexact=category_val.replace('_', ' ')).first()
                if cat:
                    data['category_new'] = cat.id
                else:
                    data['category_new'] = None
                    
        return super().to_internal_value(data)

    def validate_incident_datetime(self, value):
        from django.utils import timezone
        if value and value > timezone.now():
            raise serializers.ValidationError("Incident datetime cannot be in the future.")
        return value

    def create(self, validated_data):
        user         = self.context['request'].user
        extra_photos = validated_data.pop('photos', [])

        # ✅ FIX: If frontend only sends 'photos' array, pick the first one as the main image
        if not validated_data.get('image') and extra_photos:
            validated_data['image'] = extra_photos[0]

        item = Item.objects.create(**validated_data)

        if item.image:
            ItemPhoto.objects.create(item=item, photo=item.image, is_primary=True)

        for photo in extra_photos:
            # Don't recreate the primary photo as a secondary photo
            if photo == item.image:
                continue
            ItemPhoto.objects.create(item=item, photo=photo, is_primary=False)

        # ✅ FIX: Do NOT call Notification.bulk_create_for_all_users() here.
        # It was being called BOTH here AND in views._broadcast_new_item(),
        # triggering synchronous SMTP email to every user TWICE per post.
        # Each email batch could take 15-30s → exceeded axios 15s timeout →
        # frontend showed "Failed to Post" even though backend succeeded.
        #
        # Notifications are now handled ONLY in views._broadcast_new_item()
        # which runs in a background thread (response returns instantly).

        return item