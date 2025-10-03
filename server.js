const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs'); 

const app = express();
const port = 3000;

// Import models
const Board = require('./models/board');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const User = require('./models/User');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'public', 'uploads');
        // Check if the directory exists, if not, create it
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir); // Set the destination to the now-verified directory
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { // <-- Must use process.env
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB successfully!');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Authentication middleware
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization required.' });
    }
    const token = authHeader.split(' ')[1];
    req.userId = token;
    next();
};

const requireAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (user && user.isAdmin) {
            next();
        } else {
            return res.status(403).json({ message: 'You are not authorized to view this page.' });
        }
    } catch (err) {
        return res.status(500).json({ message: 'Server error during authorization.' });
    }
};

// Routes

// User authentication routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const newUser = new User({ username, password });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        res.status(400).json({ message: 'Registration failed. Username may already be in use.' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }
        res.status(200).json({ message: 'Login successful!', token: user._id });
    } catch (err) {
        res.status(500).json({ message: 'An error occurred during login.' });
    }
});

// Post routes
app.post('/api/posts', requireAuth, upload.single('media'), async (req, res) => {
    try {
        const { title, content, boardSlug } = req.body;
        const userId = req.userId;

        const mediaUrl = req.file ? `/uploads/${req.file.filename}` : null;
        const mediaType = req.file ? (req.file.mimetype.startsWith('image') ? 'image' : 'video') : null;

        const newPost = new Post({
            title: title,
            content: content,
            mediaUrl: mediaUrl,
            mediaType: mediaType,
            boardSlug: boardSlug,
            userId: userId
        });

        await newPost.save();
        res.status(201).json({ message: 'Post created successfully!', post: newPost });
    } catch (err) {
        console.error('Error creating post:', err);
        res.status(500).json({ message: 'Failed to create post.', error: err.message });
    }
});

app.get('/api/posts/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('userId');
        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }
        res.status(200).json(post);
    } catch (err) {
        console.error('Error fetching single post:', err);
        res.status(500).json({ message: 'Failed to fetch post.' });
    }
});

app.delete('/api/posts/:id', requireAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        const user = await User.findById(req.userId);
        if (post.userId.toString() !== req.userId && !user.isAdmin) {
            return res.status(403).json({ message: 'You are not authorized to delete this post.' });
        }

        await Post.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Post deleted successfully!' });
    } catch (err) {
        console.error('Error deleting post:', err);
        res.status(500).json({ message: 'Failed to delete post.' });
    }
});

// Comment routes
app.post('/api/comments', requireAuth, upload.single('media'), async (req, res) => {
    try {
        const { content, postId } = req.body;
        const userId = req.userId;

        const mediaUrl = req.file ? `/uploads/${req.file.filename}` : null;
        const mediaType = req.file ? (req.file.mimetype.startsWith('image') ? 'image' : 'video') : null;

        if (!content || !postId) {
            return res.status(400).json({ message: 'Content and Post ID are required.' });
        }

        const newComment = new Comment({
            content: content,
            postId: postId,
            userId: userId,
            mediaUrl: mediaUrl,
            mediaType: mediaType,
        });

        await newComment.save();
        res.status(201).json({ message: 'Comment created successfully!', comment: newComment });
    } catch (err) {
        console.error('Error creating comment:', err);
        res.status(500).json({ message: 'Failed to create comment.', error: err.message });
    }
});

app.get('/api/posts/:id/comments', async (req, res) => {
    try {
        const postId = req.params.id;
        const comments = await Comment.find({ postId }).populate('userId').sort({ createdAt: 1 });
        res.status(200).json(comments);
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ message: 'Failed to fetch comments.' });
    }
});

app.delete('/api/comments/:id', requireAuth, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found.' });
        }

        const user = await User.findById(req.userId);
        if (comment.userId.toString() !== req.userId && !user.isAdmin) {
            return res.status(403).json({ message: 'You are not authorized to delete this comment.' });
        }

        await Comment.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Comment deleted successfully!' });
    } catch (err) {
        console.error('Error deleting comment:', err);
        res.status(500).json({ message: 'Failed to delete comment.' });
    }
});

// Board routes
app.get('/api/boards', async (req, res) => {
    try {
        const boards = await Board.find();
        res.status(200).json(boards);
    } catch (err) {
        console.error('Error fetching boards:', err);
        res.status(500).json({ message: 'Failed to fetch boards.' });
    }
});

app.get('/api/boards/:slug/posts', async (req, res) => {
    try {
        const boardSlug = req.params.slug;
        const posts = await Post.find({ boardSlug }).populate('userId').sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (err) {
        console.error('Error fetching posts for board:', err);
        res.status(500).json({ message: 'Failed to fetch posts.' });
    }
});

// In server.js

// Route to get all posts by a specific user
app.get('/api/users/:id/posts', async (req, res) => {
    try {
        const userId = req.params.id;
        const posts = await Post.find({ userId }).populate('userId').sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (err) {
        console.error('Error fetching user posts:', err);
        res.status(500).json({ message: 'Failed to fetch user posts.' });
    }
});

// Route to get all comments by a specific user
app.get('/api/users/:id/comments', async (req, res) => {
    try {
        const userId = req.params.id;
        const comments = await Comment.find({ userId }).populate('postId').sort({ createdAt: -1 });
        res.status(200).json(comments);
    } catch (err) {
        console.error('Error fetching user comments:', err);
        res.status(500).json({ message: 'Failed to fetch user comments.' });
    }
});



// Admin panel routes
app.get('/admin.html', requireAuth, requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/api/admin/posts', requireAuth, requireAdmin, async (req, res) => {
    try {
        const posts = await Post.find().populate('userId').sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (err) {
        console.error('Error fetching all posts for admin:', err);
        res.status(500).json({ message: 'Failed to fetch posts.' });
    }
});

app.get('/api/admin/comments', requireAuth, requireAdmin, async (req, res) => {
    try {
        const comments = await Comment.find().populate('userId').sort({ createdAt: -1 });
        res.status(200).json(comments);
    } catch (err) {
        console.error('Error fetching all comments for admin:', err);
        res.status(500).json({ message: 'Failed to fetch comments.' });
    }
});

// Use the PORT variable provided by the hosting environment, or default to 3000
const PORT = process.env.PORT || 3000; 

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});