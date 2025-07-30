from flask import Blueprint, jsonify, request, session
from src.models.user import User, db
from src.models.message import Message
from datetime import datetime

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/conversations', methods=['GET'])
def get_conversations():
    """Obter lista de conversas do usuário atual"""
    if 'user_id' not in session:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    user_id = session['user_id']
    
    # Buscar todas as conversas (mensagens enviadas ou recebidas)
    conversations = db.session.query(
        User.id,
        User.username,
        User.phone,
        User.is_online,
        User.last_seen,
        Message.timestamp.label('last_message_time'),
        Message.content.label('last_message_content')
    ).join(
        Message,
        (Message.sender_id == User.id) | (Message.receiver_id == User.id)
    ).filter(
        (Message.sender_id == user_id) | (Message.receiver_id == user_id)
    ).filter(
        User.id != user_id
    ).order_by(
        Message.timestamp.desc()
    ).distinct(User.id).all()
    
    result = []
    for conv in conversations:
        result.append({
            'user_id': conv.id,
            'username': conv.username,
            'phone': conv.phone,
            'is_online': conv.is_online,
            'last_seen': conv.last_seen.isoformat() if conv.last_seen else None,
            'last_message_time': conv.last_message_time.isoformat() if conv.last_message_time else None,
            'last_message_content': conv.last_message_content
        })
    
    return jsonify(result), 200

@chat_bp.route('/messages/<int:user_id>', methods=['GET'])
def get_messages(user_id):
    """Obter mensagens de uma conversa específica"""
    if 'user_id' not in session:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    current_user_id = session['user_id']
    
    # Verificar se o usuário existe
    other_user = User.query.get(user_id)
    if not other_user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    # Buscar mensagens entre os dois usuários
    messages = Message.query.filter(
        ((Message.sender_id == current_user_id) & (Message.receiver_id == user_id)) |
        ((Message.sender_id == user_id) & (Message.receiver_id == current_user_id))
    ).order_by(Message.timestamp.asc()).all()
    
    # Marcar mensagens como lidas
    Message.query.filter(
        (Message.sender_id == user_id) & 
        (Message.receiver_id == current_user_id) & 
        (Message.is_read == False)
    ).update({'is_read': True})
    db.session.commit()
    
    return jsonify([message.to_dict() for message in messages]), 200

@chat_bp.route('/messages', methods=['POST'])
def send_message():
    """Enviar uma nova mensagem"""
    if 'user_id' not in session:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    data = request.json
    sender_id = session['user_id']
    
    # Validação dos dados
    if not data.get('receiver_id') or not data.get('content'):
        return jsonify({'error': 'Destinatário e conteúdo são obrigatórios'}), 400
    
    # Verificar se o destinatário existe
    receiver = User.query.get(data['receiver_id'])
    if not receiver:
        return jsonify({'error': 'Destinatário não encontrado'}), 404
    
    # Criar nova mensagem
    message = Message(
        sender_id=sender_id,
        receiver_id=data['receiver_id'],
        content=data['content'].strip()
    )
    
    db.session.add(message)
    db.session.commit()
    
    return jsonify(message.to_dict()), 201

@chat_bp.route('/messages/<int:message_id>/read', methods=['PUT'])
def mark_message_read(message_id):
    """Marcar mensagem como lida"""
    if 'user_id' not in session:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    user_id = session['user_id']
    
    # Buscar a mensagem
    message = Message.query.get(message_id)
    if not message:
        return jsonify({'error': 'Mensagem não encontrada'}), 404
    
    # Verificar se o usuário é o destinatário
    if message.receiver_id != user_id:
        return jsonify({'error': 'Não autorizado'}), 403
    
    # Marcar como lida
    message.is_read = True
    db.session.commit()
    
    return jsonify({'message': 'Mensagem marcada como lida'}), 200

