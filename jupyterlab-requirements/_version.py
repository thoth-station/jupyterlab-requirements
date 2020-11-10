#!/usr/bin/env python3
# project template
# Copyright(C) 2020 Red Hat, Inc.
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

"""Dependency manager for JupyterLab notebook."""


__all__ = ['__version__']

def _fetchVersion():
    import json
    import os

    HERE = os.path.abspath(os.path.dirname(__file__))

    for d, _, _ in os.walk(HERE): 
        try:
            with open(os.path.join(d, 'package.json')) as f:
                return json.load(f)['version']
        except FileNotFoundError:
            pass

    raise FileNotFoundError('Could not find package.json under dir {}'.format(HERE))

__version__ = _fetchVersion()

