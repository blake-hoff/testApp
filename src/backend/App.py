from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Table
from sqlalchemy.orm import relationship, sessionmaker, declarative_base
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

# Create the base class
Base = declarative_base()

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "https://blake-hoff.github.io"])

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
    completed_puzzles = relationship("CompletedPuzzle", back_populates="user")

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
    description = Column(Text)
    clue_link = Column(String(500))  # Direct link storage
    solution_key = Column(String(100), nullable=False)
    difficulty = Column(Integer, default=1)  # 1-5 scale
    
    # Relationships
    threads = relationship("Thread", back_populates="puzzle")
    completed_by = relationship("CompletedPuzzle", back_populates="puzzle")
    
    def __repr__(self):
        return f"<Puzzle(name='{self.name}')>"

# New table to track which users have completed which puzzles
class CompletedPuzzle(Base):
    __tablename__ = 'completed_puzzles'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    puzzle_id = Column(Integer, ForeignKey('puzzles.id'), nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="completed_puzzles")
    puzzle = relationship("Puzzle", back_populates="completed_by")
    
    def __repr__(self):
        return f"<CompletedPuzzle(user_id='{self.user_id}', puzzle_id='{self.puzzle_id}')>"

    __tablename__ = 'puzzle_links'
    
    id = Column(Integer, primary_key=True)
    puzzle_id = Column(Integer, ForeignKey('puzzles.id'), nullable=False)
    text = Column(String(200), nullable=False)
    url = Column(String(500), nullable=False)
    
    # Relationship
    puzzle = relationship("Puzzle")

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

    # Check if thread requires a puzzle that the user hasn't completed
    if data.get('requiredPuzzleId'):
        completed = session.query(CompletedPuzzle).filter_by(
            user_id=user.id, 
            puzzle_id=data.get('requiredPuzzleId')
        ).first()
        
        if not completed and not user.is_admin:
            session.close()
            return jsonify({"error": "You must complete the required puzzle first"}), 403

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
        
    # Get the thread
    thread = session.get(Thread, data['threadId'])
    if not thread:
        session.close()
        return jsonify({"error": "Thread not found"}), 404
        
    # Check if thread requires a puzzle that the user hasn't completed
    if thread.puzzle_id:
        completed = session.query(CompletedPuzzle).filter_by(
            user_id=user.id, 
            puzzle_id=thread.puzzle_id
        ).first()
        
        if not completed and not user.is_admin:
            session.close()
            return jsonify({"error": "You must complete the required puzzle first"}), 403

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

# New endpoints for puzzles functionality

@app.route('/api/puzzles', methods=['GET'])
def get_puzzles():
    session = Session()
    
    # Get the username from query params
    username = request.args.get('username')
    
    # Get all puzzles
    puzzles = session.query(Puzzle).all()
    
    result = []
    if username:
        # Get the user id
        user = session.query(User).filter_by(username=username).first()
        
        if user:
            # Get their completed puzzles
            completed_puzzle_ids = [
                cp.puzzle_id for cp in session.query(CompletedPuzzle).filter_by(user_id=user.id).all()
            ]
            
            # Format result with completion status
            for p in puzzles:
                # Get any related thread for this puzzle
                related_thread = session.query(Thread).filter_by(puzzle_id=p.id).first()
                
                # Get links for this puzzle
                links = session.query(PuzzleLink).filter_by(puzzle_id=p.id).all()
                
                puzzle_data = {
                    "id": p.id,
                    "name": p.name,
                    "description": p.description,
                    "completed": p.id in completed_puzzle_ids,
                    "difficulty": p.difficulty
                }
                
                # Add thread info if there is one
                if related_thread:
                    puzzle_data["threadId"] = related_thread.id
                    puzzle_data["threadName"] = related_thread.name
                
                # Add links if there are any
                if links:
                    puzzle_data["links"] = [
                        {"text": link.text, "url": link.url} for link in links
                    ]
                
                result.append(puzzle_data)
        else:
            # If user not found, just return puzzles without completion status
            for p in puzzles:
                result.append({
                    "id": p.id,
                    "name": p.name,
                    "description": p.description,
                    "completed": False,
                    "difficulty": p.difficulty
                })
    else:
        # No username provided, return puzzles without completion status
        for p in puzzles:
            result.append({
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "completed": False,
                "difficulty": p.difficulty
            })
    
    session.close()
    return jsonify(result)

