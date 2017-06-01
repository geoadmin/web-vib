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
      reset(map,$('#vib-filter').find('input'));
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
    map.addControl(new mapboxgl.NavigationControl());
    map.addControl(new mapboxgl.FullscreenControl());
    return map;
  }
   
  var apply = function(map, inputs) {
    var key = inputs[0].value;
    var val = inputs[1].value;
    applyFilter(map, key, val);
  };

  var applyFilter = function(map, key, value) {
    var filter = ['any', [
      '==', key, value
    ]];
    // If value could be an integer
    var num = parseFloat(value);
    if (/^-?\d+.?\d*$/.test(value) && !isNaN(num)) {
      filter.push(['==', key, num]);
    }
    var style = map.getStyle();
    style.layers.forEach(function(layer) {
      if (!layer.filter) {
        layer.metadata.noFilter = true;
      }
      if (!layer.metadata.noFilter && !layer.metadata.oldFilter) {
        layer.metadata.oldFilter = layer.filter;
      } else {
        layer.filter = layer.metadata.oldFilter;
      }
      var finalFilter = layer.filter;
      if (layer.filter) {
        finalFilter = ['all',
          layer.filter,
          filter
        ];
      } else {
        finalFilter = filter;
      }
      map.setFilter(layer.id, finalFilter); 
    });
  };
  
  var reset = function(map, inputs) {
    inputs[0].value = '';
    inputs[1].value = ''; 
    var style = map.getStyle();
    style.layers.forEach(function(layer) {
      map.setFilter(layer.id, layer.metadata.oldFilter); 
      layer.metadata.oldFilter = undefined;
    });
  };
 
  var displayProps = function(map, point) {
    var props = $('#vib-properties');
    var features = map.queryRenderedFeatures(point);
    if (features.length) {
      props.show();
      for (var i=0; i < features.length; i++) {
        var keys = Object.keys(features[i].properties);;
        if (keys.length) {
          var html = '<table>';
          keys.forEach(function(key) {
            html += '<tr>';
            html += '<td>' + key + '</td>';
            html += '<td>' + features[i].properties[key] + '</td';
            html += '</tr>';
          });
          html += '</table>';
          props.html(html);
          return features[i];
        }
      }
    } else {
      props.hide();
    }
  };
 
  $(window).load(function() {
    if (!mapboxgl.supported()) {
      alert('Your browser does not support Mapbox GL.  Please try Chrome or Firefox.');
    }
    var map = initMap();
    
    // Add map mouse events
    var featSelected;;
    map.on('click', function(e) {
      var feat = displayProps(map, e.point);
      if (JSON.stringify(feat) !== JSON.stringify(featSelected)) {
        featSelected = feat;
        return;
      }
      featSelected = undefined;
    });
    map.on('mousemove', function(e) {
      if (featSelected) {
        return;
      }
      displayProps(map, e.point);
    });

    // Add events on filter box
    var filter = $('#vib-filter');
    var inputs = filter.find('input');
    filter.find('#vib-filter-apply').click(function() {
      apply(map, inputs);
    });
    filter.find('#vib-filter-reset').click(function() {
      reset(map, inputs); 
    });
    
    // Add events on properties box
    var props = $('#vib-properties');
    props.on('click', 'tr', function(evt,a,b,c) {
      var tds = $(evt.currentTarget).find('td');
      if (inputs[0].value == tds[0].innerText && inputs[1].value == tds[1].innerText) {
        reset(map, inputs);
        return;
      }
      inputs[0].value = tds[0].innerText;
      inputs[1].value = tds[1].innerText;
      apply(map, inputs);
    });
  });
})();
