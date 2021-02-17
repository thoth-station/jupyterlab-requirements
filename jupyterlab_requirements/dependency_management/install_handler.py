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

"""Install API for jupyterlab requirements."""

import json
import os
import subprocess
import logging
from virtualenv import cli_run

from pathlib import Path

from jupyter_server.base.handlers import APIHandler
from tornado import web

_LOGGER = logging.getLogger("jupyterlab_requirements.install_handler")


class DependencyInstallHandler(APIHandler):
    """Dependency management handler to install dependencies."""

    @web.authenticated
    def post(self):
        """Install packages using selected package manager."""
        initial_path = Path.cwd()
        input_data = self.get_json_body()
        kernel_name: str = input_data["kernel_name"]
        _LOGGER.info(f"kernel_name selected: {kernel_name}")

        home = Path.home()
        complete_path = home.joinpath(".local/share/thoth/kernels")

        os.chdir(os.path.dirname(complete_path))
        env_name = kernel_name
        env_path = complete_path.joinpath(env_name)

        env_path.mkdir(parents=True, exist_ok=True)

        package_manager: str = 'micropipenv'

        # TODO: Check if micropipenv is installed
        _LOGGER.info(f"Installing requirements using {package_manager} in virtualenv at {env_path}." )

        #1. Creating new environment
        cli_run([str(env_path)])

        #2. Install using micropipenv
        _ = subprocess.call(
            f". {kernel_name}/bin/activate "
            f"&& cd {kernel_name} && micropipenv install --dev", shell=True, cwd=complete_path)

        os.chdir(initial_path)
        self.finish(json.dumps({
            "message": "installed with micropipenv",
            "kernel_name": env_name
        }))
