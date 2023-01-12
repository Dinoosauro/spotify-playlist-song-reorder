if (window.location.href.indexOf("?artist") !== -1) {
    document.getElementById("title").innerHTML = "Spotify Discography Playlist";
    document.getElementById("desc").innerHTML = "Put all the songs of an artist into a playlist."
}
document.getElementById("button").onclick = function() {
    let goToUrl = "https://dinoosauro.github.io/spotify-playlist-song-reorder/next.html";
    if (window.location.href.indexOf("?artist") !== -1) goToUrl = goToUrl + "?useArtistSort";
    window.location = "https://accounts.spotify.com/authorize?client_id=943d75438c2648d89ad14e1c57e4cac3&redirect_uri=" + encodeURIComponent(goToUrl) + "&scope=playlist-modify-public%20user-library-read%20playlist-modify-private%20playlist-read-private&response_type=token";
}
