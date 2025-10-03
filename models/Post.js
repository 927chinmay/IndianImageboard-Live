const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    mediaUrl: { type: String, required: false }, mediaType: { type: String, required: false    
    },
    boardSlug: { // <-- Add this new field
        type: String,
        required: true
    },
      userId: { // <-- Add this new field
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Post', PostSchema);