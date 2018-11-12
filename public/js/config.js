var meters;

function AppendDevice(row, meter, newDevice)
{
    const iName  = 0;
    const iDesc = 1;
    const iMode = 2;
    const iId = 3;
    const iControl = 4;
    
    while (row.cells && row.cells.length > 0) {
        row.deleteCell(row.cells.length-1);
    }

    if (typeof meter === 'undefined' || meter === null) {
        meter = { name:'', description:'', mode:0, id:''};
    }

    var name = document.createElement('input');
    name.type = "text";
    name.value = meter.name;
    var cell = row.insertCell(iName);
    cell.appendChild(name);

    var desc = document.createElement('input');
    desc.type = "text";
    desc.value = meter.description;
    var cell = row.insertCell(iDesc);
    cell.appendChild(desc);     

    var mode = document.createElement('input');
    mode.type = "number";
    if ((typeof meter.mode === 'undefined' || meter.mode === null)) {
        mode.value = 0;
    }
    else {
        mode.value = meter.mode;
    }
    var cell = row.insertCell(iMode);
    cell.appendChild(mode);

    var id = document.createElement('input');
    id.type = "text";
    id.value = meter.id;
    var cell = row.insertCell(iId);
    cell.appendChild(id);
    
    var distance = document.createElement('input');
    distance.type = "number";
    if ((typeof meter.distance === 'undefined' || meter.distance === null)) {
        distance.value = 0;
    }
    else {
        distance.value = meter.distance;
    }

    var cell = row.insertCell(iControl);
    if (!(typeof newDevice === 'undefined' || newDevice === null)) {
        var add = document.createElement('input');
        add.type = "button";
        add.value = "Add";
        add.onclick = function () {
            
            var update = {
                name: name.value,
                description: desc.value,
                mode: mode.value,
                id: parseInt(id.value)
            };
            
            $.get("AddDevice", { update: update }, function (err) {
                if (err) {
                    console.log(Date() + " AddDevice failed:");
                    console.log(err);
                }
                else {
                    AppendDevice(row, update);
                }
            });
        };
        cell.appendChild(add);
    }
    else {
        var update = document.createElement('input');
        update.type = "button";
        update.value = "Update";
        update.onclick = function () {
            
            var update = {
                name: name.value,
                description: desc.value,
                mode: mode.value,
                id: parseInt(id.value)
            };
            
            $.get("UpdateDevice", { previous: meter, update: update }, function (err) {
                console.log("UpdateDevice err:" + err);
            });
        };
        cell.appendChild(update);
    }

    var remove = document.createElement('input');
    remove.type = "button";
    remove.value = "Delete";
    remove.onclick = function () {
        
        var remove = {
            name: name.value,
            id: id.value
        };
        
        $.get("RemoveDevice", remove, function (err) {
            if (err) {
                console.log(Date() + " RemoveDevice failed:");
                console.log(err);
            }
            else {
                var table = document.getElementById("deviceTable");
               table.deleteRow(row.rowIndex);
            }
        });
    };
    cell.appendChild(remove);
}

function GetDeviceNames(devices)
{
    var names = [];
    if (devices && devices.constructor === Array) {
        devices.forEach(function (device, i) {
            names[i] = device.name;
        });
    }
    return names;
}

$(function () {

    $.get("GetMeters", function (serverDevices) {
        meters = serverDevices;

        var deviceTable = document.getElementById("deviceTable");
        if (meters && meters.constructor === Array) {
            meters.forEach(function (meter, i) {
                var row = deviceTable.insertRow(i + 1);
                AppendDevice(row, meter);
            });
        }
    });
});

function AddDevice(){
    $('#deviceTable tbody').append($("#deviceTable tbody tr:last").clone());
    var table = document.getElementById("deviceTable");
    var row = table.insertRow(table.rows.length);
    AppendDevice(row, null, true);
}