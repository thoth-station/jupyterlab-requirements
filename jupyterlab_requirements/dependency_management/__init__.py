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
from .dependencies_files_handler import DependenciesNotebookNameHandler
from .dependencies_stored_handler import DependenciesStoredHandler
from .discover_handler import DependencyInstalledHandler
from .discover_handler import PythonVersionHandler
from .discover_handler import RootPathHandler
from .kernel_handler import JupyterKernelHandler
from .install_handler import DependencyInstallHandler
from .pipenv import PipenvHandler
from .thoth import ThothAdviseHandler
from .thoth_config_handler import ThothConfigHandler
from .thoth_invectio import ThothInvectioHandler

from .lib import _EMOJI
from .lib import check_metadata_content
from .lib import create_pipfile_from_packages
from .lib import gather_libraries
from .lib import get_notebook_content
from .lib import horus_extract_command
from .lib import horus_lock_command
from .lib import horus_requirements_command
from .lib import horus_set_kernel_command
from .lib import horus_show_command
from .lib import load_files
from .lib import save_notebook_content

from .magic_commands import HorusMagics

__all__ = [
    "DependencyManagementBaseHandler",
    "DependenciesFilesHandler",
    "DependenciesStoredHandler",
    "DependenciesNotebookNameHandler",
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
    "check_metadata_content",
    "create_pipfile_from_packages",
    "gather_libraries",
    "get_notebook_content",
    "horus_extract_command",
    "horus_set_kernel_command",
    "horus_lock_command",
    "horus_requirements_command",
    "horus_show_command",
    "load_files",
    "save_notebook_content",
    "HorusMagics",
    "_EMOJI",
]
