# jupyterlab-requirements
# Copyright(C) 2021 Francesco Murdaca
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
import logging

from pathlib import Path

from jupyter_server.base.handlers import APIHandler
from tornado import web

from thoth.python import Project

_LOGGER = logging.getLogger("jupyterlab_requirements.dependencies_files_handler")


class DependenciesStoredHandler(APIHandler):
    """Dependencies files handler to retrieve dependencies files."""

    @web.authenticated
    def post(self):
        """Get requirements file from disk."""
        input_data = self.get_json_body()

        kernel_name: str = input_data["kernel_name"]
        home = Path.home()
        store_path: Path = home.joinpath(".local/share/thoth/kernels")

        env_path = Path(store_path).joinpath(kernel_name)

        _LOGGER.info("Path used to get dependencies is: %r", env_path.as_posix())

        requirements_format = "pipenv"

        pipfile_path = env_path.joinpath("Pipfile")
        pipfile_lock_path = env_path.joinpath("Pipfile.lock")

        if requirements_format == "pipenv":
            _LOGGER.debug("Get Pipfile/Pipfile.lock in %r", env_path)
            project = Project.from_files(pipfile_path=pipfile_path, pipfile_lock_path=pipfile_lock_path)

        requirements = project.pipfile.to_dict()
        requirements_locked = project.pipfile_lock.to_dict()

        self.finish(json.dumps({"requirements": requirements, "requirements_lock": requirements_locked}))
