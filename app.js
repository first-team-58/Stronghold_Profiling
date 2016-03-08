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

    TBA.event.get('2015melew', function (event) {
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
    /* name: string representing parameter in query string desired */
    /* url: url object to parse for query string */
    
    /* purpose: return string value from query string based on name parameter */
    
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function guid() {
    /* purpose: create a uuid for each database id */
    
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

function save(formData) {
    /* formData: JSON object to put in pouchDB */
    /* purpose: saves JSON object in pouchDB, and logs JSON object to console */
    
    db.put(formData);
    
/*    db.createIndex({
        index: {fields:['formType']}
    }).then(function () {
        return db.find({
            selector: {formType: {$eq:'match'}}
        });
    }).then(function(result) {
        console.log(result);
    }).catch(function(err) {
        console.log(err);
    });*/
}

function saveCsvStringToDisk(csvString) {
    window.open('data:text/csv;charset=utf-8,' + escape(csvString));
}

function appendData(dataset, name, value) {
    /* dataset: JSON object to be appended */
    /* name: queryable string, e.g. 'matchnum' */
    /* value: string, e.g. '34'
    /* purpose: appends information to JSON object */
    dataset[name] = value;
}

function scanForData(elementType, dataset) {
    /* elementType: a form element name, e.g. 'select' */
    /* dataset: a JSON object where names and values from elements of elementType are coalated */
    /* purpose: scans html doc for inputs of a known type and adds name/value pairs to a JSON object */
    $(elementType).each(function() {
        var name = $(this).attr("name");
        var value = $(this).val();
        appendData(dataset, name, value);
    });
}

function cleanData(formType) {
    /* purpose: builds and returns JSON dataset to submit to pouchdb */
    var dataset = new Object();

    dataset["_id"] = guid();
    
    dataset['formType'] = formType;

/*    dataset["teamNum"] = getParameterByName('teamNum');
    
    try {
      dataset["matchNum"] = getParameterByName('matchnum');  
    } catch (err) {
        //do nothing
    }*/
    
    var types = ["input", "select", "textarea"];

    for (i = 0; i < types.length; i++) {
        scanForData(types[i], dataset);
    }

    console.log(dataset);
    
    return dataset;
}

function saveMatchForm(formType) {
    /* purpose: collects information from html form and saves it to pouchdb */
    var formData = cleanData(formType);
    save(formData);
}

function ConvertToCSV(objArray) {
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    var str = '';
    
    var firstLine = '';
    for (var index in array[0]) {
        firstLine += index.toString() + ',';
    }
    str = str.slice(0,-1);
    str += firstLine + '\r\n';
 
    for (var i = 0; i < array.length; i++) {
        var line = '';
        for (var index in array[i]) {
            if (line != '') line += ','

            line += array[i][index];
        }

        str += line + '\r\n';
     }

    return str;
}

function loadQR() {
    
    /*db.createIndex({
        index: {fields:['formType']}
    }).then(function () {
        return db.find({
            selector: {formType: {$eq:'match'}}
        });
    }).then(function(result) {
        console.log(result);
    }).catch(function(err) {
        console.log(err);
    });*/
    
    db.createIndex({
        index: {fields:['formType']}
    }).then (function () {
        return db.find({
            selector: {formType: {$eq:'match'}}
        });
    }).then(function(result) {
        console.log(result);
        var info = JSON.stringify(result.docs);
        console.log(info);
        console.log(info.length);
        var CSV = ConvertToCSV(info);
        console.log(CSV);
        console.log(CSV.length);
        $(document).ready(function() {
            $('#qrdiv').qrcode({
                width: 1280,
                height: 1280,
                text: CSV
            });
        });
    }).catch(function(err) {
        console.log(err);
    });

}



function pickRobots() {
    /* purpose: for use with robotPick.html. Creates list of team numbers for match sent in query string by collecting that match from pouchdb database */

    function addRobotsToAllianceList(alliance, divid, match) {
        var i;
        for (i = 0; i < alliance.length; i++) {
            $('#' + divid).append('<a href="matchform.html?matchnum=' + match + '&teamNum=' + alliance[i] + '" class="btn btn-large">' + alliance[i] + '</a>');
        }
    }


    //var match = getParameterByName("matchnum");


    // for when we get the pouchdb.find functionality working
    
/*    var matchData = {
        "-id": 001,
        "match": "1",
        "redAlliance": ["58", "127", "133"],
        "blueAlliance": ["125", "166", "3609"]
    };

    db.put(matchData);*/

/*    db.createIndex({
        index: {fields:['formType','matchnum']}
    }).then(db.find({
        selector: {
            'matchnum': 
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
    });*/
    

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
    /* purpose: for use with matchinfoform.html, creates dropdowns for chosing red and blue alliance for given match number */
/*
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

    var listOfBots =['58','97','125','133','151','166','172','246','319','501','663','716','1058','1073','1289','1474','1519', '1699','1761','1922','1965','2084','2423','2523','2646','2713','2876','3451','3525','3566','3585','3597','3609','3930','4034','4041','4042','4151','4169','4176','4311','4473','4474','4546','4905','4906'];

    addAlliance('red');
    addAlliance('blue');

    addBotLists('red', listOfBots);
    addBotLists('blue', listOfBots);
*/
    $('#redScores').hide();
    $('#blueScores').hide();
    $('#redBots').show();
    $('#blueBots').show();

}



function scores() {
    /* purpose: for use with matchinfoform.html, displays inputs for inputing score for each team */
/*    function addFormElements(color) {

        var targetForm = $('#' + color + 'Alliance').find('form');

        targetForm.append('<label class="control-label col-sm-2">Score</label>');
        targetForm.append('<input type="range" name="' + color + 'points" value="0" min="0" max="400" data-show-value="true" data-highlight="true"><br>');
        targetForm.append('<div class="checkbox"><label><input type="checkbox" name="' + color + 'Breach">Breach</label></div>');
        targetForm.append('<div class="checkbox"><label><input type="checkbox" name="' + color + 'Capture">Capture</label></div>');

    }


    addAlliance('red');
    addAlliance('blue');

    addFormElements('red');
    addFormElements('blue');*/
    
    $('#redScores').show();
    $('#blueScores').show();
    $('#redBots').hide();
    $('#blueBots').hide();
    

}

function getRobotData(teamNumber, type) {
    /* teamNum: a team number as a string, e.g. '58' */
    /* type: a type of data stored, e.g. 'pit' 'match' */
    
    /* purpose: pulls all match data for a particular robot */
    
        
        return db.createIndex({
            index: {fields:['teamNum','formType']}
        }).then (function () {
            var result = db.find({
                selector: {teamNum: {$eq:teamNumber}, formType: {$eq:type}}
            });
            console.log('1');
            console.log(result);
            return result;
        }).catch(function(err) {
            console.log(err);
        });
}

function displayRobotData() {
    
    //var teamNumber = getParameterByName('teamNum');
    var teamNumber = '58';
    
    $('#PageTop').append('<h1>Team '+teamNumber+'</h1>');
    
    var allData = getRobotData(teamNumber, 'match').then(function(result)
        {   console.log('2'); 
            console.log(result);
            var allData = result.docs;
            $('#auto').append(JSON.stringify(allData));
        });
    
}

function displaybotlist (){
    
    var botlist=['58','97','125','133','151','166','172','246','319','501','663','716','1058','1073','1289','1474','1519', '1699','1761','1922','1965','2084','2423','2523','2646','2713','2876','3451','3525','3566','3585','3597','3609','3930','4034','4041','4042','4151','4169','4176','4311','4473','4474','4546','4905','4906'];
    
    
    for (var i=0;i<botlist.length;i++){
        var bot = botlist[i];
        $('#botlist').append('<a href="robotStats.html?botnum='+bot+'" class="btn btn-default btn-lg" role=button>'+bot+'</a>');    
       
    }
    
}

function matchlist (){
    
   for (var i=1; i<128;i++) {
        var match = i.toString();
        $('#lofm').append('<a href="robotPick.html?matchnum='+match+'" class="btn btn-danger btn-lg" role=button>'+match+'</a>');
   }
       
}

function saveAndRefresh (formType) {
    
    saveMatchForm(formType).then( location.reload());
    
}

function saveAlliances () {

    var redAlliance = [];
        $('#redBots').find('select').each(function(){
            redAlliance.push($(this).val());    
        });
    
    var blueAlliance = [];
        $('#blueBots').find('select').each(function(){
            blueAlliance.push($(this).val());    
        });
        
    var dataset = new Object();

    var matchnum = getParameterByName('matchnum');
    
    dataset["_id"] = 'reading'+matchnum;
    
    //dataset['formType'] = 'matchInfo';
    
    //dataset['matchnum'] = matchnum;
    
    dataset['redAlliance'] = redAlliance;
    dataset['blueAlliance'] = blueAlliance;
    
    save(dataset);
    
}

function saveScores () {
    
    function addScoresToDoc(doc) {
        
        $('#redAlliance').find('input').each(function(){
            var name = $(this).attr("name");
            var value = $(this).val();
            console.log(name, value);
            doc[name] = value;
            //appendData(doc, name, value);
        });
        
        $('#blueAlliance').find('input').each(function(){
            var name = $(this).attr("name");
            var value = $(this).val();
            appendData(doc, name, value);
        });
        
        console.log(doc);
        
        return doc;
  
    }
    
    // creates id to get
    var matchnum = getParameterByName('matchnum');
    var idToGet = 'reading' + matchnum;
    
    console.log(idToGet);
    
    db.get(idToGet).then(function (doc) {
        // do something here update the doc and re-put it? Not 100% sure Brain not working
        var docNew = addScoresToDoc(doc);
        console.log(docNew);
        return db.put(docNew, idToGet, doc.rev);
    }).then(function(response) {
        console.log(response);
    }).catch(function(err){
       console.log(err); 
    });
    
}





