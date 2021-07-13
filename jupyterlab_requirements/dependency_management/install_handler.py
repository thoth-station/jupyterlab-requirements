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

"""Install API for jupyterlab requirements."""

import logging

from .base import DependencyManagementBaseHandler
from .lib import install_packages
from tornado import web

_LOGGER = logging.getLogger("jupyterlab_requirements.install_handler")


class DependencyInstallHandler(DependencyManagementBaseHandler):
    """Dependency management handler to install dependencies."""

    @web.authenticated
    def post(self):
        """Post method for class."""
        input_data = self.get_json_body()

        task_index = self._tasks.create_task(self.install_dependencies, input_data)

        self.redirect_to_task(task_index)

    async def install_dependencies(self, input_data):
        """Install packages using selected package manager."""
        kernel_name: str = input_data["kernel_name"]
        resolution_engine: str = input_data["resolution_engine"]

        install_packages(kernel_name=kernel_name, resolution_engine=resolution_engine)

        result = {"message": "installed with micropipenv", "kernel_name": kernel_name, "error": False}

        return 0, result
