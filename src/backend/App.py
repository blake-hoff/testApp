from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship, sessionmaker, declarative_base
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

# Create the base class
Base = declarative_base()

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

# User model
class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(128), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_admin = Column(Boolean, default=False)

    # Relationships
    threads = relationship("Thread", back_populates="creator")
    posts = relationship("Post", back_populates="author")

    def __repr__(self):
        return f"<User(username='{self.username}', email='{self.email}')>"

# Thread model
class Thread(Base):
    __tablename__ = 'threads'

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    puzzle_id = Column(Integer, ForeignKey('puzzles.id'), nullable=True)
    thread_password = Column(String(100), nullable=True)  # For puzzle access
    created_at = Column(DateTime, default=datetime.utcnow)
    creator_id = Column(Integer, ForeignKey('users.id'))
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)

    # Relationships
    creator = relationship("User", back_populates="threads")
    posts = relationship("Post", back_populates="thread", cascade="all, delete-orphan")
    puzzle = relationship("Puzzle", back_populates="threads")

    def __repr__(self):
        return f"<Thread(name='{self.name}', puzzle_id='{self.puzzle_id}')>"

# Post model
class Post(Base):
    __tablename__ = 'posts'

    id = Column(Integer, primary_key=True)
    text = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    thread_id = Column(Integer, ForeignKey('threads.id'), nullable=False)
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)

    # Relationships
    author = relationship("User", back_populates="posts")
    thread = relationship("Thread", back_populates="posts")

    def __repr__(self):
        return f"<Post(author_id='{self.user_id}', thread_id='{self.thread_id}', timestamp='{self.timestamp}')>"

class Puzzle(Base):
    __tablename__ = 'puzzles'

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    threads = relationship("Thread", back_populates="puzzle")
    def __repr__(self):
        return f"<Puzzle(name='{self.name}')>"


# Create database engine and tables
def init_db(db_uri='sqlite:///forum.db'):
    engine = create_engine(db_uri)
    Base.metadata.create_all(engine)
    return engine

# Create session factory
def get_session_factory(engine):
    Session = sessionmaker(bind=engine)
    return Session

# Helper function to create and initialize everything
def setup_database(db_uri='sqlite:///forum.db'):
    engine = init_db(db_uri)
    Session = get_session_factory(engine)
    return Session()

engine = init_db()
Session = get_session_factory(engine)

@app.route('/')
def base():
    return 'Hello world. This is the base page for cse108 final project!'

@app.route('/api/threads', methods=['GET'])
def get_threads():
    session = Session()
    threads = session.query(Thread).all()
    result = []
    for t in threads:
        first_post = t.posts[0].text if t.posts else ''
        snippet = first_post[:120] + '...' if len(first_post) > 120 else first_post

        result.append({
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "requiredPuzzleId": t.puzzle_id if isinstance(t.puzzle_id, int) else None,
            "postCount": len(t.posts),
            "upvotes": t.upvotes,
            "downvotes": t.downvotes,
            "snippet": snippet,
            "author": t.creator.username if t.creator else "unknown",
            "puzzleName": t.puzzle.name if t.puzzle else "General"
        })

    session.close()
    return jsonify(result)

@app.route('/api/threads', methods=['POST'])
def create_thread():
    session = Session()
    data = request.get_json()

    user = session.query(User).filter_by(username=data.get("author")).first()
    if not user:
        session.close()
        return jsonify({"error": "User not found"}), 404

    new_thread = Thread(
        name=data['name'],
        description=data['description'],
        puzzle_id=data.get('requiredPuzzleId'),
        creator=user
    )
    session.add(new_thread)
    session.commit()
    thread_id = new_thread.id
    session.close()

    return jsonify({"id": thread_id, "status": "Thread created"}), 201


@app.route('/api/threads/<int:thread_id>', methods=['DELETE'])
def delete_thread(thread_id):
    session = Session()
    thread = session.get(Thread, thread_id)

    if not thread:
        session.close()
        return jsonify({"error": "Thread not found"}), 404

    username = request.args.get("username")
    if not thread.creator or thread.creator.username != username:
        session.close()
        return jsonify({"error": "Unauthorized"}), 403

    session.delete(thread)
    session.commit()
    session.close()

    return jsonify({"status": "deleted"})

@app.route('/api/posts')
def get_posts():
    session = Session()
    thread_id = request.args.get('threadId', type=int)
    posts = session.query(Post).filter_by(thread_id=thread_id).order_by(Post.timestamp).all()
    result = [
        {
            "id": post.id,
            "author": post.author.username,
            "text": post.text,
            "timestamp": post.timestamp.isoformat()
        } for post in posts
    ]
    session.close()
    return jsonify(result)

