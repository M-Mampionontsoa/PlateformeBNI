"""Genere des donnees fictives (Customers, Products, Orders) pour demontrer le MVP.

Usage: python -m app.seed
"""
import random
from datetime import datetime, timedelta

from .database import Base, engine, SessionLocal
from . import models

random.seed(42)

FIRST_NAMES = ["Rina", "Tiana", "Hery", "Fara", "Mamy", "Nirina", "Voahangy", "Andry", "Faly", "Tojo"]
LAST_NAMES = ["Rakoto", "Rabe", "Randria", "Rasoa", "Ravelo", "Andria", "Rakotondrabe", "Razafy"]
CITIES = ["Antananarivo", "Toamasina", "Fianarantsoa", "Mahajanga", "Antsirabe", "Toliara"]
PRODUCT_NAMES = [
    "Ordinateur portable", "Souris sans fil", "Clavier mecanique", "Ecran 24 pouces",
    "Casque audio", "Webcam HD", "Disque SSD 1To", "Routeur Wi-Fi", "Imprimante laser",
    "Tablette graphique",
]
CATEGORIES = ["Informatique", "Peripheriques", "Reseau", "Bureautique"]


def _make_dataset(db, name, description, records):
    column_schema = [{"name": k, "dtype": type(v).__name__} for k, v in records[0].items()]
    dataset = models.Dataset(
        name=name, description=description, row_count=len(records), column_schema=column_schema
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    rows = [
        models.DatasetRow(dataset_id=dataset.id, row_index=i, data=rec)
        for i, rec in enumerate(records)
    ]
    db.bulk_save_objects(rows)
    db.commit()
    return dataset


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(models.Dataset).count() > 0:
            print("Des datasets existent deja - seed ignore.")
            return

        customers = []
        for i in range(1, 31):
            customers.append({
                "id": i,
                "name": f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
                "city": random.choice(CITIES),
                "email": f"client{i}@example.mg",
                "age": random.choice([None] * 2 + list(range(19, 65))),
                "signup_date": (datetime(2025, 1, 1) + timedelta(days=random.randint(0, 500))).date().isoformat(),
            })

        products = []
        for i in range(1, 16):
            products.append({
                "id": i,
                "name": PRODUCT_NAMES[(i - 1) % len(PRODUCT_NAMES)] + f" v{((i-1)//len(PRODUCT_NAMES))+1}",
                "category": random.choice(CATEGORIES),
                "price": round(random.uniform(8000, 950000), 2),
                "stock": random.randint(0, 200),
            })

        orders = []
        for i in range(1, 121):
            cust = random.choice(customers)
            prod = random.choice(products)
            orders.append({
                "id": i,
                "customer_id": cust["id"],
                "product_id": prod["id"],
                "quantity": random.randint(1, 5),
                "order_date": (datetime(2025, 6, 1) + timedelta(days=random.randint(0, 200))).date().isoformat(),
                "status": random.choice(["livree", "en cours", "annulee"]),
            })

        _make_dataset(db, "customers", "Clients fictifs de la plateforme", customers)
        _make_dataset(db, "products", "Catalogue de produits fictifs", products)
        _make_dataset(db, "orders", "Commandes reliant clients et produits", orders)

        print("Seed termine: customers (30), products (15), orders (120).")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
