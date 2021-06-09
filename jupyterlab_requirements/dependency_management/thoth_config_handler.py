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

"""Thoth Config API for jupyterlab requirements."""


import os
import json
import logging

from pathlib import Path
from jupyter_server.base.handlers import APIHandler
from tornado import web

from thamos.config import _Configuration


_LOGGER = logging.getLogger("jupyterlab_requirements.thoth_config_handler")


class ThothConfigHandler(APIHandler):
    """Thoth config handler for user requirements."""

    @web.authenticated
    def post(self):
        """Retrieve or create Thoth config file."""
        initial_path = Path.cwd()
        input_data = self.get_json_body()
        kernel_name: str = input_data["kernel_name"]

        home = Path.home()
        complete_path = home.joinpath(".local/share/thoth/kernels")
        env_path = complete_path.joinpath(kernel_name)
        env_path.mkdir(parents=True, exist_ok=True)

        os.chdir(env_path)

        _LOGGER.info(f"kernel_name selected: {kernel_name} and path: {env_path}")

        config = _Configuration()

        if not config.config_file_exists():
            _LOGGER.info("Thoth config does not exist, creating it...")
            try:
                config.create_default_config()
            except Exception as e:
                raise Exception("Thoth config file could not be created! %r", e)

        config.load_config()

        thoth_config = config.content
        _LOGGER.info("Thoth config: %r", thoth_config)
        os.chdir(initial_path)
        self.finish(json.dumps(thoth_config))

    @web.authenticated
    def put(self):
        """Update Thoth config file."""
        initial_path = Path.cwd()
        input_data = self.get_json_body()
        new_runtime_environment: str = input_data["runtime_environment"]
        force: bool = input_data["force"]
        complete_path: str = input_data["complete_path"]

        os.chdir(complete_path)

        configuration = _Configuration()

        if not configuration.config_file_exists():
            _LOGGER.info("Thoth config does not exist, creating it...")
            try:
                configuration.create_default_config()
            except Exception as e:
                raise Exception("Thoth config file could not be created! %r", e)

        configuration.set_runtime_environment(
            runtime_environment=new_runtime_environment, force=force  # TODO: force should be user choice?
        )
        configuration.save_config()

        _LOGGER.info("Updated Thoth config: %r", configuration.content)

        os.chdir(initial_path)
        self.finish(json.dumps({"message": f"Successfully updated thoth config at {initial_path}!"}))
