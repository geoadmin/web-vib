from flask import Flask, Blueprint, render_template, abort
from jinja2 import TemplateNotFound


pages = Blueprint('pages', __name__, template_folder='templates', static_folder='static')


@pages.route('/', defaults={'page': 'index'})
@pages.route('/<page>')
def show(page):
    print page
    try:
        return render_template('%s' % page)
    except TemplateNotFound:
        abort(404)


app = Flask(__name__)
app.register_blueprint(pages)
