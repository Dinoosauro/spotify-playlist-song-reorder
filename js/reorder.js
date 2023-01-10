let token = window.location.href.substring(window.location.href.indexOf("access_token=")).replace("access_token=", "");
if (token.startsWith("http")) window.location = "https://accounts.spotify.com/authorize?client_id=943d75438c2648d89ad14e1c57e4cac3&redirect_uri=" + encodeURIComponent("https://dinoosauro.github.io/spotify-playlist-song-reorder/next.html") + "&scope=playlist-modify-public%20playlist-modify-private%20playlist-read-private&response_type=token";
let userLoggedId = "";
let askUserInfo = buildRequest("https://api.spotify.com/v1/me", false);
askUserInfo.onload = function() {
    if (this.status == 200) userLoggedId = JSON.parse(this.responseText).id; else alert("An error occourred. Please refresh the page and retry.");
}
askUserInfo.send();
history.pushState({}, null, window.location.href.substring(0, window.location.href.indexOf("/")) + "/spotify-playlist-song-reorder/next.html");
function buildRequest(link, usePost) {
    let xmlHttp = new XMLHttpRequest();
    if (!usePost) xmlHttp.open("GET", link); else xmlHttp.open("POST", link);
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("Accept", "application/json");
    xmlHttp.setRequestHeader("Authorization", "Bearer " + token);
    return xmlHttp;
}

