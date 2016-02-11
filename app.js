var db = new PouchDB('scouting');

function save(formData) {
    db.put(formData);
}

function appendData(dataset, name, value) {
    console.log(name + ", " + value + ", " + dataset);
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
    var dataset = {_id:"001"};
    
    var types = ["input", "select", "textarea"];
    
    for(i=0; i<types.length; i++){
        scanForData(types[i], dataset);
    }
    
    return dataset;
}

function saveMatchForm() {
    var formData = cleanData();
    console.log(formData);
    save(formData);
}
