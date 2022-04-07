import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";
const socket = io();
// Set Topic titles
document.querySelector('title').textContent = `Σ - ${window.location.href.toString().split('/').at(-1).charAt(0).toUpperCase() + window.location.href.toString().split('/').at(-1).slice(1).replace(/[^a-zA-Z0-9 ]/g, '')}`
document.querySelector('#topic').textContent = `${window.location.href.toString().split('/').at(-1).charAt(0).toUpperCase() + window.location.href.toString().split('/').at(-1).slice(1).replace(/[^a-zA-Z0-9 ]/g, '')}`

// Commenting or Posting?
let commentMode = false;

const searchSelector = document.querySelector('.search');

// Use connects to server, upon socket conection do the following
socket.on('connect', () => {
    // Amount of active users is received and page updated accordingly
    socket.on('newUser', (userAmount) => {
        document.querySelector("#users-online").textContent = `Chads Online: ${userAmount}`;
    });
    // Ask for the previous posts on the topic
    socket.emit('previousPosts', window.location.href.toString().split('/').at(-1))
    // Receive the previous posts of the topic
    socket.on('updatePosts', (postData) => {
        if (postData[1] === window.location.href.toString().split('/').at(-1)) {
            updatePosts(postData[0]);
        }
    });
    socket.on('updateComments', (commentData) => {
        console.log(commentData);
        if (commentData[1] === window.location.href.toString().split('/').at(-1) && commentMode && parseInt(document.getElementById('commenttext').getAttribute('postnumber')) === commentData[2]) {
            updateComments(commentData[0]);
        }
    })
    // Receive the GIFs HTML from server
    socket.on('populateGifs', populateGifs);
});

// Sending a post to the server
function sendPost(e) {
    // Stop submit from refreshing the page
    e.preventDefault();
    // Make sure the input isn't blank
    if (e.target.posttext.value && e.target.posttext.value !== undefined) {
        // Creating the post object
        const postData = {
            postText: e.target.posttext.value,
            postUser: socket.id,
            postTopic: window.location.href.toString().split('/').at(-1),
            postImg: e.target.postplaceholder.src
        };

        // HTTP request options
        const options = {
            method: 'POST',
            body: JSON.stringify(postData),
            headers: {
                "Content-Type": "application/json"
            }
        };
        
        // Reset everything to blank
        document.querySelector('#post-form').reset();
        document.getElementById('postplaceholder').style.display = 'none';
        document.getElementById('postplaceholder').src = '//:0';

        // Send request to server API
        fetch(`${window.location.origin}/sendPost`, options)
    }
}

// Sending a comment to the server
function sendComment(e) {
    // Stop submit from refreshing the page
    e.preventDefault();
    // Make sure the input isn't blank
    if (e.target.commenttext.value && e.target.commenttext.value !== undefined) {
        console.log(parseInt(e.target.commenttext.getAttribute('postnumber')));
        // Creating the comment object
        const commentData = {
            commentText: e.target.commenttext.value,
            commentUser: socket.id,
            commentPostNum: parseInt(e.target.commenttext.getAttribute('postnumber')),
            commentImg: e.target.commentplaceholder.src,
            postTopic: window.location.href.toString().split('/').at(-1)
        };

        // HTTP request options
        const options = {
            method: 'POST',
            body: JSON.stringify(commentData),
            headers: {
                "Content-Type": "application/json"
            }
        };
        
        // Reset everything to blank
        document.querySelector('#comment-form').reset();
        document.getElementById('commentplaceholder').style.display = 'none';
        document.getElementById('commentplaceholder').src = '//:0';

        // Send request to server API
        fetch(`${window.location.origin}/sendComment`, options)
    }
}

// changing colour of input top right
function changeSearchBackgroundColour() {
    searchSelector.style.background = "white";
}
// changing colour of input top right
function changeSearchBackgroundColourNormal() {
    searchSelector.style.background = "rgb(118, 118, 118)";
}

