/**
 * Jupyterlab requirements.
 *
 * Jupyterlab extension for managing dependencies.
 *
 * @link   https://github.com/thoth-station/jupyterlab-requirements#readme
 * @file   Jupyterlab extension for managing dependencies.
 * @author Gage Krumbach <gkrumbac@redhat.com>
 * @since  0.15.0
 */
import * as React from 'react';

import axios from "axios";
import debounce from "lodash/debounce";
import OutsideAlerter from "./OutsideAlerter"

/**
 * (CSS)
 */
const THOTH_CONSTRAINT_INPUT = "thoth-constraint-input";
const THOTH_CONSTRAINT_DROPDOWN = "thoth-constraint-dropdown";
const THOTH_CONSTRAINT_DROPDOWN_VERSION_LIST_ELEMENT = "thoth-constraint-dropdown-version-list-element";
const THOTH_CONSTRAINT_DROPDOWN_VERSION_LIST = "thoth-constraint-dropdown-version-list";
const THOTH_CONSTRAINT_DROPDOWN_BTN = "thoth-constraint-dropdown-btn";
const THOTH_CONSTRAINT_DROPDOWN_ADD = "thoth-constraint-dropdown-add";
const THOTH_CONSTRAINT_DROPDOWN_REMOVE = "thoth-constraint-dropdown-remove";
const THOTH_CONSTRAINT_DROPDOWN_SPECIFIER = "thoth-constraint-dropdown-specifier"
const THOTH_CONSTRAINT_DROPDOWN_DEGREE = "thoth-constraint-dropdown-degree"
const THOTH_CONSTRAINT_DROPDOWN_DEGREE_STATIC = "thoth-constraint-dropdown-degree-static"
const THOTH_CONSTRAINT_DROPDOWN_VERSION = "thoth-constraint-dropdown-version"


/**
 * Class: Holds properties for DependencyManagementConstraintPicker.
 */
export interface IProps {
  package_name: string;
  onChange: Function;
}

interface Constraint {
  version: string;
  specifier: string;
  originalVersion: string;
}

/**
 * A React Component for data autocomplete dropdown menu.
 */
