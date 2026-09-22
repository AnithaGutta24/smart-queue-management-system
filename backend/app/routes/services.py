from flask import Blueprint, jsonify
from app.models import Service, Counter

services_bp = Blueprint('services', __name__)

@services_bp.route('/services', methods=['GET'])
def get_services():
    services = Service.query.filter_by(is_active=True).all()
    return jsonify({'services': [s.to_dict() for s in services]})

@services_bp.route('/counters', methods=['GET'])
def get_counters():
    counters = Counter.query.all()
    return jsonify({'counters': [c.to_dict() for c in counters]})
