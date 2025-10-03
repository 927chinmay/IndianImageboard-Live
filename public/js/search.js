document.addEventListener('DOMContentLoaded', async () => {
    const searchResultsList = document.getElementById('search-results-list');
    const searchResultsHeading = document.getElementById('search-results-heading');

    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');

    if (!query) {
        searchResultsHeading.textContent = 'Please enter a search query.';
        return;
    }

    searchResultsHeading.textContent = `Search results for: "${query}"`;

    try {
        const response = await fetch(`/api/search?q=${query}`);
        const posts = await response.json();

        if (posts.length > 0) {
            searchResultsList.innerHTML = '';
            posts.forEach(post => {
                const postDiv = document.createElement('div');
                postDiv.className = 'post';
                postDiv.innerHTML = `
                    <a href="/post.html?id=${post._id}"><h4>${post.title}</h4></a>
                    <small>by ${post.userId ? post.userId.username : 'Anonymous'}</small>
                    <p>${post.content.substring(0, 150)}...</p>
                `;
                searchResultsList.appendChild(postDiv);
            });
        } else {
            searchResultsList.innerHTML = '<p>No posts found matching your query.</p>';
        }
    } catch (err) {
        console.error('Failed to fetch search results:', err);
        searchResultsList.innerHTML = '<p>An error occurred while fetching search results.</p>';
    }
});