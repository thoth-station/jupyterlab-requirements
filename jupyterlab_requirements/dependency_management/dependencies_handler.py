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
import subprocess
import logging
from virtualenv import cli_run

from pathlib import Path

from jupyter_server.base.handlers import APIHandler
from tornado import web

_LOGGER = logging.getLogger("jupyterlab_requirements.dependencies_handler")


class DependencyInstalledHandler(APIHandler):
    """Dependency management handler to discover dependencies installed."""

    @web.authenticated
    def post(self):
        """Discover list of packages installed."""
        initial_path = Path.cwd()
        input_data = self.get_json_body()
        notebook_path: str = input_data["notebook_path"]
        kernel_name: str = input_data["kernel_name"]

        complete_path = initial_path.joinpath(Path(notebook_path).parent)

        os.chdir(os.path.dirname(complete_path))

        process_output = subprocess.run(
            f". {kernel_name}/bin/activate && pip list",
            shell=True,
            capture_output=True,
            cwd=complete_path
        )
        processed_list = process_output.stdout.decode("utf-8").split('\n')[2:]
        packages = {}
        for processed_package in processed_list:
            if processed_package:
                package_version = [el for el in processed_package.split(' ') if el != '']
                packages[package_version[0]] = package_version[1]

        os.chdir(initial_path)
        self.finish(json.dumps(packages))

class DependencyInstallHandler(APIHandler):
    """Dependency management handler to install dependencies."""

    @web.authenticated
    def post(self):
        """Install packages using selected package manager."""
        initial_path = Path.cwd()
        input_data = self.get_json_body()
        notebook_path: str = input_data["notebook_path"]
        kernel_name: str = input_data["kernel_name"]

        complete_path = initial_path.joinpath(Path(notebook_path).parent)

        os.chdir(os.path.dirname(complete_path))
        env_name = kernel_name
        env_path = complete_path.joinpath(env_name)

        package_manager: str = 'micropipenv'
        # TODO: Check if micropipenv is installed
        print(f"Installing requirements using {package_manager}." )

        #1. Creating new environment
        cli_run([str(env_path)])

        #2. Install using micropipenv
        process_output = subprocess.call(f". {env_name}/bin/activate && micropipenv install --dev", shell=True, cwd=complete_path)

        os.chdir(initial_path)
        self.finish(json.dumps({
            "message": "installed with micropipenv",
            "kernel_name": env_name
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

    list_packages = json.loads(format_for_json(packages, options=ListOptions))
    return { element['name']: element['version'] for element in list_packages}