export const DependencyManagementConstraintPicker: React.FC<IProps> = ({package_name, onChange}) => {
  const [versions, setVersions] = React.useState<Array<string>>([])
  const [pagination, setPagination] = React.useState<number>(-1)
  const [validPackage, setValidPackage] = React.useState<boolean>(false)
  const [menuVisible, setMenuVisible] = React.useState<boolean>(false)

  const [manualValue, setManualValue] = React.useState<string>("*")
  const [constraints, setConstraints] = React.useState<Map<string, Constraint>>(new Map())


  const debounced = React.useRef(debounce(name => {
    setVersions([])
    setConstraints(new Map())
    setPagination(-1)
    setManualValue("*")
    setValidPackage(false)

    if(name === "") { return }
    const url = `https://pypi.org/pypi/${name}/json`;
    axios
      .get(url)
      .then(() => {
        setValidPackage(true)
      })
      .catch()
  }, 500));


  React.useEffect(() => debounced.current(package_name), [package_name])

  React.useEffect(() => getNextPage(), [validPackage])

  const getNextPage = () => {
    if (package_name === "" || !validPackage) {
      return;
    }

    if(pagination === null) {
      return;
    }

    const url = "https://khemenu.thoth-station.ninja/api/v1/python/package/versions";
    axios
      .get(url, {
        params: {
          name: package_name,
          page: pagination,
          per_page: 25,
          // os_name: ,
          // os_version: ,
          // python_version:
        }
      })
      .then(({ data }) => {
        const append_versions = new Set<string>();
        data.versions.reverse().forEach((version: { package_version: string; }) => append_versions.add(version.package_version))

        if(append_versions.has(versions[0])) {
          const cut = Array.from(append_versions.values());
          cut.splice(cut.indexOf(versions[0]))
          setVersions(versions.concat(cut))
          setPagination(null)
        }
        else {
          setVersions(versions.concat(...append_versions))
          setPagination(pagination - 1)
        }
      })
      .catch(() => {
        setVersions([])
      })
  }

  const joinedConstraints = React.useMemo(() => {
    return Array.from(constraints.values()).map(constraint => constraint.specifier + constraint.version).join(",")
  }, [constraints])

  React.useEffect(() => {
    if(joinedConstraints !== "") {
      onChange(joinedConstraints)
    }
    else {
      onChange(manualValue)
    }
  }, [joinedConstraints, manualValue])


  const addConstraint = (version: string) => {
    setConstraints(prev => new Map([...prev, [version, { version: version, specifier: "==", originalVersion: version}]]))
  }

  const removeConstraint = (version: string) => {
    setConstraints((prev) => {
      const newState = new Map(prev);
      newState.delete(version);
      return newState;
    });
  }

  const changeConstraintSpecifier = (constraint: Constraint, specifier: string) => {
    setConstraints((prev) => new Map(prev)
      .set(constraint.originalVersion, {
        specifier: specifier,
        version: constraint.originalVersion,
        originalVersion: constraint.originalVersion
      })
    );
  }

  const toggleVersionDegree = (constraint: Constraint, index: number) => {
    const splitVersion = constraint.version.split(".");
    let useOriginal = false

    if(constraint.specifier === "~=") {
      if(splitVersion[index] === undefined) {
        useOriginal = true
      }
      else {
        splitVersion.splice(index)
      }
    }
    else {
      if(splitVersion[index] === "*") {
        useOriginal = true
      }
      else {
        splitVersion[index] = "*"
        splitVersion.splice(index + 1)
      }
    }

    setConstraints((prev) => new Map(prev)
      .set(constraint.originalVersion, {
        specifier: constraint.specifier,
        version: useOriginal ? constraint.originalVersion : splitVersion.join("."),
        originalVersion: constraint.originalVersion
      })
    );
  }

  const resetAndQuit = () => {
    setConstraints(new Map());
    setMenuVisible(false);
  }

  return(
    <>
      <input
        type={versions.length > 0 ? 'button' : "text"}
        value={versions.length > 0 ? joinedConstraints === "" ? "*" : joinedConstraints : manualValue}
        className={THOTH_CONSTRAINT_INPUT}
        onClick={() => {
          if(versions.length > 0) {
            setMenuVisible(!menuVisible)
          }
        }}
        onChange={event => {
          setManualValue(event.target.value)
        }}
      >
      </input>
      {menuVisible && validPackage
        ? <OutsideAlerter callback={() => setMenuVisible(false)}>
            <div className={THOTH_CONSTRAINT_DROPDOWN}>
          {constraints.size === 0
            ? <p style={{textAlign: "center", marginBottom: "1rem"}}><i>no constraints set</i></p>
            : <ul className={THOTH_CONSTRAINT_DROPDOWN_VERSION_LIST}>
              {Array.from(constraints.values()).map(constraint => {
                return(
                  <li key={constraint.originalVersion} className={THOTH_CONSTRAINT_DROPDOWN_VERSION_LIST_ELEMENT}>
                    <select
                      id="changeRecommendationType"
                      name='package_specifier'
                      value={constraint.specifier}
                      className={THOTH_CONSTRAINT_DROPDOWN_SPECIFIER}
                      onChange={event => changeConstraintSpecifier(constraint, event.target.value)}
                    >
                      <option value="==">==</option>
                      <option value="===">===</option>
                      <option value=">=">{">"}=</option>
                      <option value="<=">{"<"}=</option>
                      <option value=">">{">"}</option>
                      <option value="<">{"<"}</option>
                      <option value="!=">!=</option>
                      <option value="~=">~=</option>
                    </select>
                    <div className={THOTH_CONSTRAINT_DROPDOWN_VERSION}>
                      {constraint.version.split(".").map((degree, index, array) => {
                        if(constraint.specifier === "~=") {
                          if(constraint.originalVersion.split(".").length > array.length && index === array.length - 1) {
                            return (
                              <React.Fragment key={constraint.version + index + degree}>
                                <div>
                                  {index === 0
                                    ? <button className={THOTH_CONSTRAINT_DROPDOWN_DEGREE_STATIC}>{degree}</button>
                                    : <button onClick={() => toggleVersionDegree(constraint, index)} className={THOTH_CONSTRAINT_DROPDOWN_DEGREE}>{degree}</button>
                                  }
                                </div>
                                {" "}
                                <div>
                                  <button onClick={() => toggleVersionDegree(constraint, index + 1)} className={THOTH_CONSTRAINT_DROPDOWN_DEGREE}>{"__"}</button>
                                </div>
                              </React.Fragment>
                            )
                          }
                        }

                        if(index === 0) {
                          return (
                            <div>
                              <button className={THOTH_CONSTRAINT_DROPDOWN_DEGREE_STATIC}>
                                {degree}
                              </button>
                              {index !== array.length - 1 ? "." : ""}
                            </div>

                          )
                        }

                        return (
                          <div>
                            <button onClick={() => toggleVersionDegree(constraint, index)} className={THOTH_CONSTRAINT_DROPDOWN_DEGREE}>{degree}</button>
                            {index !== array.length - 1 ? "." : ""}
                          </div>
                        )
                      })}
                    </div>
                  </li>
                )
              })}
            </ul>
          }

          <div style={{display: "flex", justifyContent: "space-between", marginBottom: '1rem'}}>
            <button className={THOTH_CONSTRAINT_DROPDOWN_BTN} onClick={resetAndQuit}>{constraints.size === 0 ? "CANCEL" : "RESET"}</button>
            <button className={THOTH_CONSTRAINT_DROPDOWN_BTN} onClick={() => setMenuVisible(false)}>DONE</button>
          </div>
          <hr className="rounded"/>
          <ul className={THOTH_CONSTRAINT_DROPDOWN_VERSION_LIST}>
            {versions.map(version => {
              if(constraints.has(version)) {
                return (
                  <li key={version} className={THOTH_CONSTRAINT_DROPDOWN_VERSION_LIST_ELEMENT}>
                    <p>{version}</p>
                    <button className={`${THOTH_CONSTRAINT_DROPDOWN_REMOVE} ${THOTH_CONSTRAINT_DROPDOWN_BTN}`} onClick={() => removeConstraint(version)}>REMOVE</button>
                  </li>
                )
              }

              return (
                <li key={version} className={THOTH_CONSTRAINT_DROPDOWN_VERSION_LIST_ELEMENT}>
                  <p>{version}</p>
                  <button className={`${THOTH_CONSTRAINT_DROPDOWN_ADD} ${THOTH_CONSTRAINT_DROPDOWN_BTN}`} onClick={() => addConstraint(version)}>ADD</button>
                </li>
              )
            })}
            { pagination !== null ? <a style={{textAlign: "center", marginTop: ".25rem"}} onClick={() => getNextPage()}>more</a> : undefined }
          </ul>
        </div>
          </OutsideAlerter>
        : undefined}
    </>
  )
}
