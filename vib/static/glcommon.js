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
    var templateUrl = 'https://wmts10.geo.admin.ch/1.0.0/{bodId}/default/'
        '{timestamp}/3857/{z}/{x}/{y}.{format}'
    return templateUrl.replace('{bodId}', bodId)
          .replace('{timestamp}', timestamp)
          .replace('{format}', format);
  };

  glapi.getWMSUrl = function(bodId) {
    return 'https://wms.geo.admin.ch?bbox={bbox-epsg-3857}&format=image/png&' +
        'STYLES=&&service=WMS&version=1.3.0&request=GetMap&crs=EPSG:3857&' +
        'width=256&height=256&layers=' + bodId;
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

  glapi.getMapStyle = function() {
    return $.getJSON('static/config/style.json');
  };

  glapi.getMapGroups = function() {
    return $.getJSON('static/config/groups.json');
  };

  glapi.getGeoJSON = function(sourceId) {
    return $.getJSON('static/config/geojsons/' + sourceId + '.geojson');
  };

  glapi.getLayerset = function(sourceId, layersetId) {
    return $.getJSON('static/config/layers/' + sourceId + '/' + layersetId + '.json');
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

    this.getLayerGroupAlternativesById = function(layerGroupId) {
      var layerGroup, layerGroupOptions, alternatives;
      alternatives = [];
      layerGroup = this.getLayerGroupById(layerGroupId);
      for (var i=0; i < layerGroup.sources.length; i++) {
        if (layerGroup.alternatives[i]) {
          var source = layerGroup.sources[i];
          var layerset = layerGroup.layerset[i];
          layerGroupOptions = this.getLayerGroupOptionsBySourceId(source);
          if (layerGroupOptions.layersetLabels &&
              layerGroupOptions.layersetLabels.length) {
            alternatives = alternatives.concat(
                layerGroupOptions.layerset.map(function(e, i) {
              return [e, layerGroupOptions.layersetLabels[i]];
              })
            );
          }
        }
      }
      return alternatives;
    };

    this.addLayer = function(layer, layerGroupId, beforeLayerId) {
      var extended, prop, propExt;
      const props = ['minzoom', 'maxzoom', 'layout', 'filter', 'type',
          'source', 'paint', 'metadata', 'source-layer', 'sourceLayer'];
      layer.metadata = {groupId: layerGroupId};
      if (layer.ref) {
        extended = {};
        ref = this.map.getLayer(layer.ref);
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
        this.map.addLayer(extended, beforeLayerId);
      } else {
        this.map.addLayer(layer, beforeLayerId);
      }
    };

    this.addLayerset = function(layers, layerGroupId, beforeLayerId) {
      var layer;
      for (var i=0; i < layers.length; i++) {
        layer = layers[i];
        this.addLayer(layer, layerGroupId, beforeLayerId);
      }
    };

    this.addLayerGroup = function(layerGroupId, layerSetId, beforeLayerId) {
      var that, group, groupOptions, sourceId, updateGeoJSONSource;
      that = this;
      updateGeoJSONSource = function(sourceId) {
        glapi.getGeoJSON(sourceId).then(function(data) {
          that.map.getSource(sourceId).setData(data);
        });
      };

      var layerSets = [];
      group = this.getLayerGroupById(layerGroupId);
      for (var i=0; i < group.sources.length; i++) {
        sourceId = group.sources[i];
        groupOptions = this.getLayerGroupOptionsBySourceId(sourceId);
        // Select correct layerset (only one per layer)
        if (layerSetId && groupOptions.layerset.indexOf(layerSetId) != -1) {
          layersetId = layerSetId;
        } else {
          layersetId = group.layerset[i];
        }
        layerSets.push(glapi.getLayerset(sourceId, layersetId));
        if (groupOptions.type == 'geojson') {
          updateGeoJSONSource(sourceId);
        }
      }
      return $.when.all(layerSets).then(function(layersets) {
        for (var k=0; k < layersets.length; k++) {
          if (layersets[k][0]) {
            that.addLayerset(layersets[k][0].layers, layerGroupId, beforeLayerId);
          } else {
            // When we only have one source
            that.addLayerset(layersets[k].layers, layerGroupId, beforeLayerId);
            break;
          }
        }
      });
    };

    this.updateLayerset = function(layerGroupId, layersetId) {
      var that, style, group, sourceId;
      that = this;
      style = this.map.getStyle();
      group = this.getLayerGroupById(layerGroupId);
      sourceId = group.sources[group.alternatives.indexOf(true)];
      glapi.getLayerset(sourceId, layersetId).then(function(data) {
        var beforLayerId;
        for (var i=0; i < style.layers.length; i++) {
          var groupId = style.layers[i].metadata.groupId;
          var srcId = style.layers[i].source;
          if (layerGroupId == groupId && srcId == sourceId) {
            var layerId = style.layers[i].id;
            that.map.removeLayer(layerId);
            if (i + 1 == style.layers.length) {
              beforeLayerId = undefined;
            } else if (i < style.layers.length) {
              beforeLayerId = style.layers[i].id;
            }
          }
        }
        that.addLayerset(data.layers, layerGroupId, beforeLayerId);
      });
    };

    this.getLayersIds = function(layerGroupId, layersetId) {
      var style = this.map.getStyle();
      var group = this.getLayerGroupById(layerGroupId);
      var sourceId = group.sources[(group.interactions || []).indexOf(true)];
      if (!sourceId) {
        return $.when([]);
      }
      return glapi.getLayerset(sourceId, layersetId).then(function(data) {
        var layersIds = [];
        style.layers.forEach(function(layer) {
          if (layerGroupId == layer.metadata.groupId &&
              sourceId == layer.source) {
            layersIds.push(layer.id);
          }
        });
        return layersIds;
      });
    };

    this.removeLayerGroup = function(groupId) {
      var style, groupId, layer, removing, beforeLayerId;
      removing = false;
      style = this.map.getStyle();
      for (var i=0; i < style.layers.length; i++) {
        layer =  style.layers[i];
        if (layer.metadata.groupId == groupId) {
          removing = true;
          this.map.removeLayer(layer.id);
        } else if (removing) {
          beforeLayerId = layer.id;
          break;
        }
      }
      return beforeLayerId;
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
