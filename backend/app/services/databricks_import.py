import datetime
from decimal import Decimal

from ..database import SessionLocal
from ..models import Dataset, DatasetRow
from .databricks_client import fetch_table, list_datawarehouse_tables


def json_safe(value):
    if isinstance(value, (datetime.date, datetime.datetime)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    return value


def infer_dtype(value):
    if value is None:
        return "unknown"
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, (int, float, Decimal)):
        return "numeric"
    if isinstance(value, (datetime.date, datetime.datetime)):
        return "date"
    return "string"


def estimate_size(rows, columns):
    """Estimation grossière de la taille en mémoire, juste pour affichage."""
    total_bytes = sum(
        len(str(value)) for row in rows for value in row
    )
    if total_bytes < 1024:
        return f"{total_bytes} o"
    if total_bytes < 1024 * 1024:
        return f"{total_bytes / 1024:.1f} Ko"
    return f"{total_bytes / (1024 * 1024):.1f} Mo"


def import_table(full_table_name: str, dataset_name: str, description: str = ""):
    columns, rows = fetch_table(full_table_name)

    column_schema = []
    for i, col in enumerate(columns):
        sample = next((row[i] for row in rows if row[i] is not None), None)
        column_schema.append({"name": col, "dtype": infer_dtype(sample)})

    db = SessionLocal()
    try:
        existing = db.query(Dataset).filter(Dataset.name == dataset_name).first()

        now = datetime.datetime.utcnow()
        common_fields = dict(
            description=description,
            row_count=len(rows),
            column_schema=column_schema,
            file_type="Delta Table",
            size=estimate_size(rows, columns),
            owner="Équipe Data (Databricks)",
            category="Databricks",
            status="Published",
            tags=["databricks", "datawarehouse"],
            updated_at=now,
        )

        if existing:
            db.query(DatasetRow).filter(DatasetRow.dataset_id == existing.id).delete()
            for field, value in common_fields.items():
                setattr(existing, field, value)
            dataset = existing
        else:
            dataset = Dataset(name=dataset_name, **common_fields)
            db.add(dataset)
            db.flush()  # pour obtenir dataset.id avant de créer les lignes

        for index, row in enumerate(rows):
            row_dict = {col: json_safe(value) for col, value in zip(columns, row)}
            db.add(DatasetRow(dataset_id=dataset.id, row_index=index, data=row_dict))

        db.commit()
        action = "mis à jour" if existing else "créé"
        print(f"Dataset '{dataset_name}' {action} avec {len(rows)} lignes (id={dataset.id})")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def import_all_tables(schema_name: str = "etl_pipeline_sprint1.datawarehouse"):
    """Importe (ou met à jour) automatiquement TOUTES les tables présentes
    dans le schéma datawarehouse — sans qu'on ait besoin de les nommer une par une."""
    table_names = list_datawarehouse_tables(schema_name)
    print(f"Tables trouvées côté Databricks : {table_names}")

    for table_name in table_names:
        full_table_name = f"{schema_name}.{table_name}"
        dataset_name = f"{table_name} (Databricks)"
        import_table(full_table_name, dataset_name=dataset_name)