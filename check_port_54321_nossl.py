import psycopg2

def check_port_54321_no_ssl():
    try:
        print("Connecting to localhost:54321 (sslmode=disable)...")
        conn = psycopg2.connect(
            host="localhost",
            port="54321",
            database="postgres",
            user="postgres",
            password="postgres",
            sslmode="disable"
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
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_port_54321_no_ssl()
