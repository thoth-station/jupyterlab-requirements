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
import os
import logging
from typing import Dict, Any

from pathlib import Path

from .base import DependencyManagementBaseHandler
from .lib import lock_dependencies_with_thoth
from .lib import update_runtime_environment_in_thoth_config
from tornado import web
from thamos.cli import _parse_labels

from thoth.python import Pipfile

_LOGGER = logging.getLogger("jupyterlab_requirements.thoth")


class ThothAdviseHandler(DependencyManagementBaseHandler):
    """Thoth handler to receive optimized software stack."""

    @web.authenticated
    def post(self):  # type: ignore
        """Post method for class."""
        input_data = self.get_json_body()

        task_index = self._tasks.create_task(self.lock_using_thoth, input_data)

        self.redirect_to_task(task_index)

    async def lock_using_thoth(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Lock dependencies using Thoth service."""
        initial_path = Path.cwd()

        config: str = input_data["thoth_config"]
        kernel_name: str = input_data["kernel_name"]
        os_name: str = input_data["os_name"]
        os_version: str = input_data["os_version"]
        python_version: str = input_data["python_version"]
        recommendation_type: str = input_data["recommendation_type"]
        timeout: int = input_data["thoth_timeout"]
        force: bool = input_data["thoth_force"]
        debug: bool = input_data["thoth_debug"]
        notebook_content: str = input_data["notebook_content"]
        labels: str = input_data["labels"]
        requirements: Dict[str, Any] = json.loads(input_data["requirements"])

        pipfile_string = Pipfile.from_dict(requirements).to_string()

        home = Path.home()
        store_path: Path = home.joinpath(".local/share/thoth/kernels")

        env_path = Path(store_path).joinpath(kernel_name)
        env_path.mkdir(parents=True, exist_ok=True)
        os.chdir(env_path)

        # update runtime environment in thoth config
        thoth_config_updated = update_runtime_environment_in_thoth_config(
            kernel=kernel_name,
            config=config,
            os_name=os_name,
            os_version=os_version,
            python_version=python_version,
            recommendation_type=recommendation_type,
        )

        os.chdir(initial_path)

        _, advise = lock_dependencies_with_thoth(
            config=thoth_config_updated,
            kernel_name=kernel_name,
            timeout=timeout,
            force=force,
            debug=debug,
            notebook_content=notebook_content,
            pipfile_string=pipfile_string,
            labels=_parse_labels(labels),
        )

        return advise
