document.addEventListener('DOMContentLoaded', () => {
    const authLinksContainer = document.getElementById('auth-links');
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username'); // Retrieve the stored username

    if (userId && authLinksContainer) {
        // --- User is Logged In ---
        // Display Welcome message, Profile link, and Logout button
        authLinksContainer.innerHTML = `
            <span>Welcome, ${username || 'User'}!</span> | 
            <a href="/profile.html?id=${userId}&username=${username || 'User'}">My Profile</a> | 
            <a href="#" id="logout-btn" style="cursor: pointer; color: white;">Logout</a> 
        `; // Added username to profile link and styled logout

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default link behavior
                
                // Clear user data from local storage
                localStorage.removeItem('userId');
                localStorage.removeItem('username'); 
                
                // Inform user and redirect to homepage
                alert('You have been logged out.');
                window.location.href = '/'; 
            });
        }
    } else if (authLinksContainer) {
        // --- User is Logged Out ---
        // Display the standard Login/Register links
        authLinksContainer.innerHTML = `
            <a href="/auth.html">Login / Register</a> | 
            <a href="/admin.html">Admin Panel</a> 
        `;
    }
});