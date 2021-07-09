/* eslint-disable eqeqeq */
import React from "react";
import SubComponent from "../common/SubComponent";
import * as Utils from "../common/Utils";

import Backend from "../services/backend";
class LauncherForm extends SubComponent {
  state = {
    launcherDescriptors: [],
    launcherConfig: {},
    configIndex: 0,
    selectableType: true,
  };

  constructor(props) {
    super(props);
    this.state.projectId = props.projectId;
    this.state.launcherDescriptors = props.launcherDescriptors || [];
    this.state.launcherConfig = props.launcherConfig;
    this.state.configIndex = props.configIndex;
    this.state.selectableType = props.selectableType;
    if (this.state.projectId) {
      this.getProject();
    }
    this.handleLauncherChange = props.handleLauncherChange;
    this.getProject = this.getProject.bind(this);
    this.getLauncherPropertyFormTemplate =
      this.getLauncherPropertyFormTemplate.bind(this);
    this.getLauncherPropertyTemplate =
      this.getLauncherPropertyTemplate.bind(this);
    this.getLauncherPropertyBooleanTemplate =
      this.getLauncherPropertyBooleanTemplate.bind(this);
    this.handleLauncherBooleanChange =
      this.handleLauncherBooleanChange.bind(this);
    this.setState(this.state);
  }

