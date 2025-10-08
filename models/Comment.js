const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    postId: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // ADD THIS NEW FIELD
    parentCommentId: {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
        default: null // null means it's a top-level comment
    },
    mediaUrl: {
        type: String,
        required: false
    },
    mediaType: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
module.exports = mongoose.model('Comment', CommentSchema);