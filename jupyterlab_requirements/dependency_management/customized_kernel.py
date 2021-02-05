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

"""Create new kernel API for jupyterlab requirements."""

import json
import logging
import subprocess

from pathlib import Path

from jupyter_server.base.handlers import APIHandler
from tornado import web


_LOGGER = logging.getLogger("jupyterlab_requirements.customized_kernel")


class JupyterKernelHandler(APIHandler):
    """Jupyter Kernel handler to create new kernel for notebooks."""

    @web.authenticated
    def post(self):
        """Create kernel using new virtual environment."""
        input_data = self.get_json_body()

        kernel_name: str = input_data["kernel_name"]

        home = Path.home()
        complete_path = home.joinpath(".local/share/thoth/kernels")

        _LOGGER.info(f"Setting new jupyter kernel {kernel_name} from {complete_path}/{kernel_name}." )

        # TODO: Check if ipykernel is installed, otherwise install it
        # _ = subprocess.run(
        #     f". {kernel_name}/bin/activate && pip show ipykernel",
        #     shell=True,
        #     capture_output=True,
        #     cwd=complete_path
        # )

        _ = subprocess.run(f". {kernel_name}/bin/activate && pip install ipykernel", shell=True, cwd=complete_path)

        _LOGGER.debug(f"Installing kernelspec called {kernel_name}." )

        try:
            process_output = subprocess.run(
                f". {kernel_name}/bin/activate && ipython kernel install --user"
                f" --name={kernel_name} --display-name 'Python ({kernel_name})'",
                shell=True,
                cwd=complete_path,
                capture_output=True,
            )
            _LOGGER.info(process_output.stdout.decode("utf-8"))

        except Exception as e :
            _LOGGER.error(f"Could not enter environment {e}")

        self.finish(json.dumps({
            "data": f"installed kernel {kernel_name} at {complete_path}"
        }))
