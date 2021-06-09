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
import subprocess
import logging

from pathlib import Path

from thamos.discover import discover_python_version

from jupyter_server.base.handlers import APIHandler
from tornado import web

_LOGGER = logging.getLogger("jupyterlab_requirements.discover_handler")


class DependencyInstalledHandler(APIHandler):
    """Dependency management handler to discover dependencies installed."""

    @web.authenticated
    def post(self):
        """Discover list of packages installed."""
        input_data = self.get_json_body()

        kernel_name: str = input_data["kernel_name"]

        home = Path.home()

        complete_path = home.joinpath(".local/share/thoth/kernels")

        process_output = subprocess.run(
            f". {kernel_name}/bin/activate && pip list", shell=True, capture_output=True, cwd=complete_path
        )

        processed_list = process_output.stdout.decode("utf-8").split("\n")[2:]
        packages = {}

        for processed_package in processed_list:
            if processed_package:
                package_version = [el for el in processed_package.split(" ") if el != ""]
                packages[package_version[0]] = package_version[1]

        self.finish(json.dumps(packages))


class PythonVersionHandler(APIHandler):
    """Dependency management handler to discover Python version present."""

    @web.authenticated
    def get(self):
        """Discover python version available."""
        python_version = discover_python_version()

        self.finish(json.dumps(python_version))


class RootPathHandler(APIHandler):
    """Discover root for the project."""

    @web.authenticated
    def get(self):
        """Discover root directory of the project."""
        try:
            process_output = subprocess.run("git rev-parse --show-toplevel", capture_output=True, shell=True)
            git_root = process_output.stdout.decode("utf-8").strip()
            complete_path = Path(git_root)
            _LOGGER.info("complete path used is: %r", complete_path.as_posix())

        except Exception as not_git_exc:
            _LOGGER.error(
                "Using home path because there was an error to identify root of git repository: %r", not_git_exc
            )
            complete_path = Path.home()

        self.finish(json.dumps(complete_path.as_posix()))