  componentDidMount() {
    super.componentDidMount();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.launcherConfig) {
      this.state.launcherConfig = nextProps.launcherConfig;
    }
    if (nextProps.launcherDescriptors) {
      this.state.launcherDescriptors = nextProps.launcherDescriptors;
    }
    if (nextProps.configIndex) {
      this.state.configIndex = nextProps.configIndex;
    }
    this.setState(this.state);
  }

  getProject() {
    Backend.get("project/" + this.state.projectId)
      .then((response) => {
        this.state.project = response.data;
        this.setState(this.state);
      })
      .catch((error) => {
        Utils.onErrorMessage("Couldn't get project: ", error);
      });
  }

  getLauncherForm(config, index) {
    if (!config) {
      return "";
    }
    var descriptor =
      Utils.getLaunchDescriptor(
        this.state.launcherDescriptors,
        config.launcherId
      ) || {};
    return (
      <p className="card-text">
        <form>
          {this.state.selectableType && (
            <div>
              <div className="form-group row">
                <label className="col-4 col-form-label">Launcher</label>
                <div className="col-8">
                  <select
                    id="launcherId"
                    className="form-control"
                    index={index}
                    onChange={(e) =>
                      this.handleLauncherChange(e, index, "launcherId")
                    }
                  >
                    <option> </option>
                    {this.state.launcherDescriptors.map(function (descriptor) {
                      var selected = descriptor.launcherId == config.launcherId;
                      if (selected) {
                        return (
                          <option value={descriptor.launcherId} selected>
                            {descriptor.name}
                          </option>
                        );
                      }
                      return (
                        <option value={descriptor.launcherId}>
                          {descriptor.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="form-group row">
                <label className="col-4 col-form-label">Name</label>
                <div className="col-8">
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={config.name || ""}
                    index={index}
                    onChange={(e) =>
                      this.handleLauncherChange(e, index, "name")
                    }
                  />
                </div>
              </div>
            </div>
          )}
          {!this.state.selectableType && (
            <div className="form-group row">
              <label className="col-12 col-form-label">
                Launcher: {(this.state.launcherConfig || {}).name || ""}
              </label>
            </div>
          )}
          {(descriptor.configDescriptors || []).map(
            function (descriptorItem) {
              return this.getLauncherPropertyTemplate(
                descriptorItem,
                config,
                index
              );
            }.bind(this)
          )}
        </form>
      </p>
    );
  }

  handleLauncherBooleanChange(event, index, propertyKey) {
    event.target.value = event.target.checked;
    this.handleLauncherChange(event, index, propertyKey);
  }

  getLauncherPropertyTemplate(descriptorItem, config, index) {
    return (
      <div className="form-group row">
        <label className="col-4 col-form-label">{descriptorItem.name}</label>
        <div className="col-8">
          {this.getLauncherPropertyFormTemplate(descriptorItem, config, index)}
        </div>
      </div>
    );
  }

  getLauncherPropertyFormTemplate(descriptorItem, config, index) {
    if (descriptorItem.defaultValues.length > 1 && !descriptorItem.restricted) {
      return this.getLauncherPropertySelectEditableTemplate(
        descriptorItem,
        config,
        index
      );
    }
    if (descriptorItem.defaultValues.length > 1 && descriptorItem.restricted) {
      return this.getLauncherPropertySelectRestrictedTemplate(
        descriptorItem,
        config,
        index
      );
    }
    if (descriptorItem.boolean) {
      return this.getLauncherPropertyBooleanTemplate(
        descriptorItem,
        config,
        index
      );
    }
    if (descriptorItem.password) {
      return this.getLauncherPropertyPasswordTemplate(
        descriptorItem,
        config,
        index
      );
    }
    if (descriptorItem.restricted) {
      return this.getLauncherPropertyTextDisabledTemplate(
        descriptorItem,
        config,
        index
      );
    }
    return this.getLauncherPropertyTextTemplate(descriptorItem, config, index);
  }

  getLauncherPropertyPasswordTemplate(descriptorItem, config, index) {
    return (
      <input
        type="password"
        className="form-control"
        name={descriptorItem.key}
        value={config.properties[descriptorItem.key] || ""}
        index={index}
        onChange={(e) =>
          this.handleLauncherChange(e, index, descriptorItem.key)
        }
      />
    );
  }

  getLauncherPropertyTextTemplate(descriptorItem, config, index) {
    return (
      <input
        type="text"
        className="form-control"
        name={descriptorItem.key}
        value={config.properties[descriptorItem.key] || ""}
        index={index}
        onChange={(e) =>
          this.handleLauncherChange(e, index, descriptorItem.key)
        }
      />
    );
  }

  getLauncherPropertyTextDisabledTemplate(descriptorItem, config, index) {
    return (
      <input
        type="text"
        className="form-control"
        name={descriptorItem.key}
        value={config.properties[descriptorItem.key] || ""}
        index={index}
        disabled="true"
        onChange={(e) =>
          this.handleLauncherChange(e, index, descriptorItem.key)
        }
      />
    );
  }

  getLauncherPropertySelectRestrictedTemplate(descriptorItem, config, index) {
    return (
      <select
        className="form-control"
        name={descriptorItem.key}
        value={config.properties[descriptorItem.key] || ""}
        index={index}
        onChange={(e) =>
          this.handleLauncherChange(e, index, descriptorItem.key)
        }
      >
        {descriptorItem.defaultValues.map(function (defaultValue) {
          var selected = defaultValue == config.properties[descriptorItem.key];
          if (selected) {
            return (
              <option value={defaultValue} selected>
                {defaultValue}
              </option>
            );
          }
          return <option value={defaultValue}>{defaultValue}</option>;
        })}
      </select>
    );
  }

  getLauncherPropertySelectEditableTemplate(descriptorItem, config, index) {
    return (
      <input
        type="text"
        className="form-control"
        name={descriptorItem.key}
        value={config.properties[descriptorItem.key] || ""}
        index={index}
        placeholder={descriptorItem.defaultValues.join(", ")}
        onChange={(e) =>
          this.handleLauncherChange(e, index, descriptorItem.key)
        }
      />
    );
  }

  getLauncherPropertyBooleanTemplate(descriptorItem, config, index) {
    return (
      <div>
        {config.properties[descriptorItem.key] &&
          config.properties[descriptorItem.key].toLowerCase() == "true" && (
            <input
              type="checkbox"
              className="form-control"
              name={descriptorItem.key}
              value={config.properties[descriptorItem.key] || ""}
              index={index}
              placeholder={descriptorItem.defaultValues.join(", ")}
              onChange={(e) =>
                this.handleLauncherBooleanChange(e, index, descriptorItem.key)
              }
              checked
            />
          )}
        {(!config.properties[descriptorItem.key] ||
          config.properties[descriptorItem.key].toLowerCase() != "true") && (
          <input
            type="checkbox"
            className="form-control"
            name={descriptorItem.key}
            value={config.properties[descriptorItem.key] || ""}
            index={index}
            placeholder={descriptorItem.defaultValues.join(", ")}
            onChange={(e) =>
              this.handleLauncherBooleanChange(e, index, descriptorItem.key)
            }
          />
        )}
      </div>
    );
  }

  render() {
    return (
      <div>
        {this.getLauncherForm(
          this.state.launcherConfig,
          this.state.configIndex
        )}
      </div>
    );
  }
}

export default LauncherForm;
