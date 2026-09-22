from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.models import User

def role_required(*roles):
    """
    Decorator to restrict route access based on user roles.
    Example: @role_required('admin') or @role_required('staff', 'admin')
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            if user.role not in roles:
                return jsonify({'error': f'Access forbidden: Required role {list(roles)}'}), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator
