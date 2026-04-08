import re

CATEGORIES = {
    "food": [
        "pizza", "dinner", "lunch", "breakfast", "cafe", "restaurant", "coffee",
        "burger", "sushi", "biryani", "dal", "naan", "paneer", "chicken", "food",
        "eat", "meal", "snack", "dosa", "idli", "chai", "tea", "juice", "swiggy",
        "zomato", "dominos", "mcdonalds", "kfc", "starbucks", "subway", "thali",
        "samosa", "momos", "maggi", "noodles", "pasta", "salad", "dessert", "ice cream",
    ],
    "travel": [
        "uber", "ola", "flight", "train", "bus", "taxi", "metro", "petrol", "gas",
        "fuel", "parking", "toll", "cab", "auto", "rickshaw", "rapido", "lyft",
        "airline", "airbnb", "hotel", "hostel", "trip", "travel", "vacation",
    ],
    "rent": [
        "rent", "deposit", "maintenance", "society", "flat", "apartment", "room",
        "lease", "emi", "mortgage",
    ],
    "entertainment": [
        "movie", "netflix", "spotify", "prime", "disney", "hotstar", "game",
        "concert", "show", "theatre", "bowling", "arcade", "party", "club", "bar",
        "pub", "drinks", "beer", "wine", "karaoke", "festival",
    ],
    "shopping": [
        "amazon", "flipkart", "myntra", "clothes", "shoes", "shirt", "dress",
        "jacket", "watch", "phone", "laptop", "electronics", "gadget", "furniture",
        "decor", "gift", "shopping", "mall",
    ],
    "utilities": [
        "electricity", "water", "wifi", "internet", "phone bill", "recharge",
        "gas bill", "cylinder", "laundry", "cleaning", "repair", "plumber",
        "electrician", "utility",
    ],
    "groceries": [
        "grocery", "vegetables", "fruits", "milk", "bread", "rice", "atta", "oil",
        "sugar", "bigbasket", "blinkit", "instamart", "zepto", "dmart", "supermarket",
    ],
    "health": [
        "medicine", "doctor", "hospital", "pharmacy", "gym", "fitness", "yoga",
        "medical", "health", "insurance", "dentist", "clinic",
    ],
}

CATEGORY_EMOJIS = {
    "food": "🍕",
    "travel": "✈️",
    "rent": "🏠",
    "entertainment": "🎬",
    "shopping": "🛒",
    "utilities": "💡",
    "groceries": "🥬",
    "health": "💊",
    "other": "📦",
}


def classify_expense(title: str) -> str:
    """Classify an expense title into a category using keyword-based NLP."""
    title_lower = title.lower().strip()
    words = re.findall(r"\w+", title_lower)

    scores = {}
    for category, keywords in CATEGORIES.items():
        score = 0
        for word in words:
            for keyword in keywords:
                if word == keyword or (len(word) > 3 and word in keyword) or (len(keyword) > 3 and keyword in word):
                    score += 1
                    break
        if score > 0:
            scores[category] = score

    if scores:
        return max(scores, key=scores.get)
    return "other"


def get_category_emoji(category: str) -> str:
    return CATEGORY_EMOJIS.get(category, "📦")
