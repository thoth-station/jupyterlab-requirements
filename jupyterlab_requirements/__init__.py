# jupyterlab-requirements
# Copyright(C) 2020 Francesco Murdaca
#
# This program is free software: you can redistribute it and / or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program. If not, see <http://www.gnu.org/licenses/>.

"""Dependency manager for JupyterLab notebook."""

import json
import os.path as osp

from jupyter_server.utils import url_path_join

from .dependency_management import DependenciesFilesHandler, PipenvHandler
from .dependency_management import ThothConfigHandler, ThothAdviseHandler
from .dependency_management import JupyterKernelHandler, DependencyInstalledHandler, DependencyInstallHandler

HERE = osp.abspath(osp.dirname(__file__))

__name__ = "jupyterlab-requirements"
__version__ = "0.0.1"

with open(osp.join(HERE, 'labextension', 'package.json')) as fid:
    data = json.load(fid)


def _jupyter_labextension_paths():
    return [{
        'src': 'labextension',
        'dest': data['name']
    }]


def _jupyter_server_extension_paths():
    return [{
        "module": "jupyterlab_requirements"
    }]


def _load_jupyter_server_extension(server_app):
    """Register the API handler to receive HTTP requests from the frontend extension."""
    web_app = server_app.web_app
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]

    url_path = "jupyterlab-requirements"

    # Prepend the base_url so that it works in a jupyterhub setting
    handlers = [
        (url_path_join(base_url, f"{url_path}/thoth/config"), ThothConfigHandler),
        (url_path_join(base_url, f"{url_path}/thoth/resolution"), ThothAdviseHandler),
        (url_path_join(base_url, f"{url_path}/pipenv"), PipenvHandler),
        (url_path_join(base_url, f"{url_path}/kernel/packages"), DependencyInstalledHandler),
        (url_path_join(base_url, f"{url_path}/kernel/install"), DependencyInstallHandler),
        (url_path_join(base_url, f"{url_path}/kernel/create"), JupyterKernelHandler),
        (url_path_join(base_url, f"{url_path}/file/dependencies"), JupyterKernelHandler),
    ]
    web_app.add_handlers(host_pattern, handlers)

    server_app.log.info(f"Registered JupyterLab extension at URL {url_path}")
