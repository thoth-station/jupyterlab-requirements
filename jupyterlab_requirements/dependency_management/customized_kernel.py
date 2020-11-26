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

from jupyter_server.base.handlers import APIHandler
from tornado import web

from ipykernel.kernelspec import install

_LOGGER = logging.getLogger("jupyterlab_requirements.customized_kernel")


class CustomizedKernelHandler(APIHandler):
    """Customized Kernel handler to create new kernel for jupyter."""

    @web.authenticated
    def post(self):
        """Install packages using selected package manager."""
        input_data = self.get_json_body()

        kernel_name: str = input_data["kernel_name"]

        # TODO: Check if ipykernel is installed

        _LOGGER.debug(f"Installing kernelspec called {kernel_name}." )
        kernel_path = install(kernel_name=kernel_name, user=True)

        self.finish(json.dumps({
            "data": f"installed kernel {kernel_name} at {kernel_path}"
        }))
        self.flush()
