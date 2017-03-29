'use strict';

var completeListName = "Handsome Complete";
var knowIssuesListName = "Known Issues";
var dateSince = new Date();
dateSince.setDate(dateSince.getDate() - 14);

var defectsLablesNameArray = ["Defect S0: Critical/Blocker", "Defect S1: Major", "Defect S2: Average", "Defect S3: Trivial/Minor"];

var xhr = new XMLHttpRequest();

console.log('\'Allo \'Allo! Popup');

chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
    var currentUrl = tabs[0].url;
    console.log("URL = " + currentUrl);
    var indexOfLastSlash = 0;

    if (currentUrl.indexOf("https://trello.com") === 0) {
        var pos = 0;
        while (true) {
            var foundPos = currentUrl.indexOf("\/", pos);
            if (foundPos === -1 || foundPos === (currentUrl.length - 1)) break;

            console.log(foundPos);
            indexOfLastSlash = foundPos;
            pos = foundPos + 1;
        }

        var jsonUrl = currentUrl.substring(0, indexOfLastSlash) + ".json";
        console.log("jsonUrl url = " + jsonUrl);

        xhr.open('GET', jsonUrl, false);

        xhr.send(); //TODO: move out of main thread

        if (xhr.status != 200) {
            console.log("error while request json file. please check that you are on trello board page.")
        } else {
            var response = JSON.parse(xhr.responseText, function (key, value) {
                if (key === 'date') {
                    return new Date(value);
                } else {
                    return value;
                }
            });
            console.log(response);

            var actions = response.actions;

            console.log(actions);

            var lastestActionMovedToList = actions.filter(function (item) {
                if (item.type === "updateCard") {
                    if (item.data.listAfter !== undefined) {
                        if (item.date > dateSince && item.data.listAfter.name === completeListName) {
                            return true;
                        }
                    }
                }
                return false;
            });

            console.log("Latest actions:");
            console.log(lastestActionMovedToList);

            var outputString = "What's new:\n\n";
            var linkToTrelloCardDir = "https://trello.com/c/";

            console.log(lastestActionMovedToList.isArray);

            lastestActionMovedToList.forEach(function (item) {
                console.log(item.data.card.name);
                outputString = outputString.concat(" - ", item.data.card.name, " - ");
                outputString = outputString.concat(linkToTrelloCardDir, item.data.card.shortLink);
                outputString = outputString.concat("\n");
            });

            outputString = outputString.concat("\n\n");

            var lists = response.lists;
            var knowIssuesListId;

            for (var i = 0, isIdFound = false; i < lists.length && !isIdFound; ++i) {
                if (lists[i].name === knowIssuesListName) {
                    knowIssuesListId = lists[i].id;
                    isIdFound = true;
                }
            }

            if (knowIssuesListId !== undefined) {
                var cards = response.cards;

                outputString = outputString.concat("Known issues:\n");

                defectsLablesNameArray.forEach(function (defectLabelItem) { //TODO: refactor to use label ID
                    outputString = outputString.concat("\n", defectLabelItem, "\n");
                    var isAtLeastOneCardFound = false;
                    var defectCardArray = cards.filter(function (cardItem) {
                        if (cardItem.idList !== knowIssuesListId) {
                            return
                        }
                        var isLabelFound = false;
                        cardItem.labels.forEach(function (labelItem) {
                            if (labelItem.name === defectLabelItem) {
                                isLabelFound = true;
                            }
                        });
                        if (isLabelFound) {
                            outputString = outputString.concat(" - ", cardItem.name, " - ");
                            outputString = outputString.concat(cardItem.shortUrl);
                            outputString = outputString.concat("\n");
                            isAtLeastOneCardFound = true;
                        }
                        return isLabelFound;
                    });
                    if (!isAtLeastOneCardFound) {
                        outputString = outputString.concat(" - none \n");
                    }
                    console.log(defectLabelItem);
                    console.log(defectCardArray);
                });
            } else {
                outputString = outputString.concat("known issue list was not found. check specified list name.");
            }

            chrome.runtime.sendMessage({
                type: 'copy',
                text: outputString
            })

        }

    } else {
        console.log("not trello page");
    }

});

