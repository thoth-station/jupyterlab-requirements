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

from .api import YamlSpecHandler
from .base import DependencyManagementBaseHandler
from .dependencies_files_handler import DependenciesFilesHandler
from .discover_handler import DependencyInstalledHandler
from .discover_handler import PythonVersionHandler
from .discover_handler import RootPathHandler
from .kernel_handler import JupyterKernelHandler
from .install_handler import DependencyInstallHandler
from .pipenv import PipenvHandler
from .thoth import ThothAdviseHandler
from .thoth_config_handler import ThothConfigHandler
from .thoth_invectio import ThothInvectioHandler

from .lib import create_kernel
from .lib import delete_kernel
from .lib import get_packages
from .lib import get_thoth_config
from .lib import install_packages
from .lib import load_files
from .lib import lock_dependencies_with_pipenv
from .lib import lock_dependencies_with_thoth

__all__ = [
    "DependencyManagementBaseHandler",
    "DependenciesFilesHandler",
    "DependencyInstallHandler",
    "DependencyInstalledHandler",
    "JupyterKernelHandler",
    "PipenvHandler",
    "PythonVersionHandler",
    "RootPathHandler",
    "ThothAdviseHandler",
    "ThothConfigHandler",
    "ThothInvectioHandler",
    "YamlSpecHandler",
    "create_kernel",
    "delete_kernel",
    "get_packages",
    "get_thoth_config",
    "install_packages",
    "load_files",
    "lock_dependencies_with_pipenv",
    "lock_dependencies_with_thoth",
]
