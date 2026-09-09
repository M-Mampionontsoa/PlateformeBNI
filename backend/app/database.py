import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

# Deux facons de configurer la connexion :
#
# 1) Variables separees (recommande si votre mot de passe contient des
#    caracteres speciaux comme @, #, /, % - ils sont encodes automatiquement) :
#      DB_USER=dw_user
#      DB_PASSWORD=Bni@2026
#      DB_HOST=localhost
#      DB_PORT=3306
#      DB_NAME=dw_mvp
#
# 2) Une URL complete deja construite (les caracteres speciaux du mot de
#    passe doivent alors etre encodes a la main, ex: @ -> %40) :
#      DATABASE_URL=mysql+pymysql://dw_user:Bni%402026@localhost:3306/dw_mvp

if os.getenv("DATABASE_URL"):
    DATABASE_URL = os.getenv("DATABASE_URL")
else:
    DATABASE_URL = URL.create(
        "mysql+pymysql",
        username=os.getenv("DB_USER", "dw_user"),
        password=os.getenv("DB_PASSWORD", "dw_password"),
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        database=os.getenv("DB_NAME", "dw_mvp"),
    )

engine = create_engine(DATABASE_URL, pool_pre_ping=True, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
