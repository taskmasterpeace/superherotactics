import psycopg2

def inspect_postgres_cities():
    try:
        conn = psycopg2.connect(
            host="localhost",
            port="54322",
            database="postgres",
            user="postgres",
            password="postgres"
        )
        cur = conn.cursor()
        
        print("--- Columns in 'cities' (postgres db) ---")
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'cities'
        """)
        cols = cur.fetchall()
        for c in cols:
            print(f"- {c[0]}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error inspecting cities: {e}")

def inspect_supabase_db():
    try:
        conn = psycopg2.connect(
            host="localhost",
            port="54322",
            database="_supabase",
            user="postgres",
            password="postgres"
        )
        cur = conn.cursor()
        
        print("\n--- Tables in '_supabase' db ---")
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        tables = cur.fetchall()
        for t in tables:
            print(f"- {t[0]}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error inspecting _supabase: {e}")

if __name__ == "__main__":
    inspect_postgres_cities()
    inspect_supabase_db()
