from flask import Blueprint, jsonify, request, session
from src.models.user import User, db
import re
from datetime import datetime

user_bp = Blueprint('user', __name__)

def validate_phone(phone):
    """Valida o formato do telefone brasileiro (+55 11 99999-9999)"""
    pattern = r'^\+55\s\d{2}\s\d{4,5}-\d{4}$'
    return re.match(pattern, phone) is not None

@user_bp.route('/register', methods=['POST'])
def register():
    """Cadastro de novo usuário"""
    data = request.json
    
    # Validação dos dados
    if not data.get('username') or not data.get('phone') or not data.get('password'):
        return jsonify({'error': 'Todos os campos são obrigatórios'}), 400
    
    # Validação do formato do telefone
    if not validate_phone(data['phone']):
        return jsonify({'error': 'Formato de telefone inválido. Use: +55 11 99999-9999'}), 400
    
    # Verificar se usuário já existe
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Nome de usuário já existe'}), 400
    
    if User.query.filter_by(phone=data['phone']).first():
        return jsonify({'error': 'Telefone já cadastrado'}), 400
    
    # Criar novo usuário
    user = User(username=data['username'], phone=data['phone'])
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'message': 'Usuário criado com sucesso',
        'user': user.to_dict()
    }), 201

@user_bp.route('/login', methods=['POST'])
def login():
    """Login do usuário"""
    data = request.json
    
    if not data.get('phone') or not data.get('password'):
        return jsonify({'error': 'Telefone e senha são obrigatórios'}), 400
    
    # Buscar usuário pelo telefone
    user = User.query.filter_by(phone=data['phone']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Telefone ou senha incorretos'}), 401
    
    # Atualizar status do usuário
    user.last_seen = datetime.utcnow()
    user.is_online = True
    db.session.commit()
    
    # Criar sessão
    session['user_id'] = user.id
    
    return jsonify({
        'message': 'Login realizado com sucesso',
        'user': user.to_dict()
    }), 200

@user_bp.route('/logout', methods=['POST'])
def logout():
    """Logout do usuário"""
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        if user:
            user.is_online = False
            user.last_seen = datetime.utcnow()
            db.session.commit()
        
        session.pop('user_id', None)
    
    return jsonify({'message': 'Logout realizado com sucesso'}), 200

@user_bp.route('/me', methods=['GET'])
def get_current_user():
    """Obter dados do usuário atual"""
    if 'user_id' not in session:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    return jsonify(user.to_dict()), 200

@user_bp.route('/search', methods=['GET'])
def search_users():
    """Buscar usuários por nome ou telefone"""
    if 'user_id' not in session:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([]), 200
    
    # Buscar por nome de usuário ou telefone
    users = User.query.filter(
        (User.username.ilike(f'%{query}%')) | 
        (User.phone.ilike(f'%{query}%'))
    ).filter(User.id != session['user_id']).limit(10).all()
    
    return jsonify([user.to_dict() for user in users]), 200