@app.route('/api/puzzles/<int:puzzle_id>', methods=['GET'])
def get_puzzle_detail(puzzle_id):
    session = Session()
    
    # Get username from query params
    username = request.args.get('username')
    
    # Get the puzzle
    puzzle = session.get(Puzzle, puzzle_id)
    
    if not puzzle:
        session.close()
        return jsonify({"error": "Puzzle not found"}), 404
    
    # Get any related thread for this puzzle
    related_thread = session.query(Thread).filter_by(puzzle_id=puzzle_id).first()
    
    # Get links for this puzzle
    links = session.query(PuzzleLink).filter_by(puzzle_id=puzzle_id).all()
    
    # Build base response
    result = {
        "id": puzzle.id,
        "name": puzzle.name,
        "description": puzzle.description,
        "externalUrl": puzzle.external_url,
        "difficulty": puzzle.difficulty,
        "completed": False
    }
    
    # Add thread info if there is one
    if related_thread:
        result["threadId"] = related_thread.id
        result["threadName"] = related_thread.name
    
    # Add links if there are any
    if links:
        result["links"] = [
            {"text": link.text, "url": link.url} for link in links
        ]
    
    # Check completion status if username provided
    if username:
        user = session.query(User).filter_by(username=username).first()
        if user:
            completed = session.query(CompletedPuzzle).filter_by(
                user_id=user.id, puzzle_id=puzzle_id
            ).first()
            
            result["completed"] = completed is not None
    
    session.close()
    return jsonify(result)

@app.route('/api/puzzles/<int:puzzle_id>/attempt', methods=['POST'])
def attempt_puzzle_solution(puzzle_id):
    session = Session()
    data = request.get_json()
    
    # Check if puzzle exists
    puzzle = session.get(Puzzle, puzzle_id)
    if not puzzle:
        session.close()
        return jsonify({"error": "Puzzle not found"}), 404
    
    # Get the user
    username = data.get('username')
    solution_attempt = data.get('solution', '').strip().lower()
    
    if not username:
        session.close()
        return jsonify({"error": "Username is required"}), 400
    
    user = session.query(User).filter_by(username=username).first()
    if not user:
        session.close()
        return jsonify({"error": "User not found"}), 404
    
    # Check if already completed
    already_completed = session.query(CompletedPuzzle).filter_by(
        user_id=user.id, puzzle_id=puzzle_id
    ).first()
    
    if already_completed:
        session.close()
        return jsonify({"success": True, "message": "You've already solved this puzzle!"}), 200
    
    # Check solution
    if solution_attempt == puzzle.solution_key.lower():
        # Mark as completed
        completion = CompletedPuzzle(
            user_id=user.id,
            puzzle_id=puzzle_id
        )
        session.add(completion)
        session.commit()
        session.close()
        return jsonify({"success": True, "message": "Correct! Puzzle solved successfully!"}), 200
    else:
        session.close()
        return jsonify({"success": False, "message": "Incorrect solution. Try again!"}), 200

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

def create_sample_puzzles():
    session = Session()
    
    # Check if we already have puzzles
    existing_puzzles = session.query(Puzzle).count()
    if existing_puzzles > 0:
        print("[INFO] Puzzles already exist.")
        session.close()
        return
    
    # Create sample puzzles with direct links
    puzzles = [
        Puzzle(
            name="Caesar's Secret",
            description="Decipher this encrypted message using the Caesar cipher: Wklv lv brxu iluvw fkdoohqjh.",
            clue_link="https://en.wikipedia.org/wiki/Caesar_cipher",
            solution_key="this is your first challenge",
            difficulty=1
        ),
        Puzzle(
            name="Math Challenge",
            description="Find the pattern and solve: 1, 4, 9, 16, 25, ?",
            clue_link="https://en.wikipedia.org/wiki/Square_number",
            solution_key="36",
            difficulty=2
        ),
        Puzzle(
            name="Word Riddle",
            description="I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
            clue_link=None,
            solution_key="echo",
            difficulty=2
        )
    ]
    
    session.add_all(puzzles)
    session.commit()
    print("[INFO] Sample puzzles created.")
    
    # Create a thread for the first puzzle
    admin = session.query(User).filter_by(username='admin').first()
    if admin:
        puzzle_thread = Thread(
            name="Caesar Cipher Discussion",
            description="Share hints and discuss the Caesar's Secret puzzle",
            puzzle_id=1,
            creator=admin
        )
        session.add(puzzle_thread)
        session.commit()
        
        # Add a welcome post to the thread
        welcome_post = Post(
            text="Welcome to the Caesar Cipher discussion thread! Here you can share hints (but not the solution!) and ask questions about the puzzle.",
            user_id=admin.id,
            thread_id=puzzle_thread.id
        )
        session.add(welcome_post)
        session.commit()
        print("[INFO] Created puzzle discussion thread.")
        
    session.close()
    
    # Create a thread for the first puzzle
    admin = session.query(User).filter_by(username='admin').first()
    if admin:
        puzzle_thread = Thread(
            name="Caesar Cipher Discussion",
            description="Share hints and discuss the Caesar's Secret puzzle",
            puzzle_id=1,
            creator=admin
        )
        session.add(puzzle_thread)
        session.commit()
        
        # Add a welcome post to the thread
        welcome_post = Post(
            text="Welcome to the Caesar Cipher discussion thread! Here you can share hints (but not the solution!) and ask questions about the puzzle.",
            user_id=admin.id,
            thread_id=puzzle_thread.id
        )
        session.add(welcome_post)
        session.commit()
        print("[INFO] Created puzzle discussion thread.")
        
    session.close()

if __name__ == '__main__':
    create_admin_user()
    # create_sample_puzzles()
    populate_welcome_thread_comments()
    app.run(debug=True, port=5000)

create_admin_user()
create_sample_puzzles()
populate_welcome_thread_comments()