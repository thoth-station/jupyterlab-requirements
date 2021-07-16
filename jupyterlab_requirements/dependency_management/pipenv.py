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

"""Thoth API for jupyterlab requirements."""

import json
import logging

from .base import DependencyManagementBaseHandler
from .lib import lock_dependencies_with_pipenv
from tornado import web

from thoth.python import Pipfile

_LOGGER = logging.getLogger("jupyterlab_requirements.pipenv")


class PipenvHandler(DependencyManagementBaseHandler):
    """pipenv handler to receive optimized software stack."""

    @web.authenticated
    def post(self):
        """Post method for class."""
        input_data = self.get_json_body()

        task_index = self._tasks.create_task(self.lock_using_pipenv, input_data)

        self.redirect_to_task(task_index)

    async def lock_using_pipenv(self, input_data):
        """Lock and install dependencies using pipenv."""
        kernel_name: str = input_data["kernel_name"]
        requirements: dict = json.loads(input_data["requirements"])
        pipfile_string = Pipfile.from_dict(requirements).to_string()

        returncode, result = lock_dependencies_with_pipenv(kernel_name=kernel_name, pipfile_string=pipfile_string)

        return returncode, result
