from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from app.models import db, Ticket, Service, Counter, QueueLog, User
from app.utils.qr_generator import generate_qr_base64
from app.utils.decorators import role_required

queue_bp = Blueprint('queue', __name__)

@queue_bp.route('/tickets', methods=['POST'])
def create_ticket():
    data = request.get_json() or {}
    service_id = data.get('service_id')
    citizen_name = data.get('citizen_name')
    citizen_phone = data.get('citizen_phone', '')

    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        jwt_id = get_jwt_identity()
        if jwt_id:
            user_id = int(jwt_id)
            user = User.query.get(user_id)
            if user and not citizen_name:
                citizen_name = user.name
            if user and not citizen_phone:
                citizen_phone = user.phone or ''
    except Exception:
        pass

    if not service_id:
        return jsonify({'error': 'Service ID is required'}), 400
        
    if not citizen_name:
        return jsonify({'error': 'Citizen name is required'}), 400

    service = Service.query.get(service_id)
    if not service or not service.is_active:
        return jsonify({'error': 'Selected service is invalid or inactive'}), 404

    # Count today's tickets for this service to generate sequence number (e.g. PASS-101)
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    count_today = Ticket.query.filter(
        Ticket.service_id == service_id,
        Ticket.created_at >= today_start
    ).count()

    ticket_seq = count_today + 101
    ticket_number = f"{service.code}-{ticket_seq}"

    # Generate QR Payload
    qr_payload = f"TOKEN:{ticket_number}|SVC:{service.code}|NAME:{citizen_name}"
    qr_base64 = generate_qr_base64(qr_payload)

    ticket = Ticket(
        ticket_number=ticket_number,
        service_id=service_id,
        user_id=user_id,
        citizen_name=citizen_name,
        citizen_phone=citizen_phone,
        status='waiting',
        qr_code_data=qr_base64
    )

    db.session.add(ticket)
    db.session.commit()

    # Log action
    log = QueueLog(
        ticket_id=ticket.id,
        action='CREATED',
        performed_by=citizen_name,
        details=f"Token generated for {service.name}"
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'message': 'Ticket generated successfully',
        'ticket': ticket.to_dict()
    }), 201

@queue_bp.route('/tickets/<string:ticket_number>', methods=['GET'])
def get_ticket(ticket_number):
    ticket = Ticket.query.filter_by(ticket_number=ticket_number).first()
    if not ticket:
        return jsonify({'error': 'Ticket not found'}), 404

    return jsonify({'ticket': ticket.to_dict()})

@queue_bp.route('/my-tickets', methods=['GET'])
@jwt_required()
def get_my_tickets():
    user_id = int(get_jwt_identity())
    tickets = Ticket.query.filter_by(user_id=user_id).order_by(Ticket.created_at.desc()).all()
    return jsonify({'tickets': [t.to_dict() for t in tickets]})

@queue_bp.route('/live-board', methods=['GET'])
def get_live_board():
    # Currently serving or called tickets across open counters
    counters = Counter.query.all()
    active_displays = []
    for c in counters:
        current = Ticket.query.filter(
            Ticket.counter_id == c.id,
            Ticket.status.in_(['called', 'serving'])
        ).order_by(Ticket.called_at.desc()).first()

        active_displays.append({
            'counter_id': c.id,
            'counter_name': c.name,
            'service_name': c.service.name if c.service else 'General',
            'status': c.status,
            'current_ticket': current.to_dict() if current else None
        })

    # Recent waiting queue snapshot
    waiting_tickets = Ticket.query.filter_by(status='waiting').order_by(Ticket.created_at.asc()).limit(10).all()

    return jsonify({
        'counters': active_displays,
        'waiting_queue': [t.to_dict() for t in waiting_tickets]
    })

# --- STAFF API ROUTES ---

@queue_bp.route('/staff/call-next', methods=['POST'])
@role_required('staff', 'admin')
def call_next():
    data = request.get_json() or {}
    counter_id = data.get('counter_id')
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not counter_id:
        return jsonify({'error': 'Counter ID is required'}), 400

    counter = Counter.query.get(counter_id)
    if not counter:
        return jsonify({'error': 'Counter not found'}), 404

    # Check if there is an existing serving ticket on this counter that should be completed
    existing_serving = Ticket.query.filter_by(counter_id=counter.id, status='serving').first()
    if existing_serving:
        existing_serving.status = 'completed'
        existing_serving.completed_at = datetime.utcnow()
        log = QueueLog(ticket_id=existing_serving.id, action='COMPLETED', performed_by=user.name, details='Auto-completed upon calling next')
        db.session.add(log)

    # Find next waiting ticket for this counter's service (or any service if counter has no restriction)
    query = Ticket.query.filter_by(status='waiting')
    if counter.service_id:
        query = query.filter_by(service_id=counter.service_id)
    
    next_ticket = query.order_by(Ticket.created_at.asc()).first()

    if not next_ticket:
        return jsonify({'message': 'No waiting tickets in queue for this service', 'ticket': None})

    next_ticket.status = 'called'
    next_ticket.counter_id = counter.id
    next_ticket.called_at = datetime.utcnow()
    counter.status = 'busy'

    log = QueueLog(
        ticket_id=next_ticket.id,
        action='CALLED',
        performed_by=user.name,
        details=f"Called to {counter.name}"
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'message': f"Ticket {next_ticket.ticket_number} called to {counter.name}",
        'ticket': next_ticket.to_dict()
    })

@queue_bp.route('/staff/update-status', methods=['POST'])
@role_required('staff', 'admin')
def update_status():
    data = request.get_json() or {}
    ticket_id = data.get('ticket_id')
    new_status = data.get('status') # serving, completed, missed, cancelled
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not ticket_id or not new_status:
        return jsonify({'error': 'ticket_id and status are required'}), 400

    if new_status not in ['serving', 'completed', 'missed', 'cancelled']:
        return jsonify({'error': 'Invalid status update value'}), 400

    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return jsonify({'error': 'Ticket not found'}), 404

    ticket.status = new_status
    if new_status == 'completed':
        ticket.completed_at = datetime.utcnow()
        if ticket.counter:
            ticket.counter.status = 'open'
    elif new_status == 'missed':
        if ticket.counter:
            ticket.counter.status = 'open'

    log = QueueLog(
        ticket_id=ticket.id,
        action=new_status.upper(),
        performed_by=user.name,
        details=f"Status updated to {new_status}"
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'message': f"Ticket status updated to {new_status}",
        'ticket': ticket.to_dict()
    })

@queue_bp.route('/staff/verify-qr', methods=['POST'])
@role_required('staff', 'admin')
def verify_qr():
    data = request.get_json() or {}
    qr_data = data.get('qr_data', '')

    # Format check: TOKEN:PASS-101|SVC:PASS|NAME:John
    ticket_number = None
    if 'TOKEN:' in qr_data:
        parts = qr_data.split('|')
        for p in parts:
            if p.startswith('TOKEN:'):
                ticket_number = p.replace('TOKEN:', '').strip()
    else:
        ticket_number = qr_data.strip()

    if not ticket_number:
        return jsonify({'error': 'Invalid QR code content'}), 400

    ticket = Ticket.query.filter_by(ticket_number=ticket_number).first()
    if not ticket:
        return jsonify({'error': f"No ticket found matching '{ticket_number}'"}), 404

    return jsonify({
        'message': 'QR code verified successfully',
        'ticket': ticket.to_dict()
    })
