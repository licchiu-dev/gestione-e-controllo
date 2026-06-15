"""
Skeleton del modulo classification_engine (Python).
Implementeremo funzioni per classificare movimenti e associare fatture.
"""

def classify_transaction(record, history=None):
    # record: dict con description, amount, date, iban...
    return {
        "counterparty": None,
        "category": None,
        "linked_invoice_id": None,
        "confidence": 0.0,
        "explanation": "skeleton"
    }
