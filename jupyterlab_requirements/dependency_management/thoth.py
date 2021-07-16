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
from .lib import lock_dependencies_with_thoth
from tornado import web

from thoth.python import Pipfile

_LOGGER = logging.getLogger("jupyterlab_requirements.thoth")


class ThothAdviseHandler(DependencyManagementBaseHandler):
    """Thoth handler to receive optimized software stack."""

    @web.authenticated
    def post(self):
        """Post method for class."""
        input_data = self.get_json_body()

        task_index = self._tasks.create_task(self.lock_using_thoth, input_data)

        self.redirect_to_task(task_index)

    async def lock_using_thoth(self, input_data):
        """Lock dependencies using Thoth service."""
        config: str = input_data["thoth_config"]
        kernel_name: str = input_data["kernel_name"]
        timeout: int = input_data["thoth_timeout"]
        force: bool = input_data["thoth_force"]
        notebook_content: str = input_data["notebook_content"]
        requirements: dict = json.loads(input_data["requirements"])

        pipfile_string = Pipfile.from_dict(requirements).to_string()

        returncode, advise = lock_dependencies_with_thoth(
            config=config,
            kernel_name=kernel_name,
            timeout=timeout,
            force=force,
            notebook_content=notebook_content,
            pipfile_string=pipfile_string,
        )

        return returncode, advise
