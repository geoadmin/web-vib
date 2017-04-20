(function() {
  function textField(txt) {
    return '{' + txt + '}';
  }

  function changeMap(mapToChange, styleType, styleId) {
    if (mapToChange.getStyle().id != styleId) {
      mapToChange.setStyle(app.tileserverUrl + '/styles/' + styleId + '.json');
      app.setParam(styleId, styleType);
    }
  }

  function initMap(containerId, styleType, styleId) {
    app.getParams();
    app.setParam(styleId, styleType);
    var map = new mapboxgl.Map({
      container: containerId,
      center: centerLngLat = [app.params.lng, app.params.lat],
      style:  app.tileserverUrl + '/styles/' + styleId + '.json',
      // Mapbox zoom differs by one.
      zoom: app.params.zoom,
    });

    map.on('moveend', function(e) {
      var center = map.getCenter();
      var zoom = map.getZoom();
      app.setParams({
        lng: center.lng,
        lat: center.lat,
        zoom: zoom,
        style: app.params.style,
        styleToCompare: app.params.styleToCompare
      });
    });

    map.on('click', function(e) {
      var features = map.queryRenderedFeatures(e.point);
      if (features.length) {
        for (var i=0; i < features.length; i++) {
          var feature = features[i];
          if (feature.layer.id) {
            $('#layerId').html('Layer: ' + feature.layer.id);
            break;
          }
        }
      }
    });

    map.addControl(new mapboxgl.NavigationControl());
    map.addControl(new mapboxgl.ScaleControl({
      maxWidth: 80,
      unit: 'metric'
    }));

    return map;
  }

  $(window).load(function() {
    if (!mapboxgl.supported()) {
      //stop and alert user map is not supported
      alert('Your browser does not support Mapbox GL.  Please try Chrome or Firefox.');
    }
    app.getParams();
    // Set default zoom, lat, long
    var map = initMap('map', 'style', app.params.style);
    var mapToCompare = initMap('mapToCompare', 'styleToCompare', app.params.styleToCompare);
    var mapSxS = new mapboxgl.Compare(map, mapToCompare, {
      // Set this to enable comparing two maps by mouse movement:
      //mousemove: true
    });
    $('#zoomValue').html(map.getZoom().toFixed(2));
    $('#zoomSlider').val(map.getZoom() * 100);
 
    // Handle style updates
    var selectedStyle = $('#styleSelector option[value=' + app.params.style + ']');
    if (selectedStyle) {
      selectedStyle.prop('selected', true);
    }
    $('#styleSelector select').change(function() {
      changeMap(map, 'style', this.value);
    });
    // Handle styleToCompare updates
    var selectedStyleToCompare = $('#styleToCompareSelector option[value=' + app.params.styleToCompare + ']');
    if (selectedStyleToCompare) {
      selectedStyleToCompare.prop('selected', true);
    }
    $('#styleToCompareSelector select').change(function() {
      changeMap(mapToCompare, 'styleToCompare', this.value);
    });

    // Handle zoom updates
    map.on('zoomend', function() {
      $('#zoomValue').html(map.getZoom().toFixed(2));
      $('#zoomSlider').val(map.getZoom() * 100);
    });
    $('#zoomSlider').on('input', function() {
      const currZoom = parseFloat($('#zoomSlider').val() / 100);
      $('#zoomValue').html(currZoom.toFixed(2));
      map.setZoom(currZoom);
    });

  });
})();
