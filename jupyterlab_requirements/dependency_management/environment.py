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

"""Dependency management API for jupyterlab requirements."""

import json
import os

from pathlib import Path

from jupyter_server.base.handlers import APIHandler
from tornado import web

from thamos.cli import install


class DependencyManagementHandler(APIHandler):
    """Dependency management handler to handle dependencies."""

    @web.authenticated
    def get(self):
        """Get list of packages installed."""
        packages_installed = list_installed_packages()
        self.finish(json.dumps({
            "data": packages_installed
        }))

    @web.authenticated
    def post(self):
        """Install packages using selected package manager."""
        initial_path = Path.cwd()
        input_data = self.get_json_body()
        notebook_path: str = input_data["notebook_path"]

        os.chdir(os.path.dirname(notebook_path))

        # TODO: Create new virtualenv and install packages

        package_manager: str = 'micropipenv'
        # TODO: Check if micropipenv is installed
        self.log(f"Installing requirements using {package_manager}." )
        install()

        os.chdir(initial_path)
        self.finish(json.dumps({
            "message": "installed with micropipenv"
        }))


def list_installed_packages() -> dict:
    """List packages installed."""
    # this import has to be scoped
    from pip._internal.commands.list import get_installed_distributions, format_for_json

    packages = get_installed_distributions()
    packages = sorted(
        packages,
        key=lambda dist: dist.project_name.lower(),
    )

    class ListOptions:
        verbose  = False
        outdated = False

    return json.loads(format_for_json(packages, options=ListOptions))
