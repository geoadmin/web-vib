var ga = {};

(function() {
  function initCarousel(groups) {
    var layers, layer, alts, altBtns, i, previousLayerGroupId;
    i = 0;
    layers = groups.getAllLayerGroups();
    for(var key in layers) {
      if (i == 0) {
        previousLayerGroupId = key;
      }
      layer = layers[key];
      altsBtn = '';
      alts = groups.getLayerGroupAlternativesById(key);
      if (alts && alts.length) {
        altsBtn = '<br>';
        for (var k=0; k < alts.length; k++) {
          var selectedLayerset = '';
          var layerset = alts[k][0];
          var layersetLabel = alts[k][1];
          if (layer.layerset.indexOf(layerset) != -1) {
            selectedLayerset = layerset;
          }
          altsBtn += '<button class="btn btn-sm ';
          if (selectedLayerset) {
            altsBtn += 'active" ';
          } else {
            altsBtn += '" ';
          }
          altsBtn += 'layerset="' + layerset + '" onclick="ga.toggleLayerset(\'' +
              key + '\', \'' + layerset + '\')">' + layersetLabel + '</button>';
        }
      }
      $('<div id="' + key.replace(/\./g, '_') + '" group="' + key +
          '" class="item">' + layer.label + altsBtn +
          '</div></div>').appendTo('.carousel-inner');
      $('<li data-target="#layersCarousel" data-slide-to="'+ i +'"></li>')
          .appendTo('.carousel-indicators');
      i += 1;
    }
    $('.item').first().addClass('active');
    $('.carousel-indicators > li').first().addClass('active');
    $('#layersCarousel').bind('slide.bs.carousel', function (e) {
      var layerGroupId = $(e.relatedTarget).attr('group');
      var layersetId = $(e.relatedTarget).find('button.active').attr('layerset');
      groups.removeLayerGroup(previousLayerGroupId);
      groups.addLayerGroup(layerGroupId, layersetId);
      previousLayerGroupId = layerGroupId;
    });
  }

  function initMap() {
    var map, backgroundLayerId, groups;
    backgroundLayerId = 'ch.swisstopo.lightbasemap';
    mapboxgl.accessToken = glapi.accessToken;
    app.getParams();

    map = new mapboxgl.Map({
      container: 'gl-map',
      center: centerLngLat = [app.params.lng, app.params.lat],
      // Mapbox zoom differs by one.
      zoom: app.params.zoom,
      interactive: true,
      minZoom: 6,
      maxZoom: 18
    });
    groups = new glapi.MapLayerGroups(map);
    // Ui controllers
    ga.toggleLayerset = function(layerGroupId, layersetId) {
      groups.updateLayerset(layerGroupId, layersetId);
      $('#' + layerGroupId.replace(/\./g, '_') + ' button.active').removeClass('active');
      $(event.target).addClass('active');
    };

    map.on('load', function(e) {
      groups.onReady(function() {
        initCarousel(groups);
        groups.addLayerGroup(backgroundLayerId);
      });
    });

    glapi.getMapStyle().then(function(data) {
      map.setStyle(data);
    });

    map.on('moveend', function(e) {
      var center = map.getCenter();
      var zoom = map.getZoom();
      app.setParams({
        lng: center.lng,
        lat: center.lat,
        zoom: zoom,
        overlay: app.params.overlay
      });
    });
    glapi.attachMapClickListener(map);
    map.addControl(new mapboxgl.NavigationControl());
    map.addControl(new mapboxgl.FullscreenControl());
    return map;
  }

  $(window).load(function() {
    if (!mapboxgl.supported()) {
      alert('Your browser does not support Mapbox GL.  Please try Chrome or Firefox.');
    }
    var map = initMap();
  });
})();
