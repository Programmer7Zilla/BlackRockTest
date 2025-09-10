from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid
import json

app = Flask(__name__)
CORS(app)  

users_data = []

@app.route('/api/users', methods=['GET'])
def get_users():
    return jsonify({"users": users_data})

@app.route('/api/users', methods=['POST'])
def create_user():
    try:
        data = request.get_json()
        required_fields = ['name', 'surname', 'email', 'company', 'jobTitle']
        for field in required_fields:
            if field not in data or not data[field].strip():
                return jsonify({"error": f"Missing required field: {field}"}), 400
        if any(user['email'] == data['email'] for user in users_data):
            return jsonify({"error": "Email already exists"}), 400
        new_user = {
            "uuid": str(uuid.uuid4()),
            "name": data['name'].strip(),
            "surname": data['surname'].strip(),
            "email": data['email'].strip(),
            "company": data['company'].strip(),
            "jobTitle": data['jobTitle'].strip()
        }
        
        users_data.append(new_user)
        return jsonify(new_user), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/<user_uuid>', methods=['PUT'])
def update_user(user_uuid):
    try:
        data = request.get_json()
        
        # Find user
        user_index = None
        for i, user in enumerate(users_data):
            if user['uuid'] == user_uuid:
                user_index = i
                break
        
        if user_index is None:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify(users_data[user_index])
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/<user_uuid>', methods=['DELETE'])
def delete_user(user_uuid):
    try:
        for i, user in enumerate(users_data):
            if user['uuid'] == user_uuid:
                deleted_user = users_data.pop(i)
                return jsonify({"message": "User deleted successfully", "user": deleted_user})
        
        return jsonify({"error": "User not found"}), 404
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
