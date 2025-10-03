document.addEventListener('DOMContentLoaded', () => {
    const postDetailsContainer = document.getElementById('post-details');
    const commentsList = document.getElementById('comments-list');
    const commentForm = document.getElementById('comment-form');
    const postPageTitle = document.getElementById('post-page-title');

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

            if (!post || post.message) {
                postDetailsContainer.innerHTML = '<p>Post not found.</p>';
                return;
            }

            postPageTitle.textContent = `${post.title} - Indian Imageboard`;
            const authorName = post.userId ? post.userId.username : 'Anonymous';
            let deleteBtnHtml = '';
            if (localStorage.getItem('userId') === post.userId._id.toString()) {
                deleteBtnHtml = `<button class="delete-post-btn" data-id="${post._id}">Delete Post</button>`;
            }

            let postContent = `
                <h3>${post.title}</h3>
                <small>by <a href="/profile.html?id=${post.userId._id}&username=${authorName}">${authorName}</a></small>
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

            const commentsResponse = await fetch(`/api/posts/${postId}/comments`);
            const comments = await commentsResponse.json();

            commentsList.innerHTML = '';
            if (comments.length === 0) {
                commentsList.innerHTML = `<p>No comments yet. Be the first to reply!</p>`;
            } else {
                comments.forEach(comment => {
                    const commentDiv = document.createElement('div');
                    commentDiv.className = 'comment';

                    const hasUser = comment.userId && comment.userId.username;
                    const authorName = hasUser ? comment.userId.username : 'Anonymous';
                    let deleteBtnHtml = '';

                    if (hasUser && localStorage.getItem('userId') === comment.userId._id.toString()) {
                        deleteBtnHtml = `<button class="delete-comment-btn" data-id="${comment._id}">Delete Comment</button>`;
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
                       <small>by <a href="/profile.html?id=${post.userId._id}&username=${authorName}">${authorName}</a></small>
                        <p>${comment.content}</p>
                        ${mediaHtml}
                        ${deleteBtnHtml}
                    `;
                    commentsList.appendChild(commentDiv);
                });
            }
        } catch (err) {
            console.error('Failed to fetch post data:', err);
            postDetailsContainer.innerHTML = `<p>An error occurred while loading the post.</p>`;
        }
    };

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
                        const postResponse = await fetch(`/api/posts/${postIdToDelete}`);
                        const postData = await postResponse.json();
                        if (postData.boardSlug) {
                            window.location.href = `/board.html?slug=${postData.boardSlug}`;
                        } else {
                            window.location.href = `/`;
                        }
                    } else {
                        console.error('Failed to delete post.');
                    }
                } catch (err) {
                    console.error('Error deleting post:', err);
                }
            }
        }
    });

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

    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(commentForm);

        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('id');
        formData.append('postId', postId);

        try {
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('userId')}`
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