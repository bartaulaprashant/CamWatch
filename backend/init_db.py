
from database import engine, Base
import models

def initialize_database():
    Base.metadata.create_all(bind=engine)
    print("CamWatch database initialized successfully.")

if __name__ == "__main__":
    initialize_database()
