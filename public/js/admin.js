document.addEventListener('DOMContentLoaded', async () => {
    const adminContent = document.getElementById('admin-content');
    const userId = localStorage.getItem('userId');

    if (!userId) {
        adminContent.innerHTML = '<p>Please log in to view this page.</p>';
        return;
    }

    try {
        // Fetch posts and comments from the admin API
        const postsResponse = await fetch('/api/admin/posts', {
            headers: {
                'Authorization': `Bearer ${userId}`
            }
        });

        const commentsResponse = await fetch('/api/admin/comments', {
            headers: {
                'Authorization': `Bearer ${userId}`
            }
        });

        if (postsResponse.status === 403 || commentsResponse.status === 403) {
            adminContent.innerHTML = '<p>Access Denied. You are not an administrator.</p>';
            return;
        }

        const posts = await postsResponse.json();
        const comments = await commentsResponse.json();

        // Display the data
        let html = '<h3>Posts</h3>';
        posts.forEach(post => {
            html += `
                <div class="post">
                    <h4>${post.title}</h4>
                    <small>by ${post.userId ? post.userId.username : 'Anonymous'}</small>
                    <p>${post.content}</p>
                    <button class="delete-post-btn" data-id="${post._id}">Delete</button>
                </div>
            `;
        });

        html += '<h3>Comments</h3>';
        comments.forEach(comment => {
            html += `
                <div class="comment">
                    <small>by ${comment.userId ? comment.userId.username : 'Anonymous'}</small>
                    <p>${comment.content}</p>
                    <button class="delete-comment-btn" data-id="${comment._id}">Delete</button>
                </div>
            `;
        });

        adminContent.innerHTML = html;

    } catch (err) {
        console.error('Failed to fetch admin data:', err);
        adminContent.innerHTML = '<p>An error occurred. Could not load data.</p>';
    }
});

// In public/js/admin.js (continued)

// Event listener for delete buttons on posts and comments
document.addEventListener('click', async (e) => {
    const userId = localStorage.getItem('userId');

    if (e.target.classList.contains('delete-post-btn')) {
        const postId = e.target.dataset.id;
        if (confirm('Are you sure you want to delete this post?')) {
            const response = await fetch(`/api/posts/${postId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${userId}` }
            });
            if (response.ok) {
                location.reload(); // Reload the page to show changes
            }
        }
    }

    if (e.target.classList.contains('delete-comment-btn')) {
        const commentId = e.target.dataset.id;
        if (confirm('Are you sure you want to delete this comment?')) {
            const response = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${userId}` }
            });
            if (response.ok) {
                location.reload();
            }
        }
    }
});