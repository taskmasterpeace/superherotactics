import psycopg2

def check_port_54321():
    try:
        print("Connecting to localhost:54321...")
        conn = psycopg2.connect(
            host="localhost",
            port="54321",
            database="postgres",
            user="postgres",
            password="postgres"
        )
        cur = conn.cursor()
        
        print("\n--- Databases on 54321 ---")
        cur.execute("SELECT datname FROM pg_database WHERE datistemplate = false;")
        dbs = cur.fetchall()
        for db in dbs:
            print(f"- {db[0]}")
            
        print("\n--- Tables in 'postgres' (public) ---")
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        tables = cur.fetchall()
        for table in tables:
            print(f"- {table[0]}")
            
        # Check for specific tables
        required = ['countries', 'cities', 'characters']
        found = [t[0] for t in tables if t[0] in required]
        
        if found:
            print(f"\nFound expected tables: {found}")
            
            # Count rows
            for table in found:
                cur.execute(f"SELECT count(*) FROM {table}")
                count = cur.fetchone()[0]
                print(f"  {table}: {count} rows")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_port_54321()
