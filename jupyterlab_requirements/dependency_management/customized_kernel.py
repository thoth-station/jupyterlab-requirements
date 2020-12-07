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

import os
import json
import logging
import subprocess

from pathlib import Path
from daiquiri import output

from jupyter_server.base.handlers import APIHandler
from tornado import web

from ipykernel.kernelspec import install

_LOGGER = logging.getLogger("jupyterlab_requirements.customized_kernel")


class JupyterKernelHandler(APIHandler):
    """Jupyter Kernel handler to create new kernel for notebooks."""

    @web.authenticated
    def post(self):
        """Create kernel using new virtual environment."""
        initial_path = Path.cwd()
        input_data = self.get_json_body()

        notebook_path: str = input_data["notebook_path"]
        kernel_name: str = input_data["kernel_name"]

        complete_path = initial_path.joinpath(Path(notebook_path).parent)
        os.chdir(os.path.dirname(complete_path))

        # TODO: Check if ipykernel is installed, otherwise install it
        process_output = subprocess.run(f". {kernel_name}/bin/activate && pip show ipykernel", shell=True, capture_output=True, cwd=complete_path)
        print(process_output.stdout)
        process_output = subprocess.run(f". {kernel_name}/bin/activate && pip install ipykernel", shell=True, cwd=complete_path)

        _LOGGER.debug(f"Installing kernelspec called {kernel_name}." )

        try:
            # Create new kernel
            # process_output = subprocess.call(
            #     f". {kernel_name}/bin/activate && ./{kernel_name}/bin/python3"
            #     f" -m ipykernel install --user --name={kernel_name} --display-name 'Python ({kernel_name})'", shell=True, cwd=complete_path)
            process_output = subprocess.run(f". {kernel_name}/bin/activate && ipython kernel install --user --name={kernel_name} --display-name 'Python ({kernel_name})'", shell=True, cwd=complete_path)

        except Exception as e :
            print(f"Could not enter environment {e}")


        os.chdir(initial_path)
        self.finish(json.dumps({
            "data": f"installed kernel {kernel_name} at {complete_path}"
        }))
