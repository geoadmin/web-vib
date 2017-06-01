import os
import boto3
import json
import gzip
import uuid
import requests
import cStringIO
from flask import Flask, Blueprint, render_template, abort, request, jsonify, make_response
from botocore.exceptions import ClientError
from jinja2 import TemplateNotFound


def get_s3_client():
    s3_session = boto3.Session(
        aws_access_key_id=os.environ.get('VIB_ACCESS_KEY'),
        aws_secret_access_key=os.environ.get('VIB_SECRET_KEY')
    )
    return s3_session.client('s3')


app = Flask(__name__)
BUCKET_NAME = os.environ.get('VIB_BUCKET_NAME', None)
# Avoid crashing the app for those who don't have the credentials
if BUCKET_NAME:
    s3_client = get_s3_client()
pages = Blueprint('pages', __name__, template_folder='templates', static_folder='static')


def get_style_path(style_id):
    return 'styles/%s' % style_id


def gzip_data(data):
    compressed = cStringIO.StringIO()
    gz = gzip.GzipFile(fileobj=compressed, mode='w', compresslevel=5)
    gz.write(data)
    gz.close()
    compressed.seek(0)
    return compressed


def get_s3_style(style_id):
    try:
        s3_object = s3_client.get_object(Bucket=BUCKET_NAME, Key=get_style_path(style_id))
    except ClientError as e:
        if e.response['Error']['Code'].endswith('NotFound'):
            abort(404, 'Style %s was not found' % style_id)
        abort(500, 'Internal server error while trying to retrieve %s \n\nError: %s' % (style_id, e))
    return s3_object


def put_s3_style(json_style, style_id=None):
    if not style_id:
        style_id = str(uuid.uuid1())
    try:
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=get_style_path(style_id),
            Body=json_style,
            ContentEncoding='gzip')
    except ClientError as e:
        abort(500, 'Internal server error while inserting style %s. \n\nError: %s' % (style_id, e))
    return style_id


@app.after_request
def after_request(response):
    response.headers.add('Cache-Control', 'no-cache')
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


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
@app.route('/extractSource/<string:source_id>/<string:style_id>', defaults={'new_source_id': None})
@app.route('/extractSource/<string:source_id>/<string:style_id>/<string:new_source_id>')
def extract_source(source_id, style_id, new_source_id):
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


@app.route('/glstyles', methods=['POST'])
def save_style():
    json_style = request.data
    style_id = put_s3_style(json_style)
    return jsonify({'styleId': style_id})


@app.route('/glstyles/<string:style_id>', methods=['PUT'])
def update_style(style_id):
    json_style = request.data
    style_id = put_s3_style(json_style, style_id)
    return json.dumps({'styleId': style_id})


@app.route('/glstyles/<string:style_id>', methods=['GET'])
def get_style(style_id):
    style = get_s3_style(style_id)
    response = make_response(style['Body'].read())
    response.headers['Content-Type'] = 'application/json'
    # Because of https://github.com/Miserlou/Zappa/issues/699
    # We can't have CORS and binary support at the same time
    #response.headers['Content-Encoding'] = 'gzip'
    return response
