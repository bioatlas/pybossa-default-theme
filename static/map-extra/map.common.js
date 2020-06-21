/*  Common map (Leaflet) functions */

// used to generate unique handler name for user drawn areas.
var areaCounter = 0;

var decimalLatitude = '';
var decimalLongitude = '';
var coordinateUncertaintyInMeters = '';
var footprintWKT = '';

function setGeoreferenceonUI() {
    document.getElementById('decimalLatitude').value = decimalLatitude;
    document.getElementById('decimalLongitude').value = decimalLongitude;
    document.getElementById('coordinateUncertaintyInMeters').value = coordinateUncertaintyInMeters;
    document.getElementById('footprintWKT').value = footprintWKT;
}

function addClickEventForVector(layer) {
    var name = "drawnArea" + areaCounter;
    areaCounter++;

    MAP_VAR.map.addHandler(name, L.AreaPopupHandler.extend({ layer: layer }));
    MAP_VAR.map[name].enable();
}

function removeLayer(leaflet_id) {
    decimalLatitude = '';
    decimalLongitude = '';
    coordinateUncertaintyInMeters = '';
    footprintWKT = '';
    if (MAP_VAR.map._layers[leaflet_id] !== undefined) {
        var layer = MAP_VAR.map._layers[leaflet_id];
        MAP_VAR.map.removeLayer(layer);
    }
}

L.AreaPopupHandler = L.Handler.extend({
    layer: null,

    addHooks: function() {
        L.DomEvent.on(this.layer, 'click', this._georeference, this);
    },

    removeHooks: function() {
        L.DomEvent.off(this.layer, 'click', this._georeference, this);
    },

    _georeference: function(e) {
        georeference(this.layer);
    }
});

L.PointClickHandler = L.Handler.extend({
    obj: null,

    addHooks: function() {
        L.DomEvent.on(this.obj, 'click', pointLookupClickRegister, this);
    },

    removeHooks: function() {
        L.DomEvent.off(this.obj, 'click', pointLookupClickRegister, this);
    }
});

/**
 * Fudge to allow double clicks to propagate to map while allowing single clicks to be registered
 *
 */
var clickCount = 0;

function pointLookupClickRegister(e) {
    // console.log('pointLookupClickRegister', clickCount);
    clickCount += 1;
    if (clickCount <= 1) {
        setTimeout(function() {
            if (clickCount <= 1) {
                pointLookup(e);
            }
            clickCount = 0;
        }, 400);
    }
}

function georeference(layer) {
    if (layer instanceof L.Circle) {
        var latlng = layer.getLatLng();
        decimalLatitude = latlng.lat.toFixed(7);
        decimalLongitude = latlng.lng.toFixed(7);
        coordinateUncertaintyInMeters = parseInt(layer.getRadius());
        layer.bindPopup(getParamsForCircle(layer))
    } else {
        var wkt = new Wkt.Wkt();
        wkt.read(JSON.stringify(layer.toGeoJSON()));
        footprintWKT = wkt.write();
        layer.bindPopup(getParamsforWKT(layer, wkt))
    }
    setGeoreferenceonUI();
}


function getParamsforWKT(layer, wkt) {
    var content = "WKT : " + wkt;
    //+ "<br>" +
    //"<a id='removeArea' href='javascript:void(0)' " +
    //"onclick='removeLayer(\"" + layer._leaflet_id + "\");MAP_VAR.map.closePopup()'>" +
    //"Cancel" + "</a>";
    return content
}

function getParamsForCircle(circle) {
    var latlng = circle.getLatLng();
    var radius = Math.round((circle.getRadius() / 1000) * 10) / 10; // convert to km (from m) and round to 1 decmial place
    decimalLatitude = latlng.lat.toFixed(7);
    decimalLongitude = latlng.lng.toFixed(7);
    coordinateUncertaintyInMeters = parseInt(circle.getRadius());
    var content = "Lat:" + latlng.lat.toFixed(7) + "<br>" +
        "Lng:" + latlng.lng.toFixed(7) + "<br>" +
        "Radius:" + parseInt(circle.getRadius());
    //+ "<br>" +
    //"<a id='removeArea' href='javascript:void(0)' " +
    //"onclick='removeLayer(\"" + circle._leaflet_id + "\");MAP_VAR.map.closePopup()'>" +
    //"Cancel" + "</a>";
    return content
}


function generatePopup(layer, latlng) {
    var content = "";
    if (jQuery.isFunction(layer.getRadius)) {
        // circle
        content = getParamsForCircle(layer);
    } else {
        var wkt = new Wkt.Wkt();
        wkt.fromObject(layer);
        content = getParamsforWKT(layer, wkt.write());
    }

    if (latlng == null) {
        latlng = layer.getBounds().getCenter();
    }

    L.popup()
        .setLatLng([latlng.lat, latlng.lng])
        .setContent(content)
        .openOn(MAP_VAR.map);

}

