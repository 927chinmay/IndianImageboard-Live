// Function to copy the current page URL to clipboard
function copyPostLink(postId) {
    const url = window.location.origin + '/post.html?id=' + postId;
    navigator.clipboard.writeText(url).then(() => {
        alert('Link copied to clipboard!');
    }).catch(err => {
        console.error('Could not copy text: ', err);
        alert('Could not copy link. Please copy from the address bar.');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const postDetailsContainer = document.getElementById('post-details');
    const commentsList = document.getElementById('comments-list');
    const commentForm = document.getElementById('comment-form');
    const postPageTitle = document.getElementById('post-page-title');
    const ANONYMOUS_ID = "68e10f32fde360adcb486c05"; // Placeholder Anonymous Guest ID

   const fetchPostData = async () => {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('id');

        if (!postId) {
            postDetailsContainer.innerHTML = '<p>Post not found.</p>';
            return;
        }

        const postResponse = await fetch(`/api/posts/${postId}`);
        if (!postResponse.ok) {
            postDetailsContainer.innerHTML = '<p>Post not found or error loading.</p>';
            return;
        }
        const post = await postResponse.json();

        if (!post) {
            postDetailsContainer.innerHTML = '<p>Post not found.</p>';
            return;
        }

        const loggedInUserId = localStorage.getItem('userId');
        postPageTitle.textContent = `${post.title} - Indian Imageboard`;

        // --- THIS IS THE CORRECTED LOGIC ---
        const postUser = post.userId; // This can be null if user was deleted
        const authorName = postUser ? postUser.username : 'Anonymous';
        const authorProfileLink = postUser ? `/profile.html?id=${postUser._id}&username=${authorName}` : '#'; // Link to '#' if no user

        let deleteBtnHtml = '';
        // Only create delete button if the user exists and matches the logged-in user
        if (postUser && loggedInUserId === postUser._id.toString()) {
            deleteBtnHtml = `<button class="delete-post-btn" data-id="${post._id}">Delete Post</button>`;
        }
        // --- END OF CORRECTION ---

        let shareBtnHtml = `<button class="share-post-btn" onclick="copyPostLink('${post._id}')">Share Link</button>`;
        let reportBtnHtml = `<button class="report-btn" data-id="${post._id}" data-type="Post">Report</button>`;
        
        let mediaHtml = '';
        if (post.mediaUrl) {
            if (post.mediaType?.startsWith('image')) {
                mediaHtml = `<div class="post-media"><img src="${post.mediaUrl}" alt="Post Media" data-media-type="image"></div>`;
            } else if (post.mediaType?.startsWith('video')) {
                mediaHtml = `<div class="post-media"><video src="${post.mediaUrl}" controls width="100%" data-media-type="video"></video></div>`;
            }
        }

        postDetailsContainer.innerHTML = `
            <h3>${post.title}</h3>
            <small>by <a href="${authorProfileLink}">${authorName}</a></small>
            <p>${post.content}</p>
            ${mediaHtml}
            ${deleteBtnHtml}
            ${shareBtnHtml}
            ${reportBtnHtml}
        `;

        // --- (The rest of the function for fetching/rendering comments remains the same) ---
        const commentsResponse = await fetch(`/api/posts/${postId}/comments`);
        const comments = await commentsResponse.json();
        commentsList.innerHTML = '';
        // ... (rest of the comment logic) ...
    } catch (err) {
        console.error('Failed to fetch post data:', err);
        postDetailsContainer.innerHTML = `<p>An error occurred while loading the post.</p>`;
    }
};

    // --- ALL EVENT LISTENERS ---

    // For deleting the main post
    postDetailsContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-post-btn')) {
            const userId = localStorage.getItem('userId');
            const postIdToDelete = e.target.dataset.id;
            if (confirm('Are you sure you want to delete this post?')) {
                try {
                    const response = await fetch(`/api/posts/${postIdToDelete}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${userId}` }
                    });
                    if (response.ok) {
                        alert('Post deleted!');
                        window.location.href = `/`;
                    } else { console.error('Failed to delete post.'); }
                } catch (err) { console.error('Error deleting post:', err); }
            }
        }
    });

    // For comment replies and deletions
    commentsList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('reply-btn')) {
            const commentId = e.target.dataset.id;
            document.getElementById('parent-comment-id').value = commentId;
            const commentDiv = e.target.closest('.comment');
            commentDiv.appendChild(commentForm);
            document.getElementById('comment-content').focus();
        }

        if (e.target.classList.contains('delete-comment-btn')) {
            const userId = localStorage.getItem('userId');
            const commentIdToDelete = e.target.dataset.id;
            if (confirm('Are you sure you want to delete this comment?')) {
                try {
                    const response = await fetch(`/api/comments/${commentIdToDelete}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${userId}` }
                    });
                    if (response.ok) {
                        fetchPostData(); // Refresh comments
                    } else { console.error('Failed to delete comment.'); }
                } catch (err) { console.error('Error deleting comment:', err); }
            }
        }
    });

    // For submitting a new comment/reply
    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(commentForm);
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('id');
        formData.append('postId', postId);
        
        const parentId = document.getElementById('parent-comment-id').value;
        if (parentId) {
            formData.append('parentCommentId', parentId);
        }

        const userId = localStorage.getItem('userId') || ANONYMOUS_ID;

        try {
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${userId}` },
                body: formData
            });
            if (response.ok) {
                commentForm.reset();
                document.getElementById('parent-comment-id').value = '';
                document.querySelector('main').appendChild(commentForm);
                fetchPostData();
            } else { console.error('Failed to submit comment.'); }
        } catch (err) { console.error('Error submitting comment:', err); }
    });
    
    // For handling report clicks anywhere on the page
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('report-btn')) {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                alert('You must be logged in to report content.');
                return;
            }
            const reason = prompt('Please state the reason for your report:');
            if (reason && reason.trim() !== '') {
                const report = {
                    contentId: e.target.dataset.id,
                    contentType: e.target.dataset.type,
                    reason: reason.trim()
                };
                try {
                    const response = await fetch('/api/reports', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${userId}`
                        },
                        body: JSON.stringify(report)
                    });
                    const data = await response.json();
                    alert(data.message);
                } catch (err) {
                    console.error('Failed to submit report:', err);
                    alert('An error occurred while submitting your report.');
                }
            }
        }
    });

    fetchPostData();
    window.copyPostLink = copyPostLink;
});