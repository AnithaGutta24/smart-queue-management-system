import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from app.models import db, User, Service, Counter, Ticket

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    CORS(
    app,
    resources={r"/api/.*": {"origins": "*"}},
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"]
)
    JWTManager(app)
    db.init_app(app)

    # Register Blueprints
    from app.routes.auth import auth_bp
    from app.routes.services import services_bp
    from app.routes.queue import queue_bp
    from app.routes.admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(services_bp, url_prefix='/api')
    app.register_blueprint(queue_bp, url_prefix='/api/queue')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'Smart Virtual Queue Management API',
            'version': '1.0.0'
        }), 200

    # Initialize Database & Seed initial data
    with app.app_context():
        db.create_all()
        seed_initial_data()

    return app

def seed_initial_data():
    """Seed initial services, counters, and admin/staff users if database is empty."""
    if User.query.first() is None:
        print("Seeding initial database content...")
        
        # 1. Users
        admin = User(name='System Admin', email='admin@queue.com', phone='555-0100', role='admin')
        admin.set_password('admin123')
        
        staff1 = User(name='Sarah Connor (Staff)', email='staff@queue.com', phone='555-0101', role='staff')
        staff1.set_password('staff123')

        staff2 = User(name='John Miller (Staff)', email='john@queue.com', phone='555-0102', role='staff')
        staff2.set_password('staff123')

        citizen = User(name='Alex Johnson (Citizen)', email='citizen@queue.com', phone='555-0199', role='citizen')
        citizen.set_password('citizen123')

        db.session.add_all([admin, staff1, staff2, citizen])
        db.session.commit()

        # 2. Services
        s1 = Service(
            name='Passport & Visa Services',
            code='PASS',
            description='Passport application, renewals, visa endorsements & document verification.',
            avg_service_time_mins=15,
            icon_name='CreditCard'
        )
        s2 = Service(
            name='Utility & Municipal Billing',
            code='UTIL',
            description='Water, electricity, waste collection, and municipal property tax payments.',
            avg_service_time_mins=8,
            icon_name='Receipt'
        )
        s3 = Service(
            name='Driver Licensing & Transport',
            code='DRV',
            description='DL renewal, vehicle registration, road tax, and permit issuance.',
            avg_service_time_mins=12,
            icon_name='Car'
        )
        s4 = Service(
            name='General Citizen Enquiries',
            code='GEN',
            description='Public guidance, complaints, certificates, and information desk.',
            avg_service_time_mins=5,
            icon_name='HelpCircle'
        )
        db.session.add_all([s1, s2, s3, s4])
        db.session.commit()

        # 3. Counters
        c1 = Counter(name='Counter 1 - Passport Desk', service_id=s1.id, staff_id=staff1.id, status='open')
        c2 = Counter(name='Counter 2 - Utilities Desk', service_id=s2.id, staff_id=staff2.id, status='open')
        c3 = Counter(name='Counter 3 - Transport & License', service_id=s3.id, staff_id=None, status='open')
        c4 = Counter(name='Counter 4 - General Desk', service_id=s4.id, staff_id=None, status='open')
        db.session.add_all([c1, c2, c3, c4])
        db.session.commit()

        # 4. Sample initial tickets to populate demo queue
        t1 = Ticket(
            ticket_number='PASS-101',
            service_id=s1.id,
            user_id=citizen.id,
            citizen_name='Alex Johnson',
            citizen_phone='555-0199',
            status='serving',
            counter_id=c1.id,
            qr_code_data='TOKEN:PASS-101|SVC:PASS|NAME:Alex Johnson'
        )
        t2 = Ticket(
            ticket_number='PASS-102',
            service_id=s1.id,
            citizen_name='David Miller',
            citizen_phone='555-0200',
            status='waiting',
            qr_code_data='TOKEN:PASS-102|SVC:PASS|NAME:David Miller'
        )
        t3 = Ticket(
            ticket_number='UTIL-101',
            service_id=s2.id,
            citizen_name='Emma Watson',
            citizen_phone='555-0201',
            status='waiting',
            qr_code_data='TOKEN:UTIL-101|SVC:UTIL|NAME:Emma Watson'
        )
        t4 = Ticket(
            ticket_number='DRV-101',
            service_id=s3.id,
            citizen_name='Robert Chen',
            citizen_phone='555-0202',
            status='waiting',
            qr_code_data='TOKEN:DRV-101|SVC:DRV|NAME:Robert Chen'
        )
        t5 = Ticket(
            ticket_number='GEN-101',
            service_id=s4.id,
            citizen_name='Sophia Martinez',
            citizen_phone='555-0203',
            status='waiting',
            qr_code_data='TOKEN:GEN-101|SVC:GEN|NAME:Sophia Martinez'
        )
        db.session.add_all([t1, t2, t3, t4, t5])
        db.session.commit()

        print("Database seeded with default Admin, Staff, Services & Counters!")
