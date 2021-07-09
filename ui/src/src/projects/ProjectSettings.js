/* eslint-disable eqeqeq */
import React from 'react';
import SubComponent from '../common/SubComponent'
import AsyncSelect from 'react-select/lib/Async';
import CreatableSelect from 'react-select/lib/Creatable'
import LauncherForm from '../launches/LauncherForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons'
import { faMinusCircle } from '@fortawesome/free-solid-svg-icons'
import $ from 'jquery';
import * as Utils from '../common/Utils';
import Backend from '../services/backend';
class ProjectSettings extends SubComponent {

    constructor(props) {
        super(props);
        this.state = {
             project: {
                 id: null,
                 name: "",
                 description: "",
                 readWriteGroups: [],
                 readWriteUsers: [],
                 launcherConfigs: [],
                 environments: []
             },
             originalProject: {
                  id: null,
                  name: "",
                  description: "",
                  readWriteGroups: [],
                  readWriteUsers: [],
                  environments: []
              },
             groups: [],
             users: [],
             groupsToDisplay: [],
             launcherDescriptors: [],
             launcherIndexToRemove: null
         };
         this.state.projectId = this.props.match.params.project;
         this.changeGroups = this.changeGroups.bind(this);
         this.changeUsers = this.changeUsers.bind(this);
         this.changeEnvironments = this.changeEnvironments.bind(this);
         this.submit = this.submit.bind(this);
         this.refreshGroupsToDisplay = this.refreshGroupsToDisplay.bind(this);
         this.refreshUsersToDisplay = this.refreshUsersToDisplay.bind(this);
         this.getGroups = this.getGroups.bind(this);
         this.mapGroupsToView = this.mapGroupsToView.bind(this);
         this.getUsers = this.getUsers.bind(this);
         this.mapUsersToView = this.mapUsersToView.bind(this);
         this.toggleEdit = this.toggleEdit.bind(this);
         this.handleChange = this.handleChange.bind(this);
         this.removeProject = this.removeProject.bind(this);
         this.undelete = this.undelete.bind(this);
         this.addLauncher = this.addLauncher.bind(this);
         this.removeLauncher = this.removeLauncher.bind(this);
         this.cancelRemoveLauncherConfirmation = this.cancelRemoveLauncherConfirmation.bind(this);
         this.handleLauncherChange = this.handleLauncherChange.bind(this);
      }

    componentDidMount() {
        super.componentDidMount();
        Backend.get("project/" + this.state.projectId)
          .then(response => {
            this.state.project = response.data;
            this.state.originalProject = this.state.project;
            this.refreshGroupsToDisplay();
            this.refreshUsersToDisplay();
            this.setState(this.state);
          }).catch(error => {Utils.onErrorMessage("Couldn't get project: ", error)});

          Backend.get("launcher/descriptors")
            .then(response => {
              this.state.launcherDescriptors = response.data;
              this.setState(this.state);
            }).catch(error => {Utils.onErrorMessage("Couldn't get launcher descriptors: ", error)});
     }

     getGroups(literal, callback){
        var url = "user/groups/suggest";
        if (literal){
            url = url + "?literal=" + literal;
        }
        Backend.get(url)
           .then(response => {
             this.state.groups = response.data;
             this.refreshGroupsToDisplay();
            callback(this.mapGroupsToView(this.state.groups));
           })
           .catch(error => console.log(error));
     }

     getUsers(literal, callback){
         var url = "user/users/suggest";
         if (literal){
             url = url + "?literal=" + literal;
         }
         Backend
            .get(url)
            .then(response => {
              this.state.users = response.data;
              this.refreshUsersToDisplay();
             callback(this.mapUsersToView(this.state.users));
            })
            .catch(error => console.log(error));
    }

    changeGroups(values){
        this.state.project.readWriteGroups = values.map(function(value){return value.value});
        this.refreshGroupsToDisplay();
        this.setState(this.state);
    }

    changeUsers(values){
        this.state.project.readWriteUsers = values.map(function(value){return value.value});
        this.refreshUsersToDisplay();
        this.setState(this.state);
    }

    changeEnvironments(values){
        this.state.project.environments = values.map(function(value){return value.value});
        this.setState(this.state);
    }

    submit(event, name){
        Backend.put('project', this.state.project)
            .then(response => {
                this.state.project = response.data;
                this.state.originalProject = this.state.project;
                if (name){
                    this.toggleEdit(name);
                }
                this.refreshGroupsToDisplay();
                this.setState(this.state);
                Utils.onSuccessMessage("Project Settings successfully saved");
        }).catch(error => {Utils.onErrorMessage("Couldn't save project: ", error)});
        if (event){
            event.preventDefault();
        }
    }

