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

"""Requirements API for jupyterlab requirements."""

import json
import os
import logging

from pathlib import Path

from jupyter_server.base.handlers import APIHandler
from tornado import web

from thamos.cli import _load_files, _write_files

_LOGGER = logging.getLogger("jupyterlab_requirements.dependencies_files")


class DependenciesFilesHandler(APIHandler):
    """Dependencies files handler to store, extract software stack."""

    @web.authenticated
    def get(self):
        """Retrieve requirements files from local disk."""
        dependencies = {
            "error": False,
            "requirements": "",
            "requirements_lock": ""
        }

        requirements_format = "pipenv"

        try:
            project = _load_files(requirements_format=requirements_format)
            requirements = project.pipfile.to_dict()
            requirements_lock = project.pipfile_lock.to_dict()

            dependencies['requirements'] = requirements
            dependencies['requirements_lock'] = requirements_lock

        except Exception as e:
            _LOGGER.warning(e)
            dependencies["error"] = True

        self.finish(json.dumps(dependencies))

    @web.authenticated
    def post(self):
        """Store requirements file to disk."""
        initial_path = Path.cwd()
        input_data = self.get_json_body()

        kernel_name: str = input_data["kernel_name"]
        requirements: str = input_data["requirements"]
        requirements_lock: str = input_data["requirement_lock"]

        home = Path.home()
        complete_path = home.joinpath(".local/share/thoth/kernels")
        env_path = complete_path.joinpath(kernel_name)
        env_path.mkdir(parents=True, exist_ok=True)

        os.chdir(os.path.dirname(env_path))

        requirements_format = "pipenv"

        _write_files(
            requirements=json.loads(requirements),
            requirements_lock=json.loads(requirements_lock),
            requirements_format=requirements_format
        )

        os.chdir(initial_path)
        self.finish(json.dumps({
            "message": f"Successfully stored requirements at {env_path}!"
        }))
