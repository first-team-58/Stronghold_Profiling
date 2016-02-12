/*****************************
    Datbase Initialization
*****************************/

var db;

function loadDB() {
    db = new PouchDB('scouting');
    return db;
}

/*************************
    TEST DATA FUNCTIONS
*************************/

function generateTestData(dbName) {
    /* dbName: a String object, the name of the PouchDB store to which you wish to connect. */

    /* PURPOSE: Populate a database with test data. */

    var db = new PouchDB(dbName);

    TBA.event.get('2015melew', function(event) {
        saveEventMatchesToDatabase(event, db);
    });
}

function saveYearMatchesToDatabase(year, db) {
    /* year: a String object referring to a specific year, e.g. `'2015'`. */
    /* db: a reference to the PouchDB database. */

    /* Purpose: Given a year, iterate over every event in that year and save the matches and team lists from each event into the database. */
    /* NOTE: This function can take several minutes to run, due to the large volume of data. */

    TBA.event.list(year,
        function(eventObjectList) {
            for (i = 0; i < eventObjectList.length; i++) {
                saveEventMatchesToDatabase(eventObjectList[i], db);
            }
        }
    );
}

function saveEventMatchesToDatabase(event, db) {
    /* event: An event object from The Blue Alliance API. */
    /* db: a reference ot the PouchDB database. */

    /* Purpose: Given an event, extract the list of matches and teams, and save them to the database. */
    TBA.event.matches(event.key, function(matches_list) {
        var i = 0;
        for (i = 0; i < matches_list.length; i++) {
            var match = new Object();
            var docrec = new Object();

            match._id = 'matches/' + matches_list[i].key;
            match.redTeam = matches_list[i].alliances.red.teams;
            match.blueTeam = matches_list[i].alliances.blue.teams;

            /* If the doc already exists, we need to add the _rev to update the existing doc. */
            db.get(match._id).then(function(doc) {
                match._rev = doc._rev;
                docrec = doc;
            }).catch(function(err) {
                if ( err.status != 404 ) {
                    /* Ignore 404 errors: we expect them, if the doc is new. */
                    console.log(err);
                }
            });

            db.put(match).then(function() {
                // Success!
            }).catch(function(err) {
                console.log('\ndoc._rev: ' + docrec._rev);
                console.log('match._rev: ' + match._rev);
                console.log(err);
            });
        }
    });
}



function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

function save(formData) {
    db.put(formData);
    db.get('001').then(function(result) {
        var info = result.stringify;
        console.log(info);
    }).catch(function(err) {
        console.log(err);
    });
}

function appendData(dataset, name, value) {
    dataset[name] = value;
}

function scanForData(elementType, dataset) {
    $(elementType).each(function() {
        var name = $(this).attr("name");
        var value = $(this).val();
        appendData(dataset, name, value);
    });
}

function cleanData() {
    var dataset;

    dataset["_id"] = guid();

    dataset["teamNum"] = getParameterByName('teamNum');
    dataset["matchNum"] = getParameterByName('matchnum');

    var types = ["input", "select", "textarea"];

    for (i = 0; i < types.length; i++) {
        scanForData(types[i], dataset);
    }

    return dataset;
}

function saveMatchForm() {
    var formData = cleanData();
    save(formData);
}

function loadQR() {
    db.allDocs({
        include_docs: true,
        attachments: true
    }).then(function(result) {
        var info = result.stringify;
        console.log(info);
        $(document).ready(function() {
            $('#qrdiv').qrcode({
                width: 120,
                height: 120,
                text: info
            });
        });
    }).catch(function(err) {
        console.log(err);
    });

}



function pickRobots() {

    function addRobotsToAllianceList(alliance, divid, match) {
        var i;
        for (i = 0; i < alliance.length; i++) {
            $('#' + divid).append('<a href="matchform.html?matchnum=' + match + '&teamNum=' + alliance[i] + '" class="btn btn-large">' + alliance[i] + '</a>');
        }
    }


    //var match = getParameterByName("matchnum");


    // for when we get the pouchdb.find functionality working
    /*
    var matchData = {
        "-id": 001,
        "match": "1",
        "redAlliance": ["58", "127", "133"],
        "blueAlliance": ["125", "166", "3609"]
    };

    db.put(matchData);

    db.find({
        selector: {
            "match": 'match',
            fields: ['redAlliance', 'blueAlliance']
        }
    }).then(function(result) {
        var allianceList = result.docs[0];

        var redList = allianceList.redAlliance;
        var blueList = allianceList.blueAlliance;

        addRobotsToAllianceList(redList, "redAlliance", match);
        addRobotsToAllianceList(blueList, "blueAlliance", match);

        $("#blueAlliance").children(".btn").each().addClass("btn-primary");
        $("#redAlliance").children(".btn").each().addClass("btn-danger");
    }).catch(function(err) {
        $("#error").append('<p>' + err.toString() + '</p>');
    });
    */

    // for testing
    var match = "001";
    var text = '{"docs":[{"redAlliance":["58","127","133"], "blueAlliance":["215","166","3609"] } ]}';
    var result = JSON.parse(text);

    var allianceList = result.docs[0];

    var redList = allianceList.redAlliance;
    var blueList = allianceList.blueAlliance;

    console.log(redList.toString());
    console.log(blueList.toString());

    addRobotsToAllianceList(redList, "redAlliance", match);
    addRobotsToAllianceList(blueList, "blueAlliance", match);

    $("#blueAlliance").find("a").each(function() {
        $(this).addClass("btn-primary")
    });
    $("#redAlliance").find("a").each(function() {
        $(this).addClass("btn-danger")
    });
}

function addAlliance(allianceColor) {
    $('#' + allianceColor + 'Alliance').find('h3').text(allianceColor + ' Alliance');
}

function preMatch() {
    function addBotLists(color, listOfBots) {

        for (var j = 1; j < 4; j++) {

            $('#' + color + 'Alliance').find('form').append('<select name=' + color + 'bot' + j.toString() + ' ><option value=null>  </option></select>');

        }

        console.log(listOfBots.length);

        for (var i = 0; i < listOfBots.length; i++) {
            $('#' + color + 'Alliance').find('select').each(function() {
                $(this).append('<option value="' + listOfBots[i] + '">' + listOfBots[i] + '</option>');
            });
        }

    }

    var listOfBots = ["58", "127", "133", "125", "3906", "3467"];

    addAlliance('red');
    addAlliance('blue');

    addBotLists('red', listOfBots);
    addBotLists('blue', listOfBots);

}

function scores() {
    function addFormElements(color) {

        var targetForm = $('#' + color + 'Alliance').find('form');

        targetForm.append('<label class="control-label col-sm-2">Score</label>');
        targetForm.append('<input type="range" name="' + color + 'points" value="0" min="0" max="400" data-show-value="true" data-highlight="true"><br>');
        targetForm.append('<div class="checkbox"><label><input type="checkbox" name="' + color + 'Breach">Breach</label></div>');
        targetForm.append('<div class="checkbox"><label><input type="checkbox" name="' + color + 'Capture">Capture</label></div>');

    }


    addAlliance('red');
    addAlliance('blue');

    addFormElements('red');
    addFormElements('blue');

}
