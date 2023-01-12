let token = window.location.href.substring(window.location.href.indexOf("access_token=")).replace("access_token=", "");
if (token.startsWith("http")) window.location = "https://accounts.spotify.com/authorize?client_id=943d75438c2648d89ad14e1c57e4cac3&redirect_uri=" + encodeURIComponent("https://dinoosauro.github.io/spotify-playlist-song-reorder/next.html") + "&scope=playlist-modify-public%20playlist-modify-private%20playlist-read-private&response_type=token";
let userLoggedId = "";
let currentCountry = "US"; 
let askUserInfo = buildRequest("https://api.spotify.com/v1/me", false);
let showArtistSelection = false;
if (window.location.href.indexOf("?useArtistSort") !== -1) showArtistSelection = true;
askUserInfo.onload = function() {
    if (this.status == 200) {
        let parseUserInfo = JSON.parse(this.responseText);
        userLoggedId = parseUserInfo.id; 
        currentCountry = parseUserInfo.country; 
    } else {
        alert("An error occourred. Please refresh the page and retry.");
    }
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
let useLikeFunction = false;
function likeFetch() {
    useLikeFunction = true;
    showPlaylistInfo(0, "Liked Songs", window.location.href.substring(0, window.location.href.indexOf("/")) + "/spotify-playlist-song-reorder/assets/like.jpeg");
    newPlaylistOptionShow(true, true, 'currentOrderSwitch', 'newOrderSwitch');
    document.getElementById("newPlaylistSwitch").style.display = "none";
    nextGet(1, "https://api.spotify.com/v1/me/tracks", true);
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
let artistFetch = "";
let playlistChosenId = "";
function goBack() {
    window.location.replace(window.location.href.substring(0, window.location.href.indexOf("/")) + "/spotify-playlist-song-reorder/next.html?access_token=" + token);
}
function createNumberCell(usablePlaylistId) {
    let numberItem = document.createElement("th");
    numberItem.scope = "row";
    numberItem.innerHTML = usablePlaylistId;
    return numberItem;
}
function playlistAppend(json) {
    let jsonParsed = JSON.parse(json);
    let usablePlaylistId = 1;
    for (let i = 0; i < Object.keys(jsonParsed.items).length; i++) {
        if (jsonParsed.items[i].images[0] == undefined) continue;
        if (jsonParsed.items[i].collaborative == false && jsonParsed.items[i].owner.id != userLoggedId) continue;
        let tableRow = document.createElement("tr");
        tableRow.appendChild(createNumberCell(usablePlaylistId));
        tableRow.appendChild(createCell(jsonParsed.items[i].name));
        tableRow.appendChild(createCell(jsonParsed.items[i].owner.display_name));
        tableRow.appendChild(createCell(jsonParsed.items[i].public));
        imageLinkCache[i] = jsonParsed.items[i].images[0].url;
        usablePlaylistId++; 
        tableRow.onclick = function () {
            useLikeFunction = false;
            showPlaylistInfo(i, jsonParsed.items[i].name);
            currentSnapshotId = jsonParsed.items[i].snapshot_id;
            playlistChosenId = jsonParsed.items[i].id;
            nextGet(1, "https://api.spotify.com/v1/playlists/" + jsonParsed.items[i].id + "/tracks", true);

        }
        document.getElementById("tableBody").appendChild(tableRow);
    }
}
function showPlaylistInfo(lookid, playlistName, customImg) {
    document.getElementById("playlistSelectorDiv").style.opacity = 0;
    document.getElementById("playlistSelectorDiv").style.display = "none";
    document.getElementById("playlistImgDiv").style.display = "inline";
    document.getElementById("playlistImgDiv").style.opacity = 1;
    if (customImg == "") document.getElementById("playlistImg").src = imageLinkCache[lookid]; else document.getElementById("playlistImg").src = customImg;
    document.getElementById("namePlaylist").innerHTML = playlistName;
}
let jsonPlaylist = "";
function nextGet(valueEdit, link, firstDownload) {
    if (valueEdit == 1) document.getElementById("disableButton").className = "btn btn-secondary dropdown-toggle disabled";
    let newLink = buildRequest(link, false);
    newLink.onload = function () {
        if (this.status == 200 || this.status == 201) {
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
                } else if (valueEdit == 2) {
                    artistFetch = artistFetch.substring(0, artistFetch.lastIndexOf("]")) + ",";
                    artistFetch = artistFetch + "{" + newPlaylist;
                }
            } else {
                if (valueEdit == 1) jsonPlaylist = jsonPlaylist + this.responseText;
                if (valueEdit == 0) getPlaylistJson = getPlaylistJson + this.responseText;
                if (valueEdit == 2) artistFetch = artistFetch + this.responseText;
            }
            let parseNewJson = JSON.parse(this.responseText);
            if (parseNewJson.next !== null) {
                setTimeout(function () {
                    nextGet(valueEdit, parseNewJson.next, false);
                }, 250)
            } else {
                if (valueEdit == 1) document.getElementById("disableButton").className = "btn btn-secondary dropdown-toggle";
                if (valueEdit == 1) nextReorder();
                if (valueEdit == 0) playlistAppend(getPlaylistJson);
                if (valueEdit == 2) artistAlbumFetch();
            }
        } else if (this.status == 429 || this.status == 503) {
            if (valueEdit == 1 || valueEdit == 2) document.getElementById("alertInfo").innerHTML = "Spotify has applied a rate limit. A new attempt will be executed in 10 seconds."; else alert("Spotify has applied a rate limit. A new attempt will be executed in 10 seconds");
            setTimeout(function() {
                nextGet(valueEdit, link, firstDownload);
            }, 10000);
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
        if (document.getElementById("singleTrack").checked) deleteDuplicates();
        if (this.status == 200 || this.status == 201) addItems(JSON.parse(this.responseText).id); else alert("An error occourred when creating the playlist (" + this.status + ")");
    }
    createCall.send("{\"name\": \"" + (document.getElementById("playlistName").value).replaceAll("\"", "\\\"") + "\", \"description\": \"Reordered with spotify-playlist-song-reorder\", \"public\": false}");
}
function deleteDuplicates() {
    // I won't use Set since the item should be deleted from an array only if the corresponding item is found on the other.
    for (let i = 0; i < songName.length; i++) {
        for (let x = i+1; x < songName.length; x++) {
            if (songName[i].substring(0, songName[i].indexOf("\"")) == songName[x].substring(0, songName[x].indexOf("\""))) {
                reorderTrack.splice(i, 1);
            }
        }
    }
}
let currentCall = 0;
let maxCall = 80;
function addItems(playlistId) {
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
        } else if (maxCall >= reorderTrack.length) {
            document.getElementById("alert").className = "alert alert-success";
            document.getElementById("alertInfo").innerHTML = "Ordering completed :D";
        } else if (this.status == 429 || this.status == 503) {
            document.getElementById("alertInfo").innerHTML = "Spotify has applied a rate limit. A new attempt will be executed in 10 seconds. ["+ maxCall + "]";
            setTimeout(function () {
                addItems(playlistId);
            }, 10000)
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
function newPlaylistOptionShow(state, playlistConvertStatus, leftSwitch, rightSwitch) {
    if (state && playlistConvertStatus) displayOption = "inline"; else if (playlistConvertStatus) displayOption = "none";
    if (playlistConvertStatus) document.getElementById("newPlaylistDiv").style.display = displayOption;
    let applyArray = ["Playlist name", "Owner", "Public"];
    let instructionHeader = "Choose a playlist from the following table";
    if (!playlistConvertStatus && state) {
        applyArray = ["Image", "Name", "Genre"];
        instructionHeader = "Write the name of the artist. You'll see the search results in the following table.";
        document.getElementById("searchArtist").style.display = "inline";
        document.getElementById("tableBody").innerHTML = "";
    } else if (!playlistConvertStatus && !state) {
        document.getElementById("searchArtist").style.display = "none";
        document.getElementById("tableBody").innerHTML = "";
        startPlaylistBuild();
    } 
    if (!playlistConvertStatus) {
        document.getElementById("firstHeader").innerHTML = applyArray[0];
        document.getElementById("secondHeader").innerHTML = applyArray[1];
        document.getElementById("thirdHeader").innerHTML = applyArray[2];
        document.getElementById("IstructionHeader").innerHTML = instructionHeader;
    } 
    let notSelect = "border-radius: 25px; color: white";
    let select = "border-radius: 25px;";
    if (state) {
        document.getElementById(leftSwitch).style = notSelect; 
        document.getElementById(rightSwitch).style = select + "; float: right";
        document.getElementById(leftSwitch).className = "btn w-50 leftSwitch";
        document.getElementById(rightSwitch).className = "btn w-50 btn-primary rightSwitch"
    } else {
        document.getElementById(leftSwitch).style = select;
        document.getElementById(rightSwitch).style = notSelect + "; float: right";
        document.getElementById(rightSwitch).className = "btn w-50 rightSwitch";
        document.getElementById(leftSwitch).className = "btn w-50 btn-primary leftSwitch"
}

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
        } else if (positionItem >= reorderTrack.length) {
            document.getElementById("alert").className = "alert alert-success";
            document.getElementById("alertInfo").innerHTML = "Ordering completed :D";
        } else if (this.status == 429 || this.status == 503) {
            document.getElementById("alertInfo").innerHTML = "Spotify has applied a rate limit. A new attempt will be executed in 10 seconds. [" + positionItem + "]";
            setTimeout(function () {
                positionItem--;
                moveElements();
            }, 10000)
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
// Artist discography part
// move this value over when creating the UI
let artistSpotiId = "0jdNdfi4vAuVi7a6cPDFBM";
let firstAlbum = false;
let keepProgression = 0;
function makeButtonAvailable() {
    document.getElementById("disableButton").className = "btn btn-secondary dropdown-toggle";
    document.getElementById("alert").className = "alert alert-info";
    document.getElementById("alertInfo").innerHTML = "Choose the order of the new elements in a playlist.";
}
// TODO: create the UI for this and test it. Also, let the user put the Spotify artist ID. 
let parseArtist;
let requestProgress = 0;
function artistAlbumFetch() {
    parseArtist = JSON.parse(artistFetch);
    document.getElementById("progressItem").max = Object.keys(parseArtist.items).length;
    fetchAlbumData("https://api.spotify.com/v1/albums/" + parseArtist.items[requestProgress].id + "/tracks", artistSpotiId, parseArtist.items[requestProgress].release_date, parseArtist.items[requestProgress].name);
}
function fetchAlbumData(link, artistId, releaseDate, nameAlbum) {
    let startRequest = buildRequest(link);
    startRequest.onload = function() {
        if (this.status == 200 || this.status == 201) {
            let parseRequest = JSON.parse(this.responseText);
            for (let i = 0; i < Object.keys(parseRequest.items).length; i++) {
                let shouldSkip = true;
                for (let x = 0; x < Object.keys(parseRequest.items[i].artists).length; x++) {
                    if (parseRequest.items[i].artists[x].id == artistId) shouldSkip = false;
                }
                if (shouldSkip) continue;
                if (parseRequest.items[i].artists[0].name !== null) artistAdded[keepProgression] = parseRequest.items[i].artists[0].name + "\"" + keepProgression; else artistAdded[keepProgression] = "ZZZZZZZZZZ\"" + keepProgression;
                datePublication[keepProgression] = releaseDate;
                albumName[keepProgression] = nameAlbum;
                if (parseRequest.items[i].name !== null) songName[keepProgression] = parseRequest.items[i].name + "\"" + keepProgression; else songName[keepProgression] = "ZZZZZZZZZ\"" + keepProgression;
                trackId[keepProgression] = parseRequest.items[i].uri + "\"" + keepProgression;
                artistAdded[keepProgression] = artistAdded[keepProgression].toLowerCase();
                datePublication[keepProgression] = datePublication[keepProgression].toLowerCase();
                albumName[keepProgression] = albumName[keepProgression].toLowerCase();
                songName[keepProgression] = songName[keepProgression].toLowerCase();
                keepProgression++;
            }
            requestProgress++;
            if (parseRequest.next !== null) {
                fetchAlbumData(parseRequest.next, artistId, releaseDate, nameAlbum);
                return;
            } 
            document.getElementById("progressItem").value = requestProgress;
            document.getElementById("alertInfo").innerHTML = "Fetching playlists items. Please wait. [" + requestProgress + "]";
            setTimeout(function() {
                if (requestProgress < Object.keys(parseArtist.items).length) fetchAlbumData("https://api.spotify.com/v1/albums/" + parseArtist.items[requestProgress].id + "/tracks", artistSpotiId, parseArtist.items[requestProgress].release_date, parseArtist.items[requestProgress].name); else makeButtonAvailable();
            }, 350);
        } else if (this.status == 429 || this.status == 503) {
            document.getElementById("alertInfo").innerHTML = "Spotify has applied a rate limit. A new attempt will be executed in 10 seconds. [" + requestProgress + "]";
            setTimeout(function() {
                fetchAlbumData(link, artistId, releaseDate, nameAlbum);
            }, 10000)
        } else {
            console.error(startRequest);
            document.getElementById("alertInfo").innerHTML = "An unexpected error occourred. Check the console for more info. [" + this.status + "]";
        }
    }
    startRequest.send();
}
function searchArtist() {
    let searchValue = document.getElementById("searchArtist").value;
    setTimeout(function() {
        if (searchValue == document.getElementById("searchArtist").value) {
            document.getElementById("tableBody").innerHTML = "";
            startSearch(searchValue);
        }
    },500);
}
function startSearch(input) {
    let searchRequest = buildRequest("https://api.spotify.com/v1/search?q=" + input + "&type=artist", false);
    searchRequest.onload = function() {
        if (this.status == 200 || this.status == 201) {
            let parseElement = JSON.parse(this.responseText);
            for (let i = 0; i < Object.keys(parseElement.artists.items).length; i++) {
                try {
                let tableRow = document.createElement("tr");
                let artistImg = document.createElement("img");
                artistImg.style.height = "50px";
                artistImg.style.width = "50px";
                artistImg.src = parseElement.artists.items[i].images[0].url;
                tableRow.appendChild(createNumberCell(i));
                tableRow.appendChild(createCell(artistImg.outerHTML));
                tableRow.appendChild(createCell(parseElement.artists.items[i].name));
                tableRow.appendChild(createCell(parseElement.artists.items[i].genres[0]));
                tableRow.onclick = function() {
                    artistSpotiId = parseElement.artists.items[i].id;
                    useLikeFunction = true;
                    newPlaylistOptionShow(true, true, 'currentOrderSwitch', 'newOrderSwitch');
                    showPlaylistInfo(i, parseElement.artists.items[i].name, parseElement.artists.items[i].images[0].url);  
                    document.getElementById("newPlaylistSwitch").style.display = "none";   
                    document.getElementById("hideIfNotArtistSearch").style.visibility = "visible";  
                    nextGet(2, "https://api.spotify.com/v1/artists/" + artistSpotiId + "/albums?market=IT", true);
                }
                document.getElementById("tableBody").appendChild(tableRow);
            } catch (ex) {
                console.error(ex);
            }
            }
        } else if (this.status == 429 || this.status == 201) {
            alert("Spotify has applied a rate limit. A new attempt will be executed in 10 seconds");
            setTimeout(function() {
                searchArtist();
            }, 10000);
        }
         else {
            alert("An unexpected error occourred. Please try again in a few seconds. [" + this.status + "]");
            console.error(searchRequest);
        }
    }
    searchRequest.send();
}
if (!showArtistSelection) startPlaylistBuild(); else newPlaylistOptionShow(true, false, 'createPlaylistSwitch', 'createArtistSwitch');