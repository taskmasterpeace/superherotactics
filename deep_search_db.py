import psycopg2

def search_database():
    try:
        conn = psycopg2.connect(
            host="localhost",
            port="54322",
            database="postgres",
            user="postgres",
            password="postgres"
        )
        cur = conn.cursor()
        
        print("--- Schemas ---")
        cur.execute("SELECT schema_name FROM information_schema.schemata")
        schemas = cur.fetchall()
        for s in schemas:
            print(f"  {s[0]}")

        print("\n--- Searching for tables (like '%country%', '%city%', '%hero%', '%tactic%') ---")
        cur.execute("""
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_name ILIKE '%country%' 
               OR table_name ILIKE '%city%' 
               OR table_name ILIKE '%hero%'
               OR table_name ILIKE '%tactic%'
        """)
        tables = cur.fetchall()
        
        if not tables:
            print("No matching tables found in 'postgres' database.")
        else:
            for t in tables:
                print(f"  Found: {t[0]}.{t[1]}")
                
        # Also list all databases again just to be absolutely sure
        print("\n--- All Databases ---")
        cur.execute("SELECT datname FROM pg_database")
        dbs = cur.fetchall()
        for db in dbs:
            print(f"  {db[0]}")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    search_database()
