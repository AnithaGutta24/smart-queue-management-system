from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='citizen') # citizen, staff, admin
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    tickets = db.relationship('Ticket', backref='user', lazy=True)
    counters = db.relationship('Counter', backref='staff', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Service(db.Model):
    __tablename__ = 'services'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(10), unique=True, nullable=False) # e.g. PASS, UTIL, TAX
    description = db.Column(db.Text, nullable=True)
    avg_service_time_mins = db.Column(db.Integer, default=10)
    icon_name = db.Column(db.String(50), default='FileText')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    counters = db.relationship('Counter', backref='service', lazy=True)
    tickets = db.relationship('Ticket', backref='service', lazy=True)

    def to_dict(self):
        waiting_count = Ticket.query.filter_by(service_id=self.id, status='waiting').count()
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'description': self.description,
            'avg_service_time_mins': self.avg_service_time_mins,
            'icon_name': self.icon_name,
            'is_active': self.is_active,
            'waiting_count': waiting_count,
            'est_wait_mins': waiting_count * self.avg_service_time_mins
        }

class Counter(db.Model):
    __tablename__ = 'counters'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False) # e.g. Counter 1
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=True)
    staff_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    status = db.Column(db.String(20), default='closed') # open, closed, busy
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    tickets = db.relationship('Ticket', backref='counter', lazy=True)

    def to_dict(self):
        current_ticket = Ticket.query.filter_by(counter_id=self.id, status='serving').first()
        if not current_ticket:
            current_ticket = Ticket.query.filter_by(counter_id=self.id, status='called').first()
            
        return {
            'id': self.id,
            'name': self.name,
            'service_id': self.service_id,
            'service_name': self.service.name if self.service else None,
            'service_code': self.service.code if self.service else None,
            'staff_id': self.staff_id,
            'staff_name': self.staff.name if self.staff else None,
            'status': self.status,
            'current_ticket': current_ticket.to_dict() if current_ticket else None
        }

class Ticket(db.Model):
    __tablename__ = 'tickets'
    
    id = db.Column(db.Integer, primary_key=True)
    ticket_number = db.Column(db.String(30), unique=True, nullable=False) # e.g. PASS-101
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True) # Optional for walk-in/guest
    citizen_name = db.Column(db.String(100), nullable=False)
    citizen_phone = db.Column(db.String(20), nullable=True)
    status = db.Column(db.String(20), default='waiting') # waiting, called, serving, completed, cancelled, missed
    counter_id = db.Column(db.Integer, db.ForeignKey('counters.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    called_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    qr_code_data = db.Column(db.Text, nullable=True) # Base64 encoded data URI or text payload

    def to_dict(self):
        # Calculate position ahead in queue
        ahead_count = 0
        if self.status == 'waiting':
            ahead_count = Ticket.query.filter(
                Ticket.service_id == self.service_id,
                Ticket.status == 'waiting',
                Ticket.id < self.id
            ).count()

        avg_mins = self.service.avg_service_time_mins if self.service else 10
        est_wait = ahead_count * avg_mins

        return {
            'id': self.id,
            'ticket_number': self.ticket_number,
            'service_id': self.service_id,
            'service_name': self.service.name if self.service else None,
            'service_code': self.service.code if self.service else None,
            'user_id': self.user_id,
            'citizen_name': self.citizen_name,
            'citizen_phone': self.citizen_phone,
            'status': self.status,
            'counter_id': self.counter_id,
            'counter_name': self.counter.name if self.counter else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'called_at': self.called_at.isoformat() if self.called_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'ahead_count': ahead_count,
            'est_wait_mins': est_wait,
            'qr_code_data': self.qr_code_data
        }

class QueueLog(db.Model):
    __tablename__ = 'queue_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('tickets.id'), nullable=False)
    action = db.Column(db.String(50), nullable=False)
    performed_by = db.Column(db.String(100), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    details = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'ticket_id': self.ticket_id,
            'action': self.action,
            'performed_by': self.performed_by,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'details': self.details
        }
