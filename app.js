var db;

function loadDB(){
    db = new PouchDB('scouting');
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
    db.get('001').then(function (result) {
        var info = result.stringify;
        console.log(info);
    }).catch(function (err) {
    console.log(err);
    });
}

function appendData(dataset, name, value) {
    dataset[name] = value;
}

function scanForData(elementType, dataset) {
    $(elementType).each(function () {
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
    
    for(i=0; i<types.length; i++){
        scanForData(types[i], dataset);
    }
    
    return dataset;
}

function saveMatchForm() {
    var formData = cleanData();
    save(formData);
}

function loadQR(){
    db.allDocs({
        include_docs: true,
        attachments: true
    }).then(function (result) {
        info = result.stringify;
        console.log(info);
        $(document).ready(function() {
            $('#qrdiv').qrcode({width: 120,height: 120, text: info});
        });
    }).catch(function (err) {
    console.log(err);
    });

}