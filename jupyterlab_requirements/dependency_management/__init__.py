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

"""Dependency Management APIs for jupyter server."""

from .thoth_config import ThothConfigHandler
from .customized_kernel import JupyterKernelHandler
from .dependencies_files import DependenciesFilesHandler
from .dependencies_handler import DependencyInstallHandler, DependencyInstalledHandler
from .thoth import ThothAdviseHandler
from .pipenv import PipenvHandler

__all__ = [
    "DependenciesFilesHandler",
    "DependencyInstallHandler",
    "DependencyInstalledHandler",
    "JupyterKernelHandler",
    "PipenvHandler",
    "ThothAdviseHandler",
    "ThothConfigHandler",
]