    removeProject(event){
        Backend.delete('project/' + this.state.project.id)
            .then(response => {
                window.location.href = "/";
        }).catch(error => {Utils.onErrorMessage("Couldn't delete project: ", error)});
        event.preventDefault();

    }

    undelete(event){
        this.state.project.deleted = false;
        this.submit(event);
    }

    refreshGroupsToDisplay(){
        this.state.groupsToDisplay = this.mapGroupsToView(this.state.project.readWriteGroups || []);
    }

    refreshUsersToDisplay(){
        this.state.usersToDisplay = this.mapUsersToView(this.state.project.readWriteUsers || []);
    }

    mapGroupsToView(groups){
        return groups.map(function(val){return {value: val, label: val}});
    }

    mapUsersToView(users){
        return users.map(function(val){
            var tokens = val.split(":");
            if (tokens.length == 1){
                return {value: val, label: val}
            }
            return {value: tokens[0], label: tokens[1]}

        });
    }

    toggleEdit(fieldName, event){
        if(!fieldName) return;
        var fieldId = fieldName;
        if($("#" + fieldId + "-display").offsetParent !== null){
            this.state.originalProject[fieldName] = this.state.project[fieldName];
        }
        $("#" + fieldId + "-display").toggle();
        $("#" + fieldId + "-form").toggle();
        if (event){
            event.preventDefault();
        }
    }

    handleChange(fieldName, event){
        this.state.project[fieldName] = event.target.value;
        this.setState(this.state);
    }

    handleLauncherChange(event, index, propertyKey){
        var selectedConfig = this.state.project.launcherConfigs[index];
        if(propertyKey == 'launcherId'){
            selectedConfig.launcherId = event.target.value;
        } else if (propertyKey == 'name'){
            selectedConfig.name = event.target.value;
        } else {
            selectedConfig.properties[propertyKey] = event.target.value;
        }

        //Do not leave name blank, set either descriptor name or descriptor id
        if (selectedConfig.name == undefined){
            var descriptor = Utils.getLaunchDescriptor(this.state.launcherDescriptors, selectedConfig.launcherId)
            if (descriptor.name && descriptor.name != ""){
                selectedConfig.name = descriptor.name;
            } else {
                selectedConfig.name = selectedConfig.launcherId;
            }
        }
        this.setState(this.state);
    }

    cancelEdit(fieldName, event){
        this.state.project[fieldName] = this.state.originalProject[fieldName];
        this.setState(this.state);
        this.toggleEdit(fieldName, event);
    }


    addLauncher(){
        this.state.project.launcherConfigs = this.state.project.launcherConfigs || [];
        this.state.project.launcherConfigs.push({
            properties: {}
        });
        this.setState(this.state);
    }

    removeLauncherConfirmation(index){
        this.state.launcherIndexToRemove = index;
        $("#remove-launcher-confirmation").modal("show");
    }

    cancelRemoveLauncherConfirmation(){
        this.state.launcherIndexToRemove = null;
        $("#remove-launcher-confirmation").modal("hide");
    }

    removeLauncher(){
        if (this.state.launcherIndexToRemove == null) return;
        this.state.project.launcherConfigs.splice(this.state.launcherIndexToRemove, 1);
        this.state.launcherIndexToRemove = null;
        this.setState(this.state);
        $("#remove-launcher-confirmation").modal("hide");
        this.submit();
    }

