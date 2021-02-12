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
import subprocess

from pathlib import Path

from jupyter_server.base.handlers import APIHandler
from tornado import web

from thamos.cli import _load_files
from thoth.python import Project

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

        # Path of the repo where we need to store
        path_to_store: str = input_data["path_to_store"]
        using_home_path_base: bool = input_data["using_home_path_base"]

        kernel_name: str = input_data["kernel_name"]
        requirements: str = input_data["requirements"]
        requirements_lock: str = input_data["requirement_lock"]

        home = Path.home()

        if using_home_path_base:
            complete_path = home.joinpath(path_to_store)
        else:
            git_root = _get_git_root()
            complete_path = Path(git_root).joinpath(path_to_store)

        _LOGGER.info("path to store dependencies is: %r", complete_path.as_posix())

        env_path = complete_path.joinpath(kernel_name)
        env_path.mkdir(parents=True, exist_ok=True)

        os.chdir(os.path.dirname(env_path))

        requirements_format = "pipenv"

        project = Project.from_strings(requirements, requirements_lock)

        pipfile_path = env_path.joinpath("Pipfile")
        pipfile_lock_path = env_path.joinpath("Pipfile.lock")

        if requirements_format == "pipenv":
            _LOGGER.debug("Writing to Pipfile/Pipfile.lock in %r", env_path)
            project.to_files(
                pipfile_path=pipfile_path,
                pipfile_lock_path=pipfile_lock_path
            )

        os.chdir(initial_path)
        self.finish(json.dumps({
            "message": f"Successfully stored requirements at {env_path}!"
        }))


def _get_git_root():
    return subprocess.Popen(
        ['git', 'rev-parse', '--show-toplevel'],
        stdout=subprocess.PIPE
    ).communicate()[0].rstrip().decode('utf-8')
