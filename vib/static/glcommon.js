var glapi = {};

(function() {

  glapi.accessToken = 'pk.eyJ1IjoidmliMmQiLCJhIjoiY2l5eTlqcGtoMDAwZzJ3cG56' +
      'emF6YmRoOCJ9.lP3KfJVHrUHp7DXIQrZYMw';

  glapi.getMapFirstLayerId = function(map) {
    var style = map.getStyle();
    return style.layers[0].id;
  };

  glapi.getWMTSUrl = function(bodId, timestamp, format) {
    format = format ? format : 'png';
    timestamp = timestamp ? timestamp : 'current';
    var templateUrl = 'https://wmts10.geo.admin.ch/1.0.0/{bodId}/default/{timestamp}/' +
          '3857/{z}/{x}/{y}.{format}'
    return templateUrl.replace('{bodId}', bodId)
          .replace('{timestamp}', timestamp)
          .replace('{format}', format);
  };

  glapi.getWMSUrl = function(bodId) {
    return 'https://wms.geo.admin.ch?bbox={bbox-epsg-3857}&format=image/png&STYLES=&' +
        '&service=WMS&version=1.3.0&request=GetMap&crs=EPSG:3857&width=256&height=256&layers=' + bodId;
  };

  glapi.formatSourceName = function(bodId) {
    return 'source_' + bodId;
  };

  glapi.getWMTSRasterSource = function(bodId, format, timestamp) {
    return {
      type: 'raster',
      tiles: [this.getWMTSUrl(bodId, format, timestamp)],
      tileSize: 256
    };
  };

  glapi.getWMTSRasterLayer = function(bodId) {
    return {
      id: bodId,
      source: this.formatSourceName(bodId),
      type: 'raster'
    };
  };

  glapi.removeLayerGroup = function(map, groupId) {
    var style, groupId, layer, removing, beforeLayerId;
    removing = false;
    style = map.getStyle();
    for (var i=0; i < style.layers.length; i++) {
      layer =  style.layers[i];
      if (layer.id.indexOf(groupdId != -1)) {
        removing = true;
        map.removeLayer(layer.id);
      } else if (removing) {
        beforeLayerId = layer.id;
        break;
      }
    }
    return beforeLayerId;
  };

  glapi.getMapStyle = function() {
    return $.getJSON('/static/config/style.json');
  };

  glapi.getMapGroups = function() {
    return $.getJSON('/static/config/groups.json');
  };

  glapi.getGeoJSON = function(sourceId) {
    return $.getJSON('/static/config/geojsons/' + sourceId + '.geojson');
  };

  glapi.getLayerset = function(sourceId, layersetId) {
    return $.getJSON('/static/config/layers/' + sourceId + '/' + layersetId + '.json');
  };

  glapi.MapLayerGroups = function(map) {
    this.map = map;
    this.data = null;

    var that = this;
    var deferred = jQuery.Deferred();
    this.onReady = deferred.then;

    var mapGroups = glapi.getMapGroups();
    mapGroups.then(function(data) {
      that.data = data;
      deferred.resolve(data);
    });

    this.getAllLayerGroups = function() {
      if (!this.data) {
        return;
      }
      return this.data['groups.swisstopo'];
    };

    this.getAllLayerGroupOptions = function() {
      if (!this.data) {
        return;
      }
      return this.data['group-options'];
    };

    this.getLayerGroupById = function(layerGroupId) {
      var layerGroups = this.getAllLayerGroups();
      if (layerGroups) {
        return layerGroups[layerGroupId];
      }
    };

    this.getLayerGroupOptionsBySourceId = function(sourceId) {
      var groupOptions = this.getAllLayerGroupOptions();
      if (groupOptions) {
        return groupOptions[sourceId];
      }
    };

    this.addLayerGroup = function(layerGroupId, beforeLayerId) {
      var that, group, groupOptions, sourceId, addLayerSet, updateGeoJSONSource;
      that = this;
      const props = ['minzoom', 'maxzoom', 'layout', 'filter', 'type', 'source', 'paint', 'source-layer', 'sourceLayer'];
      addLayerSet = function(sourceId, layersetId){
        glapi.getLayerset(sourceId, layersetId).then(function(data) {
          var ref, extended, layers, layer, prop;
          layers = data.layers;
          for (var i=0; i < layers.length; i++) {
            //layers[i].id = layerGroupId + '-' + i;
            layer = layers[i];
            if (layer.ref) {
              extended = {};
              ref = that.map.getLayer(layer.ref);
              for (var j in props) {
                prop = props[j];
                // user defined ref are no longer supported
                if (layer[prop]) {
                  extended[prop] = layer[prop];
                } else if (ref[prop]) {
                  propExt = prop == 'sourceLayer' ? 'source-layer' : prop;
                  extended[propExt] = ref[prop];
                }
              }
              extended.id = layer.id;
              that.map.addLayer(extended, beforeLayerId);
            } else {
              that.map.addLayer(layers[i], beforeLayerId);
            }
          }
        });
      };
      updateGeoJSONSource = function(sourceId) {
        glapi.getGeoJSON(sourceId).then(function(data) {
          that.map.getSource(sourceId).setData(data);
        });
      };

      group = this.getLayerGroupById(layerGroupId);
      for (var i=0; i < group.sources.length; i++) {
        sourceId = group.sources[i];
        layersetId = group.layerset[i];
        groupOptions = this.getLayerGroupOptionsBySourceId(sourceId);
        addLayerSet(sourceId, layersetId);
        if (groupOptions.type == 'geojson') {
          updateGeoJSONSource(sourceId);
        }
      }
    };
  };

  glapi.attachMapClickListener = function(map) {
    map.on('click', function(e) {
      var features = map.queryRenderedFeatures(e.point);
      if (features.length) {
        for (var i=0; i < features.length; i++) {
          var feature = features[i];
          if (feature.layer.id) {
            if (feature.properties.name) {
              $('.vib-layerid').html(
                  feature.properties.name + ' : ' + feature.layer.id);
            } else {
              $('.vib-layerid').html(feature.layer.id);
            }
            break;
          }
        }
      }
    });
  };
})();
