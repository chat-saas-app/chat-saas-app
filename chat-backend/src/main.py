import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, session
from flask import request
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from src.models.user import db, User
from src.models.message import Message
from src.routes.user import user_bp
from src.routes.chat import chat_bp
from datetime import datetime

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Configurar CORS
CORS(app, supports_credentials=True)

# Configurar SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

# Registrar blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(chat_bp, url_prefix='/api')

# Configurar banco de dados
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Dicionário para rastrear usuários conectados
connected_users = {}

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

# Eventos do SocketIO
@socketio.on('connect')
def handle_connect():
    print(f'Cliente conectado: {request.sid}')

@socketio.on('disconnect')
def handle_disconnect():
    print(f'Cliente desconectado: {request.sid}')
    # Remover usuário da lista de conectados
    for user_id, sid in list(connected_users.items()):
        if sid == request.sid:
            # Atualizar status no banco
            user = User.query.get(user_id)
            if user:
                user.is_online = False
                user.last_seen = datetime.utcnow()
                db.session.commit()
            del connected_users[user_id]
            break

@socketio.on('join')
def handle_join(data):
    """Usuário se junta ao chat"""
    user_id = data.get('user_id')
    if user_id:
        # Adicionar à lista de conectados
        connected_users[user_id] = request.sid
        join_room(f'user_{user_id}')
        
        # Atualizar status no banco
        user = User.query.get(user_id)
        if user:
            user.is_online = True
            user.last_seen = datetime.utcnow()
            db.session.commit()
        
        print(f'Usuário {user_id} entrou no chat')

@socketio.on('send_message')
def handle_send_message(data):
    """Enviar mensagem em tempo real"""
    sender_id = data.get('sender_id')
    receiver_id = data.get('receiver_id')
    content = data.get('content')
    
    if not all([sender_id, receiver_id, content]):
        emit('error', {'message': 'Dados incompletos'})
        return
    
    # Salvar mensagem no banco
    message = Message(
        sender_id=sender_id,
        receiver_id=receiver_id,
        content=content.strip()
    )
    db.session.add(message)
    db.session.commit()
    
    # Enviar para o destinatário se estiver online
    if receiver_id in connected_users:
        socketio.emit('new_message', {
            'message': message.to_dict(),
            'sender': User.query.get(sender_id).to_dict()
        }, room=f'user_{receiver_id}')
    
    # Confirmar para o remetente
    emit('message_sent', {'message': message.to_dict()})

@socketio.on('typing')
def handle_typing(data):
    """Indicador de digitação"""
    sender_id = data.get('sender_id')
    receiver_id = data.get('receiver_id')
    is_typing = data.get('is_typing', False)
    
    if receiver_id in connected_users:
        socketio.emit('user_typing', {
            'user_id': sender_id,
            'is_typing': is_typing
        }, room=f'user_{receiver_id}')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