@app.route('/api/posts', methods=['POST'])
def create_post():
    session = Session()
    data = request.get_json()

    user = session.query(User).filter_by(username=data['author']).first()
    if not user:
        session.close()
        return jsonify({"error": "User not found"}), 404

    new_post = Post(
        text=data['text'],
        user_id=user.id,
        thread_id=data['threadId']
    )
    session.add(new_post)
    session.commit()

    result = {
        "id": new_post.id,
        "author": user.username,
        "text": new_post.text,
        "timestamp": new_post.timestamp.isoformat()
    }

    session.close()
    return jsonify(result), 201

@app.route('/api/posts/<int:post_id>', methods=['DELETE', 'OPTIONS'])
def delete_post(post_id):
    session = Session()
    post = session.get(Post, post_id)

    if not post:
        session.close()
        return jsonify({"error": "Post not found"}), 404

    username = request.args.get("username")
    if not post.author or post.author.username != username:
        session.close()
        return jsonify({"error": "Unauthorized"}), 403

    session.delete(post)
    session.commit()
    session.close()

    return jsonify({"status": "deleted"})

@app.route('/api/posts/<int:post_id>/vote', methods=['PATCH'])
def vote_on_post(post_id):
    return handle_vote(Post, post_id)


@app.route('/api/threads/<int:thread_id>/vote', methods=['PATCH'])
def vote_on_thread(thread_id):
    return handle_vote(Thread, thread_id)


def handle_vote(model_class, object_id):
    data = request.get_json()
    action = data.get("action")

    session = Session()
    obj = session.get(model_class, object_id)

    if obj is None:
        session.close()
        return jsonify({"error": "Object not found"}), 404

    if action == "upvote":
        obj.upvotes += 1
    elif action == "downvote":
        obj.downvotes += 1

    session.commit()
    session.close()
    return jsonify({"status": "success"})


def populate_welcome_thread_comments():
    session = Session()

    # Only proceed if the thread already exists
    introductions_thread = session.query(Thread).filter_by(name="Introductions Thread").first()
    if not introductions_thread:
        session.close()
        return

    # Use existing "admin" user
    user = session.query(User).filter_by(username="admin").first()
    if not user:
        print("'admin' user not found. Creating it.")
        user = User(
            username="admin",
            email="admin@example.com",
            password_hash="scrypt:32768:8:1$vPd1Uu8nRTOPEoTn$4c68c3b227192699c520e195013f4d1c1873e0e72c4f1d7e862c5214848027ca3296da4c14420a352e31772345dba43ac56588b2a047fe040422b7fe798af295",
        )
        session.add(user)
        session.commit()
        print("'admin' user created.")
        return

    # Add posts only if none exist
    existing_posts = session.query(Post).filter_by(thread_id=introductions_thread.id).all()
    if len(existing_posts) == 0:
        post1 = Post(
            text="Welcome to our puzzle community! Feel free to introduce yourself.",
            author=user,
            thread=introductions_thread
        )
        post2 = Post(
            text="Hi everyone! Excited to solve puzzles with you all.",
            author=user,
            thread=introductions_thread
        )
        session.add_all([post1, post2])
        session.commit()
        print("Added welcome posts to 'Introductions Thread'.")
    else:
        print("Posts already exist in 'Introductions Thread'.")

    session.close()


@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    session = Session()
    if session.query(User).filter_by(username=data['username']).first():
        session.close()
        return jsonify({'error': 'Username already exists'}), 400

    new_user = User(
        username=data['username'],
        email=data['email'],
        password_hash= generate_password_hash(data['password']),
        is_admin=False
    )
    session.add(new_user)
    session.commit()
    session.close()
    return jsonify({'message': 'User created successfully'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    session = Session()
    user = session.query(User).filter_by(username=data['username']).first()
    session.close()

    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401

    return jsonify({'username': user.username, 'email': user.email})

def create_admin_user():
    session = Session()
    existing_admin = session.query(User).filter_by(username='admin').first()
    if not existing_admin:
        admin = User(
            username='admin',
            email='admin@example.com',
            password_hash='scrypt:32768:8:1$vPd1Uu8nRTOPEoTn$4c68c3b227192699c520e195013f4d1c1873e0e72c4f1d7e862c5214848027ca3296da4c14420a352e31772345dba43ac56588b2a047fe040422b7fe798af295',
            is_admin=True
        )
        session.add(admin)
        session.commit()
        print("[INFO] Admin user created.")
    else:
        print("[INFO] Admin user already exists.")
    session.close()

if __name__ == '__main__':
    #patch_threads_with_invalid_puzzles()
    create_admin_user()
    populate_welcome_thread_comments()
    app.run(debug=True, port=5000)

create_admin_user()
populate_welcome_thread_comments()