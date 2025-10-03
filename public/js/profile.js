document.addEventListener('DOMContentLoaded', async () => {
    const usernameHeading = document.getElementById('username-heading');
    const userPostsList = document.getElementById('user-posts-list');
    const userCommentsList = document.getElementById('user-comments-list');
    const profilePageTitle = document.getElementById('profile-page-title');

    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    const username = urlParams.get('username');

    if (!userId || !username) {
        usernameHeading.textContent = 'User not found.';
        return;
    }

    usernameHeading.textContent = `Profile: ${username}`;
    profilePageTitle.textContent = `${username}'s Profile`;

    try {
        const postsResponse = await fetch(`/api/users/${userId}/posts`);
        const posts = await postsResponse.json();

        if (posts.length > 0) {
            userPostsList.innerHTML = '';
            posts.forEach(post => {
                const postDiv = document.createElement('div');
                postDiv.className = 'post';
                postDiv.innerHTML = `<a href="/post.html?id=${post._id}"><h4>${post.title}</h4></a>`;
                userPostsList.appendChild(postDiv);
            });
        } else {
            userPostsList.innerHTML = '<p>This user has not made any posts.</p>';
        }

        const commentsResponse = await fetch(`/api/users/${userId}/comments`);
        const comments = await commentsResponse.json();

        if (comments.length > 0) {
            userCommentsList.innerHTML = '';
            comments.forEach(comment => {
                const commentDiv = document.createElement('div');
                commentDiv.className = 'comment';
                commentDiv.innerHTML = `<p>${comment.content}</p>`;
                userCommentsList.appendChild(commentDiv);
            });
        } else {
            userCommentsList.innerHTML = '<p>This user has not made any comments.</p>';
        }
    } catch (err) {
        console.error('Failed to fetch user data:', err);
        usernameHeading.textContent = 'An error occurred.';
    }
});