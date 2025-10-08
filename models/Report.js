const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReportSchema = new Schema({
    // The content being reported can be a post or a comment
    contentId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    // To know if it's a 'Post' or a 'Comment'
    contentType: {
        type: String,
        required: true,
        enum: ['Post', 'Comment'] 
    },
    // The user who filed the report
    reportingUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // The reason for the report
    reason: {
        type: String,
        required: true,
        trim: true
    },
    // To track if the report has been dealt with
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'resolved']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Report', ReportSchema);