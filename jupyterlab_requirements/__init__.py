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
from pathlib import Path

from jupyter_server.utils import url_path_join

from .dependency_management import YamlSpecHandler, DependencyManagementBaseHandler
from .dependency_management import DependenciesFilesHandler, PipenvHandler, PythonVersionHandler, RootPathHandler
from .dependency_management import ThothConfigHandler, ThothAdviseHandler, ThothInvectioHandler
from .dependency_management import JupyterKernelHandler, DependencyInstalledHandler, DependencyInstallHandler

HERE = Path(__file__).parent.resolve()

__version__ = "0.7.3"

with (HERE / "labextension" / "package.json").open() as fid:
    data = json.load(fid)


def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": data["name"]}]


def _jupyter_server_extension_points():
    return [{"module": "jupyterlab_requirements"}]


def _jupyter_server_extension_paths():
    """Jupyter Server Extension Paths.

    Returns a list of dictionaries with metadata describing
    where to find the `_load_jupyter_server_extension` function.
    """
    return [{"module": "jupyterlab_requirements"}]


def _load_jupyter_server_extension(lab_app):
    """Register the API handler to receive HTTP requests from the frontend extension.

    Parameters
    ----------
    lab_app: jupyterlab.labapp.LabApp
        JupyterLab application instance

    """
    web_app = lab_app.web_app
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]

    url_path = "jupyterlab_requirements"

    # Prepend the base_url so that it works in a jupyterhub setting
    custom_handlers = [
        (
            url_path_join(base_url, r"/jupyterlab_requirements/{}".format(YamlSpecHandler.get_resource_metadata()[0])),
            YamlSpecHandler,
        ),
        (url_path_join(base_url, f"/{url_path}/thoth/config"), ThothConfigHandler),
        (url_path_join(base_url, f"/{url_path}/thoth/resolution"), ThothAdviseHandler),
        (url_path_join(base_url, f"/{url_path}/thoth/invectio"), ThothInvectioHandler),
        (url_path_join(base_url, f"/{url_path}/pipenv"), PipenvHandler),
        (url_path_join(base_url, f"/{url_path}/kernel/packages"), DependencyInstalledHandler),
        (url_path_join(base_url, f"/{url_path}/kernel/install"), DependencyInstallHandler),
        (url_path_join(base_url, f"/{url_path}/kernel/python"), PythonVersionHandler),
        (url_path_join(base_url, f"/{url_path}/kernel/create"), JupyterKernelHandler),
        (url_path_join(base_url, f"/{url_path}/file/directory"), RootPathHandler),
        (url_path_join(base_url, f"/{url_path}/file/dependencies"), DependenciesFilesHandler),
        (
            url_path_join(base_url, r"/jupyterlab_requirements/jupyterlab_requirements/tasks/%s" % r"(?P<index>\d+)"),
            DependencyManagementBaseHandler,
        ),  # GET / DELETE
    ]

    web_app.add_handlers(host_pattern, custom_handlers)

    lab_app.log.info(f"Registered JupyterLab extension at URL {url_path}")


# Reference the old function name with the new function name.
load_jupyter_server_extension = _load_jupyter_server_extension
