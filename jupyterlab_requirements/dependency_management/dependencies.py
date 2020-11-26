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

from thoth.python import Project

_LOGGER = logging.getLogger("jupyterlab_requirements.dependencies")


class DependenciesHandler(APIHandler):
    """Dependencies handler to receive optimized software stack."""

    @web.authenticated
    def get(self):
        """Retrieve requirements files from local disk."""
        dependencies = {
            "error": False,
            "requirements": "",
            "requirements_lock": ""
        }

        try:
            project = Project.from_files()
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

        notebook_path: str = input_data["notebook_path"]
        requirements: str = input_data["requirements"]
        requirements_lock: str = input_data["requirement_lock"]

        os.chdir(os.path.dirname(notebook_path))

        requirements_format = "pipenv"

        _write_files(
            requirements=json.loads(requirements),
            requirements_lock=json.loads(requirements_lock),
            requirements_format=requirements_format
        )

        os.chdir(initial_path)
        self.finish(json.dumps({
            "message": f"Successfully stored requirements at {notebook_path}!"
        }))


def _write_files(
    requirements: str, requirements_lock: str, requirements_format: str
) -> None:
    """Write content of Pipfile/Pipfile.lock or requirements.in/txt to the current directory."""
    project = Project.from_strings(requirements, requirements_lock)
    if requirements_format == "pipenv":
        _LOGGER.debug("Writing to Pipfile/Pipfile.lock in %r", os.getcwd())
        project.to_files()
    elif requirements_format in ("pip", "pip-tools", "pip-compile"):
        _LOGGER.debug("Writing to requirements.in/requirements.txt in %r", os.getcwd())
        project.to_pip_compile_files()
        _LOGGER.debug("No changes to Pipfile to write")
    else:
        raise ValueError(
            f"Unknown requirements format, supported are 'pipenv' and 'pip': {requirements_format!r}"
        )
