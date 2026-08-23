import re
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..auth import get_current_user
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/graph", tags=["graph"], dependencies=[Depends(get_current_user)])

MAX_NODES_PER_DATASET = 40


def _label_for(record: dict, fallback_id):
    for key in ("name", "nom", "title", "titre", "label"):
        if key in record and record[key]:
            return str(record[key])
    return str(fallback_id)


def _dataset_for_fk(fk_column: str, dataset_names: dict):
    """Devine le dataset cible d'une colonne de type 'customer_id' -> 'customers'."""
    base = re.sub(r"_id$", "", fk_column, flags=re.IGNORECASE)
    candidates = {base.lower(), base.lower() + "s", base.lower() + "es"}
    for name_lower, ds in dataset_names.items():
        if name_lower in candidates or name_lower.rstrip("s") == base.lower():
            return ds
    return None


@router.get("/overview", response_model=schemas.GraphData)
def graph_overview(db: Session = Depends(get_db)):
    """Construit un graphe de relations entre entites en detectant les colonnes *_id."""
    datasets = db.query(models.Dataset).all()
    dataset_names = {d.name.lower(): d for d in datasets}

    nodes = {}
    edges = []

    for ds in datasets:
        rows = (
            db.query(models.DatasetRow)
            .filter(models.DatasetRow.dataset_id == ds.id)
            .order_by(models.DatasetRow.row_index)
            .limit(MAX_NODES_PER_DATASET)
            .all()
        )
        fk_columns = [
            c["name"] for c in (ds.column_schema or [])
            if c["name"].lower().endswith("_id") and c["name"].lower() != "id"
        ]

        for row in rows:
            record = row.data
            own_id = record.get("id", row.row_index)
            own_node_id = f"{ds.name}:{own_id}"
            nodes[own_node_id] = {
                "id": own_node_id,
                "label": _label_for(record, own_id),
                "group": ds.name,
            }

            for fk in fk_columns:
                target_val = record.get(fk)
                if target_val is None:
                    continue
                target_ds = _dataset_for_fk(fk, dataset_names)
                target_group = target_ds.name if target_ds else fk
                target_node_id = f"{target_group}:{target_val}"
                if target_node_id not in nodes:
                    nodes[target_node_id] = {
                        "id": target_node_id,
                        "label": str(target_val),
                        "group": target_group,
                    }
                edges.append({
                    "source": own_node_id,
                    "target": target_node_id,
                    "label": fk.replace("_id", ""),
                })

    return schemas.GraphData(nodes=list(nodes.values()), edges=edges)
