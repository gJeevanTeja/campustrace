from decimal import Decimal

def calculate_commission(reward):
    """
    Commission Slabs (based on reward):
    reward <= 500: ₹10
    reward <= 5000: 10%
    reward <= 50000: 5%
    Above 50000: 2% (Max ₹1500)
    """
    r = Decimal(str(reward))
    
    if r <= 500:
        return Decimal('10.00')
    elif r <= 5000:
        return (r * Decimal('0.10'))
    elif r <= 50000:
        return (r * Decimal('0.05'))
    else:
        comm = (r * Decimal('0.02'))
        return min(comm, Decimal('1500.00'))

def get_suggested_reward(product_price):
    """
    Suggested reward based on product price:
    if price <= 500 → reward = ₹50
    if price <= 5000 → reward = ₹100–₹300 (suggest ₹200)
    if price <= 50000 → reward = ₹300–₹1000 (suggest ₹500)
    if price > 50000 → reward = ₹1000+ (suggest ₹1000)
    """
    price = Decimal(str(product_price))
    
    if price <= 500:
        # 10% but at least 50
        suggested = max(price * Decimal('0.10'), Decimal('50.00'))
        return suggested, suggested / 2
    elif price <= 5000:
        # 5% but at least 100
        suggested = max(price * Decimal('0.05'), Decimal('100.00'))
        return suggested, suggested / 2
    elif price <= 50000:
        # 3% but at least 300
        suggested = max(price * Decimal('0.03'), Decimal('300.00'))
        return suggested, suggested / 2
    else:
        # 2% but at least 1000
        suggested = max(price * Decimal('0.02'), Decimal('1000.00'))
        return suggested, suggested / 2
