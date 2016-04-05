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

// function saveEventMatchesToDatabase(event, db) {
//     /* event: An event object from The Blue Alliance API. */
//     /* db: a reference ot the PouchDB database. */

//     /* Purpose: Given an event, extract the list of matches and teams, and save them to the database. */
//     TBA.event.matches(event.key, function(matches_list) {
//         var i = 0;
//         for (i = 0; i < matches_list.length; i++) {
//             var match = new Object();
//             var docrec = new Object();

//             match._id = 'matches/' + matches_list[i].key;
//             match.redTeam = matches_list[i].alliances.red.teams;
//             match.blueTeam = matches_list[i].alliances.blue.teams;

//              If the doc already exists, we need to add the _rev to update the existing doc. 
//             db.get(match._id).then(function(doc) {
//                 match._rev = doc._rev;
//                 docrec = doc;
//             }).catch(function(err) {
//                 if (err.status != 404) {
//                     /* Ignore 404 errors: we expect them, if the doc is new. */
//                     console.log(err);
//                 }
//             });

//             db.put(match).then(function() {
//                 // Success!
//             }).catch(function(err) {
//                 console.log('\ndoc._rev: ' + docrec._rev);
//                 console.log('match._rev: ' + match._rev);
//                 console.log(err);
//             });
//         }
//     });
// }



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

    db.put(formData)
        .then(function(response) {
            var feedback = ' \
            <div class="panel panel-success"> \
                <div class="panel-heading">Form saved!</div> \
            </div> \
            ';
            $('#feedbackContainer').append(feedback);
        }).catch(function(err) {
            console.log(err);
            var feedback = ' \
            <div class="panel panel-danger"> \
                <div class="panel-heading">An error occurred!</div> \
            </div> \
            ';
            $('#feedbackContainer').append(feedback);
        });
}

function saveCsvStringToDisk(csvString) {
    var newDoc = 'data:text/csv;charset=utf-8,' + escape(csvString);
    //console.log(newDoc);
    window.open(newDoc);
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
        var o = $(this);
        console.log(o);


        var name = o.attr("name");
        var value = o.val();

        console.log(name, value);


        if (o.is(':checked')) {
            value = "YES";
            console.log('checked');
        } else {
            //do nothing
        }

        appendData(dataset, name, value);
    });
}

