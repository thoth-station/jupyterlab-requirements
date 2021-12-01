#!/usr/bin/env python3
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

"""A class for implementing horus' test cases for commands."""

from tests.base_test import HorusTestCase

from jupyterlab_requirements.dependency_management.lib import get_notebook_content
from jupyterlab_requirements.dependency_management.lib import horus_check_metadata_content
from jupyterlab_requirements.dependency_management.lib import horus_delete_kernel
from jupyterlab_requirements.dependency_management.lib import horus_list_kernels
from jupyterlab_requirements.dependency_management.lib import horus_set_kernel_command
from jupyterlab_requirements.dependency_management.lib import horus_requirements_command


class HorusCheckCommandTestCase(HorusTestCase):
    """A class for horus check test cases."""

    notebook = get_notebook_content(notebook_path=HorusTestCase.empty_notebook_path)
    notebook_metadata = notebook.get("metadata")

    result = horus_check_metadata_content(notebook_metadata=notebook_metadata)

    exit_code = 1 if any(item.get("type") == "ERROR" for item in result) else 0
    assert exit_code == 1


class HorusRequirementsCommandTestCase(HorusTestCase):
    """A class for horus requirements test cases."""

    add = ["boto3"]

    try:
        tmp, tmp_path = HorusTestCase.create_temporary_copy(HorusTestCase.empty_notebook_path)

        pipfile_ = horus_requirements_command(
            path=tmp_path, index_url="https://pypi.org/simple", dev=False, add=add, remove=None
        )

        pipfile_dict = {
            "packages": {"boto3": "*"},
            "dev-packages": {},
            "source": [{"url": "https://pypi.org/simple", "verify_ssl": True, "name": "pypi"}],
            "requires": {"python_version": "3.8"},
        }

        assert pipfile_dict == pipfile_.to_dict()

        notebook = get_notebook_content(notebook_path=tmp_path)
        notebook_metadata = notebook.get("metadata")

        result = horus_check_metadata_content(notebook_metadata=notebook_metadata)

        assert result

    finally:
        tmp.close()


class HorusListKernelsCommandTestCase(HorusTestCase):
    """A class for horus list kernels test cases."""

    kernels = horus_list_kernels()
    HorusTestCase._KERNEL_SCHEMA(kernels)
    assert "python3" in kernels


class HorusSetKernelCommandTestCase(HorusTestCase):
    """A class for horus set kernel test cases."""

    # horus_set_kernel_command


class HorusDeleteKernelCommandTestCase(HorusTestCase):
    """A class for horus delete kernel test cases."""

    # horus_delete_kernel
