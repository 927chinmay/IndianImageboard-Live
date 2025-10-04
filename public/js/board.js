document.addEventListener('DOMContentLoaded', () => {
    const postsList = document.getElementById('posts-list');
    const postForm = document.getElementById('post-form');
    const listViewBtn = document.getElementById('list-view-btn');
    const catalogViewBtn = document.getElementById('catalog-view-btn');
    const ANONYMOUS_ID = "68e10f32fde360adcb486c05"; // <-- PASTE THE _id HERE

    // This function fetches all the posts for the current board and renders them
    const fetchBoardData = async () => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const boardSlug = urlParams.get('slug');

            if (!boardSlug) {
                postsList.innerHTML = '<p>Board not found.</p>';
                return;
            }

            const boardNameHeader = document.getElementById('board-name');
            const boardDescriptionPara = document.getElementById('board-description');

            const boardResponse = await fetch('/api/boards');
            const allBoards = await boardResponse.json();
            const currentBoard = allBoards.find(b => b.slug === boardSlug);

            if (currentBoard) {
                boardNameHeader.textContent = `/${currentBoard.slug}/ - ${currentBoard.name}`;
                boardDescriptionPara.textContent = currentBoard.description;
            }

            const postsResponse = await fetch(`/api/boards/${boardSlug}/posts`);
            const posts = await postsResponse.json();

            postsList.innerHTML = '';

            posts.forEach(post => {
    const postDiv = document.createElement('div');
    postDiv.className = 'post';

    const hasUser = post.userId && post.userId.username;
    const authorName = hasUser ? post.userId.username : 'Anonymous';
    let deleteBtnHtml = '';

    if (hasUser && localStorage.getItem('userId') === post.userId._id.toString()) {
        deleteBtnHtml = `<button class="delete-post-btn" data-id="${post._id}">Delete Post</button>`;
    }

    let mediaHtml = '';
    if (post.mediaUrl) {
        if (post.mediaType && post.mediaType.startsWith('image')) {
            mediaHtml = `<div class="post-media"><img src="${post.mediaUrl}" alt="Post Media"></div>`;
        } else if (post.mediaType && post.mediaType.startsWith('video')) {
            mediaHtml = `<div class="post-media"><video src="${post.mediaUrl}" controls width="100%"></video></div>`;
        }
    }

    let postContent = `
        <a href="/post.html?id=${post._id}"><h3>${post.title}</h3></a>
        <small>by <a href="/profile.html?id=${post.userId?._id}&username=${authorName}">${authorName}</a></small>
        <p>${post.content}</p>
        ${mediaHtml}
        ${deleteBtnHtml}
    `;
    postDiv.innerHTML = postContent;
    postsList.appendChild(postDiv);
});
        } catch (err) {
            console.error('Failed to fetch board data:', err);
            postsList.innerHTML = '<p>An error occurred while loading the board.</p>';
        }
    };

    // Event listener for post deletion
    postsList.addEventListener('click', async (e) => {
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
                        fetchBoardData();
                    } else {
                        console.error('Failed to delete post.');
                    }
                } catch (err) {
                    console.error('Error deleting post:', err);
                }
            }
        }
    });

    // Event listener for the post submission form
    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(postForm);

        const urlParams = new URLSearchParams(window.location.search);
        const boardSlug = urlParams.get('slug');
        formData.append('boardSlug', boardSlug);

        const userId = localStorage.getItem('userId') || ANONYMOUS_ID;

        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                     'Authorization': `Bearer ${userId}`
                },
                body: formData
            });

            if (response.ok) {
                postForm.reset();
                fetchBoardData();
            } else {
                console.error('Failed to submit post.');
            }
        } catch (err) {
            console.error('Error submitting post:', err);
        }
    });

    // Event listeners for view toggling
    if (listViewBtn && catalogViewBtn) {
        listViewBtn.addEventListener('click', (e) => {
            e.preventDefault();
            postsList.classList.remove('catalog');
        });

        catalogViewBtn.addEventListener('click', (e) => {
            e.preventDefault();
            postsList.classList.add('catalog');
        });
    }

    // Initial call to fetch data on page load
    fetchBoardData();
});