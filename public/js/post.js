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
            const post = await postResponse.json();

            if (!post || post.message) {
                postDetailsContainer.innerHTML = '<p>Post not found.</p>';
                return;
            }

            const postUser = post.userId;
            const hasUser = postUser && postUser.username;
            const authorName = hasUser ? postUser.username : 'Anonymous';
            const loggedInUserId = localStorage.getItem('userId');

            postPageTitle.textContent = `${post.title} - Indian Imageboard`;
            
            let deleteBtnHtml = hasUser && loggedInUserId === postUser._id.toString() 
                ? `<button class="delete-post-btn" data-id="${post._id}">Delete Post</button>` 
                : '';
            let shareBtnHtml = `<button class="share-post-btn" onclick="copyPostLink('${post._id}')">Share Link</button>`;
            let reportBtnHtml = `<button class="report-btn" data-id="${post._id}" data-type="Post">Report</button>`;

            let mediaHtml = '';
            if (post.mediaUrl) {
                if (post.mediaType && post.mediaType.startsWith('image')) {
                    mediaHtml = `<div class="post-media"><img src="${post.mediaUrl}" alt="Post Media" data-media-type="image"></div>`;
                } else if (post.mediaType && post.mediaType.startsWith('video')) {
                    mediaHtml = `<div class="post-media"><video src="${post.mediaUrl}" controls width="100%" data-media-type="video"></video></div>`;
                }
            }

            postDetailsContainer.innerHTML = `
                <h3>${post.title}</h3>
                <small>by <a href="/profile.html?id=${postUser._id}&username=${authorName}">${authorName}</a></small>
                <p>${post.content}</p>
                ${mediaHtml}
                ${deleteBtnHtml}
                ${shareBtnHtml}
                ${reportBtnHtml}
            `;

            // Fetch and render comments
            const commentsResponse = await fetch(`/api/posts/${postId}/comments`);
            const comments = await commentsResponse.json();
            commentsList.innerHTML = '';

            if (comments.length === 0) {
                commentsList.innerHTML = `<p>No comments yet. Be the first to reply!</p>`;
            } else {
                const buildTree = (list) => {
                    const map = {};
                    list.forEach(item => {
                        map[item._id] = item;
                        item.children = [];
                    });
                    const tree = [];
                    list.forEach(item => {
                        if (item.parentCommentId && map[item.parentCommentId]) {
                            map[item.parentCommentId].children.push(item);
                        } else {
                            tree.push(item);
                        }
                    });
                    return tree;
                };

                const renderComments = (commentArray, container) => {
                    commentArray.forEach(comment => {
                        const commentUser = comment.userId;
                        const commentAuthorName = commentUser ? commentUser.username : 'Anonymous';
                        
                        let commentDeleteBtnHtml = commentUser && loggedInUserId === commentUser._id.toString() ? `<button class="delete-comment-btn" data-id="${comment._id}">Delete</button>` : '';
                        let commentReportBtnHtml = `<button class="report-btn" data-id="${comment._id}" data-type="Comment">Report</button>`;
                        let replyBtnHtml = `<button class="reply-btn" data-id="${comment._id}">Reply</button>`;

                        let commentMediaHtml = '';
                        if (comment.mediaUrl) {
                            if (comment.mediaType && comment.mediaType.startsWith('image')) {
                                commentMediaHtml = `<div class="comment-media"><img src="${comment.mediaUrl}" alt="Comment Media" data-media-type="image"></div>`;
                            } else if (comment.mediaType && comment.mediaType.startsWith('video')) {
                                commentMediaHtml = `<div class="comment-media"><video src="${comment.mediaUrl}" controls width="100%" data-media-type="video"></video></div>`;
                            }
                        }

                        const commentDiv = document.createElement('div');
                        commentDiv.className = comment.parentCommentId ? 'comment comment-reply' : 'comment';
                        commentDiv.innerHTML = `
                            <small>by ${commentAuthorName} (ID: ${comment._id})</small>
                            <p>${comment.content}</p>
                            ${commentMediaHtml}
                            ${replyBtnHtml}
                            ${commentDeleteBtnHtml}
                            ${commentReportBtnHtml}
                        `;
                        
                        const repliesContainer = document.createElement('div');
                        commentDiv.appendChild(repliesContainer);
                        container.appendChild(commentDiv);

                        if (comment.children && comment.children.length > 0) {
                            renderComments(comment.children, repliesContainer);
                        }
                    });
                };

                const commentTree = buildTree(comments);
                renderComments(commentTree, commentsList);
            }
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
                // ... (rest of delete post logic)
            }
        }
    });

    // For comment replies and deletions
    commentsList.addEventListener('click', async (e) => {
        // Handle REPLY clicks
        if (e.target.classList.contains('reply-btn')) {
            const commentId = e.target.dataset.id;
            document.getElementById('parent-comment-id').value = commentId;
            const commentDiv = e.target.closest('.comment');
            commentDiv.appendChild(commentForm);
            document.getElementById('comment-content').focus();
        }

        // Handle DELETE clicks
        if (e.target.classList.contains('delete-comment-btn')) {
            const userId = localStorage.getItem('userId');
            const commentIdToDelete = e.target.dataset.id;
            if (confirm('Are you sure you want to delete this comment?')) {
                // ... (rest of delete comment logic)
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
                document.querySelector('main').appendChild(commentForm); // Move form back to main area
                fetchPostData();
            } else {
                console.error('Failed to submit comment.');
            }
        } catch (err) {
            console.error('Error submitting comment:', err);
        }
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
                // ... (rest of report logic)
            }
        }
    });

    fetchPostData();
    window.copyPostLink = copyPostLink;
});