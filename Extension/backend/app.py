from flask import Flask, request, jsonify
import json
import os
from datetime import datetime

app = Flask(__name__)

# Configuration
JSON_FILE_PATH = 'domains.json'

def read_domains_file():
    """Read existing domains from JSON file"""
    try:
        if os.path.exists(JSON_FILE_PATH):
            with open(JSON_FILE_PATH, 'r') as file:
                data = json.load(file)
                # Handle both old format and new format
                if isinstance(data, dict) and 'domains' in data:
                    return data['domains']
                else:
                    return {}
        else:
            return {}
    except (json.JSONDecodeError, FileNotFoundError):
        return {}

def write_domains_file(domains):
    """Write domains to JSON file with individual counts"""
    data = {
        "domains": domains
    }
    with open(JSON_FILE_PATH, 'w') as file:
        json.dump(data, file, indent=2)

@app.route('/api/domain', methods=['POST'])
def add_domain():
    """
    API endpoint to add a domain to the JSON file
    Expected JSON payload: {"domain": "test.com"}
    """
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data or 'domain' not in data:
            return jsonify({
                'error': 'Missing domain field in request body',
                'example': {'domain': 'test.com'}
            }), 400
        
        domain = data['domain'].strip()
        
        if not domain:
            return jsonify({'error': 'Domain cannot be empty'}), 400
        
        # Read existing domains
        domains = read_domains_file()
        
        # Add new domain or increment count
        if domain in domains:
            domains[domain] += 1
            message = f'Domain {domain} count updated to {domains[domain]}'
        else:
            domains[domain] = 1
            message = f'Domain {domain} added with count 1'
        
        # Write back to file
        write_domains_file(domains)
        
        return jsonify({
            'message': message,
            'domain': domain,
            'count': domains[domain],
            'total_unique_domains': len(domains)
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/domains', methods=['GET'])
def get_domains():
    """Get all domains from the JSON file"""
    try:
        domains = read_domains_file()
        return jsonify({
            'domains': domains,
            'total_unique_domains': len(domains)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    }), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=85)
