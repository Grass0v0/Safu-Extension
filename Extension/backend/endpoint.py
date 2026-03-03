from flask import Flask, jsonify
import os
import json

app = Flask(__name__)

# File paths (adjust if necessary)
BLACKLIST_FILE = "blacklist.json"

def read_json_file(filepath):
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {"error": f"{filepath} not found"}
    except json.JSONDecodeError:
        return {"error": f"{filepath} is not a valid JSON file"}

@app.route("/wallet-scores", methods=["GET"])
def wallet_scores():
    data = read_json_file(BLACKLIST_FILE)
    return jsonify(data)



@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "message": "Welcome to the API!",

    })

if __name__ == "__main__":
    # Run publicly on port 80 for deployment (change to 5000 if running locally)
    app.run(host="0.0.0.0", port=5000)
