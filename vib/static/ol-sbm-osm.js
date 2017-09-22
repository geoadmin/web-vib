
var params = (window.location.hash || window.location.search  || ' ').replace('?ts_hash=', '#').slice(1).split('/');
var x = parseFloat(params[2]) || 7.75;
var y = parseFloat(params[1]) || 46.7;
var z = parseFloat(params[0]) || 7;
var center = (-180 <= x && x <= 180 && -90 <= y && y <= 90) ?
    ol.proj.fromLonLat([x, y]) :
[x, y];


// https://tileserver.dev.bgdi.ch/styles/swissbasemap-osm-integrated.json
var key = "pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiRk1kMWZaSSJ9.E5BkluenyWQMsBLsuByrmg";

var resolutionsView = [];
for (var i = 0; i <= 20; ++i) {
  resolutionsView.push(78271.51696402048 / Math.pow(2, i));
}
var resolutionsWmts = [];
for (var i = 0; i <= 22; ++i) {
  resolutionsWmts.push(156543.03392804097 / Math.pow(2, i));
}

// TIlegrid for mbtiles
var resolutionsMvt = [];
for (var i = 0; i <= 14; ++i) {
  resolutionsMvt.push(78271.51696402048 / Math.pow(2, i));
}
var tileGridMvt = new ol.tilegrid.TileGrid({
  extent: ol.proj.get('EPSG:3857').getExtent(),
  resolutions: resolutionsMvt,
  tileSize: 512
});

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      opacity: 0.3,
      source: new ol.source.XYZ({
        url: 'https://tileserver.dev.bgdi.ch/data/hillshade-europe-mbtiles/{z}/{x}/{y}.png',
        tileGrid: tileGridMvt,
        maxZoom: 14
      })
    }),
    new ol.layer.Tile({
      opacity: 0,
      source: new ol.source.XYZ({
        url: 'https://wmts10.geo.admin.ch/1.0.0/ch.swisstopo.swissalti3d-reliefschattierung/default/current/3857/{z}/{x}/{y}.png',
        tileGrid: new ol.tilegrid.TileGrid({
          extent: ol.proj.get('EPSG:3857').getExtent(),
          resolutions: resolutionsWmts,
          tileSize: 256
        })
      })
    }),
    /*new ol.layer.VectorTile({
      source: new ol.source.VectorTile({
        format: new ol.format.MVT(),
        url: 'https://tileserver.dev.bgdi.ch/data/osm-europe-cut-mbtiles/{z}/{x}/{y}.pbf',
        //tileGrid: tileGridMvt,
        maxZoom: 14
      })
    }),*/
  ],
  target: "map",
  controls: [
    new ol.control.Zoom({delta: 0.55})
  ]
});
var layers = map.getLayers().getArray();

map.on('moveend', function() {
  var z = map.getView().getZoom();
  $('.zoom-control input').val(z);
  var op =((z >= 17) ? 0.1 : 0.3);
  layers[1].setOpacity(op);

  op = ((z >= 9) ? ((z >= 17) ? 0.1 : 0.2) : 0.3);
  layers[0].setOpacity(op);

  var center = map.getView().getCenter();
  var centerLonLat = ol.proj.toLonLat(center);
  var hash = '?ts_hash=' + z + '/' + centerLonLat[1] + '/' + centerLonLat[0];
  history.pushState({}, '', window.location.pathname + hash);
});


var ZoomControl = function(opt_options) {

  var options = opt_options || {};
  var input = document.createElement('input');
  input.innerHTML = '';

  var this_ = this;
  var handleZ = function(evt) {
    var z = parseFloat(this.value);
    if (z) {
      this_.getMap().getView().setZoom(z);
    }
  };
  input.addEventListener('blur', handleZ, false);

  var element = document.createElement('div');
  element.className = 'zoom-control ol-unselectable ol-control';
  element.appendChild(input);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });
};
ol.inherits(ZoomControl, ol.control.Control);
map.addControl(new ZoomControl());


var load = function(mbConfig, mbTilesUrl, mbTilesLayer) {
  var vt = new ol.layer.VectorTile({
    visible: true,
    source: new ol.source.VectorTile({
      format: new ol.format.MVT(),
      url: mbTilesUrl,
      maxZoom: 15
    })
  })
  map.addLayer(vt);

  fetch(mbConfig).then(function(style) {
    var ft = ['Helvetica'];
    style.json().then(function(glStyle) {
      fetch('../static/data/ol-sbm-osm-sprite.json').then(function(spriteData) {
        spriteData.json().then(function(glSpriteData) {
          //mb2olstyle(layers[2], glStyle, 'osm', undefined, glSpriteData, 'https://vtiles.geops.ch/styles/inspirationskarte/sprite.png', ft);
          mb2olstyle(layers[2], glStyle, mbTilesLayer, undefined, glSpriteData, 'https://vtiles.geops.ch/styles/inspirationskarte/sprite.png', ft);
          map.setView(new ol.View({
            center: center,
            zoom: z,
            resolutions: resolutionsView
          }));
        });
      });
    });
  });
};