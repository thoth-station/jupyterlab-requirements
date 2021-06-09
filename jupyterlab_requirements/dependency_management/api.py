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

"""Handler for API for jupyterlab requirements."""

import os

from jupyter_server.base.handlers import APIHandler
from tornado import web


class BaseSpecHandler(web.StaticFileHandler, APIHandler):
    """Base class handler."""

    @staticmethod
    def get_resource_metadata():
        """Return the (resource, mime-type) for the handlers spec."""
        pass

    def initialize(self):
        """Initialize class."""
        web.StaticFileHandler.initialize(self, path=os.path.dirname(__file__))

    @web.authenticated
    def get(self):
        """Get method."""
        return web.StaticFileHandler.get(self, self.get_resource_metadata()[0])

    def get_content_type(self):
        """Get content type."""
        return self.get_resource_metadata()[1]


class YamlSpecHandler(BaseSpecHandler):
    """Expose the ability to return specifications from static files."""

    @staticmethod
    def get_resource_metadata():
        """Return the (resource, mime-type) for the handlers spec."""
        return "jupyterlab_requirements.yaml", "text/x-yaml"
