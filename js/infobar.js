document.getElementById("imgIcon").addEventListener("mouseover", function() {
    document.getElementById("imgTool").style.opacity = 1;
    document.getElementById("imgTool").style.visibility = "visible";
});
document.getElementById("privacyImg").addEventListener("mouseover", function() {
    document.getElementById("privacyTool").style.opacity = 1;
    document.getElementById("privacyTool").style.visibility = "visible";
});
document.getElementById("gitImg").addEventListener("mouseover", function() {
    document.getElementById("gitTool").style.opacity = 1;
    document.getElementById("gitTool").style.visibility = "visible";
});
document.getElementById("imgIcon").addEventListener("mouseleave", function() {
    document.getElementById("imgTool").style.opacity = 0;
    setTimeout(function() {
        document.getElementById("imgTool").style.visibility = "collapse";
    }, 450);
});
document.getElementById("privacyImg").addEventListener("mouseleave", function() {
    document.getElementById("privacyTool").style.opacity = 0;
    setTimeout(function() {
        document.getElementById("privacyTool").style.visibility = "collapse";
    }, 450);
});
document.getElementById("gitImg").addEventListener("mouseleave", function() {
    document.getElementById("gitTool").style.opacity = 0;
    setTimeout(function() {
        document.getElementById("gitTool").style.visibility = "collapse";
    }, 450);
});
document.getElementById("gitImg").onclick = function() {
    window.open("https://github.com/Dinoosauro/spotify-playlist-song-reorder");
}
document.getElementById("imgIcon").onclick = function() {
    window.open("https://unsplash.com/@imtiiiyaazz");
}
