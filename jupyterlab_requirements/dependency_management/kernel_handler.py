# jupyterlab-requirements
# Copyright(C) 2020, 2021 Francesco Murdaca
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

"""Create new kernel API for jupyterlab requirements."""

import json
import logging
import subprocess

from jupyter_server.base.handlers import APIHandler
from tornado import web
from pathlib import Path

from .lib import create_kernel
from .lib import delete_kernel


_LOGGER = logging.getLogger("jupyterlab_requirements.kernel_handler")


class JupyterKernelHandler(APIHandler):
    """Jupyter Kernel handler to create new kernel for notebooks."""

    @web.authenticated
    def post(self):
        """POST request for JupyterKernelHandler."""
        input_data = self.get_json_body()

        kernel_name: str = input_data["kernel_name"]

        kernels_path: Path = Path.home().joinpath(".local/share/thoth/kernels")

        create_kernel(kernel_name=kernel_name, kernels_path=kernels_path)

        self.finish(json.dumps({"data": f"installed kernel {kernel_name} at {kernels_path}"}))

    @web.authenticated
    def get(self):
        """Get kernel list."""
        try:
            kernels_output = subprocess.run(
                "jupyter kernelspec list --json",
                shell=True,
                capture_output=True,
            )
            kernelspecs_str = kernels_output.stdout.decode("utf-8")
            _LOGGER.debug(kernelspecs_str)

        except Exception as e:
            _LOGGER.error(f"Could not get kernels available: {e}")

        kernelspecs_json = json.loads(kernelspecs_str)
        kernels = []
        for kernelspec in kernelspecs_json["kernelspecs"]:
            # Default kernel is filtered.
            if kernelspec != "python3":
                kernels.append(kernelspec)

        self.finish(json.dumps(kernels))

    @web.authenticated
    def delete(self):
        """Delete selected kernel."""
        input_data = self.get_json_body()

        kernel_name: str = input_data["kernel_name"]

        {"message": "", "error": False}

        command_output = delete_kernel(kernel_name=kernel_name)

        if command_output.returncode == 0:
            self.finish(json.dumps({"message": f"{kernel_name} kernel successfully deleted", "error": False}))
        else:
            self.finish(
                json.dumps(
                    {"message": f"{kernel_name} kernel could not be deleted, please check pod logs", "error": True}
                )
            )
