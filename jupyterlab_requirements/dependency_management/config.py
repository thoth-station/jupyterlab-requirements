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

import json
import logging

from jupyter_server.base.handlers import APIHandler
from tornado import web

from thamos.config import _Configuration

_LOGGER = logging.getLogger("jupyterlab_requirements.config")


class ThothConfigHandler(APIHandler):
    """Thoth config handler to create new kernel for jupyter."""

    @web.authenticated
    def get(self):
        """Get or create thoth config file."""
        config = _Configuration()

        if not config.config_file_exists():
            _LOGGER.info("Thoth config does not exist, creating it...")
            config.create_default_config()

        config.load_config()

        thoth_config = config._configuration
        _LOGGER.info("Thoth config:", thoth_config)
        self.finish(json.dumps(thoth_config))
