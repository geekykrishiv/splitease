def simplify_debts(balances: dict) -> list:
    """
    Simplify debts using a greedy algorithm.

    Args:
        balances: {user_id: net_balance}
                  positive = is owed money (creditor)
                  negative = owes money (debtor)

    Returns:
        List of dicts: [{"from_id": debtor, "to_id": creditor, "amount": X}, ...]
    """
    creditors = []
    debtors = []

    for user_id, balance in balances.items():
        if balance > 0.01:
            creditors.append([user_id, balance])
        elif balance < -0.01:
            debtors.append([user_id, -balance])

    # Sort descending for optimal matching
    creditors.sort(key=lambda x: -x[1])
    debtors.sort(key=lambda x: -x[1])

    transactions = []
    i, j = 0, 0

    while i < len(creditors) and j < len(debtors):
        creditor_id, credit = creditors[i]
        debtor_id, debt = debtors[j]

        amount = min(credit, debt)
        if amount > 0.01:
            transactions.append({
                "from_id": debtor_id,
                "to_id": creditor_id,
                "amount": round(amount, 2),
            })

        creditors[i][1] -= amount
        debtors[j][1] -= amount

        if creditors[i][1] < 0.01:
            i += 1
        if debtors[j][1] < 0.01:
            j += 1

    return transactions


def compute_balances(expenses: list, settlements: list, member_ids: list) -> dict:
    """
    Compute net balances for all members in a group.

    For each expense:
      - payer gets +amount (they paid for everyone)
      - each split participant gets -amount_owed (they owe that much)

    For each settlement:
      - payer gets -amount (they paid their debt)
      - payee gets +amount (they received payment)

    Returns: {user_id: net_balance}
    """
    balances = {uid: 0.0 for uid in member_ids}

    for expense in expenses:
        paid_by = expense["paid_by"]
        if paid_by in balances:
            balances[paid_by] += expense["amount"]

        for split in expense["splits"]:
            uid = split["user_id"]
            if uid in balances:
                balances[uid] -= split["amount_owed"]

    for settlement in settlements:
        payer = settlement["payer_id"]
        payee = settlement["payee_id"]
        amount = settlement["amount"]

        if payer in balances:
            balances[payer] -= amount
        if payee in balances:
            balances[payee] += amount

    # Round to avoid floating point noise
    return {uid: round(bal, 2) for uid, bal in balances.items()}
