document.addEventListener('DOMContentLoaded', async () => {
    const adminContent = document.getElementById('admin-content');
    const adminReports = document.getElementById('admin-reports');
    const userId = localStorage.getItem('userId');

    if (!userId) {
        adminContent.innerHTML = '<p>Please log in to view this page.</p>';
        return;
    }

    try {
        // Fetch posts, comments, AND reports
        const [postsResponse, commentsResponse, reportsResponse] = await Promise.all([
            fetch('/api/admin/posts', { headers: { 'Authorization': `Bearer ${userId}` } }),
            fetch('/api/admin/comments', { headers: { 'Authorization': `Bearer ${userId}` } }),
            fetch('/api/admin/reports', { headers: { 'Authorization': `Bearer ${userId}` } })
        ]);

        if (postsResponse.status === 403) {
            adminContent.innerHTML = '<p>Access Denied. You are not an administrator.</p>';
            adminReports.innerHTML = '<p>You do not have permission to view reports.</p>';
            return;
        }

        const posts = await postsResponse.json();
        const comments = await commentsResponse.json();
        const reports = await reportsResponse.json();

        // --- THIS IS THE CORRECTED PART ---
        // Display Posts
        let contentHtml = '<h3>Posts</h3>';
        if (posts.length > 0) {
            posts.forEach(post => {
                contentHtml += `
                    <div class="post">
                        <h4>${post.title}</h4>
                        <small>by ${post.userId ? post.userId.username : 'Anonymous'}</small>
                        <p>${post.content}</p>
                        <button class="delete-post-btn" data-id="${post._id}">Delete</button>
                    </div>
                `;
            });
        } else {
            contentHtml += '<p>No posts to display.</p>';
        }

        // Display Comments
        contentHtml += '<h3>Comments</h3>';
        if (comments.length > 0) {
            comments.forEach(comment => {
                contentHtml += `
                    <div class="comment">
                        <small>by ${comment.userId ? comment.userId.username : 'Anonymous'}</small>
                        <p>${comment.content}</p>
                        <button class="delete-comment-btn" data-id="${comment._id}">Delete</button>
                    </div>
                `;
            });
        } else {
            contentHtml += '<p>No comments to display.</p>';
        }
        
        adminContent.innerHTML = contentHtml;
        // --- END OF CORRECTION ---

        // Display Reports
        if (reports.length > 0) {
            let reportsHtml = '';
            reports.forEach(report => {
                const contentLink = `/post.html?id=${report.contentId}`;

                reportsHtml += `
                    <div class="report" style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px;">
                        <p><strong>Reason:</strong> ${report.reason}</p>
                        <small>Reported by: ${report.reportingUserId ? report.reportingUserId.username : 'Unknown'}</small><br>
                        <a href="${contentLink}" target="_blank">View Reported ${report.contentType}</a>
                        <button class="resolve-report-btn" data-id="${report._id}" style="margin-left: 10px;">Mark as Resolved</button>
                    </div>
                `;
            });
            adminReports.innerHTML = reportsHtml;
        } else {
            adminReports.innerHTML = '<p>No pending reports.</p>';
        }

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

    // Inside document.addEventListener('click', ...)
    
    if (e.target.classList.contains('resolve-report-btn')) {
        const reportId = e.target.dataset.id;
        if (confirm('Are you sure you want to mark this report as resolved?')) {
            const response = await fetch(`/api/reports/${reportId}/resolve`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${userId}` }
            });
            if (response.ok) {
                location.reload(); // Reload the page to show changes
            }
        }
    }
});