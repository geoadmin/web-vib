import json
import requests
from flask import Flask, Blueprint, render_template, abort
from jinja2 import TemplateNotFound


app = Flask(__name__)
pages = Blueprint('pages', __name__, template_folder='templates', static_folder='static')


@pages.route('/', defaults={'page': 'index'})
@pages.route('/<page>')
def show(page):
    print page
    try:
        return render_template('%s' % page)
    except TemplateNotFound:
        abort(404)


app.register_blueprint(pages)


# This service will download the target style and remove all sources and layers different from the target source_id
@app.route('/update/<string:source_id>/<string:style_id>', defaults={'new_source_id': None})
@app.route('/update/<string:source_id>/<string:style_id>/<string:new_source_id>')
def update_style(source_id, style_id, new_source_id):
    layer_id = None
    base_url = 'https://api.mapbox.com/styles/v1/vib2d/'
    access_token = 'pk.eyJ1IjoidmliMmQiLCJhIjoiY2l5eTlqcGtoMDAwZzJ3cG56emF6YmRoOCJ9.lP3KfJVHrUHp7DXIQrZYMw'
    url = '%s%s?access_token=%s' % (base_url, style_id, access_token)
    print url
    r = requests.get(url, verify=False)
    if not r.ok:
        abort(404, 'Style %s not Found' % style_id)
    style = json.loads(r.content)
    for k, s in style['sources'].iteritems():
        if 'url' in s and s['url'].endswith(source_id):
            layer_id = k
            if new_source_id:
                s['url'] = 'mapbox://vib2d.' + new_source_id
            sources = { k: s }
            break
    if not layer_id:
        print source_id, style_id
        abort(400, 'Source %s not in style %s' % (source_id, style_id))

    if new_source_id:
        layers = []
        for l in style['layers']:
            if 'url' in l and l['source'].endswith(layer_id):
                l['source'] = k
                layers.append(l)
    else:
        layers = [l for l in style['layers'] if 'source' in l and l['source'].endswith(layer_id)]
    style['sources'] = sources
    style['layers'] = layers
    return json.dumps(style)
