document.addEventListener('DOMContentLoaded', () => {
    const postDetailsContainer = document.getElementById('post-details');
    const commentsList = document.getElementById('comments-list');
    const commentForm = document.getElementById('comment-form');
    const postPageTitle = document.getElementById('post-page-title');
    // NOTE: Replace this placeholder ID with your actual Anonymous Guest ID!
    const ANONYMOUS_ID = "68e10f32fde360adcb486c05YO"; 

    const fetchPostData = async () => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const postId = urlParams.get('id');

            if (!postId) {
                postDetailsContainer.innerHTML = '<p>Post not found.</p>';
                return;
            }

            const postResponse = await fetch(`/api/posts/${postId}`);
            const post = await postResponse.json();

            // CRITICAL CHECK: If post is not found or null, stop script gracefully
            if (!post || post.message) { 
                postDetailsContainer.innerHTML = '<p>Post not found.</p>';
                return;
            }

            // Define User Variables SAFELY
            const postUser = post.userId;
            const hasUser = postUser && postUser.username;
            const authorName = hasUser ? postUser.username : 'Anonymous';
            const loggedInUserId = localStorage.getItem('userId');

            postPageTitle.textContent = `${post.title} - Indian Imageboard`;
            let deleteBtnHtml = '';

            // Post Deletion Logic: Only show delete button if logged in user is the author
            if (hasUser && loggedInUserId === postUser._id.toString()) {
                deleteBtnHtml = `<button class="delete-post-btn" data-id="${post._id}">Delete Post</button>`;
            }

            // Post Content Rendering
            let postContent = `
                <h3>${post.title}</h3>
                <small>by <a href="/profile.html?id=${postUser._id}&username=${authorName}">${authorName}</a></small>
                <p>${post.content}</p>
                ${deleteBtnHtml}
            `;

            if (post.mediaUrl) {
                if (post.mediaType && post.mediaType.startsWith('image')) {
                    postContent += `<div class="post-media"><img src="${post.mediaUrl}" alt="Post Media"></div>`;
                } else if (post.mediaType && post.mediaType.startsWith('video')) {
                    postContent += `<div class="post-media"><video src="${post.mediaUrl}" controls width="100%"></video></div>`;
                }
            }
            postDetailsContainer.innerHTML = postContent;

            // Fetch Comments
            const commentsResponse = await fetch(`/api/posts/${postId}/comments`);
            const comments = await commentsResponse.json();

            commentsList.innerHTML = '';
            if (comments.length === 0) {
                commentsList.innerHTML = `<p>No comments yet. Be the first to reply!</p>`;
            } else {
                comments.forEach(comment => {
                    const commentDiv = document.createElement('div');
                    commentDiv.className = 'comment';

                    const commentUser = comment.userId;
                    const commentAuthorName = commentUser ? commentUser.username : 'Anonymous';
                    let commentDeleteBtnHtml = '';

                    // Comment Deletion Logic: Only show delete button if logged in user is the author
                    if (commentUser && loggedInUserId === commentUser._id.toString()) {
                        commentDeleteBtnHtml = `<button class="delete-comment-btn" data-id="${comment._id}">Delete Comment</button>`;
                    }

                    let mediaHtml = '';
                    if (comment.mediaUrl) {
                        if (comment.mediaType && comment.mediaType.startsWith('image')) {
                            mediaHtml = `<div class="comment-media"><img src="${comment.mediaUrl}" alt="Comment Media"></div>`;
                        } else if (comment.mediaType && comment.mediaType.startsWith('video')) {
                            mediaHtml = `<div class="comment-media"><video src="${comment.mediaUrl}" controls width="100%"></video></div>`;
                        }
                    }

                    commentDiv.innerHTML = `
                       <small>by <a href="/profile.html?id=${commentUser._id}&username=${commentAuthorName}">${commentAuthorName}</a></small>
                        <p>${comment.content}</p>
                        ${mediaHtml}
                        ${commentDeleteBtnHtml}
                    `;
                    commentsList.appendChild(commentDiv);
                });
            }
        } catch (err) {
            console.error('Failed to fetch post data:', err);
            postDetailsContainer.innerHTML = `<p>An error occurred while loading the post.</p>`;
        }
    };

    // Post Deletion Event Listener (uses postDetailsContainer because the button is created inside it)
    postDetailsContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-post-btn')) {
            const userId = localStorage.getItem('userId');
            const postIdToDelete = e.target.dataset.id;
            if (confirm('Are you sure you want to delete this post?')) {
                try {
                    const response = await fetch(`/api/posts/${postIdToDelete}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${userId}`
                        }
                    });
                    if (response.ok) {
                        alert('Post deleted!');
                        // Simplifies redirect to home after successful deletion
                        window.location.href = `/`; 
                    } else {
                        console.error('Failed to delete post.');
                    }
                } catch (err) {
                    console.error('Error deleting post:', err);
                }
            }
        }
    });

    // Comment Deletion Event Listener
    commentsList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-comment-btn')) {
            const userId = localStorage.getItem('userId');
            const commentIdToDelete = e.target.dataset.id;
            if (confirm('Are you sure you want to delete this comment?')) {
                try {
                    const response = await fetch(`/api/comments/${commentIdToDelete}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${userId}`
                        }
                    });
                    if (response.ok) {
                        fetchPostData();
                    } else {
                        console.error('Failed to delete comment.');
                    }
                } catch (err) {
                    console.error('Error deleting comment:', err);
                }
            }
        }
    });

    // Comment Submission Event Listener (FINAL FIX FOR ANONYMOUS POSTING)
    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(commentForm);

        // Get Post ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('id');
        formData.append('postId', postId); // CRITICAL: Ensure postId is appended

        // CRITICAL: Determine User ID for Authorization Header
        const userId = localStorage.getItem('userId') || ANONYMOUS_ID;

        try {
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userId}`
                },
                body: formData
            });

            if (response.ok) {
                commentForm.reset();
                fetchPostData();
            } else {
                console.error('Failed to submit comment.');
            }
        } catch (err) {
            console.error('Error submitting comment:', err);
        }
    });

    fetchPostData();
});