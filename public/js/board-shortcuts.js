document.addEventListener('DOMContentLoaded', async () => {
    const boardShortcutsDiv = document.getElementById('board-shortcuts');
    if (!boardShortcutsDiv) {
        console.warn('Board shortcuts container not found.');
        return;
    }

    try {
        const response = await fetch('/api/boards');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const boards = await response.json();

        boardShortcutsDiv.innerHTML = ''; // Clear "Loading boards..."

        // Add an "All Boards" link (optional but useful)
        const allBoardsLink = document.createElement('a');
        allBoardsLink.href = '/'; // Link to your homepage/boards overview
        allBoardsLink.textContent = 'Home';
        boardShortcutsDiv.appendChild(allBoardsLink);

        boards.forEach(board => {
            const link = document.createElement('a');
            link.href = `/board.html?slug=${board.slug}`;
            link.textContent = `/${board.slug}/ - ${board.name}`;
            boardShortcutsDiv.appendChild(link);
        });

    } catch (error) {
        console.error('Error fetching board shortcuts:', error);
        boardShortcutsDiv.innerHTML = '<p>Could not load board shortcuts.</p>';
    }
});