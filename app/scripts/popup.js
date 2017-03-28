'use strict';

var listName = "Blocked";
var dateSince = new Date();
dateSince.setDate(dateSince.getDate() - 14);

var defectsLablelsNameArray = ["S0", "S1", "S2", "S3"];

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
                        if (item.date > dateSince && item.data.listAfter.name === "Blocked") {
                            return true;
                        }
                    }
                }
                return false;
            });

            console.log(lastestActionMovedToList);

            var cards = response.cards;

            defectsLablelsNameArray.forEach(function (defectLabelItem) { //TODO: refactor to use label ID
                var defectCardArray = cards.filter(function (cardItem) {
                    var isLabelFound = false;
                    cardItem.labels.forEach(function (labelItem) {
                        if (labelItem.name === defectLabelItem) {
                            isLabelFound = true;
                        }
                    });
                    return isLabelFound;
                });
                console.log(defectLabelItem);
                console.log(defectCardArray);
            })
        }

    } else {
        console.log("not trello page");
    }

});

