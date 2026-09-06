from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import os

app = Flask(__name__)
CORS(app)

DB_URL = os.getenv("DATABASE_URL")

def init_db():
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()

        cur.execute("""
            CREATE TABLE IF NOT EXISTS production_logs (
                id SERIAL PRIMARY KEY,
                asset_name VARCHAR(100),
                barrels_per_day INT,
                pressure_psi INT
            );
        """)

        conn.commit()
        cur.close()
        conn.close()

        print("Database initialization successful")

    except Exception as e:
        print(f"Database Init Failure State: {e}")


init_db()


@app.route('/api/v1/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "service": "seplat-backend"
    }), 200


@app.route('/api/v1/operations', methods=['GET'])
def get_operations():
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()

        cur.execute("""
            SELECT id, asset_name, barrels_per_day, pressure_psi
            FROM production_logs
            ORDER BY id DESC;
        """)

        rows = cur.fetchall()

        cur.close()
        conn.close()

        operations = []

        for row in rows:
            operations.append({
                "id": row[0],
                "asset_name": row[1],
                "barrels_per_day": row[2],
                "pressure_psi": row[3]
            })

        return jsonify(operations), 200

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@app.route('/api/v1/operations', methods=['POST'])
def create_operation():
    try:
        data = request.get_json()

        asset_name = data.get("asset_name")
        barrels_per_day = data.get("barrels_per_day")
        pressure_psi = data.get("pressure_psi")

        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO production_logs
            (asset_name, barrels_per_day, pressure_psi)
            VALUES (%s, %s, %s)
            RETURNING id;
        """, (
            asset_name,
            barrels_per_day,
            pressure_psi
        ))

        log_id = cur.fetchone()[0]

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "message": "Production log created successfully",
            "id": log_id
        }), 201

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@app.route('/api/v1/logs', methods=['POST'])
def create_log():
    return create_operation()

@app.route('/api/v1/operations', methods=['GET'])
def get_operations():
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()

        cur.execute("""
            SELECT id, asset_name, barrels_per_day, pressure_psi
            FROM production_logs
            ORDER BY id DESC;
        """)

        rows = cur.fetchall()

        cur.close()
        conn.close()

        return jsonify([
            {
                "id": row[0],
                "asset_name": row[1],
                "barrels_per_day": row[2],
                "pressure_psi": row[3]
            }
            for row in rows
        ]), 200

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