function cleanData(formType) {
    /* purpose: builds and returns JSON dataset to submit to pouchdb */
    var dataset = new Object();

    dataset["_id"] = guid();

    dataset['formType'] = formType;

    try {
        dataset["teamnum"] = getParameterByName('teamNum');
        dataset["matchNum"] = getParameterByName('matchnum');
    } catch (err) {
        //do nothing
    }

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
    str = str.slice(0, -1);
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
        index: { fields: ['formType'] }
    }).then(function() {
        return db.find({
            selector: { formType: { $eq: 'match' } }
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

function addBotsToSelect(id) {
    var listOfBots = ['58', '97', '125', '133', '151', '166', '172', '246', '319', '501', '663', '716', '1058', '1073', '1289', '1474', '1519', '1699', '1761', '1922', '1965', '2084', '2423', '2523', '2646', '2713', '2876', '3451', '3525', '3566', '3585', '3597', '3609', '3930', '4034', '4041', '4042', '4151', '4169', '4176', '4311', '4473', '4474', '4546', '4761', '4905', '4906', '4909', '4929', '5263', '5347', '5459', '5556', '5563', '5752', '5962', '5969', '6161', '6201'];

    var selectToAdd = $('#' + id);

    for (var i = 0; i < listOfBots.length; i++) {
        selectToAdd.append('<option value="' + listOfBots[i] + '">' + listOfBots[i] + '</option>');

    }

}



function pickRobots() {
    /* purpose: for use with robotPick.html. Creates list of team numbers for match sent in query string by collecting that match from pouchdb database */

    function addRobotsToAllianceList(alliance, divid, match, color) {
        var i;
        for (i = 0; i < alliance.length; i++) {
            $('#' + divid).append('<a href="matchform.html?matchnum=' + match + '&teamNum=' + alliance[i] + '" class="btn btn-large ' + color + '" role="button">' + alliance[i] + '</a>');
        }
    }

    // for when we get the pouchdb.find functionality working

    /*    var matchData = {
            "-id": 001,
            "match": "1",
            "redAlliance": ["58", "127", "133"],
            "blueAlliance": ["125", "166", "3609"]
        };

        db.put(matchData);*/

    var match = getParameterByName('matchnum');

    $('#header').append('<h1>Match Number: ' + match + '</h1>');

    db.createIndex({
        index: { fields: ['formType', 'matchnum'] }
    }).then(function() {
        return db.find({
            selector: { _id: { $eq: 'pineTree' + match } },
            fields: ['redAlliance', 'blueAlliance']
        });
    }).then(function(result) {
        var allianceList = result.docs[0];

        var redList = allianceList.redAlliance;
        var blueList = allianceList.blueAlliance;

        addRobotsToAllianceList(redList, "redAlliance", match, 'btn-danger');
        addRobotsToAllianceList(blueList, "blueAlliance", match, 'btn-primary');

        // $("#blueAlliance").children(".btn").each().addClass("btn-primary");
        // $("#redAlliance").children(".btn").each().addClass("btn-danger");
    }).catch(function(err) {
        console.log(err);
    });


    /*    // for testing
        var match = "001";
        var text = '{"docs":[{"redAlliance":["58","127","133"], "blueAlliance":["215","166","3609"] } ]}';
        var result = JSON.parse(text);*/
    /*
        var allianceList = result.docs[0];

        var redList = allianceList.redAlliance;
        var blueList = allianceList.blueAlliance;

        console.log(redList.toString());
        console.log(blueList.toString());

        addRobotsToAllianceList(redList, "redAlliance", match);
        addRobotsToAllianceList(blueList, "blueAlliance", match);*/

    /*    $("#blueAlliance").find("a").each(function() {
            $(this).addClass("btn-primary")
        });
        $("#redAlliance").find("a").each(function() {
            $(this).addClass("btn-danger")
        });*/
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
        index: { fields: ['teamnum', 'formType'] }
    }).then(function() {
        var result = db.find({
            selector: { teamnum: { $eq: teamNumber }, formType: { $eq: type } },
            //sort: ['matchnum']
        });
        //console.log('1');
        //console.log(result);
        return result;
    }).catch(function(err) {
        console.log(err);
    });
}

function addChart(chartData, divid) {

    console.log(chartData);

    $.plot(divid, [chartData], {
        series: {
            bars: {
                show: true,
                barWidth: 0.6,
                align: "center"
            }
        },
        xaxis: {
            mode: "categories",
            tickLength: 0
        }
    });

}

function addCountableDataToPage(teamNumber, type) {


    function queryAndAppend(query, divid) {

        var result = db.find(query).then(function(result) {
            //console.log(result);
            $(divid).append('<label>' + result.docs.length + '</label>')

            //console.log(divid, result.docs.length);
        });
    }

    return db.createIndex({
        index: { fields: ['teamnum', 'formType', 'autoReachD', 'scaleAttempt', 'scaleSuccess', 'autoShotAtp', 'autoShotSS'] }
    }).then(function() {

        //console.log('58');

        var queryables = ['autoReachD', 'scaleAttempt', 'scaleSuccess', 'autoShotAtp', 'autoShotAtp'];
        var querytocount = ['YES', 'YES', 'YES', 'Hi', 'Lo'];

        for (var i = 0; i < queryables.length; i++) {
            var query = new Object();

            var queryType = queryables[i];

            query['teamnum'] = { $eq: teamNumber };
            query['formType'] = { $eq: type };
            query[queryType] = { $eq: querytocount[i] };

            var queryString = new Object();
            queryString['selector'] = query;

            //console.log(queryString);
            var divid = '#' + queryType + querytocount[i];

            queryAndAppend(queryString, divid);

        }

    }).then(function() {

        var querytocount = ['Hi', 'Lo'];

        for (var i = 0; i < querytocount.length; i++) {
            var query = new Object();

            var queryType = 'autoShotSS';

            query['teamnum'] = { $eq: teamNumber };
            query['formType'] = { $eq: type };
            query[queryType] = { $eq: 'YES' };
            query['autoShotAtp'] = { $eq: querytocount[i] }

            var queryString = new Object();
            queryString['selector'] = query;

            //console.log(queryString);
            var divid = '#' + queryType + querytocount[i];

            queryAndAppend(queryString, divid);

        }
    });

}

function addAutoDefenseChart(teamNumber) {

    chartData = [];

    // db.find({'selector':{}})

    db.find({ selector: { teamnum: { $eq: teamNumber }, formType: { $eq: 'match' }, autoCrossD: { $eq: 'CDF' } } }).then(function(result) {
        chartData.push(['CDF', result.docs.length]);
    }).then(function() {
        return db.find({ selector: { teamnum: { $eq: teamNumber }, formType: { $eq: 'match' }, autoCrossD: { $eq: 'DB' } } }).then(function(result) {
            chartData.push(['Draw Bridge', result.docs.length]);
        });
    }).then(function() {
        return db.find({ selector: { teamnum: { $eq: teamNumber }, formType: { $eq: 'match' }, autoCrossD: { $eq: 'RP' } } }).then(function(result) {
            chartData.push(['Ramparts', result.docs.length]);
        });
    }).then(function() {
        return db.find({ selector: { teamnum: { $eq: teamNumber }, formType: { $eq: 'match' }, autoCrossD: { $eq: 'RW' } } }).then(function(result) {
            chartData.push(['Rock Wall', result.docs.length]);
        });
    }).then(function() {
        return db.find({ selector: { teamnum: { $eq: teamNumber }, formType: { $eq: 'match' }, autoCrossD: { $eq: 'RT' } } }).then(function(result) {
            chartData.push(['Rough Terrain', result.docs.length]);
        });
    }).then(function() {
        return db.find({ selector: { teamnum: { $eq: teamNumber }, formType: { $eq: 'match' }, autoCrossD: { $eq: 'LB' } } }).then(function(result) {
            chartData.push(['Low Bar', result.docs.length]);
        });
    }).then(function() {
        return db.find({ selector: { teamnum: { $eq: teamNumber }, formType: { $eq: 'match' }, autoCrossD: { $eq: 'M' } } }).then(function(result) {
            chartData.push(['Moat', result.docs.length]);
        });
    }).then(function() {
        return db.find({ selector: { teamnum: { $eq: teamNumber }, formType: { $eq: 'match' }, autoCrossD: { $eq: 'PC' } } }).then(function(result) {
            chartData.push(['Portcullis', result.docs.length]);
        });
    }).then(function() {
        return db.find({ selector: { teamnum: { $eq: teamNumber }, formType: { $eq: 'match' }, autoCrossD: { $eq: 'SP' } } }).then(function(result) {
            chartData.push(['Sally Port', result.docs.length]);
        });
    }).then(function() {
        addChart(chartData, '#autoDefenses')
    });


}

function iterateOverAddables(allData, addables, displayType) {

    var chartData = [];


    for (var j = 0; j < addables.length; j++) {
        var property = addables[j];
        var sum = 0;

        for (var i = 0; i < allData.length; i++) {
            var n = allData[i][property];

            sum += parseInt(allData[i][property]);
        }

        if (displayType == "numbers") {
            $('#' + property).append('<label>' + sum + '</label>');
        } else {
            chartData.push([property, sum]);
        }

    }

    if (displayType == "chart") {
        addChart(chartData, '#teleopDefenses');
    }

}

function addEachField(allData, fields) {
    for (var i = 0; i < allData.length; i++) {
        var form = allData[i];
        for (var j = 0; j < fields.length; j++) {
            var field = fields[j];
            $('#' + field).append('<label>"' + form[field] + '"</label><br>');
        }
    }
}

function displayRobotData() {

    db.createIndex({
        index: { fields: ['teamnum', 'formType', 'autoReachD', 'scaleAttempt', 'scaleSuccess', 'autoShotAtp', 'autoShotSS', 'autoCrossD'] }
    });

    if (getParameterByName('teamNum') != null) {
        var teamNumber = getParameterByName('teamNum');
    } else {
        var teamNumber = $('#teamnums').val();
    }   

    $('#PageTop > h1').text('Team ' + teamNumber);

    addCountableDataToPage(teamNumber, 'match');

    addAutoDefenseChart(teamNumber);

    getRobotData(teamNumber, 'match').then(function(result) {
        //console.log('2'); 
        //console.log(result);
        var allData = result.docs;
        //$('#auto').append(JSON.stringify(allData));
        var numsToDisplay = ['HiGAttempt', 'HiGAttain', 'LoGAttain'];
        var forGraph = ['CDFCross', 'DBCross', 'LBCross', 'MoatCross', 'RPCross', 'RWCross', 'RTCross', 'PCCross', 'SPCross'];
        iterateOverAddables(allData, numsToDisplay, "numbers");
        iterateOverAddables(allData, forGraph, "chart");
    });

    getRobotData(teamNumber, 'pit').then(function(result) {
        var allData = result.docs;
        var fields = ['drivetrain', 'aim', 'shooter', 'ballpick'];
        addEachField(allData, fields);
    });

    try {
        getRobotData(teamNumber, 'opinion').then(function(result) {
            var allData = result.docs;
            var fields = ['stRate', 'stCoop', 'stInfo', 'hpRate', 'hpInfo', 'fcRate', 'fcInfo'];
            addEachField(allData, fields);
        });
    } catch (err) {
        // its okay if this errors out
    }

}

function displaybotlist() {

    var botlist = ['58', '97', '125', '133', '151', '166', '172', '246', '319', '501', '663', '716', '1058', '1073', '1289', '1474', '1519', '1699', '1761', '1922', '1965', '2084', '2423', '2523', '2646', '2713', '2876', '3451', '3525', '3566', '3585', '3597', '3609', '3930', '4034', '4041', '4042', '4151', '4169', '4176', '4311', '4473', '4474', '4546', '4905', '4906'];


    for (var i = 0; i < botlist.length; i++) {
        var bot = botlist[i];
        $('#botlist').append('<a href="robotStats.html?botnum=' + bot + '" class="btn btn-default btn-lg" role=button>' + bot + '</a>');

    }

}

function matchlist() {
    
    var type = getParameterByName('type');
    if (type == 'performance') {
        var url = "robotPick.html";
    } else if (type == 'alliances') {
        var url = "matchinfoform.html";
    } else {
        var url = "mainpage.html";
    }

    for (var i = 1; i < 128; i++) {
        var match = i.toString();
        $('#lofm').append('<a href="'+url+'?matchnum=' + match + '" role="button" class="col-xs-1 btn btn-danger btn-lg " style="height: 50px; margin: 3px;">' + match + '</a>');
    }

}

function saveAndRefresh(formType) {

    saveMatchForm(formType);
    var matchnum = getParameterByName('matchnum');
    var newmatch = parseInt(matchnum) + 1;

    $('#buttons').append('<a href="robotPick.html?matchnum=' + newmatch.toString() + '" class="btn btn-default btn-lg" role=button>Next Match!</a>');
}



function saveAlliances() {

    var redAlliance = [];
    $('#redBots').find('select').each(function() {
        redAlliance.push($(this).val());
    });

    var blueAlliance = [];
    $('#blueBots').find('select').each(function() {
        blueAlliance.push($(this).val());
    });

    var dataset = new Object();

    var matchnum = getParameterByName('matchnum');

    dataset["_id"] = 'pineTree' + matchnum;

    //dataset['formType'] = 'matchInfo';

    //dataset['matchnum'] = matchnum;

    dataset['redAlliance'] = redAlliance;
    dataset['blueAlliance'] = blueAlliance;

    console.log(dataset);

    save(dataset);

}

function saveScores() {

    function addScoresToDoc(doc) {

        $('#redAlliance').find('input').each(function() {
            var name = $(this).attr("name");
            var value = $(this).val();
            console.log(name, value);
            doc[name] = value;
            //appendData(doc, name, value);
        });

        $('#blueAlliance').find('input').each(function() {
            var name = $(this).attr("name");
            var value = $(this).val();
            appendData(doc, name, value);
        });

        console.log(doc);

        return doc;

    }

    // creates id to get
    var matchnum = getParameterByName('matchnum');
    var idToGet = 'pineTree' + matchnum;

    console.log(idToGet);

    db.get(idToGet).then(function(doc) {
        // do something here update the doc and re-put it? Not 100% sure Brain not working
        var docNew = addScoresToDoc(doc);
        console.log(docNew);
        return db.put(docNew, idToGet, doc.rev);
    }).then(function(response) {
        console.log(response);
    }).catch(function(err) {
        console.log(err);
    });
}

function findController ( queryType, queryParameters, nullMessage ) {
    $('#robotButtons').empty();

    if (queryType == 'whoCan' ){
        var field = queryParameters.field;
        console.log(field);
        var condition = queryParameters.condition;
        console.log(condition);
        var arrayOfBots = findWhoCan(field, condition);
        arrayOfBots.then(function(result) {
            deduplicateAndPrint(result, nullMessage);
        });
    } else if ( queryType == 'whoCanNumTimes' ) {
        var field = queryParameters.field;
        var condition = queryParameters.condition;
        var numTimes = queryParameters.numTimes;
        var arrayOfBots = findWhoCanNumTimes(field, condition, numTimes);
        arrayOfBots.then(function(result) {
            deduplicateAndPrint(result, nullMessage);
        });
    } else if ( false /* queryType == other query type */ ) {
        $('#robotButtons').append('<label>This Query Was Bad</label>');
    }
}

function findWhoCan(field, condition) {
    var who = [];
    
    return db.createIndex({
        index: { fields: ['formType', field] }
    }).then(function() {
        var query = new Object();

        query['formType'] = { $eq: 'match' };
        query[field] = condition;

        var queryString = new Object();
        queryString['selector'] = query;
        //queryString['fields'] = 'teamnum';

        console.log(queryString);
        

        var result = db.find(queryString);
        return result;
    }).then(function(result) {
        console.log(result);

       if (result.docs.length == 0){
           return who;
       } else {
           for (var i=0; i<result.docs.length; i++) {
                var teamnum = result.docs[i]['teamnum'];
                //console.log(teamnum);
               who.push(teamnum);
           }
           //console.log(who);
           return who;
       }
    });
}


function findCounts(arr) {
    var a = [], b = [], prev;

    arr.sort();
    for ( var i = 0; i < arr.length; i++ ) {
        if ( arr[i] !== prev ) {
            a.push(arr[i]);
            b.push(1);
        } else {
            b[b.length-1]++;
        }
        prev = arr[i];
    }

    return [a, b];
}

function findWhoCanNumTimes(field, condition, numTimes) {
    var who = [];
    
    return db.createIndex({
        index: { fields: ['formType', field] }
    }).then(function() {
        var query = new Object();

        query['formType'] = { $eq: 'match' };
        query[field] = condition ;

        var queryString = new Object();
        queryString['selector'] = query;

        var result = db.find(queryString);
        return result;
    }).then(function(result) {
        //console.log(result);

       if (result.docs.length == 0){
           return who;
       } else {
            var everyone = [];

           for (var i=0; i<result.docs.length; i++) {
                var teamnum = result.docs[i]['teamnum'];
                //console.log(teamnum);
               everyone.push(teamnum);
           }

           var whoCounts = findCounts(everyone);
           
           var whoList = whoCounts[0];
           //console.log(whoList);
           var count = whoCounts[1];
           //console.log(count);
           
           for (var i=0; i<whoList.length;i++) {
                console.log(count[i]);
               if (count[i]>=numTimes) {
                   who.push(whoList[i]);
               } else {
                   // do not push, not enough times
               }
           }
           return who;
       }
    });

}

function deduplicateAndPrint(Bots, nullMessage) {
    console.log(Bots);
    if (Bots.length == 0) {
        $('#robotButtons').append('<label>No robots have ' + nullMessage + ' (yet)</label>');
    } else {
        var who = [];

        for (var i = 0; i < Bots.length; i++) {
            var bot = Bots[i];

            if (who.includes(bot)) {
                // do nothing
            } else {
                who.push(bot);
            }
        }

        for (var j = 0; j < who.length; j++) {
            var bot = who[j];
            var strToAppend = '<a href="robotStats.html?teamNum=' + bot + '" class="btn btn-default btn-lg" role="button">' + bot +'</a>';
            //console.log(strToAppend);
            $('#robotButtons').append(strToAppend);
        }
    }

}

/*function displayBotsOnCondition(querytype, condition, nullMessage) {
    var results = findBots(querytype, condition);

    var Bots = results.docs;

    var whoCan = [];

    for (var i = 0; i < Bots.length; i++) {
        var bot = Bots[i];

        if (whoCan.includes(bot)) {
            // do nothing
        } else {
            whoCan.append(bot.teamNum);
        }

    }

    for (var j = 0; j < whoCan.length; j++) {
        var bot = whoCan[j];
        var strToAppend = '<a href=robotStats?teamNum="' + bot + '">' + bot '</a>';
        console.log(strToAppend);
        $('#robotButtons').append(strToAppend);
    }

    if (Bots.length == 0) {
        $('#robotButtons').append('<p>No robots have ' + nullMessage + ' (yet)');
    } else {
        // do nothing
    }

}*/


/************************
    Layout/Templating
************************/
function addQuantityButtons(elementName) {
    var minusButton = '<a class="btn btn-danger" href="javascript:subtractFromValue(\'' + elementName + '\');">-</a>';
    var plusButton = '<a class="btn btn-success" href="javascript:addToValue(\'' + elementName + '\');">+</a>';
    $('[name="' + elementName + '"]').before(minusButton);
    $('[name="' + elementName + '"]').after(plusButton);
}

function subtractFromValue(elementName) {
    /* TODO: Code to deduct 1 from the value of the given element. */
    var currentValue = Number($('[name="' + elementName + '"]').val());
    $('[name="' + elementName + '"]').val(currentValue - 1);
}

function addToValue(elementName) {
    /* TODO: Code to add 1 to the value of the given element. */
    var currentValue = Number($('[name="' + elementName + '"]').val());
    $('[name="' + elementName + '"]').val(currentValue + 1);
}

function addQuantityButtonsToMatchForm() {
    var names = ['HiGAttempt', 'HiGAttain', 'LoGAttain', 'PCCross', 'LBCross', 'RPCross', 'RWCross', 'RTCross', 'DBCross', 'SPCross', 'CDFCross', 'MoatCross'];

    for (var i = 0; i < names.length; i++) {
        addQuantityButtons(names[i]);
    }
}

function addHeader() {
    var matchnum = getParameterByName('matchnum');
    var teamnum = getParameterByName('teamNum');

    $('#banner').append('<h1>Match ' + matchnum + ' Team ' + teamnum + '</h1>');
}
