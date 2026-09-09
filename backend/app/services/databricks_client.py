from databricks import sql

from ..config import settings


def get_databricks_connection():
    return sql.connect(
        server_hostname=settings.DATABRICKS_SERVER_HOSTNAME,
        http_path=settings.DATABRICKS_HTTP_PATH,
        access_token=settings.DATABRICKS_TOKEN,
    )


def fetch_table(table_name: str):
    """Lit toutes les lignes d'une table du datawarehouse Databricks.

    table_name doit être le nom complet, ex:
    'etl_pipeline_sprint1.datawarehouse.dim_client'
    """
    connection = get_databricks_connection()
    cursor = connection.cursor()
    try:
        cursor.execute(f"SELECT * FROM {table_name}")
        columns = [col[0] for col in cursor.description]
        rows = cursor.fetchall()
        return columns, rows
    finally:
        cursor.close()
        connection.close()


def list_datawarehouse_tables(schema_name: str = "etl_pipeline_sprint1.datawarehouse"):
    """Retourne la liste des noms courts de toutes les tables présentes
    dans le schéma datawarehouse (ex: ['dim_client', 'dim_date', ...])."""
    connection = get_databricks_connection()
    cursor = connection.cursor()
    try:
        cursor.execute(f"SHOW TABLES IN {schema_name}")
        rows = cursor.fetchall()
        return [row.tableName for row in rows]
    finally:
        cursor.close()
        connection.close()