    render() {
        return (
            <div>
                <div id="name" className="project-header">
                    <div id="name-display" className="inplace-display">
                        {this.state.project.deleted &&
                            <h1>
                                <s>{this.state.project.name}</s> - DELETED
                                <button type="button" className="btn" onClick={this.undelete}>Undelete</button>
                            </h1>
                        }
                        {!this.state.project.deleted &&
                            <h1>
                                {this.state.project.name}
                                <span className="edit edit-icon clickable" onClick={(e) => this.toggleEdit("name", e)}><FontAwesomeIcon icon={faPencilAlt}/></span>
                            </h1>
                        }
                    </div>
                    <div id="name-form" className="inplace-form" style={{display: 'none'}}>
                        <form>
                            <div className="form-group row">
                                <div className="col-8">
                                    <input type="text" name="name" className="form-control" onChange={(e) => this.handleChange("name", e)} value={this.state.project.name}/>
                                </div>
                                <div className="col-4">
                                    <button type="button" className="btn btn-light" data-dismiss="modal" onClick={(e) => this.cancelEdit("name", e)}>Cancel</button>
                                    <button type="button" className="btn btn-primary" onClick={(e) => this.submit(e, "name")}>Save</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="project-settings-section">
                    <h3>Permissions</h3>

                     <form>

                         <div className="row form-group">
                            <label className="col-1 col-form-label">Groups</label>
                            <div className="col-6">
                                <AsyncSelect value={this.state.groupsToDisplay}
                                        isMulti
                                        cacheOptions
                                        loadOptions={this.getGroups}
                                        onChange={this.changeGroups}
                                        options={this.mapGroupsToView(this.state.groups)}
                                       />
                            </div>
                        </div>

                        <div className="row form-group">
                            <label className="col-1 col-form-label">Users</label>
                            <div className="col-6">
                                <AsyncSelect value={this.state.usersToDisplay}
                                        isMulti
                                        cacheOptions
                                        loadOptions={this.getUsers}
                                        onChange={this.changeUsers}
                                        options={this.mapUsersToView(this.state.users)}
                                       />
                            </div>
                        </div>
                     </form>
                </div>

                <div className="project-settings-section">
                    <h3>Launchers</h3>
                    <form>
                        <div className="row form-group">
                            <label className="col-1 col-form-label">Environments</label>
                            <div className="col-6">
                                <CreatableSelect value={(this.state.project.environments || []).map(function(val){return {value: val, label: val}})}
                                        isMulti
                                        isClearable
                                        cacheOptions
                                        onChange={this.changeEnvironments}
                                        options={[]}
                                       />
                            </div>
                        </div>
                    </form>


                     <div className="row project-settings-launchers">
                        {
                            (this.state.project.launcherConfigs || []).map(function(config, i){
                                return(
                                    <div className="card col-6">
                                      <div className="card-header row">
                                        <div className="col-11">
                                            {config.name || ""}
                                        </div>
                                        <div className="col-1">
                                            <span className='float-right clickable edit-icon-visible red'>
                                                <FontAwesomeIcon icon={faMinusCircle} index={i} onClick={(e) => this.removeLauncherConfirmation(i)}/>
                                            </span>
                                        </div>
                                      </div>
                                      <div className="card-body">
                                            <LauncherForm launcherDescriptors={this.state.launcherDescriptors} selectableType={true}
                                                    launcherConfig={config} configIndex={i} handleLauncherChange={this.handleLauncherChange}/>
                                      </div>
                                    </div>
                                )
                            }.bind(this))
                        }
                    </div>
                    <div className="row project-settings-launchers">
                      <button type="button" className="btn btn-primary" onClick={this.addLauncher}>
                         Add Launcher
                      </button>
                    </div>
                </div>

                <div className="project-settings-control row">
                    <div className="col-10">
                        <button type="button" className="btn btn-success" onClick={this.submit}>Save</button>
                    </div>
                    <div className="col-2">
                        <button type="button" className="btn btn-danger" data-toggle="modal" data-target="#remove-project-confirmation">Remove Project</button>
                    </div>
                </div>

                <div className="modal fade" tabIndex="-1" role="dialog" id="remove-project-confirmation">
                  <div className="modal-dialog" role="document">
                      <div className="modal-content">
                        <div className="modal-header">
                          <h5 className="modal-title">Remove Project</h5>
                          <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                          </button>
                        </div>
                        <div className="modal-body">Are you sure you want to remove Project?</div>
                        <div className="modal-footer">
                          <button type="button" className="btn btn-secondary" data-dismiss="modal" aria-label="Cancel">Close</button>
                          {!this.state.project.deleted &&
                            <button type="button" className="btn btn-danger" data-dismiss="modal" onClick={this.removeProject}>Remove Project</button>
                          }
                        </div>
                      </div>
                   </div>
               </div>
               <div className="modal fade" tabIndex="-1" role="dialog" id="remove-launcher-confirmation">
                   <div className="modal-dialog" role="document">
                       <div className="modal-content">
                         <div className="modal-header">
                           <h5 className="modal-title">Remove Launcher</h5>
                           <button type="button" className="close" onClick={this.cancelRemoveLauncherConfirmation} aria-label="Close">
                             <span aria-hidden="true">&times;</span>
                           </button>
                         </div>
                         <div className="modal-body">Are you sure you want to remove Launcher?</div>
                         <div className="modal-footer">
                           <button type="button" className="btn btn-secondary" onClick={this.cancelRemoveLauncherConfirmation}>Close</button>
                           <button type="button" className="btn btn-danger" onClick={this.removeLauncher}>Remove Launcher</button>
                         </div>
                       </div>
                    </div>
                </div>
            </div>
        );
      }

}

export default ProjectSettings;