let imageLinkCache = Array(1).fill("");
let currentSnapshotId = "";
let getPlaylistJson = "";
function startPlaylistBuild() {
    nextGet(0, "https://api.spotify.com/v1/me/playlists", true);
}
function createCell(textHtml) {
    let nameCell = document.createElement("td");
    nameCell.innerHTML = textHtml
    return nameCell;
}
let playlistChosenId = "";
function goBack() {
    window.location.replace(window.location.href.substring(0, window.location.href.indexOf("/")) + "/spotify-playlist-song-reorder/next.html?access_token=" + token);
}
function playlistAppend(json) {
    let jsonParsed = JSON.parse(json);
    let usablePlaylistId = 1;
    for (let i = 0; i < Object.keys(jsonParsed.items).length; i++) {
        if (jsonParsed.items[i].images[0] == undefined) continue;
        if (jsonParsed.items[i].collaborative == false && jsonParsed.items[i].owner.id != userLoggedId) continue;
        let tableRow = document.createElement("tr");
        let numberItem = document.createElement("th");
        numberItem.scope = "row";
        numberItem.innerHTML = usablePlaylistId;
        tableRow.appendChild(numberItem);
        tableRow.appendChild(createCell(jsonParsed.items[i].name));
        tableRow.appendChild(createCell(jsonParsed.items[i].owner.display_name));
        tableRow.appendChild(createCell(jsonParsed.items[i].public));
        imageLinkCache[i] = jsonParsed.items[i].images[0].url;
        usablePlaylistId++; 
        tableRow.onclick = function () {
            showPlaylistInfo(i, jsonParsed.items[i].name);
            currentSnapshotId = jsonParsed.items[i].snapshot_id;
            playlistChosenId = jsonParsed.items[i].id;
            nextGet(1, "https://api.spotify.com/v1/playlists/" + jsonParsed.items[i].id + "/tracks", true);

        }
        document.getElementById("tableBody").appendChild(tableRow);
    }
}
function showPlaylistInfo(lookid, playlistName) {
    document.getElementById("playlistSelectorDiv").style.opacity = 0;
    document.getElementById("playlistSelectorDiv").style.display = "none";
    document.getElementById("playlistImgDiv").style.display = "inline";
    document.getElementById("playlistImgDiv").style.opacity = 1;
    document.getElementById("playlistImg").src = imageLinkCache[lookid];
    document.getElementById("namePlaylist").innerHTML = playlistName;
}
let jsonPlaylist = "";
function nextGet(valueEdit, link, firstDownload) {
    let newLink = buildRequest(link, false);
    newLink.onload = function () {
        if (this.status == 200) {
            let tempJson = JSON.parse(newLink.responseText);
            if ((parseInt(document.getElementById("progressItem").value) + tempJson.limit) < tempJson.total) {
                document.getElementById("progressItem").value = parseInt(document.getElementById("progressItem").value) + tempJson.limit;
            }  else {
                document.getElementById("progressItem").value = tempJson.total;
            }
            document.getElementById("progressItem").max = tempJson.total;
            if (!firstDownload) {
                let newPlaylist = this.responseText.substring(this.responseText.indexOf("\"items\" : [ {")).replace("\"items\" : [ {", "");
                if (valueEdit == 1) {
                    jsonPlaylist = jsonPlaylist.substring(0, jsonPlaylist.lastIndexOf("]")) + ",";
                    jsonPlaylist = jsonPlaylist + "{" + newPlaylist;
                } else if (valueEdit == 0) {
                    getPlaylistJson = getPlaylistJson.substring(0, getPlaylistJson.lastIndexOf("]")) + ",";
                    getPlaylistJson = getPlaylistJson + "{" + newPlaylist;
                }
            } else {
                if (valueEdit == 1) jsonPlaylist = jsonPlaylist + this.responseText;
                if (valueEdit == 0) getPlaylistJson = getPlaylistJson + this.responseText;
            }
            let parseNewJson = JSON.parse(this.responseText);
            if (parseNewJson.next !== null) {
                setTimeout(function () {
                    nextGet(valueEdit, parseNewJson.next, false);
                }, 250)
            } else {
                if (valueEdit == 1) nextReorder();
                if (valueEdit == 0) playlistAppend(getPlaylistJson);
            }
        } else {
            console.error(newLink);
            alert("An error occourred. Please refresh the page and retry.");
        }
    }
    newLink.send();
}
let songName = Array(1).fill("");
let albumName = Array(1).fill("");
let datePublication = Array(1).fill("");
let dateAdded = Array(1).fill("");
let artistAdded = Array(1).fill("");
let trackId = Array(1).fill("");
let startLook = 0;
let interestingStuff;
let lookJson = true;
function nextReorder() {
    document.getElementById("alert").className = "alert alert-info";
    document.getElementById("alertInfo").innerHTML = "Ordering elements. This should take maxinum a few seconds.";
    let parseFinalJson = JSON.parse(jsonPlaylist);
    if (lookJson) interestingStuff = parseFinalJson.items;
    for (let i = startLook; i < Object.keys(interestingStuff).length; i++) {
        document.getElementById("progressItem").value = i;
        if (interestingStuff[i].track.artists[0].name !== null) artistAdded[i] = interestingStuff[i].track.artists[0].name + "\"" + i; else artistAdded[i] = "ZZZZZZZZZZ\"" + i;
        if (interestingStuff[i].added_at !== null) dateAdded[i] = interestingStuff[i].added_at + "\"" + i; else dateAdded[i] = "ZZZZZZZZZZ\"" + i;
        if (interestingStuff[i].track.album.release_date !== null) datePublication[i] = interestingStuff[i].track.album.release_date + "\"" + i; else datePublication[i] = "ZZZZZZZZZ\"" + i;
        if (interestingStuff[i].track.album.name !== null) albumName[i] = interestingStuff[i].track.album.name + "\"" + i; else albumName[i] = "ZZZZZZZZZZZ\"" + i;
        if (interestingStuff[i].track.name !== null) songName[i] = interestingStuff[i].track.name + "\"" + i; else songName[i] = "ZZZZZZZZZ\"" + i;
        if (interestingStuff[i].track.uri !== null) trackId[i] = interestingStuff[i].track.uri + "\"" + i; else trackId[i] = "ZZZZZZZZZ\"" + i;
        // Put everything to lowercase
        artistAdded[i] = artistAdded[i].toLowerCase();
        dateAdded[i] = dateAdded[i].toLowerCase();
        datePublication[i] = datePublication[i].toLowerCase();
        albumName[i] = albumName[i].toLowerCase();
        songName[i] = songName[i].toLowerCase();
    }
    if (selectedId != -1) chooseReorder(selectedId);
    if (lookJson) document.getElementById("alertInfo").innerHTML = "You can now choose the ordering criteria.";
}
let selectedId = -1;
function chooseReorder(chooseId) {
    document.getElementById("disableButton").className = "btn btn-secondary dropdown-toggle disabled";
    selectedId = chooseId;
    document.getElementById("closeThis").className = "dropdown-menu";
    switch (chooseId) {
        case 0:
            adaptOtherContent(songName.sort());
            break;
        case 1:
            adaptOtherContent(artistAdded.sort());
            break;
        case 2:
            adaptOtherContent(dateAdded.sort());
            break;
        case 3:
            adaptOtherContent(albumName.sort());
            break;
        case 4:
            adaptOtherContent(datePublication.sort());
            break;
    }
}
let reorderTrack = Array(1).fill("");
let firstPositionItem = Array(1).fill("");
let displayOption = "none";
function adaptOtherContent(originString) {
    for (let i = 0; i < originString.length; i++) {
        let lookIntoId = originString[i].substring(originString[i].lastIndexOf("\"") + 1);
        firstPositionItem[i] = lookIntoId;
        reorderTrack[i] = trackId[lookIntoId];
    }
    if (displayOption == "none") moveElements(); else createNewPlaylist();
}
// Create new playlist part.
function createNewPlaylist() {
    let createCall = buildRequest("https://api.spotify.com/v1/users/" + userLoggedId + "/playlists", true);
    createCall.onload = function() {
        if (this.status == 200 || this.status == 201) addItems(JSON.parse(this.responseText).id); else alert("An error occourred when creating the playlist (" + this.status + ")");
    }
    createCall.send("{\"name\": \"" + (document.getElementById("playlistName").value).replaceAll("\"", "\\\"") + "\", \"description\": \"Reordered with spotify-playlist-song-reorder\", \"public\": false}");
}
let currentCall = 0;
let maxCall = 80;
function addItems(playlistId) {
    console.log(playlistId);
    let uriId = "";
    document.getElementById("progressItem").value = currentCall;
    if (maxCall > reorderTrack.length) maxCall = reorderTrack.length;
    for (let i = currentCall; i < maxCall; i++) {
        if (reorderTrack[i].indexOf("spotify:local") !== -1) continue;
        uriId = uriId + "," + reorderTrack[i].substring(0, reorderTrack[i].indexOf("\""));
    }
    uriId = uriId.substring(1);
    let createPost = buildRequest("https://api.spotify.com/v1/playlists/" + playlistId + "/tracks?uris=" + encodeURIComponent(uriId), true);
    createPost.onload = function() {
        if (this.status == 200 || this.status == 201) {
            currentCall = maxCall;
            maxCall += 80;
            setTimeout(function() {
                addItems(playlistId);
            }, 500)        
        } else if (this.status == 429) {
            document.getElementById("alertInfo").innerHTML = "Spotify has applied a rate limit. A new attempt will be executed in 10 seconds. ["+ maxCall + "]";
            setTimeout(function () {
                addItems(playlistId);
            }, 10000)
        } 
        else if (maxCall >= reorderTrack.length) {
            document.getElementById("alert").className = "alert alert-success";
            document.getElementById("alertInfo").innerHTML = "Ordering completed :D";
        } else {
            console.error(createPost);
            document.getElementById("alertInfo").innerHTML = "An unexpected error occourred. A new attempt will be executed in 10 seconds. [" + maxCall + "]";
            setTimeout(function () {
                addItems(playlistId);
            }, 10000);
        }
    }
    createPost.send();
}
function newPlaylistOptionShow(state) {
    if (state) displayOption = "inline"; else displayOption = "none";
    document.getElementById("newPlaylistDiv").style.display = displayOption;
    let notSelect = "border-radius: 25px; color: white";
    let select = "border-radius: 25px;";
    if (state) document.getElementById("currentOrderSwitch").style = notSelect; else document.getElementById("currentOrderSwitch").style = select;
    if (state) document.getElementById("newOrderSwitch").style = select; else document.getElementById("newOrderSwitch").style = notSelect;

}
let positionItem = 0;
// Reroder current playlist part:
function rearrangeItems() {
    let x = interestingStuff.splice(firstPositionItem[positionItem], 1);
    interestingStuff.splice(positionItem, 0, x[0]);
    lookJson = false;
    positionItem++;
    nextReorder();
}
let newSnapshotId = "";
function moveElements() {
    document.getElementById("progressItem").value = positionItem;
    document.getElementById("alertInfo").innerHTML = "Ordering playlist... [" + positionItem + "]";
    let putHttp = new XMLHttpRequest();
    putHttp.open("PUT", "https://api.spotify.com/v1/playlists/" + playlistChosenId + "/tracks");
    putHttp.setRequestHeader("Content-Type", "application/json");
    putHttp.setRequestHeader("Accept", "application/json");
    putHttp.setRequestHeader("Authorization", "Bearer " + token);
    putHttp.onload = function () {
        if (this.status == 200 && positionItem < reorderTrack.length) {
            setTimeout(function () {
                newSnapshotId = JSON.parse(putHttp.responseText).snapshot_id;
                rearrangeItems();
            }, 500);
        } else if (this.status == 429) {
            document.getElementById("alertInfo").innerHTML = "Spotify has applied a rate limit. A new attempt will be executed in 10 seconds. [" + positionItem + "]";
            setTimeout(function () {
                positionItem--;
                moveElements();
            }, 10000)
        }
        else if (positionItem >= reorderTrack.length) {
            document.getElementById("alert").className = "alert alert-success";
            document.getElementById("alertInfo").innerHTML = "Ordering completed :D";
        } else {
            console.error(putHttp);
            document.getElementById("alertInfo").innerHTML = "An unexpected error occourred. A new attempt will be executed in 10 seconds. [" + positionItem + "]";
            setTimeout(function () {
                moveElements();
            }, 10000);
        }
    }
    let prepareString = "{\"range_start\": " + firstPositionItem[positionItem] + ",\"insert_before\": " + (positionItem) + ",\"range_length\": 1}";
        putHttp.send(prepareString);
}
startPlaylistBuild();