var map, featureList;

$(document).on("click", ".feature-name", function(e) {
  sidebarClick(parseInt($(this).attr('id')));
});

function sidebarClick(id) {
  map.addLayer(streetOverlay);
  var layer = markerClusters.getLayer(id);
  markerClusters.zoomToShowLayer(layer, function() {
    map.setView([layer.getLatLng().lat, layer.getLatLng().lng], 17);
    layer.fire("click");
  });
  /* Hide sidebar and go to the map on small screens */
  if (document.body.clientWidth <= 767) {
    $("#sidebar").hide();
    map.invalidateSize();
  }
}

/* Basemap Layers */
var mapquestOSM = L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png", {
  maxZoom: 19,
  subdomains: ["otile1", "otile2", "otile3", "otile4"],
  attribution: 'Tiles courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, CC-BY-SA.'
});
var mapquestHYB = L.layerGroup([L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg", {
  maxZoom: 18,
  subdomains: ["oatile1", "oatile2", "oatile3", "oatile4"]
}), L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/hyb/{z}/{x}/{y}.png", {
  maxZoom: 19,
  subdomains: ["oatile1", "oatile2", "oatile3", "oatile4"],
  attribution: 'Labels courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, CC-BY-SA. Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency'
})]);

/* Overlay Layers */
var highlight = L.geoJson(null);

var streetOverlay = L.geoJson(null, {
  style: function (feature) {
          return {
        color: "#ff3135",
        weight: 2.5,
        opacity: 1
      };
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      var content = 
      "<h4>Project location</h4>"
      +
      "<table class='table table-striped table-bordered table-condensed'>" 
      + 
      "<tr><th>Starting Intersection</th><td>" + feature.properties.start_int + "</td></tr>" 
      + 
      "<tr><th>End</th><td>" + feature.properties.end + "</td></tr>" 
      + 
      "</table>"
      +
      "<table class='table table-striped table-bordered table-condensed'>" 
      +
      "<h4>Start dates for project stages:</h4>"
      +
      "<tr><th>Milling</th><td>" + feature.properties.mill + "</td></tr>"
      +
      "<tr><th>Patching</th><td>" + feature.properties.patch + "</td></tr>"
      +
      "<tr><th>Asphalt</th><td>" + feature.properties.asphalt + "</td></tr>"
      +
      "<tr><th>Other Work</th><td>" + feature.properties.other + "</td></tr>"
      "<table>";
      layer.on({
        click: function (e) {
          $("#feature-title").html(feature.properties.start_int);
          $("#feature-info").html(content);
          $("#featureModal").modal("show");
          highlight.clearLayers().addLayer(L.circleMarker([e.latlng.lat, e.latlng.lng], {
            stroke: false,
            fillColor: "#00FFFF",
            fillOpacity: 0.7,
            radius: 10
          }));
        }
      });
    }
    layer.on({
      mouseover: function (e) {
        var layer = e.target;
        layer.setStyle({
          weight: 3,
          color: "#00FFFF",
          opacity: 1
        });
        if (!L.Browser.ie && !L.Browser.opera) {
          layer.bringToFront();
        }
      },
      mouseout: function (e) {
        streetOverlay.resetStyle(e.target);
      }
    });
  }
});
$.getJSON("data/streetOverlay_2014.geojson", function (data) {
  streetOverlay.addData(data);
});

map = L.map("map", {
  zoom: 10,
  center: [39.843242, -86.397954],
  layers: [mapquestOSM, streetOverlay, highlight],
  zoomControl: false,
  attributionControl: false
});

/* Clear feature highlight when map is clicked */
map.on("click", function(e) {
  highlight.clearLayers();
});

/* Attribution control */
function updateAttribution(e) {
  $.each(map._layers, function(index, layer) {
    if (layer.getAttribution) {
      $("#attribution").html((layer.getAttribution()));
    }
  });
}
map.on("layeradd", updateAttribution);
map.on("layerremove", updateAttribution);

var attributionControl = L.control({
  position: "bottomright"
});
attributionControl.onAdd = function (map) {
  var div = L.DomUtil.create("div", "leaflet-control-attribution");
  div.innerHTML = "<span class='hidden-xs'>Developed by Ryan Cooper for the <a href='http://www.brownsburgmap.org' target='_blank'>Brownsburg Map Project</a> | <a href='#' onclick='$(\"#attributionModal\").modal(\"show\"); return false;'>Attribution</a>";
  return div;
};
map.addControl(attributionControl);

var zoomControl = L.control.zoom({
  position: "bottomright"
}).addTo(map);

/* GPS enabled geolocation control set to follow the user's location */
var locateControl = L.control.locate({
  position: "bottomright",
  drawCircle: true,
  follow: true,
  setView: true,
  keepCurrentZoomLevel: true,
  markerStyle: {
    weight: 1,
    opacity: 0.8,
    fillOpacity: 0.8
  },
  circleStyle: {
    weight: 1,
    clickable: false
  },
  icon: "icon-direction",
  metric: false,
  strings: {
    title: "My location",
    popup: "You are within {distance} {unit} from this point",
    outsideMapBoundsMsg: "You seem located outside the boundaries of the map"
  },
  locateOptions: {
    maxZoom: 18,
    watch: true,
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 10000
  }
}).addTo(map);

/* Larger screens get expanded layer control and visible sidebar */
if (document.body.clientWidth <= 767) {
  var isCollapsed = true;
} else {
  var isCollapsed = false;
}

var baseLayers = {
  "Street Map": mapquestOSM,
  "Satellite + Streets": mapquestHYB
};

var groupedOverlays = {
  "Toggle": {
    "Streets to be Repaved": streetOverlay
  }
};

var layerControl = L.control.groupedLayers(baseLayers, groupedOverlays, {
  collapsed: isCollapsed
}).addTo(map);

/* Highlight search box text on click */
$("#searchbox").click(function () {
  $(this).select();
});

/* Typeahead search functionality */
$(document).one("ajaxStop", function () {
  $("#loading").hide();
  /* Fit map to streetOverlay bounds */
  map.fitBounds(streetOverlay.getBounds());
  
});
