from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from app.models import db, Service, Counter, Ticket, User, QueueLog
from app.utils.decorators import role_required

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/analytics', methods=['GET'])
@role_required('admin')
def get_analytics():
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    total_today = Ticket.query.filter(Ticket.created_at >= today_start).count()
    waiting_today = Ticket.query.filter(Ticket.created_at >= today_start, Ticket.status == 'waiting').count()
    serving_today = Ticket.query.filter(Ticket.created_at >= today_start, Ticket.status.in_(['called', 'serving'])).count()
    completed_today = Ticket.query.filter(Ticket.created_at >= today_start, Ticket.status == 'completed').count()
    missed_today = Ticket.query.filter(Ticket.created_at >= today_start, Ticket.status == 'missed').count()

    # Calculate average wait time for completed tickets today
    completed_tickets = Ticket.query.filter(
        Ticket.created_at >= today_start,
        Ticket.status == 'completed',
        Ticket.called_at.isnot(None)
    ).all()

    total_wait_seconds = 0
    for t in completed_tickets:
        if t.called_at and t.created_at:
            delta = (t.called_at - t.created_at).total_seconds()
            total_wait_seconds += delta
            
    avg_wait_mins = round((total_wait_seconds / len(completed_tickets)) / 60, 1) if completed_tickets else 0

    # Service breakdown
    services = Service.query.all()
    service_stats = []
    for s in services:
        s_count = Ticket.query.filter(Ticket.created_at >= today_start, Ticket.service_id == s.id).count()
        s_waiting = Ticket.query.filter(Ticket.created_at >= today_start, Ticket.service_id == s.id, Ticket.status == 'waiting').count()
        service_stats.append({
            'id': s.id,
            'name': s.name,
            'code': s.code,
            'total_tickets': s_count,
            'waiting': s_waiting
        })

    return jsonify({
        'total_today': total_today,
        'waiting_today': waiting_today,
        'serving_today': serving_today,
        'completed_today': completed_today,
        'missed_today': missed_today,
        'avg_wait_mins': avg_wait_mins,
        'service_stats': service_stats
    })

# --- SERVICE MANAGMENT ---

@admin_bp.route('/services', methods=['POST'])
@role_required('admin')
def create_service():
    data = request.get_json() or {}
    name = data.get('name')
    code = data.get('code')
    description = data.get('description', '')
    avg_service_time_mins = data.get('avg_service_time_mins', 10)
    icon_name = data.get('icon_name', 'FileText')

    if not name or not code:
        return jsonify({'error': 'Name and Code are required'}), 400

    if Service.query.filter_by(code=code.upper()).first():
        return jsonify({'error': f"Service code '{code}' already exists"}), 400

    service = Service(
        name=name,
        code=code.upper(),
        description=description,
        avg_service_time_mins=int(avg_service_time_mins),
        icon_name=icon_name,
        is_active=True
    )
    db.session.add(service)
    db.session.commit()

    return jsonify({'message': 'Service created successfully', 'service': service.to_dict()}), 201

@admin_bp.route('/services/<int:service_id>', methods=['PUT'])
@role_required('admin')
def update_service(service_id):
    service = Service.query.get(service_id)
    if not service:
        return jsonify({'error': 'Service not found'}), 404

    data = request.get_json() or {}
    service.name = data.get('name', service.name)
    service.code = data.get('code', service.code).upper()
    service.description = data.get('description', service.description)
    service.avg_service_time_mins = int(data.get('avg_service_time_mins', service.avg_service_time_mins))
    service.icon_name = data.get('icon_name', service.icon_name)
    service.is_active = data.get('is_active', service.is_active)

    db.session.commit()
    return jsonify({'message': 'Service updated successfully', 'service': service.to_dict()})

# --- COUNTER MANAGEMENT ---

@admin_bp.route('/counters', methods=['POST'])
@role_required('admin')
def create_counter():
    data = request.get_json() or {}
    name = data.get('name')
    service_id = data.get('service_id')
    staff_id = data.get('staff_id')

    if not name:
        return jsonify({'error': 'Counter name is required'}), 400

    counter = Counter(
        name=name,
        service_id=service_id if service_id else None,
        staff_id=staff_id if staff_id else None,
        status='closed'
    )
    db.session.add(counter)
    db.session.commit()

    return jsonify({'message': 'Counter created successfully', 'counter': counter.to_dict()}), 201

@admin_bp.route('/counters/<int:counter_id>', methods=['PUT'])
@role_required('admin')
def update_counter(counter_id):
    counter = Counter.query.get(counter_id)
    if not counter:
        return jsonify({'error': 'Counter not found'}), 404

    data = request.get_json() or {}
    counter.name = data.get('name', counter.name)
    counter.service_id = data.get('service_id', counter.service_id)
    counter.staff_id = data.get('staff_id', counter.staff_id)
    counter.status = data.get('status', counter.status)

    db.session.commit()
    return jsonify({'message': 'Counter updated successfully', 'counter': counter.to_dict()})

# --- USER MANAGEMENT ---

@admin_bp.route('/users', methods=['GET'])
@role_required('admin')
def get_users():
    users = User.query.all()
    return jsonify({'users': [u.to_dict() for u in users]})

@admin_bp.route('/users/staff', methods=['POST'])
@role_required('admin')
def create_staff():
    data = request.get_json() or {}
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    phone = data.get('phone', '')

    if not name or not email or not password:
        return jsonify({'error': 'Name, email and password are required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email is already registered'}), 409

    staff = User(
        name=name,
        email=email,
        phone=phone,
        role='staff'
    )
    staff.set_password(password)

    db.session.add(staff)
    db.session.commit()

    return jsonify({'message': 'Staff user created successfully', 'user': staff.to_dict()}), 201
