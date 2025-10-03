document.addEventListener('DOMContentLoaded', async () => {
    const boardsList = document.getElementById('boards-list');

    try {
        const response = await fetch('/api/boards');
        const boards = await response.json();

        boards.forEach(board => {
            const boardLink = document.createElement('a');
            boardLink.href = `/board.html?slug=${board.slug}`;
            boardLink.className = 'board-link';
            boardLink.innerHTML = `<h3>/${board.slug}/ - ${board.name}</h3><p>${board.description}</p>`;
            boardsList.appendChild(boardLink);
        });
    } catch (err) {
        console.error('Failed to fetch boards:', err);
    }
});