function updatePosts(postHTML) {
    document.querySelector('#postfeed').insertAdjacentHTML("afterbegin", postHTML);

    // Pressing comments svg - opens an option to comment and an option to see replies - and also shows close svg
    document.querySelector('.view-comments').addEventListener('click', (e) => {
        commentMode = true;
        const topic = window.location.href.toString().split('/').at(-1)
        const originPost = e.target.closest('.post');
        const postNumber = originPost.querySelector('#postnum').textContent;
        socket.emit('previousComments', [topic, parseInt(postNumber)]);
        document.querySelector('#commenttext').setAttribute('postnumber', postNumber);
        document.querySelector('#replies').style.display = 'block';
        document.querySelector('.post-reply').style.display = 'flex';
        document.querySelector('.tweet').style.display = 'none';
        
        // Hide all the posts
        document.querySelectorAll('.post').forEach(post => post.style.display = 'none');
        
        // Show the target post
        originPost.style.display = "flex";
        originPost.style.borderBottom = 'none';
        originPost.querySelector('.details').style.display = 'flex';
        originPost.querySelector('.view-comments').style.display = 'none';
        originPost.querySelector('.comments-count').style.display = 'none';
    })

    // Close comments button
    document.querySelector('.details').addEventListener('click', (e) => {
        commentMode = false;
        const originPost = e.target.closest('.post');
        document.querySelector('#replies').style.display = 'none';
        document.querySelector('#replies').innerHTML = '';
        document.querySelector('.post-reply').style.display = 'none';
        originPost.querySelector('.details').style.display = "none";
        document.querySelector('.tweet').style.display = 'flex'
        document.querySelectorAll('.post').forEach(post => {
            post.style.borderBottom = '1px solid var(--border-color)';
            post.style.display = 'flex';
        })
        originPost.querySelector('.view-comments').style.display = 'flex';
        originPost.querySelector('.comments-count').style.display = 'flex';
    })
}

// Update the comment HTML
function updateComments(commentHTML) {
    document.querySelector('#replies').insertAdjacentHTML("afterbegin", commentHTML);
}

// Emit a socket call for GIF data
function searchGifs(e) {
    e.preventDefault();
    socket.emit('getGifs', e.target.giftext.value);
}

// Add GIF to post before sending
function addGifPost(e) {
    document.getElementById('postplaceholder').src = e.target.src;
    document.getElementById('postplaceholder').style.display = 'flex';
}

// Add GIF to comment before sending
function addGifComment(e) {
    document.getElementById('commentplaceholder').src = e.target.src;
    document.getElementById('commentplaceholder').style.display = 'flex';
}

// Add Gifs from socket return
function populateGifs(gifHTML) {
    document.querySelector('#gif-container').innerHTML = "";
    document.querySelector('#gif-container').insertAdjacentHTML("afterbegin", gifHTML);
    document.querySelectorAll('.gifselection').forEach(gifSelect => gifSelect.addEventListener('click', (e) => {
        if (commentMode) {
            addGifComment(e);
        } else {
            addGifPost(e);
        }
    }));
}

// Event listener for sending a post
document.querySelector('#post-form').addEventListener('submit', sendPost);

// Event listener for sending a comment
document.querySelector('#comment-form').addEventListener('submit', sendComment);

searchSelector.addEventListener("mouseover", changeSearchBackgroundColour);
searchSelector.addEventListener("mouseout", changeSearchBackgroundColourNormal);

// Event listener for getting GIFs
document.querySelector('.gif-forum').addEventListener('submit', searchGifs);

// Opening GIF container
document.querySelectorAll('.gif-icon').forEach(gifIcon => {
    gifIcon.addEventListener('click', () => {
        document.querySelector('.bg-modal').style.display = 'flex';
    })
})

// Closing GIF button
document.querySelector('.close').addEventListener('click', () => {
    document.querySelector('#gif-container').innerHTML = "";
    document.querySelector('.bg-modal').style.display = 'none';
    document.querySelector('.gif-forum').reset();
})