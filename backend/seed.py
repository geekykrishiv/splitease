"""Pre-seed the database with sample users, groups, and expenses."""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine, Base
from models import User, Group, GroupMember, Expense, Split, Settlement
from auth import hash_password
from services.classifier import classify_expense
from datetime import datetime, timedelta
import random

random.seed(42)

DEFAULT_PASSWORD = "password123"


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    if db.query(User).count() > 0:
        print("Database already seeded!")
        db.close()
        return

    print("Seeding database...")

    # ── Users ──────────────────────────────────────────
    users_data = [
        ("Krish", "krish@example.com", "#6C5CE7"),
        ("Arjun", "arjun@example.com", "#0984E3"),
        ("Priya", "priya@example.com", "#00B894"),
        ("Neha", "neha@example.com", "#E17055"),
        ("Rahul", "rahul@example.com", "#D63031"),
        ("Sneha", "sneha@example.com", "#FDCB6E"),
        ("Vikram", "vikram@example.com", "#E84393"),
        ("Ananya", "ananya@example.com", "#00CEC9"),
    ]

    users = []
    for name, email, color in users_data:
        user = User(
            name=name,
            email=email,
            password_hash=hash_password(DEFAULT_PASSWORD),
            avatar_color=color,
        )
        db.add(user)
        users.append(user)

    db.commit()
    for u in users:
        db.refresh(u)

    print(f"  Created {len(users)} users (password: {DEFAULT_PASSWORD})")

    # ── Groups ─────────────────────────────────────────
    groups_config = [
        {
            "name": "Goa Trip 🏖️",
            "type": "trip",
            "member_indices": [0, 1, 2, 3],  # Krish, Arjun, Priya, Neha
        },
        {
            "name": "Flat 42 Roommates 🏠",
            "type": "roommates",
            "member_indices": [0, 1, 4],  # Krish, Arjun, Rahul
        },
        {
            "name": "Office Lunch Group 🍕",
            "type": "custom",
            "member_indices": [0, 2, 3, 5, 6],  # Krish, Priya, Neha, Sneha, Vikram
        },
        {
            "name": "College Project 📚",
            "type": "project",
            "member_indices": [0, 1, 7],  # Krish, Arjun, Ananya
        },
    ]

    groups = []
    for gc in groups_config:
        group = Group(name=gc["name"], type=gc["type"])
        db.add(group)
        db.commit()
        db.refresh(group)

        for idx in gc["member_indices"]:
            member = GroupMember(group_id=group.id, user_id=users[idx].id)
            db.add(member)

        db.commit()
        groups.append((group, [users[i] for i in gc["member_indices"]]))

    print(f"  Created {len(groups)} groups")

    # ── Expenses ───────────────────────────────────────
    expense_templates = {
        "trip": [
            ("Flight tickets", 12000, "travel"),
            ("Hotel booking", 8000, "travel"),
            ("Beach restaurant dinner", 3200, "food"),
            ("Uber to airport", 1200, "travel"),
            ("Souvenirs shopping", 2500, "shopping"),
            ("Nightclub entry", 4000, "entertainment"),
            ("Breakfast at cafe", 800, "food"),
            ("Scooter rental", 1500, "travel"),
            ("Lunch at beach shack", 2800, "food"),
            ("Drinks at pub", 3500, "entertainment"),
            ("Water sports", 6000, "entertainment"),
            ("Train tickets", 2200, "travel"),
            ("Street food crawl", 600, "food"),
            ("Pharmacy sunscreen", 450, "health"),
            ("Late night pizza", 900, "food"),
        ],
        "roommates": [
            ("Monthly rent", 45000, "rent"),
            ("Electricity bill", 3200, "utilities"),
            ("WiFi bill", 1200, "utilities"),
            ("Groceries from DMart", 4500, "groceries"),
            ("Cleaning supplies", 800, "utilities"),
            ("Gas cylinder", 900, "utilities"),
            ("Netflix subscription", 649, "entertainment"),
            ("Vegetables from market", 1200, "groceries"),
            ("Water bill", 500, "utilities"),
            ("Milk monthly", 1800, "groceries"),
            ("Plumber repair", 1500, "utilities"),
            ("Swiggy dinner", 1100, "food"),
            ("Amazon kitchen items", 2300, "shopping"),
            ("Monthly rent", 45000, "rent"),
            ("Electricity bill", 2800, "utilities"),
            ("WiFi bill", 1200, "utilities"),
            ("Blinkit groceries", 3200, "groceries"),
            ("Spotify family plan", 179, "entertainment"),
            ("Monthly rent", 45000, "rent"),
            ("Groceries", 5200, "groceries"),
        ],
        "custom": [
            ("Team lunch at restaurant", 4500, "food"),
            ("Coffee at Starbucks", 1200, "food"),
            ("Pizza order for team", 2800, "food"),
            ("Lunch at South Indian place", 1800, "food"),
            ("Birthday cake", 1500, "food"),
            ("Uber for client meeting", 600, "travel"),
            ("Team dinner", 6500, "food"),
            ("Chai break", 300, "food"),
            ("Biryani for team", 3200, "food"),
            ("Sandwich delivery", 1400, "food"),
            ("Friday drinks", 4000, "entertainment"),
            ("Momos order", 800, "food"),
            ("Dominos pizza", 2100, "food"),
            ("Team outing snacks", 1600, "food"),
            ("Coffee run", 950, "food"),
        ],
        "project": [
            ("Printing materials", 800, "shopping"),
            ("Domain registration", 1200, "utilities"),
            ("AWS hosting", 2500, "utilities"),
            ("Reference book", 950, "shopping"),
            ("Coffee during study session", 450, "food"),
            ("Poster printing", 600, "shopping"),
            ("Figma subscription", 1100, "utilities"),
            ("Working lunch", 1800, "food"),
            ("USB drives", 500, "shopping"),
            ("Late night work snacks", 700, "food"),
        ],
    }

    total_expenses = 0
    base_date = datetime(2025, 1, 1)

    for group, members in groups:
        templates = expense_templates.get(group.type, expense_templates["custom"])
        
        # Multiply template items by 5 to generate more data for the Analytics Engine
        extended_templates = templates * 5

        for i, (title, amount, expected_cat) in enumerate(extended_templates):
            # Spread expenses across a full year (365 days) randomly
            days_offset = random.randint(0, 365)
            expense_date = base_date + timedelta(days=days_offset)

            # Random payer from group members
            payer = random.choice(members)

            # Slight amount variation
            variation = random.uniform(0.85, 1.15)
            actual_amount = round(amount * variation, 2)

            category = classify_expense(title)

            expense = Expense(
                group_id=group.id,
                title=title,
                amount=actual_amount,
                category=category,
                paid_by=payer.id,
                split_type="equal",
                date=expense_date,
                notes="",
            )
            db.add(expense)
            db.commit()
            db.refresh(expense)

            # Equal split among members
            per_person = round(actual_amount / len(members), 2)
            for j, member in enumerate(members):
                owed = per_person
                if j == len(members) - 1:
                    owed = round(actual_amount - per_person * (len(members) - 1), 2)
                split = Split(
                    expense_id=expense.id, user_id=member.id, amount_owed=owed
                )
                db.add(split)

            total_expenses += 1

        db.commit()

    # ── Add some settlements ───────────────────────────
    # Settle some debts in the roommates group
    roommates_group, roommates_members = groups[1]
    settlement = Settlement(
        group_id=roommates_group.id,
        payer_id=roommates_members[1].id,  # Arjun pays
        payee_id=roommates_members[0].id,  # Krish
        amount=5000,
        date=datetime(2025, 9, 15),
    )
    db.add(settlement)

    settlement2 = Settlement(
        group_id=roommates_group.id,
        payer_id=roommates_members[2].id,  # Rahul pays
        payee_id=roommates_members[0].id,  # Krish
        amount=8000,
        date=datetime(2025, 10, 1),
    )
    db.add(settlement2)

    db.commit()
    db.close()

    print(f"  Created {total_expenses} expenses")
    print(f"  Created 2 settlements")
    print("Database seeded successfully!")
    print(f"\nLogin credentials:")
    for name, email, _ in users_data:
        print(f"   {name}: {email} / {DEFAULT_PASSWORD}")


if __name__ == "__main__":
    seed()
