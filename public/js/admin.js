document.addEventListener('DOMContentLoaded', async () => {
    const adminContent = document.getElementById('admin-content');
    const adminReports = document.getElementById('admin-reports'); // Get the new reports div
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

        if (postsResponse.status === 403) { // Check just one for admin status
            adminContent.innerHTML = '<p>Access Denied. You are not an administrator.</p>';
            adminReports.innerHTML = '';
            return;
        }

        const posts = await postsResponse.json();
        const comments = await commentsResponse.json();
        const reports = await reportsResponse.json();

        // Display Posts
        let postsHtml = '<h3>Posts</h3>';
        posts.forEach(post => { /* ... your existing post rendering code ... */ });
        adminContent.innerHTML = postsHtml;
        
        // Display Comments
        let commentsHtml = '<h3>Comments</h3>';
        comments.forEach(comment => { /* ... your existing comment rendering code ... */ });
        adminContent.innerHTML += commentsHtml;

        // Display Reports
        if (reports.length > 0) {
            let reportsHtml = '';
            reports.forEach(report => {
                const contentLink = report.contentType === 'Post'
                    ? `/post.html?id=${report.contentId}`
                    : `/post.html?id=${report.contentId}`; // Link to the post for both

                reportsHtml += `
                    <div class="report">
                        <p><strong>Reason:</strong> ${report.reason}</p>
                        <small>Reported by: ${report.reportingUserId ? report.reportingUserId.username : 'Unknown'}</small><br>
                        <a href="${contentLink}" target="_blank">View Reported ${report.contentType}</a>
                        <button class="resolve-report-btn" data-id="${report._id}">Mark as Resolved</button>
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