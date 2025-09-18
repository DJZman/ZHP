import os
from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

MSSQL_HOST = os.getenv("MSSQL_HOST", "localhost")
MSSQL_PORT = int(os.getenv("MSSQL_PORT", "1433"))
MSSQL_DB = os.getenv("MSSQL_DB", "YourDatabase")
MSSQL_USER = os.getenv("MSSQL_USER", "sa")
MSSQL_PASSWORD = os.getenv("MSSQL_PASSWORD", "YourStrong!Passw0rd")
MSSQL_TRUST_CERT = os.getenv("MSSQL_TRUST_CERT", "yes")

CONN_STR = (
    f"mssql+pyodbc://{MSSQL_USER}:{MSSQL_PASSWORD}@{MSSQL_HOST}:{MSSQL_PORT}/{MSSQL_DB}"
    f"?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate={MSSQL_TRUST_CERT}"
)

engine = create_engine(CONN_STR, echo=False, fast_executemany=True, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

@contextmanager
def get_session():
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except:
        session.rollback()
        raise
    finally:
        session.close()
