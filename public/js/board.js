document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const postsList = document.getElementById('posts-list');
    const boardNameHeader = document.getElementById('board-name');
    const boardDescriptionPara = document.getElementById('board-description');
    const postForm = document.getElementById('post-form');
    const listViewBtn = document.getElementById('list-view-btn');
    const catalogViewBtn = document.getElementById('catalog-view-btn');
    const paginationControls = document.getElementById('pagination-controls');

    // --- STATE VARIABLES ---
    const ANONYMOUS_ID = "68e10f32fde360adcb486c05"; // Your placeholder Anonymous ID
    let currentPage = 1; // Keep track of the current page

    // --- CORE FUNCTION TO FETCH AND RENDER DATA ---
    const fetchBoardData = async (page = 1) => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const boardSlug = urlParams.get('slug');
            currentPage = page; // Update the global current page

            if (!boardSlug) {
                boardNameHeader.textContent = 'Board not found.';
                return;
            }

            // Fetch board details (this remains the same)
            const allBoardsResponse = await fetch('/api/boards');
            const allBoards = await allBoardsResponse.json();
            const currentBoard = allBoards.find(b => b.slug === boardSlug);
            
            if (currentBoard) {
                boardNameHeader.textContent = `/${currentBoard.slug}/ - ${currentBoard.name}`;
                boardDescriptionPara.textContent = currentBoard.description;
            }

            // Fetch posts for the specific page using the new paginated API
            const response = await fetch(`/api/boards/${boardSlug}/posts?page=${page}`);
            const data = await response.json();
            const { posts, totalPages } = data;

            postsList.innerHTML = ''; // Clear previous posts
            if (!posts || posts.length === 0) {
                postsList.innerHTML = '<p>No posts on this board yet. Be the first!</p>';
                paginationControls.innerHTML = ''; // Clear pagination if no posts
                return;
            }

            const loggedInUserId = localStorage.getItem('userId');
            posts.forEach(post => {
                const postUser = post.userId;
                const hasUser = postUser && postUser.username;
                const authorName = hasUser ? postUser.username : 'Anonymous';
                
                let deleteBtnHtml = (hasUser && loggedInUserId === postUser._id.toString()) 
                    ? `<button class="delete-post-btn" data-id="${post._id}">Delete</button>` 
                    : '';
                const reportBtnHtml = `<button class="report-btn" data-id="${post._id}" data-type="Post">Report</button>`;
                
                let mediaHtml = '';
                if (post.mediaUrl) {
                    if (post.mediaType?.startsWith('image')) {
                        mediaHtml = `<div class="post-media"><img src="${post.mediaUrl}" alt="Post Media" data-media-type="image"></div>`;
                    } else if (post.mediaType?.startsWith('video')) {
                        mediaHtml = `<div class="post-media"><video src="${post.mediaUrl}" controls data-media-type="video"></video></div>`;
                    }
                }

                // We create a wrapper div for the entire post content
                const postWrapper = document.createElement('div');
                postWrapper.className = 'post';
                postWrapper.innerHTML = `
                    <h3><a href="/post.html?id=${post._id}">${post.title}</a></h3>
                    <small>by ${authorName}</small>
                    <p>${post.content.substring(0, 250)}...</p>
                    ${mediaHtml}
                    ${deleteBtnHtml}
                    ${reportBtnHtml}
                `;
                postsList.appendChild(postWrapper);
            });

            // Render the pagination buttons
            renderPagination(totalPages, currentPage);

        } catch (err) {
            console.error('Failed to fetch board data:', err);
            postsList.innerHTML = '<p>An error occurred while loading posts.</p>';
        }
    };

    // --- HELPER FUNCTION FOR PAGINATION ---
    const renderPagination = (totalPages, page) => {
        if (totalPages <= 1) {
            paginationControls.innerHTML = '';
            return;
        }

        let prevBtn = `<button id="prev-page-btn" ${page === 1 ? 'disabled' : ''}>Previous</button>`;
        let nextBtn = `<button id="next-page-btn" ${page === totalPages ? 'disabled' : ''}>Next</button>`;
        
        paginationControls.innerHTML = `
            ${prevBtn}
            <span>Page ${page} of ${totalPages}</span>
            ${nextBtn}
        `;
    };

    // --- EVENT LISTENERS ---

    // Listener for pagination buttons
    paginationControls.addEventListener('click', (e) => {
        if (e.target.id === 'prev-page-btn') {
            fetchBoardData(currentPage - 1);
        }
        if (e.target.id === 'next-page-btn') {
            fetchBoardData(currentPage + 1);
        }
    });
    
    // Listener for submitting the new post form
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
                headers: { 'Authorization': `Bearer ${userId}` },
                body: formData
            });

            if (response.ok) {
                postForm.reset();
                fetchBoardData(1); // Go back to page 1 to see the new post
            } else {
                alert('Failed to create post. Please try again.');
            }
        } catch (err) {
            console.error('Error creating post:', err);
            alert('An error occurred while creating the post.');
        }
    });

    // Delegated listener for delete and report buttons
    postsList.addEventListener('click', async (e) => {
        const userId = localStorage.getItem('userId');

        // Handle Delete Clicks
        if (e.target.classList.contains('delete-post-btn')) {
            const postId = e.target.dataset.id;
            if (confirm('Are you sure you want to delete this post?')) {
                try {
                    const response = await fetch(`/api/posts/${postId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${userId}` }
                    });
                    if (response.ok) {
                        fetchBoardData(currentPage); // Refresh the current page
                    } else {
                        alert('Failed to delete post.');
                    }
                } catch (err) {
                    console.error('Error deleting post:', err);
                }
            }
        }

        // Handle Report Clicks
        if (e.target.classList.contains('report-btn')) {
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
                }
            }
        }
    });
    
    // Listeners for view toggling
    listViewBtn.addEventListener('click', (e) => {
        e.preventDefault();
        postsList.classList.remove('catalog');
    });

    catalogViewBtn.addEventListener('click', (e) => {
        e.preventDefault();
        postsList.classList.add('catalog');
    });

    // --- INITIAL PAGE LOAD ---
    const initialUrlParams = new URLSearchParams(window.location.search);
    const initialPage = parseInt(initialUrlParams.get('page')) || 1;
    fetchBoardData(initialPage);
    postsList.classList.add('catalog'); // Set Catalog as default view
});