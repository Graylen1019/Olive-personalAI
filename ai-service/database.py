import psycopg2
import os
from datetime import datetime

# Grab the values Docker injected from your .env file
DB_NAME = os.getenv("POSTGRES_DB")
DB_USER = os.getenv("POSTGRES_USER")
DB_PASS = os.getenv("POSTGRES_PASSWORD") 
DB_HOST = "postgres"  # Internal Docker network name

def log_chat(prompt, response):
    try:
        # No hardcoded strings here!
        conn = psycopg2.connect(
            dbname=DB_NAME, 
            user=DB_USER, 
            password=DB_PASS, 
            host=DB_HOST,
            port="5432"
        )
        cur = conn.cursor()
        
        query = """
        INSERT INTO chat_history (prompt, response, created_at) 
        VALUES (%s, %s, %s)
        """
        cur.execute(query, (prompt, response, datetime.now()))
        
        conn.commit()
        cur.close()
        conn.close()
        print(f"📝 Chat logged for user: {DB_USER}")
    except Exception as e:
        # Keep errors descriptive for your logs
        print(f"❌ Database logging failed: {str(e)}")